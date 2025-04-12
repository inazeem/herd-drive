import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {Button} from '@ui/buttons/button';
import {Trans} from '@ui/i18n/trans';
import {Form} from '@ui/forms/form';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {useForm} from 'react-hook-form';
import {toast} from '@ui/toast/toast';
import {useNavigate} from 'react-router-dom';
import {message} from '@ui/i18n/message';
import {apiClient} from '@common/http/query-client';

interface CreateUserPayload {
  first_name: string;
  last_name: string;
  email: string;
}

export function CreateUserDialog() {
  const form = useForm<CreateUserPayload>();
  const {close, formId} = useDialogContext();
  const navigate = useNavigate();

  const createUser = async (values: CreateUserPayload) => {
    try {
      const response = await apiClient.post('users/invite', values).then(r => r.data);
      toast(message('Invitation sent to :email', {values: {email: values.email}}));
      close();
      if (response.user?.id) {
        navigate(`/drive/users/${response.user.id}`);
      }
    } catch (error) {
      toast.danger(message('Could not create user'));
    }
  };

  return (
    <Dialog>
      <DialogHeader>
        <Trans message="Add new user" />
      </DialogHeader>
      <DialogBody>
        <Form 
          form={form} 
          id={formId} 
          onSubmit={createUser}
        >
          <FormTextField
            name="first_name"
            label={<Trans message="First name" />}
            className="mb-20"
            required
            autoFocus
          />
          <FormTextField
            name="last_name"
            label={<Trans message="Last name" />}
            className="mb-20"
            required
          />
          <FormTextField
            name="email"
            type="email"
            label={<Trans message="Email" />}
            required
          />
        </Form>
      </DialogBody>
      <DialogFooter>
        <Button onClick={() => close()}>
          <Trans message="Cancel" />
        </Button>
        <Button
          variant="flat"
          color="primary"
          type="submit"
          form={formId}
        >
          <Trans message="Add" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
} 