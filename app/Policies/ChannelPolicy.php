<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ChannelPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any channels.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the channel.
     */
    public function view(User $user, $channel): bool
    {
        return true;
    }

    /**
     * Determine whether the user can create channels.
     */
    public function create(User $user): bool
    {
        return $user->hasRole(['admin', 'superadmin']);
    }

    /**
     * Determine whether the user can update the channel.
     */
    public function update(User $user, $channel): bool
    {
        return $user->hasRole(['admin', 'superadmin']);
    }

    /**
     * Determine whether the user can delete the channel.
     */
    public function delete(User $user, $channel): bool
    {
        return $user->hasRole(['admin', 'superadmin']);
    }

    /**
     * Determine whether the user can restore the channel.
     */
    public function restore(User $user, $channel): bool
    {
        return $user->hasRole(['admin', 'superadmin']);
    }

    /**
     * Determine whether the user can permanently delete the channel.
     */
    public function forceDelete(User $user, $channel): bool
    {
        return $user->hasRole(['admin', 'superadmin']);
    }
} 