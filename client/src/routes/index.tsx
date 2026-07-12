import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { LoginPage } from '../features/auth/LoginPage';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { AssetListPage } from '../features/assets/AssetListPage';
import { AssetDetailsPage } from '../features/assets/AssetDetailsPage';
import { DepartmentDetailsPage } from '../features/departments/DepartmentDetailsPage';
import { LocationDetailsPage } from '../features/locations/LocationDetailsPage';
import { Dashboard } from '../features/dashboard/Dashboard';
import { OrganizationPage } from '../features/organization/OrganizationPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <Dashboard />,
          },
          {
            path: 'assets',
            element: <AssetListPage />,
          },
          {
            path: 'assets/:id',
            element: <AssetDetailsPage />,
          },
          {
            path: 'org',
            element: <OrganizationPage />,
          },
          {
            path: 'departments/:id',
            element: <DepartmentDetailsPage />,
          },
          {
            path: 'locations/:id',
            element: <LocationDetailsPage />,
          },
        ],
      },
    ],
  },
]);
