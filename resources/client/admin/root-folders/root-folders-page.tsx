import {useQuery} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import {Button} from '@common/ui/library/buttons/button';
import {FormattedDate} from '@common/ui/library/i18n/formatted-date';
import {IllustratedMessage} from '@common/ui/library/images/illustrated-message';
import {SvgImage} from '@common/ui/library/images/svg-image';
import {SearchIcon} from '@common/ui/library/icons/material/Search';
import {TextField} from '@common/ui/library/forms/input-field/text-field/text-field';
import {useState} from 'react';
import {FolderIcon} from '@common/ui/library/icons/material/Folder';
import {Skeleton} from '@common/ui/library/skeleton/skeleton';

interface RootFolder {
  id: number;
  name: string;
  owner_id: number;
  created_at: string;
  updated_at: string;
}

interface UserWithFolders {
  user: {
    id: number;
    email: string;
    name: string;
  };
  root_folders: RootFolder[];
}

export function RootFoldersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const {data, isLoading} = useQuery({
    queryKey: ['root-folders'],
    queryFn: () => fetchRootFolders(),
  });

  const filteredData = data?.root_folders.filter((item: UserWithFolders) => 
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
        title="No root folders found"
        description="There are no root folders available at the moment."
      />
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">User Root Folders</h1>
        <div className="flex items-center gap-2">
          <TextField
            startAdornment={<SearchIcon />}
            placeholder="Search by user name or email..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
      </div>

      <div className="grid gap-6">
        {filteredData?.map(({user, root_folders}: UserWithFolders) => (
          <div
            key={user.id}
            className="border rounded-lg shadow-sm bg-white dark:bg-alt"
          >
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{user.name}</h2>
                  <p className="text-sm text-muted">{user.email}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  elementType={Link}
                  to={`/admin/users/${user.id}`}
                >
                  View User
                </Button>
              </div>
            </div>
            <div className="p-4">
              {root_folders.length ? (
                <div className="grid gap-3">
                  {root_folders.map((folder: RootFolder) => (
                    <div
                      key={folder.id}
                      className="flex items-center justify-between p-2 hover:bg-hover rounded"
                    >
                      <div className="flex items-center gap-2">
                        <FolderIcon className="text-primary" />
                        <div>
                          <p className="font-medium">{folder.name}</p>
                          <p className="text-sm text-muted">
                            Created:{' '}
                            <FormattedDate date={folder.created_at} />
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        elementType={Link}
                        to={`/drive/folders/${folder.id}`}
                      >
                        Open Folder
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No root folders for this user.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
      <Skeleton className="h-8 w-48 mb-6" />
      <Skeleton className="h-10 max-w-md mb-6" />
      <div className="grid gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="border rounded-lg">
            <div className="p-4 border-b">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="p-4">
              <div className="grid gap-3">
                {[1, 2].map(j => (
                  <div key={j} className="flex justify-between items-center">
                    <Skeleton className="h-12 w-48" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            </div>
          </div>
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