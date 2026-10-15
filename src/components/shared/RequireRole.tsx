import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { PORTAL_HOME, ROLE_LABEL, useAuth, type Role } from '../../lib/auth';
import { ButtonLink } from '../ui/ButtonLink';
import { EmptyState } from './EmptyState';

/**
 * Guarda de rota por perfil. Sem sessão, manda para o login e volta depois (logo após "Sair", só para o
 * login); com outro perfil, mostra o estado "sem permissão" em vez de vazar a tela.
 */
export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { session, signedOut } = useAuth();
  const location = useLocation();

  if (!session) {
    if (signedOut) return <Navigate to="/entrar" replace />;
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/entrar?next=${next}`} replace />;
  }

  if (session.role !== role) {
    return (
      <main id="conteudo" className="mx-auto grid min-h-screen max-w-xl place-items-center bg-bg-page px-4">
        <EmptyState
          title="Essa área não é do seu perfil"
          description={
            <>
              Você entrou como <strong>{ROLE_LABEL[session.role]}</strong>, e esta tela é do perfil{' '}
              <strong>{ROLE_LABEL[role]}</strong>.
            </>
          }
          action={
            <>
              <ButtonLink to={PORTAL_HOME[session.role]}>Voltar para o meu portal</ButtonLink>
              <ButtonLink to="/entrar" variant="secondary">
                Trocar de perfil
              </ButtonLink>
            </>
          }
        />
      </main>
    );
  }

  return <>{children}</>;
}
