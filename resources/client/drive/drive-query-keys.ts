import type {DriveApiIndexParams} from './files/queries/use-paginated-entries';
import type {UserFoldersApiParams} from './files/queries/use-folders';
import {queryClient} from '@common/http/query-client';
import {Key} from 'react';

export const DriveQueryKeys = {
  fetchEntries: (params?: DriveApiIndexParams) => {
    // Always start with base key
    const key: (string | number | DriveApiIndexParams)[] = ['drive-entries'];
    
    // If we have a userId, make it part of the base key to ensure unique caching per user
    if (params?.userId != null) {
      key.push('user');
      key.push(params.userId);
    }
    
    // Add remaining params without userId and workspaceId
    if (params) {
      const {userId: _, workspaceId: __, ...cleanParams} = params;
      key.push(cleanParams);
    }
    
    return key;
  },
  fetchUserFolders(params?: UserFoldersApiParams) {
    const key: (string | UserFoldersApiParams)[] = ['user-folders'];
    if (params) {
      key.push(params);
    }
    return key;
  },
  fetchShareableLink: (params?: {hash?: string; sort?: string}) => {
    const key: (string | object)[] = ['shareable-link'];
    if (params) {
      key.push(params);
    }
    return key;
  },
  fetchFolderPath(
    hash?: string,
    params?: Record<string, string | number | null>,
  ) {
    const key: (string | any)[] = ['folder-path'];
    if (hash) {
      key.push(hash);
    }
    if (params) {
      key.push(params);
    }
    return key;
  },
  fetchEntryShareableLink: (entryId: number) => {
    return ['file-entries', entryId, 'shareable-link'];
  },
  fetchFileEntry: (id?: number) => {
    const key: Key[] = ['drive/file-entries/model'];
    if (id) key.push(id);
    return key;
  },
  fetchStorageSummary: ['storage-summary'],
};

export function invalidateEntryQueries() {
  return Promise.all([
    queryClient.invalidateQueries({queryKey: DriveQueryKeys.fetchEntries()}),
    queryClient.invalidateQueries({queryKey: DriveQueryKeys.fetchFolderPath()}),
    queryClient.invalidateQueries({
      queryKey: DriveQueryKeys.fetchUserFolders(),
    }),
    // fetching model for single file entry in "useFileEntry"
    queryClient.invalidateQueries({queryKey: DriveQueryKeys.fetchFileEntry()}),
  ]);
}
