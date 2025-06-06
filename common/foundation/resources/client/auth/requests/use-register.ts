import {useMutation} from '@tanstack/react-query';
import {UseFormReturn} from 'react-hook-form';
import {BackendResponse} from '../../http/backend-response/backend-response';
import {onFormQueryError} from '../../errors/on-form-query-error';
import {useNavigate} from '../../ui/navigation/use-navigate';
import {apiClient} from '../../http/query-client';
import {useAuth} from '../use-auth';
import {setBootstrapData} from '@ui/bootstrap-data/bootstrap-data-store';
import {useParams} from 'react-router';

interface Response extends BackendResponse {
  bootstrapData?: string;
  message?: string;
  status: 'success' | 'needs_email_verification';
}

export interface RegisterPayload {
  email: string;
  password: string;
  password_confirmation: string;
  invite_id?: string;
  invite_type?: string;
}

export function useRegister(form: UseFormReturn<RegisterPayload>) {
  const navigate = useNavigate();
  const {getRedirectUri} = useAuth();
  const {inviteId} = useParams();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => {
      return register({
        invite_id: inviteId,
        ...payload,
      });
    },
    onSuccess: response => {
      setBootstrapData(response.bootstrapData!);
      if (response.status === 'needs_email_verification') {
        navigate('/');
      } else {
        navigate(getRedirectUri(), {replace: true});
      }
    },
    onError: r => onFormQueryError(r, form),
  });
}

function register(payload: RegisterPayload): Promise<Response> {
  return apiClient
    .post('auth/register', payload)
    .then(response => response.data);
}
