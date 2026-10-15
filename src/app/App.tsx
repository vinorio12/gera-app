import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { LucideProvider } from 'lucide-react';
import { PublicLayout } from '../components/layout/PublicLayout';
import { NotFound } from '../components/shared/NotFound';
import { PageLoader } from '../components/shared/PageLoader';
import { RequireRole } from '../components/shared/RequireRole';
import { ScreenPlaceholder } from '../components/shared/ScreenPlaceholder';
import { HomePage } from '../features/publico/HomePage';
import { LoginPage } from '../features/publico/LoginPage';
import { PUBLIC_PLACEHOLDERS } from '../features/publico/pages';
import { AuthProvider, type Role } from '../lib/auth';
import { ThemeProvider } from '../lib/theme';

// Cada portal é um pedaço separado do bundle: quem só usa o app do Voluntário não baixa o Admin.
const AdminPortal = lazy(() => import('../features/admin/AdminPortal'));
const EntidadePortal = lazy(() => import('../features/entidade/EntidadePortal'));
const VoluntarioPortal = lazy(() => import('../features/voluntario/VoluntarioPortal'));
const ParceiroPortal = lazy(() => import('../features/parceiro/ParceiroPortal'));

function Portal({ role, children }: { role: Role; children: ReactNode }) {
  return (
    <RequireRole role={role}>
      <Suspense fallback={<PageLoader fullScreen />}>{children}</Suspense>
    </RequireRole>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LucideProvider strokeWidth={1.75}>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route element={<PublicLayout />}>
                <Route index element={<HomePage />} />
                <Route path="entrar" element={<LoginPage />} />
                {PUBLIC_PLACEHOLDERS.map(({ path, title, summary }) => (
                  <Route
                    key={path}
                    path={path}
                    element={
                      <div className="mx-auto max-w-[1200px] px-4 py-10">
                        <ScreenPlaceholder title={title} summary={summary} />
                      </div>
                    }
                  />
                ))}
                <Route
                  path="*"
                  element={
                    <div className="mx-auto max-w-[1200px] px-4 py-10">
                      <NotFound homePath="/" />
                    </div>
                  }
                />
              </Route>
              <Route path="admin/*" element={<Portal role="admin"><AdminPortal /></Portal>} />
              <Route path="entidade/*" element={<Portal role="entidade"><EntidadePortal /></Portal>} />
              <Route path="app/*" element={<Portal role="voluntario"><VoluntarioPortal /></Portal>} />
              <Route path="parceiro/*" element={<Portal role="parceiro"><ParceiroPortal /></Portal>} />
            </Routes>
          </BrowserRouter>
        </LucideProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
