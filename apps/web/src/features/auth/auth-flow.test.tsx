import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { installFakeApi } from '../../test/fake-api';
import { renderApp } from '../../test/render-app';

const JANE = { email: 'jane@example.com', name: 'Jane Doe', password: 'Passw0rd!' };

describe('auth flow', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends signed-out visitors from the application page to sign in', async () => {
    installFakeApi();
    const { router } = renderApp('/');

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/signin');
  });

  it('signs up and lands on the welcome page', async () => {
    installFakeApi();
    const { user } = renderApp('/signup');

    await user.type(await screen.findByLabelText('Email'), JANE.email);
    await user.type(screen.getByLabelText('Name'), JANE.name);
    await user.type(screen.getByLabelText('Password'), JANE.password);
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(
      await screen.findByRole('heading', { name: 'Welcome to the application.' }),
    ).toBeInTheDocument();
    expect(screen.getByText(JANE.name)).toBeInTheDocument();
  });

  it('shows validation errors without calling the API', async () => {
    const { fetchMock } = installFakeApi();
    const { user } = renderApp('/signup');

    await user.click(await screen.findByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Email is required.')).toBeInTheDocument();
    expect(screen.getByText('Name must be at least 3 characters long.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(fetchMock).not.toHaveBeenCalledWith('/api/auth/signup', expect.anything());
  });

  it('updates the password checklist as the user types', async () => {
    installFakeApi();
    const { user } = renderApp('/signup');

    const checklist = await screen.findByRole('list', { name: 'Password requirements' });
    await user.type(screen.getByLabelText('Password'), 'abc1');

    expect(within(checklist).getByText(/At least one letter/)).toHaveTextContent('(met)');
    expect(within(checklist).getByText(/At least one number/)).toHaveTextContent('(met)');
    expect(within(checklist).getByText(/At least 8 characters/)).toHaveTextContent('(not met)');
    expect(within(checklist).getByText(/special character/)).toHaveTextContent('(not met)');
  });

  it('shows a duplicate email under the email field', async () => {
    const api = installFakeApi();
    api.addAccount(JANE);
    const { user } = renderApp('/signup');

    await user.type(await screen.findByLabelText('Email'), JANE.email);
    await user.type(screen.getByLabelText('Name'), 'Another Jane');
    await user.type(screen.getByLabelText('Password'), JANE.password);
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(
      await screen.findByText('An account with this email already exists.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveFocus();
  });

  it('shows a generic error for wrong credentials', async () => {
    const api = installFakeApi();
    api.addAccount(JANE);
    const { user } = renderApp('/signin');

    await user.type(await screen.findByLabelText('Email'), JANE.email);
    await user.type(screen.getByLabelText('Password'), 'Wr0ng-pass!');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.');
  });

  it('signs in and returns to the page that was originally requested', async () => {
    const api = installFakeApi();
    api.addAccount(JANE);
    const { user, router } = renderApp('/');

    await user.type(await screen.findByLabelText('Email'), JANE.email);
    await user.type(screen.getByLabelText('Password'), JANE.password);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(
      await screen.findByRole('heading', { name: 'Welcome to the application.' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
  });

  it('keeps signed-in users away from the sign-in page', async () => {
    installFakeApi({ signedInAs: JANE });
    const { router } = renderApp('/signin');

    expect(
      await screen.findByRole('heading', { name: 'Welcome to the application.' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
  });

  // Regression: logout used to clear the cache in a way the route guard never saw.
  it('logs out and returns to the sign-in page', async () => {
    installFakeApi({ signedInAs: JANE });
    const { user, router } = renderApp('/');

    await user.click(await screen.findByRole('button', { name: 'Log out' }));

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/signin');
  });
});
