import type { ReactNode } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { GeraSymbol, PORTAL_VERB, cx } from '@gera/design-system';
import { PORTAL_HOME, useAuth } from '../../lib/auth';
import type { NavItem } from '../../lib/portals';
import { IconButton } from '../shared/IconButton';
import { SkipLink } from '../shared/SkipLink';
import { ThemeToggle } from '../shared/ThemeToggle';

interface MobileLayoutProps {
  portal: 'voluntario' | 'parceiro';
  tabs: NavItem[];
  /** Telas que ficam dentro da aba "mais": a aba aparece ativa quando uma delas está aberta. */
  moreItems?: NavItem[];
  /** Ações extras no cabeçalho, antes do tema (ex.: o sino de notificações). */
  acoes?: ReactNode;
}

/** Portais de celular (Voluntário e Parceiro): barra superior enxuta e abas inferiores. */
export function MobileLayout({ portal, tabs, moreItems = [], acoes }: MobileLayoutProps) {
  const { signOut } = useAuth();
  const { pathname } = useLocation();
  const base = PORTAL_HOME[portal];
  const inMore = moreItems.some((item) => pathname === `${base}/${item.path}` || pathname.startsWith(`${base}/${item.path}/`));

  return (
    <div className="min-h-screen bg-bg-page pb-[calc(64px+env(safe-area-inset-bottom))]">
      <SkipLink />
      <header className="sticky top-0 z-30 border-b border-border bg-bg-card">
        <div className="mx-auto flex h-14 max-w-[640px] items-center gap-2 pl-4 pr-1">
          <GeraSymbol size={28} />
          <span className="truncate text-sm font-semibold text-ink-muted">{PORTAL_VERB[portal].who}</span>
          <div className="ml-auto flex items-center">
            {acoes}
            <ThemeToggle />
            <IconButton icon={LogOut} label="Sair" onClick={signOut} />
          </div>
        </div>
      </header>

      <main id="conteudo" className="mx-auto max-w-[640px] px-4 py-4">
        <Outlet />
      </main>

      <nav
        aria-label="Abas do app"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg-card pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="mx-auto grid max-w-[640px]" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
          {tabs.map(({ path, label, short, icon: Icon }) => (
            <li key={path}>
              <NavLink
                to={path ? `${base}/${path}` : base}
                end={path === ''}
                className={({ isActive }) => {
                  const active = isActive || (path === 'mais' && inMore);
                  return cx(
                    'relative flex h-16 flex-col items-center justify-center gap-1 px-0.5 text-[11px] font-semibold leading-4',
                    active ? 'text-link' : 'text-ink-muted hover:text-ink',
                  );
                }}
              >
                {({ isActive }) => (
                  <>
                    {(isActive || (path === 'mais' && inMore)) && (
                      <span className="absolute inset-x-1/4 top-0 h-[3px] rounded-sm bg-primary" aria-hidden />
                    )}
                    <Icon size={22} aria-hidden />
                    <span className="max-w-full truncate">{short ?? label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
