import {useNavigate} from 'react-router-dom';
import {TextField} from '@ui/forms/input-field/text-field/text-field';
import {SearchIcon} from '@ui/icons/material/Search';
import {useActiveWorkspaceId} from '@common/workspace/active-workspace-id-context';
import {useState, Fragment} from 'react';
import {DataTable} from '@common/datatable/data-table';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {ColumnConfig} from '@common/datatable/column-config';
import {TableDataItem} from '@common/ui/tables/types/table-data-item';
import {DataTableEmptyStateMessage} from '@common/datatable/page/data-table-emty-state-message';

interface UserWithFolders extends TableDataItem {
  id: number;
  display_name: string;
  email: string;
  root_folders: {
    id: number;
    name: string;
  }[];
}

export function UserListPage() {
  const navigate = useNavigate();
  const {setWorkspaceId} = useActiveWorkspaceId();
  const {trans} = useTrans();

  const navigateToUserDrive = (userId: number) => {
    setWorkspaceId(0);
    navigate(`/drive/users/${userId}`);
  };

  const columns: ColumnConfig<UserWithFolders>[] = [
    {
      key: 'display_name',
      header: () => <Trans message="User" />,
      body: (user) => user.display_name || user.email,
    },
    {
      key: 'email',
      header: () => <Trans message="Email" />,
      body: (user) => user.email,
    },
    {
      key: 'root_folders',
      header: () => <Trans message="Root folders" />,
      body: (user) => user.root_folders.length,
    },
    {
      key: 'actions',
      header: () => <Fragment />,
      body: (user) => (
        <button
          onClick={() => navigateToUserDrive(user.id)}
          className="text-muted hover:text-primary transition-colors"
        >
          <Trans message="View drive" />
        </button>
      ),
    },
  ];

  return (
    <div className="p-12 md:p-24">
      <DataTable 
        columns={columns}
        onRowAction={(item: UserWithFolders) => navigateToUserDrive(item.id)}
        endpoint="drive/file-entries"
        queryParams={{
          with: 'entries'
        }}
        searchPlaceholder={{message: 'Search users...'}}
        emptyStateMessage={
          <DataTableEmptyStateMessage
            image="/assets/images/users.svg"
            title={<Trans message="No users found" />}
            filteringTitle={<Trans message="No users match the search query" />}
          />
        }
      />
    </div>
  );
} 