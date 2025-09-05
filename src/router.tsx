import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LandingRedirect from './routes/LandingRedirect';
import { AppErrorBoundary } from './components/common/AppErrorBoundary';
import { SignIn } from './routes/auth/SignIn';
import { SignUp } from './routes/auth/SignUp';
import { Reset } from './routes/auth/Reset';
import { Welcome } from './routes/auth/Welcome';
import { AdminApp } from './routes/admin/AdminApp';
import { ClientApp } from './routes/app/ClientApp';
import { AppDashboard } from './routes/app/AppDashboard';
import { MyBlades } from './routes/app/MyBlades';
import { ServiceHistory } from './routes/app/ServiceHistory';
import { ScanAction } from './routes/app/ScanAction';
import { ScanBlade } from './routes/scan/ScanBlade';
import { BladeDetails } from './routes/blade/BladeDetails';
import { BladeForm } from './routes/blade/BladeForm';
import { BladeEdit } from './routes/blade/BladeEdit';
import { BladeDetails as AdminBladeDetails } from './routes/admin/BladeDetails';
import AdminBladeNew from './routes/admin/BladeNew';
import { AdminDashboard } from './routes/admin/AdminDashboard';
import { PrintLabel } from './routes/print/PrintLabel';

/** NEW **/
import AdminDocs from './routes/admin/AdminDocs';
import DocDetails from './routes/admin/DocDetails';

export const router = createBrowserRouter([
  { path: '/', element: <LandingRedirect /> },
  { path: '/auth/signin', element: <SignIn /> },
  { path: '/auth/signup', element: <SignUp /> },
  { path: '/auth/reset', element: <Reset /> },
  { path: '/auth/welcome', element: <Welcome /> },
  { path: '/print/label/:bladeId', element: <PrintLabel /> },

  {
    element: <ProtectedRoute />,
    errorElement: (
      <AppErrorBoundary>
        <div className="p-6">Błąd w aplikacji.</div>
      </AppErrorBoundary>
    ),
    children: [
      {
        path: '/admin',
        element: <AdminApp />,
        errorElement: (
          <AppErrorBoundary>
            <div className="p-6">Błąd w panelu administratora.</div>
          </AppErrorBoundary>
        ),
        children: [
          { index: true, element: <AdminDashboard /> },
          {
            path: 'blade/:id',
            element: <AdminBladeDetails />,
            errorElement: (
              <AppErrorBoundary>
                <div className="p-6">Błąd w szczegółach piły.</div>
              </AppErrorBoundary>
            ),
          },
          {
            path: 'blade/:id/edit',
            element: <BladeEdit />,
            errorElement: (
              <AppErrorBoundary>
                <div className="p-6">Błąd w edycji piły.</div>
              </AppErrorBoundary>
            ),
          },
          {
            path: 'blade/new',
            element: <AdminBladeNew />,
            errorElement: (
              <AppErrorBoundary>
                <div className="p-6">Błąd w tworzeniu piły.</div>
              </AppErrorBoundary>
            ),
          },

          /** NEW: WZ/PZ list + details **/
          {
            path: 'docs',
            element: <AdminDocs />,
            errorElement: (
              <AppErrorBoundary>
                <div className="p-6">Błąd w dokumentach.</div>
              </AppErrorBoundary>
            ),
          },
          {
            path: 'docs/:id',
            element: <DocDetails />,
            errorElement: (
              <AppErrorBoundary>
                <div className="p-6">Błąd w szczegółach dokumentu.</div>
              </AppErrorBoundary>
            ),
          },
        ],
      },

      {
        path: '/app',
        element: <ClientApp />,
        errorElement: (
          <AppErrorBoundary>
            <div className="p-6">Błąd w panelu klienta.</div>
          </AppErrorBoundary>
        ),
        children: [
          { index: true, element: <AppDashboard /> },
          {
            path: 'scan',
            element: <ScanBlade />,
            errorElement: (
              <AppErrorBoundary>
                <div className="p-6">Błąd w skanerze.</div>
              </AppErrorBoundary>
            ),
          },
          {
            path: 'scan/result/:bladeId',
            element: <ScanAction />,
            errorElement: (
              <AppErrorBoundary>
                <div className="p-6">Błąd w akcji skanowania.</div>
              </AppErrorBoundary>
            ),
          },
          {
            path: 'blades',
            element: <MyBlades />,
            errorElement: (
              <AppErrorBoundary>
                <div className="p-6">Błąd w liście pił.</div>
              </AppErrorBoundary>
            ),
          },
          {
            path: 'history',
            element: <ServiceHistory />,
            errorElement: (
              <AppErrorBoundary>
                <div className="p-6">Błąd w historii serwisu.</div>
              </AppErrorBoundary>
            ),
          },
          {
            path: 'blade/new',
            element: <BladeForm />,
            errorElement: (
              <AppErrorBoundary>
                <div className="p-6">Błąd w tworzeniu piły.</div>
              </AppErrorBoundary>
            ),
          },
          {
            path: 'blade/:id',
            element: <BladeDetails />,
            errorElement: (
              <AppErrorBoundary>
                <div className="p-6">Błąd w szczegółach piły.</div>
              </AppErrorBoundary>
            ),
          },
          {
            path: 'reports',
            element: (
              <div className="p-8 text-center">
                <h1 className="text-2xl font-bold">Raporty - Wkrótce</h1>
              </div>
            ),
            errorElement: (
              <AppErrorBoundary>
                <div className="p-6">Błąd w raportach.</div>
              </AppErrorBoundary>
            ),
          },
        ],
      },

      { path: '/scan', element: <ScanBlade /> },
      { path: '/scan/result/:bladeId', element: <ScanAction /> },
    ],
  },

  { path: '*', element: <Navigate to="/" replace /> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
