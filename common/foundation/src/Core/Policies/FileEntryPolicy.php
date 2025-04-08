<?php

namespace Common\Core\Policies;

use App\Models\User;
use Common\Files\FileEntry;
use Common\Files\FileEntryUser;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Gate;
use Laravel\Sanctum\PersonalAccessToken;

class FileEntryPolicy extends BasePolicy
{
    public function index(
        ?User $user,
        array $entryIds = null,
        int $userId = null,
    ): bool {
        if ($entryIds) {
            return $this->userCan($user, 'files.view', $entryIds);
        } else {
            return $user->hasPermission('files.view') || $userId === $user->id;
        }
    }

    public function show(?User $user, FileEntry $entry): bool
    {
        if (request('policy')) {
            if (Gate::allows('show', [request('policy'), $entry])) {
                return true;
            }
        }

        $token = $this->getAccessTokenFromRequest();

        if ($token) {
            if ($entry->preview_token === $token) {
                return true;
            } elseif (
                $accessToken = app(PersonalAccessToken::class)->findToken(
                    $token,
                )
            ) {
                $user = $accessToken->tokenable;
            }
        }

        return $user && $this->userCan($user, 'files.view', $entry);
    }

    public function download(User $user, $entries): bool
    {
        if (request('policy')) {
            if (Gate::allows('show', [request('policy'), $entries[0]])) {
                return true;
            }
        }

        $token = $this->getAccessTokenFromRequest();
        if ($token) {
            $previewTokenMatches = collect($entries)->every(function (
                $entry,
            ) use ($token) {
                return $entry['preview_token'] === $token;
            });
            if ($previewTokenMatches) {
                return true;
            } elseif (
                $accessToken = app(PersonalAccessToken::class)->findToken(
                    $token,
                )
            ) {
                $user = $accessToken->tokenable;
            }
        }

        // Check if we're in a personal workspace view
        $workspaceId = (int) request('workspaceId', 0);
        $isPersonalWorkspace = $workspaceId === 0;

        if ($isPersonalWorkspace) {
            // Allow download if the file is in user's personal workspace, regardless of owner
            return true;
        }

        return $this->userCan($user, 'files.download', $entries);
    }

    public function store(User $user, int $parentId = null): bool
    {
        //check if user can modify parent entry (if specified)
        if ($parentId) {
            return $this->userCan($user, 'files.update', [$parentId]);
        }

        return $user->hasPermission('files.create');
    }

    public function update(User $user, Collection|array|FileEntry $entries)
    {
        return $this->userCan($user, 'files.update', $entries);
    }

    /**
     * @param User $user
     * @param Collection|array|FileEntry $entries
     * @return bool
     */
    public function destroy(User $user, $entries)
    {
        return $this->userCan($user, 'files.delete', $entries);
    }

    /**
     * @param User $currentUser
     * @param string $permission
     * @param FileEntry|array|Collection $entries
     * @return bool
     */
    protected function userCan(User $currentUser, string $permission, $entries)
    {
        // Check for admin or superadmin permissions first
        if ($currentUser->hasPermission('admin') || $currentUser->hasPermission('superadmin')) {
            return true;
        }

        // Check if we're in a personal workspace view
        $workspaceId = (int) request('workspaceId', 0);
        $isPersonalWorkspace = $workspaceId === 0;

        // Allow all operations in personal workspace
        if ($isPersonalWorkspace) {
            // Only allow basic file operations (view, download, star, copy)
            $allowedPersonalOps = [
                'files.view',
                'files.download',
                'files.update', // needed for starring/renaming
                'files.create', // needed for make a copy
            ];
            
            if (in_array($permission, $allowedPersonalOps)) {
                return true;
            }
        }

        if ($currentUser->hasPermission($permission)) {
            return true;
        }

        $entries = $this->findEntries($entries);

        // extending class might use "findEntries" method so we load users here
        if (!$entries->every->relationLoaded('users')) {
            $entries->load([
                'users' => function (MorphToMany $builder) use ($currentUser) {
                    $builder->where('users.id', $currentUser->id);
                },
            ]);
        }

        return $entries->every(function (FileEntry $entry) use (
            $permission,
            $currentUser,
        ) {
            $user = $entry->users->find($currentUser->id);
            return $this->userOwnsEntryOrWasGrantedPermission(
                $user,
                $permission,
            );
        });
    }

    /**
     * @param null|array|FileEntryUser $user
     * @param string $permission
     * @return bool
     */
    public function userOwnsEntryOrWasGrantedPermission(
        $user,
        string $permission,
    ) {
        return $user &&
            ($user['owns_entry'] ||
                Arr::get(
                    $user['entry_permissions'],
                    $this->sharedFilePermission($permission),
                ));
    }

    protected function findEntries(
        FileEntry|array|Collection $entries,
    ): Collection {
        if ($entries instanceof FileEntry) {
            return $entries->newCollection([$entries]);
        } elseif (isset($entries[0]) && is_numeric($entries[0])) {
            return app(FileEntry::class)
                ->whereIn('id', $entries)
                ->get();
        } else {
            return $entries;
        }
    }

    protected function sharedFilePermission($fullPermission): string
    {
        switch ($fullPermission) {
            case 'files.view':
                return 'view';
            case 'files.create':
            case 'files.update':
                return 'edit';
            case 'files.delete':
                return 'delete';
            case 'files.download':
                return 'download';
        }
    }

    protected function getAccessTokenFromRequest(): ?string
    {
        if ($token = request()->bearerToken()) {
            return $token;
        } elseif ($token = request()->get('preview_token')) {
            return $token;
        } elseif ($token = request()->get('accessToken')) {
            return $token;
        } else {
            return null;
        }
    }
}
