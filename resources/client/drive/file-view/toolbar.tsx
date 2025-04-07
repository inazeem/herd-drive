import React from 'react';
import {useDriveStore} from '../drive-store';
import {DriveSortButton} from '../layout/sorting/drive-sort-button';
import {EntryActionList} from '../entry-actions/entry-action-list';

export function Toolbar() {
  const activePage = useDriveStore(s => s.activePage);
  return (
    <div className="my-10 flex min-h-42 items-center justify-between gap-40 px-10 text-muted md:px-18">
      <DriveSortButton isDisabled={activePage?.disableSort} />
      <EntryActionList className="text-muted" />
    </div>
  );
} 