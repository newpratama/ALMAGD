import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { friendlyError } from '../lib/errors';

export const LoginPage: React.FC = () => {
  const { session, staff, error: authError, clearError } = useAuth();
  const { t, lang, toggleLang } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // If already logged in with active staff profile, redirect
  React.useEffect(() => {
    if (session && staff) {
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [session, staff, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    clearError();
    setLoginError(null);
    setSubmitting(true);

    try {
      const inputStr = email.trim().toLowerCase();
      let emailToTry = inputStr;
      if (inputStr === 'reception') {
        emailToTry = 'reception@almagd.test';
      } else if (inputStr === 'manager') {
        emailToTry = 'manager@almagd.test';
      }

      let { data, error } = await supabase.auth.signInWithPassword({
        email: emailToTry,
        password,
      });

      // Seamless fallback for pratama.res26@gmail.com until email confirmation link is verified
      if (error && (inputStr === 'pratama.res26@gmail.com' || inputStr === 'reception')) {
        const fallback = await supabase.auth.signInWithPassword({
          email: 'reception@almagd.test',
          password,
        });
        if (!fallback.error && fallback.data?.user) {
          data = fallback.data;
          error = null;
        }
      }

      if (error) {
        setLoginError(friendlyError(error) === 'errors.unknown' ? 'auth.loginFailed' : friendlyError(error));
        setSubmitting(false);
        return;
      }

      if (data.user) {
        // AuthProvider onAuthStateChange will fetch staff data and handle redirection
        // or trigger errors.notStaff if no staff record exists.
      }
    } catch (err) {
      setLoginError(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const displayedError = loginError ? t(loginError) : authError ? t(authError) : null;

  return (
    <div className="min-h-screen bg-mist flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Language Toggle in top corner */}
      <div className="absolute top-4 end-4">
        <button
          type="button"
          onClick={toggleLang}
          className="bg-white border border-line text-navy hover:bg-stone text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition"
        >
          {lang === 'id' ? 'العربية' : 'Bahasa Indonesia'}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <img
            src={`${import.meta.env.BASE_URL}logo-almagd.png`}
            alt="ALMAGD"
            className="h-14 w-auto object-contain"
          />
          <span className="h-10 w-px bg-slate-300" aria-hidden="true" />
          <img
            src={`${import.meta.env.BASE_URL}a_clean_isolated_logo_graphic_on_a_transparent_bac.png`}
            alt="New Pratama"
            className="h-14 w-14 rounded-full bg-white object-contain ring-2 ring-gold/50 p-1 shadow-sm"
          />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-navy">
          {t('auth.loginTitle')}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {t('auth.loginSubtitle')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-line rounded-xl sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {displayedError && (
              <div className="rounded-lg bg-danger/10 border border-danger/20 p-3 text-sm text-danger text-start">
                {displayedError}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-ink text-start mb-1"
              >
                {t('auth.email')}
              </label>
              <input
                id="email"
                name="email"
                type="text"
                autoComplete="username email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-lg border border-line px-3 py-2 text-ink shadow-sm placeholder:text-muted/60 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy sm:text-sm text-start"
                placeholder="pratama.res26@gmail.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-ink text-start mb-1"
              >
                {t('auth.password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-lg border border-line px-3 py-2 text-ink shadow-sm placeholder:text-muted/60 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy sm:text-sm text-start"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-navy hover:bg-navy-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy disabled:opacity-50 transition"
              >
                {submitting ? t('auth.loggingIn') : t('auth.loginButton')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
