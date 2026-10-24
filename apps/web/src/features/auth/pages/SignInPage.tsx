import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { TextLink } from '../../../components/TextLink';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { PasswordField } from '../../../components/ui/PasswordField';
import { TextField } from '../../../components/ui/TextField';
import { AuthLayout } from '../components/AuthLayout';
import { useSignIn } from '../hooks';
import { signInSchema, type SignInValues } from '../schemas';
import { applyServerErrors } from '../server-errors';

const FIELDS = ['email', 'password'] as const;

export function SignInPage() {
  const signIn = useSignIn();
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit((values) => {
    setFormErrors([]);
    // On success the cached user is set and GuestOnly redirects.
    signIn.mutate(values, {
      onError: (error) => setFormErrors(applyServerErrors(error, FIELDS, setError)),
    });
  });

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue to the application."
      footer={
        <>
          Don&apos;t have an account? <TextLink to="/signup">Sign up</TextLink>
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

        <PasswordField
          label="Password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <Button type="submit" className="w-full" loading={signIn.isPending}>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
