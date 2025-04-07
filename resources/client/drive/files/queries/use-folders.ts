import {useQuery} from '@tanstack/react-query';
import {DriveFolder} from '../drive-entry';
import {useAuth} from '@common/auth/use-auth';
import {DriveQueryKeys} from '../../drive-query-keys';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {apiClient} from '@common/http/query-client';
import {useActiveWorkspaceId} from '@common/workspace/active-workspace-id-context';

export interface UserFoldersApiParams {
  userId: number;
  workspaceId: number | null;
}

interface UserFoldersResponse extends BackendResponse {
  folders: DriveFolder[];
  rootFolder: DriveFolder;
}

function fetchUserFolders(
  params: UserFoldersApiParams,
): Promise<UserFoldersResponse> {
  return apiClient
    .get(`users/${params.userId}/folders`, {params})
    .then(response => response.data);
}

export function useFolders(options: {userId?: number} = {}) {
  const {user} = useAuth();
  const {workspaceId} = useActiveWorkspaceId();
  
  // Use provided userId if available, otherwise use logged-in user's ID
  const userId = options.userId ?? user!.id;
  
  const params: UserFoldersApiParams = {
    userId,
    workspaceId: options.userId ? null : workspaceId, // If viewing another user's folders, set workspaceId to null
  };
  
  return useQuery({
    queryKey: DriveQueryKeys.fetchUserFolders(params),
    queryFn: () => fetchUserFolders(params),
    enabled: !!user,
  });
}
