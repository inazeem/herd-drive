<?php

namespace App\Http\Controllers;

use App\Models\User;
use Common\Core\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class UsersController extends BaseController
{
    public function index(): JsonResponse
    {
        try {
            // Log authentication status
            Log::info('Authentication status:', [
                'is_authenticated' => Auth::check(),
                'user_id' => Auth::id(),
                'user' => Auth::user() ? [
                    'id' => Auth::user()->id,
                    'email' => Auth::user()->email,
                    'permissions' => Auth::user()->permissions ?? 'no permissions'
                ] : 'no user'
            ]);

            // Temporarily comment out permission check for debugging
            /*
            if (!auth()->user()->hasPermission('admin') && !auth()->user()->hasPermission('superadmin')) {
                abort(403);
            }
            */

            // Get total count of users
            $totalUsers = User::count();
            Log::info('Total users in database:', ['count' => $totalUsers]);

            // Log the raw SQL query
            $query = User::select('id', 'email', 'first_name', 'last_name', 'created_at', 'updated_at');
            Log::info('SQL Query:', ['sql' => $query->toSql(), 'bindings' => $query->getBindings()]);

            $users = $query->get()
                ->map(function($user) {
                    return [
                        'id' => $user->id,
                        'email' => $user->email,
                        'first_name' => $user->first_name,
                        'last_name' => $user->last_name,
                        'created_at' => $user->created_at,
                        'updated_at' => $user->updated_at,
                    ];
                })->values()->all();

            // Log the number of users returned
            Log::info('Users returned from query:', [
                'count' => count($users),
                'users' => $users
            ]);

            return $this->success(['users' => $users]);
        } catch (\Exception $e) {
            Log::error('Error in UsersController@index: ' . $e->getMessage(), [
                'exception' => $e,
                'user_id' => Auth::id(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->error('Could not fetch users.');
        }
    }
} 