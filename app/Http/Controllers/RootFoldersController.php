<?php

namespace App\Http\Controllers;

use App\Models\FileEntry;
use App\Models\User;
use Common\Core\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class RootFoldersController extends BaseController
{
    public function index(): JsonResponse
    {
        try {
            if (!auth()->user()->hasPermission('admin') && !auth()->user()->hasPermission('superadmin')) {
                abort(403);
            }

            $users = User::with(['entries' => function($query) {
                $query->where('type', 'folder')
                    ->whereNull('parent_id')
                    ->orWhere('name', 'root');
            }])->get(['id', 'email', 'first_name', 'last_name']);

            $rootFolders = $users->map(function($user) {
                return [
                    'user' => [
                        'id' => $user->id,
                        'email' => $user->email,
                        'name' => $user->first_name . ' ' . $user->last_name,
                    ],
                    'root_folders' => $user->entries->map(function($entry) {
                        return [
                            'id' => $entry->id,
                            'name' => $entry->name,
                            'owner_id' => $entry->owner_id,
                            'created_at' => $entry->created_at,
                            'updated_at' => $entry->updated_at,
                        ];
                    })->values()->all()
                ];
            })->values()->all();

            return $this->success(['root_folders' => $rootFolders]);
        } catch (\Exception $e) {
            Log::error('Error in RootFoldersController@index: ' . $e->getMessage(), [
                'exception' => $e,
                'user_id' => Auth::id()
            ]);
            return $this->error('Could not fetch root folders.');
        }
    }
} 