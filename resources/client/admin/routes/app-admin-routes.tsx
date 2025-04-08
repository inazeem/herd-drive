import {RouteObject} from 'react-router';
import {RootFoldersPage} from '../root-folders/root-folders-page';
import {authGuard} from '@common/auth/guards/auth-route';
import {lazyAdminRoute} from '@common/admin/routes/lazy-admin-route';

export const appAdminRoutes: RouteObject[] = [
  {
    path: '/root-folders',
    loader: () => authGuard({permission: 'admin.access'}),
    lazy: () => lazyAdminRoute('AdminLayout'),
    children: [
      {
        index: true,
        element: <RootFoldersPage />,
      }
    ],
  },
];
