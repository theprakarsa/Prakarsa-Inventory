import { createHashRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '@/pages/auth/Login';
import { DashboardPage } from '@/pages/dashboard/Dashboard';
import { AssetsPage } from '@/pages/assets/Assets';
import { AssetDetailPage } from '@/pages/assets/AssetDetail';
import { DivisionsPage } from '@/pages/divisions/Divisions';
import { CategoriesPage } from '@/pages/categories/Categories';
import { EmployeesPage } from '@/pages/employees/Employees';
import { LocationsPage } from '@/pages/locations/Locations';
import { PurchasesPage } from '@/pages/purchases/Purchases';
import { LoansPage } from '@/pages/loans/Loans';
import { DamagesPage } from '@/pages/damages/Damages';
import { InstalledPage } from '@/pages/installed/Installed';
import { TemplatesPage } from '@/pages/templates/Templates';
import { UsersPage } from '@/pages/users/Users';
import { LogsPage } from '@/pages/logs/Logs';
import { ReportsPage } from '@/pages/reports/Reports';

export const router = createHashRouter(
  [
    { path: '/login', element: <LoginPage /> },
    {
      element: <ProtectedRoute />,
      children: [
        {
          element: <AppLayout />,
          children: [
            { path: '/', element: <Navigate to="/dashboard" replace /> },
            { path: '/dashboard', element: <DashboardPage /> },
            { path: '/assets', element: <AssetsPage /> },
            { path: '/assets/:id', element: <AssetDetailPage /> },
            { path: '/loans', element: <LoansPage /> },
            { path: '/damages', element: <DamagesPage /> },
            { path: '/installed', element: <InstalledPage /> },
            { path: '/reports', element: <ReportsPage /> },
          ],
        },
        {
          element: <ProtectedRoute adminOnly />,
          children: [
            {
              element: <AppLayout />,
              children: [
                { path: '/divisions', element: <DivisionsPage /> },
                { path: '/categories', element: <CategoriesPage /> },
                { path: '/employees', element: <EmployeesPage /> },
                { path: '/locations', element: <LocationsPage /> },
                { path: '/purchases', element: <PurchasesPage /> },
                { path: '/templates', element: <TemplatesPage /> },
                { path: '/users', element: <UsersPage /> },
                { path: '/logs', element: <LogsPage /> },
              ],
            },
          ],
        },
      ],
    },
    { path: '*', element: <Navigate to="/dashboard" replace /> },
  ],
  { future: { v7_startTransition: true, v7_relativeSplatPath: true } }
);
