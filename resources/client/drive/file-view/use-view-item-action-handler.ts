import {useCallback} from 'react';
import {getPathForFolder, TrashPage} from '../drive-page/drive-page';
import {driveState} from '../drive-store';
import {DriveEntry} from '../files/drive-entry';
import {getSelectedEntries} from '../files/use-selected-entries';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {useParams} from 'react-router-dom';

export function useViewItemActionHandler() {
  const navigate = useNavigate();
  const {userId} = useParams();

  const performViewItemAction = useCallback(
    (entry: DriveEntry) => {
      if (entry && entry.type === 'folder') {
        if (driveState().activePage === TrashPage) {
          driveState().setActiveActionDialog('trashFolderBlock', [entry]);
        } else {
          navigate(getPathForFolder(entry.hash, userId ? parseInt(userId) : undefined));
        }
      } else {
        const selectedEntries = getSelectedEntries();
        driveState().setActiveActionDialog(
          'preview',
          selectedEntries.length ? selectedEntries : [entry],
        );
      }
    },
    [navigate, userId],
  );

  return {performViewItemAction};
}
