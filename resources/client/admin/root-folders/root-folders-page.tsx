import {useQuery} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import {Fragment} from 'react';
import {Button} from '@ui/buttons/button';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {IllustratedMessage} from '@ui/images/illustrated-message';
import {SvgImage} from '@ui/images/svg-image';
import {SearchIcon} from '@ui/icons/material/Search';
import {TextField} from '@ui/forms/input-field/text-field/text-field';
import {useState} from 'react';
import {FolderIcon} from '@ui/icons/material/Folder';
import {Skeleton} from '@ui/skeleton/skeleton';
import {PersonIcon} from '@ui/icons/material/Person';
import {Table} from '@common/ui/tables/table';
import {ColumnConfig} from '@common/datatable/column-config';
import {IconButton} from '@ui/buttons/icon-button';
import {KeyboardArrowRightIcon} from '@ui/icons/material/KeyboardArrowRight';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {message} from '@ui/i18n/message';

interface RootFolder {
  id: number;
  name: string;
  owner_id: number;
  created_at: string;
  updated_at: string;
}

interface UserWithFolders {
  id: number;
  user: {
    id: number;
    email: string;
    name: string;
  };
  root_folders: RootFolder[];
}

export function RootFoldersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithFolders | null>(null);
  const {trans} = useTrans();
  
  const {data, isLoading} = useQuery({
    queryKey: ['root-folders'],
    queryFn: () => fetchRootFolders(),
  });

  const filteredData = data?.root_folders.map((item: UserWithFolders) => ({
    ...item,
    // Use the user's ID as the unique identifier for the table row
    id: item.user.id,
  })).filter((item: UserWithFolders) => 
    item.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!data?.root_folders.length) {
    return (
      <IllustratedMessage
        image={<SvgImage src="/assets/folder.svg" />}
        title={<Trans message="No users found" />}
        description={<Trans message="There are no users available at the moment." />}
      />
    );
  }

  const columnConfig: ColumnConfig<UserWithFolders>[] = [
    {
      key: 'name',
      header: () => <Trans message="Name" />,
      width: '200px',
      body: (item: UserWithFolders) => (
        <div className="flex items-center gap-2">
          <PersonIcon />
          <div>
            <div className="font-medium">{item.user.name || <Trans message="Unnamed User" />}</div>
            <div className="text-sm text-muted">{item.user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'folders',
      header: () => <Trans message="Root Folders" />,
      body: (item: UserWithFolders) => (
        <span>{item.root_folders.length}</span>
      ),
    },
    {
      key: 'actions',
      header: () => <Fragment />,
      width: '70px',
      body: (item: UserWithFolders) => (
        <IconButton 
          size="sm"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            setSelectedUser(item);
          }}
        >
          <KeyboardArrowRightIcon/>
        </IconButton>
      ),
    },
  ];

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4"><Trans message="User Root Folders" /></h1>
        <div className="flex items-center gap-2">
          <TextField
            startAdornment={<SearchIcon />}
            placeholder={trans({message: "Search by user name or email..."})}
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
      </div>

      <Table 
        columns={columnConfig}
        data={filteredData || []}
        onAction={(item: UserWithFolders) => setSelectedUser(item)}
        className="mt-4"
      />

      <DialogTrigger
        type="modal"
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
      >
        <Dialog size="lg">
          <DialogHeader>
            <Trans 
              message="Folders for {email}" 
              values={{email: selectedUser?.user.email}} 
            />
          </DialogHeader>
          <DialogBody>
            {selectedUser?.root_folders.length ? (
              <div className="grid gap-3">
                {selectedUser.root_folders.map((folder: RootFolder) => (
                  <div
                    key={folder.id}
                    className="flex items-center justify-between p-2 hover:bg-hover rounded"
                  >
                    <div className="flex items-center gap-2">
                      <FolderIcon className="text-primary" />
                      <div>
                        <p className="font-medium">{folder.name}</p>
                        <p className="text-sm text-muted">
                          <Trans 
                            message="Created: {date}" 
                            values={{
                              date: <FormattedDate date={folder.created_at} />
                            }} 
                          />
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      elementType={Link}
                      to={`/drive/folders/${folder.id}`}
                    >
                      <Trans message="Open Folder" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted">
                <Trans message="No root folders for this user." />
              </p>
            )}
          </DialogBody>
        </Dialog>
      </DialogTrigger>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
      <div className="mb-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-10 w-64" />
      </div>
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>
  );
}

async function fetchRootFolders() {
  const response = await fetch('/api/v1/root-folders');
  if (!response.ok) {
    throw new Error('Failed to fetch root folders');
  }
  return response.json();
} 