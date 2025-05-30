<?php

namespace Common\Comments;

use App\Models\User;
use Common\Auth\BaseUser;
use Common\Comments\Comment;
use Common\Core\Policies\BasePolicy;

class CommentPolicy extends BasePolicy
{
    public function vote(User $user)
    {
        return $user->hasPermission('comments.create');
    }

    public function index(?BaseUser $user, $userId = null)
    {
        return $user->hasPermission('comments.view') ||
            $user->id === (int) $userId;
    }

    public function show(?BaseUser $user, Comment $comment)
    {
        return $user->hasPermission('comments.view') ||
            $comment->user_id === $user->id;
    }

    public function store(BaseUser $user)
    {
        return $user->id && $user->hasPermission('comments.create');
    }

    public function update(BaseUser $user, ?Comment $comment = null)
    {
        return $user->hasPermission('comments.update') ||
            ($comment && $comment->user_id === $user->id);
    }

    public function destroy(BaseUser $user, $commentIds)
    {
        if ($user->hasPermission('comments.delete')) {
            return true;
        } else {
            $dbCount = app(Comment::class)
                ->whereIn('id', $commentIds)
                ->where('user_id', $user->id)
                ->count();
            return $dbCount === count($commentIds);
        }
    }
}
