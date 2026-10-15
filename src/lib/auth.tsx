import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Portal } from '@gera/design-system';

/** Os perfis autenticados são os mesmos quatro portais do design system. */
export type Role = Portal;

export interface Session {
  role: Role;
  /** Nome mostrado na interface. */
  userName: string;
  /** Entidade ou empresa do usuário (multi-tenant): Entidade e Parceiro só enxergam a própria. */
  orgId?: string;
  orgName?: string;
}

/** Perfis do seletor "entrar como" do protótipo. */
export const DEMO_PROFILES: Record<Role, Session> = {
  admin: { role: 'admin', userName: 'Comitê Social ACIJS' },
  entidade: { role: 'entidade', userName: 'Equipe AMA Jaraguá', orgId: 'ama-jaragua', orgName: 'AMA Jaraguá' },
  voluntario: { role: 'voluntario', userName: 'Alex Silva' },
  parceiro: { role: 'parceiro', userName: 'Café Exemplo', orgId: 'cafe-exemplo', orgName: 'Café Exemplo' },
};

export const PORTAL_HOME: Record<Role, string> = {
  admin: '/admin',
  entidade: '/entidade',
  voluntario: '/app',
  parceiro: '/parceiro',
};

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrador',
  entidade: 'Entidade',
  voluntario: 'Voluntário',
  parceiro: 'Parceiro',
};

/** Perfil dono de um caminho, para decidir se o "next" do login faz sentido para quem entrou. */
export function roleForPath(path: string): Role | null {
  const hit = (Object.entries(PORTAL_HOME) as Array<[Role, string]>).find(
    ([, home]) => path === home || path.startsWith(`${home}/`),
  );
  return hit ? hit[0] : null;
}

const STORAGE_KEY = 'gera.session';

function readStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const role = (JSON.parse(raw) as { role?: string }).role;
    return role && role in DEMO_PROFILES ? DEMO_PROFILES[role as Role] : null;
  } catch {
    return null;
  }
}

interface AuthContextValue {
  session: Session | null;
  /** true depois de "Sair": as guardas mandam para o login sem o aviso de "entre como". */
  signedOut: boolean;
  signIn: (role: Role) => Session;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readStoredSession);
  const [signedOut, setSignedOut] = useState(false);

  const signIn = useCallback((role: Role) => {
    const next = DEMO_PROFILES[role];
    setSession(next);
    setSignedOut(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ role }));
    } catch {
      // Sem storage (aba privada): a sessão vale só até recarregar.
    }
    return next;
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
    setSignedOut(true);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // idem
    }
  }, []);

  const value = useMemo(() => ({ session, signedOut, signIn, signOut }), [session, signedOut, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return ctx;
}

/** Sessão garantida: use só em telas que estão atrás de <RequireRole>. */
export function useSession(): Session {
  const { session } = useAuth();
  if (!session) throw new Error('useSession chamado fora de uma rota protegida');
  return session;
}
