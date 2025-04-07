<?php

namespace App\Policies;

use App\Models\Model;
use Illuminate\Auth\Access\HandlesAuthorization;

class ModelPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny($user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view($user, Model $model): bool
    {
        return true;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create($user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update($user, Model $model): bool
    {
        return true;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete($user, Model $model): bool
    {
        return true;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore($user, Model $model): bool
    {
        return true;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete($user, Model $model): bool
    {
        return true;
    }
} 