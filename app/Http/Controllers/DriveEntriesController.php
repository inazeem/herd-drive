<?php

namespace App\Http\Controllers;

use App\Models\FileEntry;
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

    public function showModel($fileEntryId)
    {
        $fileEntry = FileEntry::findOrFail($fileEntryId);
        $this->authorize('show', $fileEntry);

        $fileEntry->load('users');
        app(SetPermissionsOnEntry::class)->execute($fileEntry);

        return $this->success(['fileEntry' => $fileEntry]);
    }

    public function index()
    {
        $this->middleware('auth');

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
}
