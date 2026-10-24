import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { TextLink } from '../../../components/TextLink';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { PasswordField } from '../../../components/ui/PasswordField';
import { TextField } from '../../../components/ui/TextField';
import { isApiError } from '../../../lib/api-client';
import { AuthLayout } from '../components/AuthLayout';
import { PasswordChecklist } from '../components/PasswordChecklist';
import { useSignUp } from '../hooks';
import { signUpSchema, type SignUpValues } from '../schemas';
import { applyServerErrors } from '../server-errors';

const FIELDS = ['email', 'name', 'password'] as const;

export function SignUpPage() {
  const signUp = useSignUp();
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    mode: 'onTouched',
    defaultValues: { email: '', name: '', password: '' },
  });
  const password = useWatch({ control, name: 'password' });

  const onSubmit = handleSubmit((values) => {
    setFormErrors([]);
    // On success the cached user is set and GuestOnly redirects.
    signUp.mutate(values, {
      onError: (error) => {
        if (isApiError(error) && error.status === 409) {
          setError('email', { type: 'server', message: error.message }, { shouldFocus: true });
          return;
        }
        setFormErrors(applyServerErrors(error, FIELDS, setError));
      },
    });
  });

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Sign up to get started."
      footer={
        <>
          Already have an account? <TextLink to="/signin">Sign in</TextLink>
        </>
      }
    >
      <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-5">
        <Alert messages={formErrors} />

        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <TextField
          label="Name"
          autoComplete="name"
          placeholder="Jane Doe"
          error={errors.name?.message}
          {...register('name')}
        />

        <PasswordField
          label="Password"
          autoComplete="new-password"
          error={errors.password?.message}
          hint={<PasswordChecklist value={password} />}
          {...register('password')}
        />

        <Button type="submit" className="w-full" loading={signUp.isPending}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
