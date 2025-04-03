import {RouteObject} from 'react-router';
import {RootFoldersPage} from '../root-folders/root-folders-page';

export const appAdminRoutes: RouteObject[] = [
  {
    path: 'root-folders',
    element: <RootFoldersPage />,
  },
];
