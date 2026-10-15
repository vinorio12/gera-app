import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import { LucideProvider } from 'lucide-react';
import { QueryClientProvider } from '@tanstack/react-query';
import { PublicLayout } from '../components/layout/PublicLayout';
import { NotFound } from '../components/shared/NotFound';
import { PageLoader } from '../components/shared/PageLoader';
import { RequireRole } from '../components/shared/RequireRole';
import { ToastProvider } from '../components/shared/Toast';
import { HomePage } from '../features/publico/HomePage';
import { LoginPage } from '../features/publico/LoginPage';
import { CadastroPage } from '../features/publico/CadastroPage';
import { CheckoutPage } from '../features/publico/CheckoutPage';
import { IngressosPage } from '../features/publico/IngressosPage';
import { ValidarPage } from '../features/publico/ValidarPage';
import { CampanhaDetalhePage, CampanhasPage } from '../features/publico/CampanhasPages';
import { EntidadeDetalhePage, EntidadesPage, ParceirosPage } from '../features/publico/EntidadesParceirosPages';
import { EventoDetalhePage, EventosPage } from '../features/publico/EventosPages';
import { CarrinhoPage, LojaPage, ProdutoPage } from '../features/publico/LojaPages';
import { OportunidadeDetalhePage, OportunidadesPage } from '../features/publico/OportunidadesPages';
import { AuthProvider, type Role } from '../lib/auth';
import { CartProvider } from '../lib/cart';
import { ThemeProvider } from '../lib/theme';
import { queryClient } from '../services/hooks';

// Cada portal é um pedaço separado do bundle: quem só usa o app do Voluntário não baixa o Admin.
const AdminPortal = lazy(() => import('../features/admin/AdminPortal'));
const EntidadePortal = lazy(() => import('../features/entidade/EntidadePortal'));
const VoluntarioPortal = lazy(() => import('../features/voluntario/VoluntarioPortal'));
const ParceiroPortal = lazy(() => import('../features/parceiro/ParceiroPortal'));

// A prévia publicada como página (npm run build:static) roda num quadro sem URLs próprias,
// então guarda a rota em memória. O app de verdade usa as URLs do navegador.
const Router = import.meta.env.VITE_ROUTER === 'memory' ? MemoryRouter : BrowserRouter;

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
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <CartProvider>
              <LucideProvider strokeWidth={1.75}>
                <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                  <Routes>
                    <Route element={<PublicLayout />}>
                      <Route index element={<HomePage />} />
                      <Route path="entrar" element={<LoginPage />} />
                      <Route path="oportunidades" element={<OportunidadesPage />} />
                      <Route path="oportunidades/:id" element={<OportunidadeDetalhePage />} />
                      <Route path="eventos" element={<EventosPage />} />
                      <Route path="eventos/:slug" element={<EventoDetalhePage />} />
                      <Route path="campanhas" element={<CampanhasPage />} />
                      <Route path="campanhas/:slug" element={<CampanhaDetalhePage />} />
                      <Route path="loja" element={<LojaPage />} />
                      <Route path="loja/:produto" element={<ProdutoPage />} />
                      <Route path="carrinho" element={<CarrinhoPage />} />
                      <Route path="entidades" element={<EntidadesPage />} />
                      <Route path="entidades/:slug" element={<EntidadeDetalhePage />} />
                      <Route path="parceiros" element={<ParceirosPage />} />
                      <Route path="eventos/:slug/ingressos" element={<IngressosPage />} />
                      <Route path="checkout" element={<CheckoutPage />} />
                      <Route path="cadastro" element={<CadastroPage />} />
                      <Route path="validar" element={<ValidarPage />} />
                      <Route path="validar/:token" element={<ValidarPage />} />
                      <Route
                        path="*"
                        element={
                          <div className="mx-auto max-w-[1200px] px-4 py-10">
                            <NotFound homePath="/" />
                          </div>
                        }
                      />
                    </Route>
                    <Route
                      path="admin/*"
                      element={
                        <Portal role="admin">
                          <AdminPortal />
                        </Portal>
                      }
                    />
                    <Route
                      path="entidade/*"
                      element={
                        <Portal role="entidade">
                          <EntidadePortal />
                        </Portal>
                      }
                    />
                    <Route
                      path="app/*"
                      element={
                        <Portal role="voluntario">
                          <VoluntarioPortal />
                        </Portal>
                      }
                    />
                    <Route
                      path="parceiro/*"
                      element={
                        <Portal role="parceiro">
                          <ParceiroPortal />
                        </Portal>
                      }
                    />
                  </Routes>
                </Router>
              </LucideProvider>
            </CartProvider>
          </ToastProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
