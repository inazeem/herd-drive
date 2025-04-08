import {RouteObject} from 'react-router';
import React from 'react';
import {AuthRoute} from '@common/auth/guards/auth-route';
import {ActiveWorkspaceProvider} from '@common/workspace/active-workspace-id-context';
import {UserListPage} from './user-list/user-list-page';
import {useAuth} from '@common/auth/use-auth';
import {DriveLayout} from './layout/drive-layout';
import {FileView} from './file-view/file-view';
import {AdminDriveLayout} from './layout/admin-drive-layout';

const lazyDriveRoute = async (
  cmp: keyof typeof import('@app/drive/drive-routes.lazy'),
) => {
  const exports = await import('@app/drive/drive-routes.lazy');
  return {
    Component: exports[cmp],
  };
};

function DriveIndex() {
  const {hasPermission} = useAuth();
  const canViewAllUsers = hasPermission('files.view');

  if (canViewAllUsers) {
    return (
      <AdminDriveLayout>
        <UserListPage />
      </AdminDriveLayout>
    );
  }

  return <DriveLayout><FileView /></DriveLayout>;
}

export const driveRoutes: RouteObject[] = [
  {
    path: 'drive',
    element: (
      <ActiveWorkspaceProvider>
        <AuthRoute />
      </ActiveWorkspaceProvider>
    ),
    children: [
      {
        index: true,
        element: <DriveIndex />,
      },
      {
        path: 'folders/:hash',
        lazy: () => lazyDriveRoute('DriveLayout'),
      },
      {
        path: 'users/:userId',
        lazy: () => lazyDriveRoute('DriveLayout'),
      },
      {
        path: 'users/:userId/folders/:hash',
        lazy: () => lazyDriveRoute('DriveLayout'),
      },
      {
        path: 'shares',
        lazy: () => lazyDriveRoute('DriveLayout'),
      },
      {
        path: 'recent',
        lazy: () => lazyDriveRoute('DriveLayout'),
      },
      {
        path: 'starred',
        lazy: () => lazyDriveRoute('DriveLayout'),
      },
      {
        path: 'trash',
        lazy: () => lazyDriveRoute('DriveLayout'),
      },
      {
        path: 'search',
        lazy: () => lazyDriveRoute('DriveLayout'),
      },
    ],
  },
  {path: 'drive/s/:hash', lazy: () => lazyDriveRoute('ShareableLinkPage')},
];
