import {useQuery} from '@tanstack/react-query';
import {useParams} from 'react-router-dom';
import {IllustratedMessage} from '@ui/images/illustrated-message';
import {SvgImage} from '@ui/images/svg-image';
import {Trans} from '@ui/i18n/trans';
import {apiClient} from '@common/http/query-client';
import {FileTable} from './file-table/file-table';
import {PersonIcon} from '@ui/icons/material/Person';
import {DriveEntry} from '../files/drive-entry';

interface FileEntry {
  id: number;
  name: string;
  type: string;
  file_name: string;
  mime: string;
  file_size: number;
  created_at: string;
  updated_at: string;
  owner: {
    id: number;
    email: string;
    name: string;
  };
}

interface User {
  id: number;
  email: string;
  name: string;
}

interface UserFilesResponse {
  entries: FileEntry[];
  user: User;
}

export function UserFilesPage() {
  const {userId} = useParams();
  
  const {data, isLoading} = useQuery({
    queryKey: ['user-files', userId],
    queryFn: () => fetchUserFiles(userId!),
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!data?.entries?.length) {
    return (
      <IllustratedMessage
        image={<SvgImage src="/assets/folder.svg" />}
        title={<Trans message="No files found" />}
        description={<Trans message="This user has no files or folders yet." />}
      />
    );
  }

  // Transform FileEntry[] to DriveEntry[]
  const driveEntries: DriveEntry[] = data.entries.map(entry => ({
    ...entry,
    parent_id: null,
    users: [{
      id: entry.owner.id,
      email: entry.owner.email,
      name: entry.owner.name,
      owns_entry: true,
      entry_permissions: {
        edit: true,
        view: true,
        download: true,
      }
    }],
    permissions: {
      'files.create': false,
      'files.update': false,
      'files.delete': false,
      'files.download': true,
    },
    hash: entry.file_name, // Using file_name as hash since it's required
    url: `/api/v1/files/${entry.id}`, // Constructing URL based on file ID
    path: entry.file_name, // Using file_name as path since it's required
  }));

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-6">
          <PersonIcon size="lg" />
          <div>
            <h1 className="text-2xl font-bold">{data.user.name}</h1>
            <div className="text-sm text-muted">{data.user.email}</div>
          </div>
        </div>
      </div>

      <FileTable entries={driveEntries} />
    </div>
  );
}

async function fetchUserFiles(userId: string): Promise<UserFilesResponse> {
  return apiClient.get(`users/${userId}/files`).then(response => response.data);
} 