import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Portal } from '@gera/design-system';

/** Os perfis autenticados são os mesmos quatro portais do design system. */
export type Role = Portal;

/** Perfis do seletor "entrar como": os quatro portais e uma voluntária com cadastro novo. */
export type ProfileKey = Role | 'voluntario-novo';

export interface Session {
  profile: ProfileKey;
  role: Role;
  /** Nome mostrado na interface. */
  userName: string;
  /** Registro da pessoa nos dados (voluntário). */
  userId?: string;
  /** Entidade ou empresa do usuário (multi-tenant): Entidade e Parceiro só enxergam a própria. */
  orgId?: string;
  orgName?: string;
}

export const DEMO_PROFILES: Record<ProfileKey, Session> = {
  admin: { profile: 'admin', role: 'admin', userName: 'Comitê Social ACIJS' },
  entidade: { profile: 'entidade', role: 'entidade', userName: 'Equipe AMA Jaraguá', orgId: 'ama-jaragua', orgName: 'AMA Jaraguá' },
  voluntario: { profile: 'voluntario', role: 'voluntario', userName: 'Alex Silva', userId: 'v-alex' },
  'voluntario-novo': { profile: 'voluntario-novo', role: 'voluntario', userName: 'Bruna Costa', userId: 'v-bruna' },
  parceiro: { profile: 'parceiro', role: 'parceiro', userName: 'Café Exemplo', orgId: 'p-cafe', orgName: 'Café Exemplo' },
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
    const profile = (JSON.parse(raw) as { profile?: string }).profile;
    return profile && profile in DEMO_PROFILES ? DEMO_PROFILES[profile as ProfileKey] : null;
  } catch {
    return null;
  }
}

interface AuthContextValue {
  session: Session | null;
  /** true depois de "Sair": as guardas mandam para o login sem o aviso de "entre como". */
  signedOut: boolean;
  signIn: (profile: ProfileKey) => Session;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readStoredSession);
  const [signedOut, setSignedOut] = useState(false);

  const signIn = useCallback((profile: ProfileKey) => {
    const next = DEMO_PROFILES[profile];
    setSession(next);
    setSignedOut(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ profile }));
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
