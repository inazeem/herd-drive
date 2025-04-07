import React, {useContext, useRef, useState} from 'react';
import {usePaginatedEntries} from '../files/queries/use-paginated-entries';
import {useDriveStore} from '../drive-store';
import {useMouseSelectionBox} from '@ui/interactions/dnd/mouse-selection/use-mouse-selection-box';
import {useDroppable} from '@ui/interactions/dnd/use-droppable';
import {mergeProps} from '@react-aria/utils';
import {FileTable} from './file-table/file-table';
import {FileGrid} from './file-grid/file-grid';
import {PageBreadcrumbs} from '../page-breadcrumbs';
import {InfiniteScrollSentinel} from '@common/ui/infinite-scroll/infinite-scroll-sentinel';
import {useEntries} from '../files/queries/use-entries';
import {DropTargetMask} from '../drop-target-mask';
import {useSearchParams, useParams} from 'react-router-dom';
import {useDeleteEntries} from '../files/queries/use-delete-entries';
import {DashboardLayoutContext} from '@common/ui/dashboard-layout/dashboard-layout-context';
import {IllustratedMessage} from '@ui/images/illustrated-message';
import {SvgImage} from '@ui/images/svg-image';
import {Trans} from '@ui/i18n/trans';
import {Toolbar} from './toolbar';

interface FileViewProps {
  className?: string;
}

export function FileView({className}: FileViewProps) {
  const {userId} = useParams();
  const [params] = useSearchParams();
  const [isDragOver, setIsDragOver] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const {selectedEntries, viewMode, activePage} = useDriveStore();
  const {mutate: deleteEntriesMutation} = useDeleteEntries();
  const {isMobileMode} = useContext(DashboardLayoutContext);

  const options = {userId: userId ? parseInt(userId) : undefined};
  
  const query = usePaginatedEntries(options);
  const entries = useEntries(options);

  const {droppableProps} = useDroppable({
    id: 'driveRoot',
    ref: containerRef,
    types: ['nativeFile'],
    onDragEnter: () => setIsDragOver(true),
    onDragLeave: () => setIsDragOver(false),
    onDrop: () => setIsDragOver(false),
  });

  const handleKeybinds = (e: React.KeyboardEvent) => {
    if (e.key === 'Delete' && selectedEntries.size > 0) {
      deleteEntriesMutation({entryIds: Array.from(selectedEntries)});
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    return (
      e.button === 2 ||
      target.closest('button, input, [role="button"]') != null
    );
  };

  const {containerProps} = useMouseSelectionBox({
    onPointerDown,
    containerRef,
  });

  let content;
  if (!entries.length && (!query.isLoading || query.fetchStatus === 'idle')) {
    const noContentMessage = activePage?.noContentMessage(!!params.get('query'));
    if (noContentMessage) {
      content = (
        <IllustratedMessage
          className="mt-40"
          image={<SvgImage src={noContentMessage.image} />}
          title={<Trans {...noContentMessage.title} />}
          description={<Trans {...noContentMessage.description} />}
        />
      );
    }
  } else {
    content = viewMode === 'list' ? (
      <FileTable entries={entries} />
    ) : (
      <FileGrid entries={entries} />
    );
  }

  return (
    <div
      {...mergeProps(containerProps, droppableProps, {
        onKeyDown: handleKeybinds,
      })}
      className={className}
      ref={containerRef}
    >
      <div className="relative flex min-h-full flex-col pt-10">
        {isMobileMode ? (
          <PageBreadcrumbs className="mb-10 px-14" />
        ) : (
          <Toolbar />
        )}
        <div className="relative flex-auto px-18 pb-18 md:px-24">
          {content}
          <InfiniteScrollSentinel query={query} variant="infiniteScroll" />
        </div>
        <DropTargetMask isVisible={isDragOver} />
      </div>
    </div>
  );
}
