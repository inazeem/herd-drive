<?php

namespace App\Http\Controllers;

use App\Models\FileEntry;
use App\Models\User;
use App\Services\Entries\DriveEntriesLoader;
use App\Services\Entries\FetchDriveEntries;
use App\Services\Entries\SetPermissionsOnEntry;
use Common\Files\Controllers\FileEntriesController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DriveEntriesController extends FileEntriesController
{
    public function __construct(Request $request, FileEntry $entry)
    {
        parent::__construct($request, $entry);
        $this->request = $request;
        $this->entry = $entry;
    }

    public function index()
    {
        $this->middleware('auth');

        // Check if user is admin/superadmin
        $user = Auth::user();
        if ($user && ($user->hasPermission('admin') || $user->hasPermission('superadmin'))) {
            // If no specific user is requested, show the user list
            if (!$this->request->route('userId')) {
                return $this->getUserList();
            }
        }

        $params = $this->request->all();
        
        // If we're viewing a specific user's drive (from admin panel)
        if ($this->request->route('userId')) {
            $params['userId'] = (int) $this->request->route('userId');
            // Force workspace_id to 0 for user-specific views
            $params['workspace_id'] = 0;
            // Only show files owned by this user
            $params['owner_id'] = $params['userId'];
        } else {
            $params['userId'] = Auth::id();
        }

        $this->authorize('index', [FileEntry::class, null, $params['userId']]);

        if (isset($params['section'])) {
            return (new DriveEntriesLoader($params))->load();
        }

        return app(FetchDriveEntries::class)->execute($params);
    }

    protected function getUserList()
    {
        $query = User::query()
            ->with(['entries' => function($query) {
                $query->where('type', 'folder')
                    ->whereNull('parent_id')
                    ->orWhere('name', 'root');
            }])
            ->whereDoesntHave('roles', function($q) {
                $q->whereIn('name', ['admin', 'superadmin']);
            });

        // Handle search
        if ($searchQuery = $this->request->get('query')) {
            $query->where(function($q) use ($searchQuery) {
                $q->where('email', 'like', "%{$searchQuery}%")
                    ->orWhere('first_name', 'like', "%{$searchQuery}%")
                    ->orWhere('last_name', 'like', "%{$searchQuery}%");
            });
        }

        $users = $query->paginate($this->request->get('perPage', 15));

        $data = $users->map(function($user) {
            return [
                'id' => $user->id,
                'display_name' => trim($user->first_name . ' ' . $user->last_name) ?: $user->email,
                'email' => $user->email,
                'root_folders' => $user->entries->map(function($entry) {
                    return [
                        'id' => $entry->id,
                        'name' => $entry->name,
                    ];
                })->values()->all()
            ];
        });

        return $this->success([
            'pagination' => [
                'data' => $data,
                'total' => $users->total(),
                'per_page' => $users->perPage(),
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'from' => $users->firstItem(),
                'to' => $users->lastItem(),
            ]
        ]);
    }

    public function showModel($fileEntryId)
    {
        $fileEntry = FileEntry::findOrFail($fileEntryId);
        $this->authorize('show', $fileEntry);

        $fileEntry->load('users');
        app(SetPermissionsOnEntry::class)->execute($fileEntry);

        return $this->success(['fileEntry' => $fileEntry]);
    }
}
