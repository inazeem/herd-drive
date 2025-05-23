import {ReactElement, useRef} from 'react';
import {AnimatePresence, m} from 'framer-motion';
import {driveState, useDriveStore} from '../drive-store';
import {IconButton} from '@ui/buttons/icon-button';
import {CloseIcon} from '@ui/icons/material/Close';
import {useFileUploadStore} from '@common/uploads/uploader/file-upload-provider';
import {Trans} from '@ui/i18n/trans';
import {UploadQueueItem} from './upload-queue-item';
import {useVirtualizer} from '@tanstack/react-virtual';

export function UploadQueue() {
  const isOpen = useDriveStore(s => s.uploadQueueIsOpen);

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          key="upload-queue"
          className="fixed bottom-16 right-16 z-modal w-375 rounded border bg text-sm shadow-xl"
          initial={{y: '100%', opacity: 0}}
          animate={{y: 0, opacity: 1}}
          exit={{y: '100%', opacity: 0}}
        >
          <Header />
          <UploadList />
        </m.div>
      )}
    </AnimatePresence>
  );
}

export function Header() {
  const inProgressUploadsCount = useFileUploadStore(s => s.activeUploadsCount);
  const completedUploadsCount = useFileUploadStore(
    s => s.completedUploadsCount,
  );
  const clearInactive = useFileUploadStore(s => s.clearInactive);

  let message: ReactElement;
  if (inProgressUploadsCount) {
    message = (
      <Trans
        message="Uploading :count files"
        values={{count: inProgressUploadsCount}}
      />
    );
  } else if (completedUploadsCount) {
    message = (
      <Trans
        message="Uploaded :count files"
        values={{count: completedUploadsCount}}
      />
    );
  } else {
    message = <Trans message="No active uploads" />;
  }

  // only allow closing upload queue if there are no active uploads
  return (
    <div className="flex min-h-[45px] items-center justify-between gap-10 border-b bg-alt px-10 py-4">
      {message}
      {inProgressUploadsCount === 0 ? (
        <IconButton
          size="sm"
          onClick={() => {
            driveState().setUploadQueueIsOpen(false);
            // wait for upload queue panel animation to complete, then clear inactive uploads
            setTimeout(() => {
              clearInactive();
            }, 200);
          }}
        >
          <CloseIcon />
        </IconButton>
      ) : undefined}
    </div>
  );
}

function UploadList() {
  const uploads = useFileUploadStore(s => s.fileUploads);
  const uploadsArray = [...uploads.values()];
  const ref = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: uploads.size,
    getScrollElement: () => ref.current,
    estimateSize: () => 60,
    overscan: 4,
  });

  return (
    <div className="max-h-320 overflow-y-auto" ref={ref}>
      <div
        className="relative w-full"
        style={{
          height: `${virtualizer.getTotalSize()}px`,
        }}
      >
        {virtualizer.getVirtualItems().map(virtualItem => {
          const upload = uploadsArray[virtualItem.index];
          return (
            <UploadQueueItem
              style={{
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
              key={upload.file.id}
              file={upload.file}
            />
          );
        })}
      </div>
    </div>
  );
}
