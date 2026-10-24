import { createBrowserRouter, type RouteObject } from 'react-router';
import { GuestOnly, RequireAuth } from './features/auth/components/RouteGuards';
import { SignInPage } from './features/auth/pages/SignInPage';
import { SignUpPage } from './features/auth/pages/SignUpPage';
import { AppPage } from './pages/AppPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const routes: RouteObject[] = [
  {
    element: <RequireAuth />,
    children: [{ path: '/', element: <AppPage /> }],
  },
  {
    element: <GuestOnly />,
    children: [
      { path: '/signin', element: <SignInPage /> },
      { path: '/signup', element: <SignUpPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
];

export const router = createBrowserRouter(routes);
