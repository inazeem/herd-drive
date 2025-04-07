import {DriveEntry} from '../drive-entry';
import {usePaginatedEntries} from './use-paginated-entries';

export function useEntries(options: {userId?: number} = {}): DriveEntry[] {
  const query = usePaginatedEntries(options);
  if (!query.data) return [];
  return query.data.pages.flatMap(p => p.data);
}
