import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from './lib/supabase';
import { I18nProvider } from './i18n/I18nProvider';
import { AuthProvider } from './auth/AuthProvider';
import { RequireAuth } from './auth/RequireAuth';
import { RequireManager } from './auth/RequireManager';
import { ToastProvider } from './components/ui/Toast';
import { Spinner } from './components/ui/Spinner';
import { AppShell } from './components/layout/AppShell';
import { DataSyncProvider } from './components/data/DataSyncProvider';

import { LoginPage } from './pages/LoginPage';
import { ConfigErrorPage } from './pages/ConfigErrorPage';
import { NotFoundPage } from './pages/NotFoundPage';

const TodayPage = lazy(() => import('./pages/TodayPage').then((m) => ({ default: m.TodayPage })));
const CalendarPage = lazy(() => import('./pages/CalendarPage').then((m) => ({ default: m.CalendarPage })));
const BookingsPage = lazy(() => import('./pages/BookingsPage').then((m) => ({ default: m.BookingsPage })));
const NewBookingPage = lazy(() => import('./pages/NewBookingPage').then((m) => ({ default: m.NewBookingPage })));
const BookingDetailPage = lazy(() => import('./pages/BookingDetailPage').then((m) => ({ default: m.BookingDetailPage })));
const GuestsPage = lazy(() => import('./pages/GuestsPage').then((m) => ({ default: m.GuestsPage })));
const GuestDetailPage = lazy(() => import('./pages/GuestDetailPage').then((m) => ({ default: m.GuestDetailPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30, // 30s
    },
  },
});

export default function App() {
  if (!supabase) {
    return (
      <I18nProvider>
        <ConfigErrorPage />
      </I18nProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ToastProvider>
          <AuthProvider>
            <DataSyncProvider>
              <BrowserRouter basename="/admin">
                <Suspense
                  fallback={
                    <div className="min-h-screen bg-mist flex items-center justify-center">
                      <Spinner size="lg" />
                    </div>
                  }
                >
                  <Routes>
                    <Route path="/login" element={<LoginPage />} />

                    <Route
                      element={
                        <RequireAuth>
                          <AppShell />
                        </RequireAuth>
                      }
                    >
                      <Route path="/" element={<TodayPage />} />
                      <Route path="/calendar" element={<CalendarPage />} />
                      <Route path="/bookings" element={<BookingsPage />} />
                      <Route path="/bookings/new" element={<NewBookingPage />} />
                      <Route path="/bookings/:id" element={<BookingDetailPage />} />
                      <Route path="/guests" element={<GuestsPage />} />
                      <Route path="/guests/:id" element={<GuestDetailPage />} />
                      <Route
                        path="/reports"
                        element={
                          <RequireManager>
                            <ReportsPage />
                          </RequireManager>
                        }
                      />
                      <Route
                        path="/settings"
                        element={
                          <RequireManager>
                            <SettingsPage />
                          </RequireManager>
                        }
                      />
                    </Route>

                    <Route path="/404" element={<NotFoundPage />} />
                    <Route path="*" element={<Navigate to="/404" replace />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </DataSyncProvider>
          </AuthProvider>
        </ToastProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
