import {InfiniteData, useInfiniteQuery} from '@tanstack/react-query';
import {useSearchParams, useParams} from 'react-router';
import {hasNextPage, LengthAwarePaginationResponse} from '@common/http/backend-response/pagination-response';
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

export interface EntriesPaginationResponse extends LengthAwarePaginationResponse<DriveEntry> {
  folder?: DriveFolder;
}

export function usePaginatedEntries(options: {userId?: number} = {}) {
  const page = useDriveStore(s => s.activePage);
  const sortDescriptor = useDriveStore(s => s.sortDescriptor);
  const [searchParams] = useSearchParams();
  const {workspaceId} = useActiveWorkspaceId();
  const {userId} = useParams();
  const {userId: optionsUserId} = options;

  // Base params without workspaceId
  const params: DriveApiIndexParams = {
    orderBy: sortDescriptor?.orderBy,
    orderDir: sortDescriptor?.orderDir,
    section: page?.name || 'folder',
    perPage: 50,
    ...page?.queryParams,
    ...Object.fromEntries(searchParams),
    folderId: page?.isFolderPage ? page.uniqueId : '0',
  };

  // When viewing user files, ONLY use userId and never workspaceId
  if (optionsUserId != null || userId != null) {
    params.userId = optionsUserId ?? (userId ? parseInt(userId) : undefined);
    // Ensure workspaceId is not present
    delete params.workspaceId;
  } else {
    // When not viewing user files, ONLY use workspaceId
    params.workspaceId = workspaceId;
  }

  const isDisabledInSearch = page === SearchPage && !params.query && !params.filters;

  const query = useInfiniteQuery({
    queryKey: DriveQueryKeys.fetchEntries(params),
    queryFn: async ({pageParam = 1}) => {
      try {
        const queryParams = {
          ...params,
          page: pageParam,
        };
        
        // Use user-specific endpoint when userId is provided
        const endpoint = params.userId != null
          ? `drive/users/${params.userId}/file-entries`
          : 'drive/file-entries';

        const response = await apiClient.get<EntriesPaginationResponse>(endpoint, {
          params: queryParams,
        });

        // Ensure response has the expected structure
        if (!response.data) {
          throw new Error('Invalid response structure');
        }

        // Validate response data structure
        if (!Array.isArray(response.data.data)) {
          throw new Error('Invalid data array in response');
        }

        return response.data;
      } catch (error) {
        console.error('Error fetching entries:', error);
        // Return a valid pagination structure even in case of error
        return {
          data: [],
          current_page: pageParam,
          last_page: pageParam,
          per_page: params.perPage || 50,
          from: 0,
          to: 0,
          total: 0,
        };
      }
    },
    initialPageParam: 1,
    getNextPageParam: lastResponse => {
      if (!lastResponse || !hasNextPage(lastResponse)) {
        return undefined;
      }
      return lastResponse.current_page + 1;
    },
    enabled: !isDisabledInSearch,
    gcTime: 0,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 30000, // Consider data fresh for 30 seconds
    retry: 3, // Retry failed requests 3 times
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Update active folder if needed
  useEffect(() => {
    if (query.data?.pages[0]?.folder) {
      const folder = query.data.pages[0].folder;
      const currentFolder = useDriveStore.getState().activePage?.folder;
      
      if (!currentFolder || currentFolder.id !== folder.id || currentFolder.hash !== folder.hash) {
        driveState().setActivePage(makeFolderPage(folder, params.userId));
      }
    }
  }, [query.data, params.userId]);

  return query;
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
