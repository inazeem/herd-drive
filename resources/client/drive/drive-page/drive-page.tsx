import type {DriveFolder} from '../files/drive-entry';
import {message} from '@ui/i18n/message';
import {MessageDescriptor} from '@ui/i18n/message-descriptor';
import addFilesSvg from './add-files.svg';
import timeManagement from './time-management.svg';
import fileSearching from './file-searching.svg';
import throwAwaySvg from './throw-away.svg';
import lovingItSvg from './loving-it.svg';
import shareSvg from './../shareable-link/shareable-link-page/folder-preview/share.svg';
import {DriveSortDescriptor} from '../drive-store';
import {getBootstrapData} from '@ui/bootstrap-data/bootstrap-data-store';
import {BootstrapData} from '@ui/bootstrap-data/bootstrap-data';

interface NoContentMessage {
  title: MessageDescriptor;
  description: MessageDescriptor;
  image: string;
}

export interface DrivePage {
  uniqueId: string;
  name: string;
  label: MessageDescriptor | string;
  path: string;
  hasActions?: boolean;
  canUpload?: boolean;
  disableSort?: boolean;
  sortDescriptor: DriveSortDescriptor;
  queryParams?: Record<string, string | number | boolean>;
  folder?: DriveFolder;
  isFolderPage?: boolean;
  noContentMessage: (isSearchingOrFiltering: boolean) => NoContentMessage;
}

const defaultSortDescriptor: DriveSortDescriptor = {
  orderBy: 'updated_at',
  orderDir: 'desc',
};

export function makeFolderPage(folder: DriveFolder, userId?: number): DrivePage {
  return {
    ...makePartialFolderPage(folder.hash, userId),
    canUpload: folder.permissions['files.create'] || folder.permissions['files.update'],
    label: folder.name,
    folder,
  };
}

export function makePartialFolderPage(hash: string, userId?: number): DrivePage {
  return {
    name: 'folder',
    uniqueId: hash,
    label: '',
    path: getPathForFolder(hash, userId),
    hasActions: true,
    canUpload: false,
    sortDescriptor: defaultSortDescriptor,
    isFolderPage: true,
    noContentMessage: () => ({
      title: message('Drop files or folders here'),
      description: message('Or use the "Upload" button'),
      image: addFilesSvg,
    }),
  };
}

export function getPathForFolder(hash: string, userId?: number): string {
  if (userId != null) {
    // When viewing a specific user's drive
    if (hash === '0') {
      return `/drive/users/${userId}`;
    }
    return `/drive/users/${userId}/folders/${hash}`;
  }
  
  // Normal workspace view
  if (hash === '0') {
    return '/drive';
  }
  return `/drive/folders/${hash}`;
}

// bootstrap data will always be available at this point
interface BootstrapDataWithRootFolder extends BootstrapData {
  rootFolder: DriveFolder;
}
const rootFolder = (getBootstrapData() as BootstrapDataWithRootFolder)
  .rootFolder;
export const RootFolderPage = {
  ...makeFolderPage(rootFolder),
  name: 'home',
} as Required<DrivePage>;

export const RecentPage: DrivePage = {
  name: 'recent',
  uniqueId: 'recent',
  label: message('Recent'),
  path: '/drive/recent',
  disableSort: true,
  sortDescriptor: {
    orderBy: 'created_at',
    orderDir: 'desc',
  },
  queryParams: {
    recentOnly: true,
  },
  noContentMessage: () => ({
    title: message('No recent entries'),
    description: message('You have not uploaded any files or folders yet'),
    image: timeManagement,
  }),
};

export const SearchPage: DrivePage = {
  name: 'search',
  uniqueId: 'search',
  label: message('Search results'),
  path: '/drive/search',
  sortDescriptor: defaultSortDescriptor,
  noContentMessage: isSearchingOrFiltering => {
    if (isSearchingOrFiltering) {
      return {
        title: message('No matching results'),
        description: message('Try changing your search query or filters'),
        image: fileSearching,
      };
    }
    return {
      title: message('Begin typing or select a filter to search'),
      description: message('Search for files, folders and other content'),
      image: fileSearching,
    };
  },
};

export const SharesPage: DrivePage = {
  name: 'sharedWithMe',
  uniqueId: 'sharedWithMe',
  label: message('Shared'),
  path: '/drive/shares',
  sortDescriptor: defaultSortDescriptor,
  queryParams: {
    sharedOnly: true,
  },
  noContentMessage: () => ({
    title: message('Shared with me'),
    description: message('Files and folders other people have shared with you'),
    image: shareSvg,
  }),
};

export const TrashPage: DrivePage = {
  name: 'trash',
  uniqueId: 'trash',
  label: message('Trash'),
  path: '/drive/trash',
  sortDescriptor: defaultSortDescriptor,
  hasActions: true,
  queryParams: {
    deletedOnly: true,
  },
  noContentMessage: () => ({
    title: message('Trash is empty'),
    description: message(
      'There are no files or folders in your trash currently',
    ),
    image: throwAwaySvg,
  }),
};

export const StarredPage: DrivePage = {
  name: 'starred',
  uniqueId: 'starred',
  label: message('Starred'),
  path: '/drive/starred',
  sortDescriptor: defaultSortDescriptor,
  queryParams: {
    starredOnly: true,
  },
  noContentMessage: () => ({
    title: message('Nothing is starred'),
    description: message(
      'Add stars to files and folders that you want to easily find later',
    ),
    image: lovingItSvg,
  }),
};

export const DRIVE_PAGES = [
  RootFolderPage,
  RecentPage,
  SearchPage,
  SharesPage,
  TrashPage,
  StarredPage,
];
