import {useDragMonitor} from '@ui/interactions/dnd/use-drag-monitor';
import React, {memo, useRef, useState} from 'react';
import {FileTypeIcon} from '@common/uploads/components/file-type-icon/file-type-icon';
import {FileEntry} from '@common/uploads/file-entry';
import {DragSessionStatus, droppables} from '@ui/interactions/dnd/drag-state';
import {AnimatePresence, m} from 'framer-motion';
import clsx from 'clsx';
import {
  isFolderTreeDragId,
  makeFolderTreeDragId,
} from '@app/drive/layout/sidebar/folder-tree-drag-id';
import {InteractableEvent} from '@ui/interactions/interactable-event';
import {useDriveStore} from '../drive-store';
import {ConnectedDraggable} from '@ui/interactions/dnd/use-draggable';

interface Point {
  x: number;
  y: number;
}

interface DragPreviewState {
  entries?: FileEntry[];
  e?: InteractableEvent;
  status?: DragSessionStatus;
  draggingTreeItem?: boolean;
}

export function EntryDragPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const [points, setPoints] = useState<{start?: Point; end?: Point}>();
  const [state, setState] = useState<DragPreviewState>({});

  useDragMonitor({
    type: 'fileEntry',
    onDragStart: (e, dragTarget) => {
      const target = dragTarget as ConnectedDraggable<FileEntry[]>;
      if (target) {
        setState({
          entries: target.getData(),
          e,
          draggingTreeItem: isFolderTreeDragId(target.id as number),
        });
        setPoints({start: e});
      }
    },
    onDragMove: e => {
      setState(prev => {
        return {...prev, e: e};
      });
      setPoints(prev => {
        return {...prev, end: e};
      });
    },
    onDragEnd: (e, dragTarget, status) => {
      setState({status});
    },
  });

  let preview = null;

  if (state.entries && state.e) {
    preview = (
      <div
        ref={ref}
        style={
          state.e
            ? {
                transform: `translate(${state.e.x}px, ${state.e.y}px)`,
                width: `${state.e.rect.width}px`,
              }
            : undefined
        }
        className="pointer-events-none fixed left-0 top-0 isolate"
      >
        {state.entries.map((item, index) => (
          <EntryPreview
            key={item.id}
            index={index}
            entry={item}
            points={points}
            state={state}
          />
        ))}
      </div>
    );
  }

  return <AnimatePresence custom={state.status}>{preview}</AnimatePresence>;
}

interface EntryPreviewProps {
  entry: FileEntry;
  index: number;
  points?: {start?: Point; end?: Point};
  state: DragPreviewState;
}
const EntryPreview = memo(
  ({entry, points, index, state}: EntryPreviewProps) => {
    const viewMode = useDriveStore(s => s.viewMode);
    const droppableId = state.draggingTreeItem
      ? makeFolderTreeDragId(entry)
      : entry.id;
    const target = droppables.get(droppableId);
    if (!target?.rect || !points?.start) return null;
    const rect = target.rect;
    const itemCount = state.entries?.length || 0;

    const exitVariant = (status: DragSessionStatus) => {
      if (status === 'dropSuccess') {
        return {
          x: 0,
          y: 0,
          opacity: 0,
          transition: {duration: 0.1, delay: 0},
        };
      }
      return {
        x: rect.left - (points.end?.x || 0),
        y: rect.top - (points.end?.y || 0),
        width: `${state.e?.rect.width}px`,
      };
    };

    return (
      <m.div
        key={entry.id}
        transition={{delay: 0.01 * index, bounce: 0, duration: 0.2}}
        initial={{
          x: rect.left - points.start.x,
          y: rect.top - points.start.y,
          width: `${state.e?.rect.width}px`,
        }}
        animate={{
          x: 0,
          y: 0,
          // in list/table mode limit preview size to 288px, but start and end the animation
          // at full width, so it returns to original position at original size smoothly
          width: viewMode === 'list' ? 288 : undefined,
        }}
        exit={exitVariant as any}
        style={{
          // in grid mode simply use the width of the draggable item
          width: viewMode === 'grid' ? `${state.e?.rect.width}px` : undefined,
          height: `${state.e?.rect.height}px`,
        }}
        className={clsx(
          'absolute max-h-48 whitespace-nowrap rounded border border-primary-light bg-paper',
          index < 2 && 'shadow',
          index === 0 && 'left-0 top-0 z-10',
          index > 0 && 'left-6 top-6',
        )}
      >
        {itemCount > 1 && index === 0 && <EntryCount count={itemCount} />}
        <div className="flex h-full items-center justify-center gap-10 overflow-hidden bg-primary-light/20 px-16 text-sm">
          <FileTypeIcon type={entry.type} />
          <div className="flex-auto overflow-hidden text-ellipsis">
            {entry.name}
          </div>
        </div>
      </m.div>
    );
  },
);

interface EntryCountProps {
  count: number;
}
const EntryCount = memo(({count}: EntryCountProps) => {
  return (
    <m.div
      key="entryCount"
      initial={{opacity: 0}}
      animate={{opacity: 1, transition: {delay: 0.1}}}
      exit={{opacity: 0}}
      transition={{duration: 0.1}}
      className="absolute -right-6 -top-6 z-10 z-30 flex h-20 w-20 items-center justify-center rounded-full bg-danger text-sm font-bold text-white shadow-lg"
    >
      {count}
    </m.div>
  );
});
