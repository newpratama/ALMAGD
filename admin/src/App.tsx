import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from './lib/supabase';
import { I18nProvider } from './i18n/I18nProvider';
import { AuthProvider } from './auth/AuthProvider';
import { RequireAuth } from './auth/RequireAuth';
import { RequireManager } from './auth/RequireManager';
import { ToastProvider } from './components/ui/Toast';
import { AppShell } from './components/layout/AppShell';
import { DataSyncProvider } from './components/data/DataSyncProvider';

import { LoginPage } from './pages/LoginPage';
import { ConfigErrorPage } from './pages/ConfigErrorPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { TodayPage } from './pages/TodayPage';
import { CalendarPage } from './pages/CalendarPage';
import { BookingsPage } from './pages/BookingsPage';
import { NewBookingPage } from './pages/NewBookingPage';
import { BookingDetailPage } from './pages/BookingDetailPage';
import { GuestsPage } from './pages/GuestsPage';
import { GuestDetailPage } from './pages/GuestDetailPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AttendancePage } from './pages/AttendancePage';

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
                      path="/attendance"
                      element={
                        <RequireManager>
                          <AttendancePage />
                        </RequireManager>
                      }
                    />
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
              </BrowserRouter>
            </DataSyncProvider>
          </AuthProvider>
        </ToastProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
