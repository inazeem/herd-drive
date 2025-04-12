<?php

namespace App\Services\Entries;

use App\Models\FileEntry;
use App\Models\RootFolder;
use Common\Database\Datasource\Datasource;
use Common\Database\Datasource\DatasourceFilters;
use Common\Workspaces\ActiveWorkspace;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class DriveEntriesLoader
{
    protected DatasourceFilters $filters;
    protected Builder $builder;
    protected SetPermissionsOnEntry $setPermissionsOnEntry;
    protected int $userId;
    protected int $workspaceId;

    public function __construct(protected array $params)
    {
        $this->setPermissionsOnEntry = app(SetPermissionsOnEntry::class);
        $this->filters = new DatasourceFilters($params['filters'] ?? null);
        $this->userId = (int) ($this->params['userId'] ?? Auth::id());
        
        // If we're viewing a specific user's drive, always use their personal workspace
        if (isset($this->params['userId'])) {
            $this->workspaceId = 0; // Personal workspace
            $this->params['owner_id'] = $this->params['userId']; // Set owner_id to userId
        } else {
            $this->workspaceId = app(ActiveWorkspace::class)->id ?? 0;
        }

        $this->params['perPage'] ??= 50;
        $this->params['section'] = $this->params['section'] ?? 'home';

        // folders should always be first
        $this->builder = FileEntry::where('public', false)
            ->orderBy(DB::raw('type = "folder"'), 'desc')
            ->with(['users', 'tags']);

        // load entries with ids matching [entryIds], but only if their parent id is not in [entryIds]
        if ($entryIds = Arr::get($this->params, 'entryIds')) {
            $entryIds = explode(',', $entryIds);
            $this->builder
                ->whereIn('file_entries.id', $entryIds)
                ->whereDoesntHave('parent', function ($query) use ($entryIds) {
                    $query->whereIn('file_entries.id', $entryIds);
                });
        }
    }

    public function load(): array
    {
        FileEntry::where('type', 'folder')
            ->where('workspace_id', '!=', 0)
            ->chunk(100, function ($folders) {
                foreach ($folders as $folder) {
                    FileEntry::where('parent_id', $folder->id)
                        ->where('workspace_id', 0)
                        ->update(['workspace_id' => $folder->workspace_id]);
                }
            });

        switch ($this->params['section']) {
            case 'home':
                return $this->home();
            case 'folder':
                return $this->folder();
            case 'recent':
                return $this->recent();
            case 'trash':
                return $this->trash();
            case 'starred':
                return $this->starred();
            case 'sharedByMe':
                return $this->sharedByMe();
            case 'sharedWithMe':
                return $this->sharedWithMe();
            case 'search':
                return $this->search();
            case 'offline':
                return $this->offline();
            case 'allChildren':
                return $this->allChildren();
        }
    }

    protected function home(): array
    {
        // When viewing a specific user's drive, show only their personal files
        if (isset($this->params['userId'])) {
            $this->builder->whereNull('parent_id')
                ->where('workspace_id', 0)
                ->where('owner_id', $this->params['userId']);
        } else {
            // Normal workspace filtering
            $this->builder->whereNull('parent_id')
                ->where('workspace_id', $this->workspaceId);
            if ($this->workspaceId) {
                $this->scopeToOwnerIfCantViewWorkspaceFiles();
            } else {
                $this->builder->whereOwner($this->userId);
            }
        }

        $results = $this->loadEntries();
        $results['folder'] = $this->setPermissionsOnEntry->execute(
            new RootFolder(['owner_id' => $this->params['userId'] ?? null]),
        );
        return $results;
    }

    protected function folder(): array
    {
        // Default folderId to 0 if not set
        $folderId = $this->params['folderId'] ?? 0;

        // Get IDs of users with admin or superadmin permissions
        $adminIds = User::whereHas('permissions', function($query) {
            $query->whereIn('name', ['admin', 'superadmin']);
        })->pluck('id')->toArray();

        \Log::info('Admin IDs', ['adminIds' => $adminIds]);

        if (!$folderId || $folderId == 0) {
            // For root folder (0), show files owned by user or admins/superadmins
            $this->builder->whereNull('parent_id');
            
            if (isset($this->params['userId'])) {
                $this->builder->where('workspace_id', 0)
                    ->where(function($query) use ($adminIds) {
                        $query->where('owner_id', $this->params['userId'])
                            ->orWhereIn('owner_id', $adminIds);
                    });
            } else {
                $this->builder->where('workspace_id', $this->workspaceId);
                if ($this->workspaceId) {
                    $this->scopeToOwnerIfCantViewWorkspaceFiles();
                } else {
                    $this->builder->whereOwner($this->userId);
                }
            }

            $results = $this->loadEntries();
            $results['folder'] = $this->setPermissionsOnEntry->execute(
                new RootFolder(['owner_id' => $this->params['userId'] ?? null])
            );
            return $results;
        }

        // Get the folder
        $folder = FileEntry::with(['users', 'parent']);
        
        if (isset($this->params['userId'])) {
            $folder->where('workspace_id', 0)
                ->where(function($query) use ($adminIds) {
                    $query->where('owner_id', $this->params['userId'])
                        ->orWhereIn('owner_id', $adminIds);
                });
        } else {
            $folder->where('workspace_id', $this->workspaceId);
            if ($this->workspaceId) {
                $this->scopeToOwnerIfCantViewWorkspaceFiles();
            } else {
                $folder->whereOwner($this->userId);
            }
        }

        $folder = $folder->byIdOrHash($this->params['folderId'])->firstOrFail();

        // Get all files in this folder
        $this->builder->where('parent_id', $folder->id);
        
        if (isset($this->params['userId'])) {
            $this->builder->where('workspace_id', 0)
                ->where(function($query) use ($adminIds) {
                    $query->where('owner_id', $this->params['userId'])
                        ->orWhereIn('owner_id', $adminIds);
                });
        } else {
            $this->builder->where('workspace_id', $this->workspaceId);
            if ($this->workspaceId) {
                $this->scopeToOwnerIfCantViewWorkspaceFiles();
            } else {
                $this->builder->whereOwner($this->userId);
            }
        }

        // Log the SQL query and bindings
        \Log::info('SQL Query', [
            'sql' => $this->builder->toSql(),
            'bindings' => $this->builder->getBindings()
        ]);

        // Check if there are any files in the database
        $fileCount = FileEntry::count();
        \Log::info('Total files in database', ['count' => $fileCount]);

        // Check files owned by the user
        $userFiles = FileEntry::where('owner_id', $this->params['userId'])->count();
        \Log::info('Files owned by user', ['count' => $userFiles]);

        // Check files owned by admins
        $adminFiles = FileEntry::whereIn('owner_id', $adminIds)->count();
        \Log::info('Files owned by admins', ['count' => $adminFiles]);

        // Check files at root level
        $rootFiles = FileEntry::whereNull('parent_id')->count();
        \Log::info('Files at root level', ['count' => $rootFiles]);

        $results = $this->loadEntries();
        $results['folder'] = $this->setPermissionsOnEntry->execute($folder);
        
        \Log::info('Results', [
            'total' => $results['total'] ?? 0,
            'data_count' => count($results['data'] ?? [])
        ]);
        
        return $results;
    }

    protected function search(): array
    {
        // apply "trash" filter
        if ($this->filters->getAndRemove('deleted_at')) {
            $this->builder->onlyTrashed()->whereRootOrParentNotTrashed();
        }

        if ($sharedByMe = $this->filters->getAndRemove('sharedByMe')) {
            $checkOwnerId = !$this->workspaceId;
            $this->builder->sharedByUser($this->userId, $checkOwnerId);
        }

        if ($folderId = Arr::get($this->params, 'folderId')) {
            $folder = FileEntry::byIdOrHash($folderId)->first();
            if ($folder) {
                $this->builder->where(
                    'path',
                    'like',
                    $folder->getRawOriginal('path') . '/%',
                );
            }
        }

        $this->builder->where('workspace_id', $this->workspaceId);
        if ($this->workspaceId) {
            $this->scopeToOwnerIfCantViewWorkspaceFiles();
        } else {
            // if "sharedByMe" filter is present, show entries shared by user, otherwise
            // scope search to entries owned by user and entries shared with user
            if (!$sharedByMe) {
                $this->builder->whereUser($this->userId, true);
            }
        }

        return $this->loadEntries();
    }

    protected function recent(): array
    {
        try {
            // only show files in recent section
            $this->builder->where('type', '!=', 'folder');

            $this->builder->where('workspace_id', $this->workspaceId);
            if ($this->workspaceId) {
                $this->scopeToOwnerIfCantViewWorkspaceFiles();
            } else {
                $this->builder->whereOwner($this->userId);
            }

            // Add logging for debugging
            \Log::info('Recent files query', [
                'sql' => $this->builder->toSql(),
                'bindings' => $this->builder->getBindings(),
                'userId' => $this->userId,
                'workspaceId' => $this->workspaceId
            ]);

            $results = $this->loadEntries();

            // Validate results structure
            if (!isset($results['data']) || !is_array($results['data'])) {
                throw new \Exception('Invalid results structure');
            }

            // Log the results count
            \Log::info('Recent files results', [
                'count' => count($results['data']),
                'total' => $results['total'] ?? 0
            ]);

            return $results;
        } catch (\Exception $e) {
            \Log::error('Error in recent files', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'userId' => $this->userId,
                'workspaceId' => $this->workspaceId
            ]);

            // Return empty results with valid structure
            return [
                'data' => [],
                'total' => 0,
                'per_page' => $this->params['perPage'] ?? 50,
                'current_page' => 1,
                'last_page' => 1,
                'from' => 0,
                'to' => 0
            ];
        }
    }

    protected function trash(): array
    {
        $this->builder->onlyTrashed()->whereRootOrParentNotTrashed();

        $this->builder->where('workspace_id', $this->workspaceId);
        if ($this->workspaceId) {
            $this->scopeToOwnerIfCantViewWorkspaceFiles();
        } else {
            $this->builder->whereOwner($this->userId);
        }

        return $this->loadEntries();
    }

    protected function starred(): array
    {
        $this->builder->onlyStarred();

        $this->builder->where('workspace_id', $this->workspaceId);
        if ($this->workspaceId) {
            $this->scopeToOwnerIfCantViewWorkspaceFiles();
        } else {
            $this->builder->whereOwner($this->userId);
        }

        return $this->loadEntries();
    }

    protected function sharedByMe(): array
    {
        if ($this->workspaceId) {
            $this->builder->where('workspace_id', $this->workspaceId);
        }

        $this->builder->sharedByUser($this->userId);
        return $this->loadEntries();
    }

    protected function sharedWithMe(): array
    {
        if ($this->workspaceId) {
            $this->builder->where('workspace_id', $this->workspaceId);
        }

        $this->builder->sharedWithUserOnly($this->userId);
        return $this->loadEntries();
    }

    protected function scopeToOwnerIfCantViewWorkspaceFiles(): void
    {
        if ($this->workspaceId) {
            $canViewAllFiles = app(ActiveWorkspace::class)
                ->member($this->userId)
                ->hasPermission('files.view');
            if (!$canViewAllFiles) {
                $this->builder->whereOwner($this->userId);
            }
        }
    }

    protected function offline(): array
    {
        $this->builder->where('workspace_id', $this->workspaceId);
        if ($this->workspaceId) {
            $this->scopeToOwnerIfCantViewWorkspaceFiles();
        } else {
            $this->builder->whereOwner($this->userId);
        }

        return $this->loadEntries();
    }

    protected function allChildren(): array
    {
        $folderId = Arr::get($this->params, 'folderId');
        $folder = FileEntry::byIdOrHash($folderId)->firstOrFail();

        $this->builder->where(
            'path',
            'like',
            $folder->getRawOriginal('path') . '/%',
        );

        $this->builder->where('workspace_id', $this->workspaceId);
        if ($this->workspaceId) {
            $this->scopeToOwnerIfCantViewWorkspaceFiles();
        } else {
            $this->builder->whereUser($this->userId);
        }

        $this->params['perPage'] = 500;
        return $this->loadEntries();
    }

    protected function loadEntries(): array
    {
        try {
            // Log the query before execution
            \Log::info('Loading entries', [
                'sql' => $this->builder->toSql(),
                'bindings' => $this->builder->getBindings()
            ]);

            $datasource = new Datasource(
                $this->builder,
                // prevent filtering by user id or workspace, it will be done here already
                Arr::except($this->params, ['userId', 'workspaceId']),
                $this->filters
            );

            $datasource->buildQuery();

            // order by name in case updated_at date is the same
            $orderCol = $this->builder->getQuery()->orders[0]['column'] ?? null;
            if (!is_string($orderCol) || $orderCol != 'name') {
                $this->builder->orderBy('name', 'asc');
            }

            $results = $datasource->paginate()->toArray();
            
            // Validate pagination structure
            if (!isset($results['data']) || !is_array($results['data'])) {
                throw new \Exception('Invalid pagination structure');
            }

            $results['data'] = array_map(
                fn($result) => $this->setPermissionsOnEntry->execute($result),
                $results['data']
            );

            // Log successful results
            \Log::info('Entries loaded successfully', [
                'count' => count($results['data']),
                'total' => $results['total'] ?? 0
            ]);

            return $results;
        } catch (\Exception $e) {
            \Log::error('Error loading entries', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'userId' => $this->userId,
                'workspaceId' => $this->workspaceId
            ]);

            // Return empty pagination structure
            return [
                'data' => [],
                'total' => 0,
                'per_page' => $this->params['perPage'] ?? 50,
                'current_page' => 1,
                'last_page' => 1,
                'from' => 0,
                'to' => 0
            ];
        }
    }
}
