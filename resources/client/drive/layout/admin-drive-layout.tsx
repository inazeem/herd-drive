import React, {Fragment} from 'react';
import {DashboardLayout} from '@common/ui/dashboard-layout/dashboard-layout';
import {DashboardNavbar} from '@common/ui/dashboard-layout/dashboard-navbar';
import {DashboardContent} from '@common/ui/dashboard-layout/dashboard-content';
import {DashboardSidenav} from '@common/ui/dashboard-layout/dashboard-sidenav';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {Trans} from '@ui/i18n/trans';
import {Sidebar} from './sidebar/sidebar';
import {DriveContentHeader} from './drive-content-header';
import {UploadQueue} from '../uploading/upload-queue';
import {DriveDialogsContainer} from '../files/dialogs/drive-dialogs-container';
import {EntryDragPreview} from '../file-view/entry-drag-preview';
import {FileUploadProvider} from '@common/uploads/uploader/file-upload-provider';
import {FileEntryUrlsContext} from '@common/uploads/file-entry-urls';
import {useActiveWorkspaceId} from '@common/workspace/active-workspace-id-context';
import {useMemo} from 'react';

interface AdminDriveLayoutProps {
  children: React.ReactElement;
}

export function AdminDriveLayout({children}: AdminDriveLayoutProps) {
  const {workspaceId} = useActiveWorkspaceId();
  
  const urlsContextValue = useMemo(() => {
    return {workspaceId, userId: undefined};
  }, [workspaceId]);

  return (
    <Fragment>
      <StaticPageTitle>
        <Trans message="Drive Management" />
      </StaticPageTitle>
      <FileUploadProvider>
        <FileEntryUrlsContext.Provider value={urlsContextValue}>
          <DashboardLayout name="drive-admin">
            <DashboardNavbar />
            <DashboardSidenav position="left" size="md">
              <Sidebar />
            </DashboardSidenav>
            <DriveContentHeader />
            <DashboardContent>
              {children}
            </DashboardContent>
            <UploadQueue />
            <DriveDialogsContainer />
            <EntryDragPreview />
          </DashboardLayout>
        </FileEntryUrlsContext.Provider>
      </FileUploadProvider>
    </Fragment>
  );
} 