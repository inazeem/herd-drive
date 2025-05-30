import {Fragment, useRef} from 'react';
import {Trans} from '@ui/i18n/trans';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {AppearanceButton} from '@common/admin/appearance/appearance-button';
import {AceDialog} from '@common/ace-editor/ace-dialog';
import mergedAppearanceConfig from '@common/admin/appearance/config/merged-appearance-config';
import {SeoSettingsSectionConfig} from '@common/admin/appearance/types/appearance-editor-config';
import {MessageDescriptor} from '@ui/i18n/message-descriptor';
import {useSeoTags} from '@common/admin/appearance/sections/seo/use-seo-tags';
import {useUpdateSeoTags} from '@common/admin/appearance/sections/seo/use-update-seo-tags';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {FullPageLoader} from '@ui/progress/full-page-loader';
import {Button} from '@ui/buttons/button';
import type ReactAce from 'react-ace';
import {AppearanceEditorLayout} from '@common/admin/appearance/appearance-editor-form';
import {AppearanceEditorBreadcrumb} from '@common/admin/appearance/appearance-editor-breadcrumb';

const pages =
  (
    mergedAppearanceConfig.sections['seo-settings']
      .config as SeoSettingsSectionConfig
  )?.pages || [];

const names = pages.map(page => page.key);

export function SeoSection() {
  const {isLoading} = useSeoTags(names);

  return (
    <AppearanceEditorLayout
      breadcrumb={
        <AppearanceEditorBreadcrumb>
          <Trans message="SEO" />
        </AppearanceEditorBreadcrumb>
      }
    >
      {isLoading ? (
        <FullPageLoader />
      ) : (
        <Fragment>
          {pages.map(page => (
            <TagEditorTrigger
              key={page.key}
              label={page.label}
              name={page.key}
            />
          ))}
        </Fragment>
      )}
    </AppearanceEditorLayout>
  );
}

interface TagEditorTriggerProps {
  label: MessageDescriptor;
  name: string;
}
function TagEditorTrigger({label, name}: TagEditorTriggerProps) {
  const {data, isLoading} = useSeoTags(names);

  return (
    <DialogTrigger type="modal">
      <AppearanceButton disabled={isLoading}>
        <Trans {...label} />
      </AppearanceButton>
      {data ? <TagsEditorDialog name={name} value={data[name]} /> : null}
    </DialogTrigger>
  );
}

interface TagsEditorDialogProps {
  name: string;
  value: {custom: string | null; original: string};
}
function TagsEditorDialog({name, value}: TagsEditorDialogProps) {
  const {close} = useDialogContext();
  const updateTags = useUpdateSeoTags(name);
  const editorRef = useRef<ReactAce | null>(null);

  const resetButton = (
    <Button
      variant="outline"
      color="primary"
      onClick={() => {
        if (editorRef.current) {
          editorRef.current.editor.setValue(value.original);
        }
      }}
    >
      <Trans message="Reset to original" />
    </Button>
  );

  return (
    <AceDialog
      mode="php_laravel_blade"
      title={<Trans message="Edit SEO meta tags" />}
      footerStartAction={resetButton}
      editorRef={editorRef}
      defaultValue={value.custom || value.original}
      isSaving={updateTags.isPending}
      beautify={false}
      onSave={newValue => {
        if (newValue != null) {
          updateTags.mutate(
            {tags: newValue},
            {
              onSuccess: () => close(),
            },
          );
        }
      }}
    />
  );
}
