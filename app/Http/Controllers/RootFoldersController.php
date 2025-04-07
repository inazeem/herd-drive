<?php

namespace App\Http\Controllers;

use App\Models\FileEntry;
use App\Models\User;
use Common\Core\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class RootFoldersController extends BaseController
{
    public function index(): JsonResponse
    {
        try {
            if (!auth()->user()->hasPermission('admin') && !auth()->user()->hasPermission('superadmin')) {
                abort(403);
            }

            $query = User::query()
                ->with(['entries' => function($query) {
                    $query->where('type', 'folder')
                        ->whereNull('parent_id')
                        ->orWhere('name', 'root');
                }]);

            // Handle search
            if ($searchQuery = Request::get('query')) {
                $query->where(function($q) use ($searchQuery) {
                    $q->where('email', 'like', "%{$searchQuery}%")
                        ->orWhere('first_name', 'like', "%{$searchQuery}%")
                        ->orWhere('last_name', 'like', "%{$searchQuery}%");
                });
            }

            $users = $query->paginate(Request::get('perPage', 15));

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
        } catch (\Exception $e) {
            Log::error('Error in RootFoldersController@index: ' . $e->getMessage(), [
                'exception' => $e,
                'user_id' => Auth::id()
            ]);
            return $this->error('Could not fetch root folders.');
        }
    }
} 