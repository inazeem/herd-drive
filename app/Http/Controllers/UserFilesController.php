<?php

namespace App\Http\Controllers;

use App\Models\FileEntry;
use App\Models\User;
use Common\Core\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class UserFilesController extends BaseController
{
    public function index($userId): JsonResponse
    {
        try {
            // Check if current user is admin/superadmin
            if (!auth()->user()->hasPermission('admin.access') && !auth()->user()->hasPermission('admin') && !auth()->user()->hasPermission('superadmin')) {
                abort(403);
            }

            // Get the user
            $user = User::findOrFail($userId);

            // Get all files and folders for this user
            $entries = FileEntry::where('owner_id', $user->id)
                ->where(function($query) {
                    $query->whereNull('parent_id')
                        ->orWhere('name', 'root');
                })
                ->with(['owner:id,email,first_name,last_name'])
                ->get()
                ->map(function($entry) {
                    return [
                        'id' => $entry->id,
                        'name' => $entry->name,
                        'type' => $entry->type,
                        'file_name' => $entry->file_name,
                        'mime' => $entry->mime,
                        'file_size' => $entry->file_size,
                        'created_at' => $entry->created_at,
                        'updated_at' => $entry->updated_at,
                        'owner' => [
                            'id' => $entry->owner->id,
                            'email' => $entry->owner->email,
                            'name' => $entry->owner->first_name . ' ' . $entry->owner->last_name,
                        ],
                    ];
                })->values()->all();

            return $this->success([
                'entries' => $entries,
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'name' => $user->first_name . ' ' . $user->last_name,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error in UserFilesController@index: ' . $e->getMessage(), [
                'exception' => $e,
                'user_id' => Auth::id()
            ]);
            return $this->error('Could not fetch user files.', [], 500);
        }
    }
} 