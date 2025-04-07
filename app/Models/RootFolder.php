<?php

namespace App\Models;

use Arr;
use Auth;
use Common\Workspaces\ActiveWorkspace;
use App\Models\User;

class RootFolder extends FileEntry
{
    protected $id = 0;
    protected $appends = ['name'];
    protected $casts = [];
    protected $relations = ['users'];
    public $owner_id;

    protected $attributes = [
        'type' => 'folder',
        'id' => 0,
        'hash' => '0',
        'path' => '',
    ];

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);

        // Set owner_id from attributes if provided
        if (isset($attributes['owner_id'])) {
            $this->owner_id = $attributes['owner_id'];
            $this->workspace_id = 0; // Personal workspace for specific user
            
            // Load the owner user and set up the users relationship
            $owner = User::find($attributes['owner_id']);
            if ($owner) {
                $user = Arr::only($owner->toArray(), [
                    'first_name',
                    'last_name',
                    'name',
                    'email',
                    'id',
                    'image',
                ]);
                $user['owns_entry'] = true;
                $this->users = collect([$user]);
            } else {
                $this->users = collect([]);
            }
        } else {
            // Only set current user as owner if no specific owner_id is set
            $this->setCurrentUserAsOwner();
            $this->workspace_id = app(ActiveWorkspace::class)->id;
        }
    }

    public function getNameAttribute(): string
    {
        return trans('All Files');
    }

    public function getHashAttribute(): string
    {
        return '0';
    }

    private function setCurrentUserAsOwner(): void
    {
        $users = collect([]);
        if (
            Auth::check() &&
            app(ActiveWorkspace::class)->currentUserIsOwner()
        ) {
            $user = Arr::only(Auth::user()->toArray(), [
                'first_name',
                'last_name',
                'name',
                'email',
                'id',
                'image',
            ]);
            $user['owns_entry'] = true;
            $users[] = $user;
        }
        $this->users = $users;
        $this->owner_id = Auth::id();
    }
}
