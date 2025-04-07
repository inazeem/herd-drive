import {InfiniteData, useInfiniteQuery} from '@tanstack/react-query';
import {useSearchParams} from 'react-router';
import {hasNextPage} from '@common/http/backend-response/pagination-response';
import {DriveEntry, DriveFolder} from '../drive-entry';
import {driveState, useDriveStore} from '../../drive-store';
import {apiClient, queryClient} from '@common/http/query-client';
import {DriveQueryKeys} from '../../drive-query-keys';
import {SearchPage, makeFolderPage} from '../../drive-page/drive-page';
import {useEffect} from 'react';
import {useActiveWorkspaceId} from '@common/workspace/active-workspace-id-context';

export interface DriveApiIndexParams {
  orderBy?: string;
  orderDir?: string;
  folderId?: string | number | null;
  query?: string;
  filters?: string;
  deletedOnly?: boolean;
  starredOnly?: boolean;
  sharedOnly?: boolean;
  perPage?: number;
  page?: number;
  recentOnly?: boolean;
  workspaceId?: number | null;
  section?: string;
  userId?: number;
}

export interface EntriesPaginationResponse {
  data: DriveEntry[];
  current_page: number;
  last_page: number;
  folder?: DriveFolder;
}

export function usePaginatedEntries(options: {userId?: number} = {}) {
  const page = useDriveStore(s => s.activePage);
  const sortDescriptor = useDriveStore(s => s.sortDescriptor);
  const [searchParams] = useSearchParams();
  const {workspaceId} = useActiveWorkspaceId();
  const {userId} = options;

  // Base params without workspaceId
  const params: DriveApiIndexParams = {
    orderBy: sortDescriptor?.orderBy,
    orderDir: sortDescriptor?.orderDir,
    section: page?.name || 'folder',
    ...page?.queryParams,
    ...Object.fromEntries(searchParams),
    folderId: page?.isFolderPage ? page.uniqueId : '0',
  };

  // When viewing user files, ONLY use userId and never workspaceId
  if (userId != null) {
    params.userId = userId;
    // Ensure workspaceId is not present
    delete params.workspaceId;
  } else {
    // When not viewing user files, ONLY use workspaceId
    params.workspaceId = workspaceId;
  }

  const isDisabledInSearch = page === SearchPage && !params.query && !params.filters;

  const query = useInfiniteQuery({
    queryKey: DriveQueryKeys.fetchEntries(params),
    queryFn: ({pageParam = 1}) => {
      const queryParams = {
        ...params,
        page: pageParam,
      };
      
      // Use user-specific endpoint when userId is provided
      const endpoint = userId != null
        ? `drive/users/${userId}/file-entries`
        : 'drive/file-entries';

      console.log('Making request to:', endpoint, 'with params:', queryParams); // Add logging

      return apiClient
        .get(endpoint, {
          params: queryParams,
        })
        .then(response => response.data);
    },
    initialPageParam: 1,
    getNextPageParam: lastResponse => {
      const currentPage = lastResponse.current_page;
      if (!hasNextPage(lastResponse)) {
        return undefined;
      }
      return currentPage + 1;
    },
    enabled: !isDisabledInSearch,
    gcTime: 0,
    // Reduce unnecessary refetches
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Update active folder if needed
  useEffect(() => {
    if (query.data?.pages[0]?.folder) {
      setActiveFolder(query.data);
    }
  }, [query.data]);

  return query;
}

function setActiveFolder(data: InfiniteData<EntriesPaginationResponse>) {
  const folder = data.pages[0].folder;
  if (!folder) return;
  const currentFolder = useDriveStore.getState().activePage?.folder;
  if (!currentFolder || currentFolder.id !== folder.id || currentFolder.hash !== folder.hash) {
    driveState().setActivePage(makeFolderPage(folder));
  }
}

export function getAllEntries(): DriveEntry[] {
  const caches = queryClient.getQueriesData<InfiniteData<EntriesPaginationResponse>>({
    queryKey: DriveQueryKeys.fetchEntries(),
  });
  return caches.reduce<DriveEntry[]>((all, cache) => {
    const current = cache[1] ? cache[1].pages.flatMap(p => p.data) : [];
    return [...all, ...current];
  }, []);
}
