import { createBrowserRouter, type RouteObject } from 'react-router';
import { NotFoundPage } from './pages/NotFoundPage';

export const routes: RouteObject[] = [
  { path: '/', element: <p className="p-6">Application page coming soon.</p> },
  { path: '*', element: <NotFoundPage /> },
];

export const router = createBrowserRouter(routes);
