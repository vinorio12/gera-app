import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { GeraSymbol, PortalVerbo, cx } from '@gera/design-system';
import { PORTAL_HOME, useAuth, useSession } from '../../lib/auth';
import { marcaDaEntidade } from '../../lib/marca';
import type { NavItem } from '../../lib/portals';
import { useEntidadeConfig } from '../../services/hooks';
import { Avatar } from '../shared/Imagens';
import { IconButton } from '../shared/IconButton';
import { SkipLink } from '../shared/SkipLink';
import { ThemeToggle } from '../shared/ThemeToggle';

interface DeskLayoutProps {
  portal: 'admin' | 'entidade';
  nav: NavItem[];
}

/** Portais de computador (Administrador e Entidade): barra lateral recolhível, gaveta no celular. */
export function DeskLayout({ portal, nav }: DeskLayoutProps) {
  const session = useSession();
  const { signOut, signIn } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const verComo = !!session.verComo;
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => setDrawerOpen(false), [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  return (
    <div className="min-h-screen bg-bg-page">
      <SkipLink />
      {verComo && (
        <div role="status" className="sticky top-0 z-50 flex h-10 items-center justify-center gap-2 bg-brand-deep px-3 text-xs font-semibold text-on-brand-deep sm:text-sm">
          <span className="truncate">Você está vendo como {session.orgName}</span>
          <span aria-hidden>·</span>
          <button
            type="button"
            onClick={() => {
              signIn('admin');
              navigate('/admin/entidades');
            }}
            className="shrink-0 rounded-sm underline underline-offset-2"
          >
            Voltar ao admin
          </button>
        </div>
      )}
      <div className="lg:flex">
        <aside
          className={cx(
            'sticky hidden shrink-0 flex-col border-r border-border bg-bg-card lg:flex',
            verComo ? 'top-10 h-[calc(100vh-40px)]' : 'top-0 h-screen',
            collapsed ? 'w-[76px]' : 'w-[264px]',
          )}
        >
          <SidebarContent portal={portal} nav={nav} subtitle={session.orgName} collapsed={collapsed} />
          <div className={cx('border-t border-border p-3', collapsed && 'flex justify-center')}>
            <IconButton
              icon={collapsed ? PanelLeftOpen : PanelLeftClose}
              label={collapsed ? 'Expandir menu' : 'Recolher menu'}
              aria-expanded={!collapsed}
              onClick={() => setCollapsed((c) => !c)}
            />
          </div>
        </aside>

        {drawerOpen && (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="absolute inset-0 bg-ink opacity-40" onClick={() => setDrawerOpen(false)} aria-hidden />
            <div className="relative flex h-full w-[280px] max-w-[85vw] flex-col bg-bg-card shadow-raised">
              <div className="flex justify-end p-2">
                <IconButton icon={X} label="Fechar menu" onClick={() => setDrawerOpen(false)} autoFocus />
              </div>
              <SidebarContent portal={portal} nav={nav} subtitle={session.orgName} collapsed={false} />
            </div>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <header className={cx('sticky z-30 flex h-16 items-center gap-2 border-b border-border bg-bg-card px-2 sm:px-4', verComo ? 'top-10' : 'top-0')}>
            <IconButton
              className="lg:hidden"
              icon={Menu}
              label="Abrir menu"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
            />
            <GeraSymbol size={28} className="lg:hidden" />
            <div className="ml-auto flex min-w-0 items-center gap-1">
              <span className="hidden truncate px-2 text-sm font-semibold text-ink-muted sm:block">{session.userName}</span>
              <ThemeToggle />
              <IconButton icon={LogOut} label="Sair" onClick={signOut} />
            </div>
          </header>
          <main id="conteudo" className="mx-auto max-w-[1200px] px-4 py-6 lg:px-8 lg:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

/** Foto de perfil (logo) da entidade no topo do menu, com a faixa da cor dela. Sem logo, não mostra nada. */
function EntidadeTopo({ collapsed }: { collapsed: boolean }) {
  const { orgId } = useSession();
  const entidade = useEntidadeConfig(orgId ?? '');
  const e = entidade.data;
  if (!e?.logoUrl) return collapsed ? <GeraSymbol size={36} /> : null;
  return (
    <div style={marcaDaEntidade(e).estilo} className={cx('flex flex-col gap-2', !collapsed && 'mb-3')}>
      <Avatar src={e.logoUrl} nome={e.nome} tamanho={collapsed ? 40 : 56} />
      {!collapsed && <div aria-hidden className="h-1 w-14 rounded-pill bg-[var(--cor-entidade)]" />}
    </div>
  );
}

function SidebarContent({
  portal,
  nav,
  subtitle,
  collapsed,
}: DeskLayoutProps & { subtitle?: string; collapsed: boolean }) {
  const base = PORTAL_HOME[portal];
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={cx('p-3', collapsed && 'flex justify-center py-4')}>
        {portal === 'entidade' && <EntidadeTopo collapsed={collapsed} />}
        {collapsed ? portal !== 'entidade' && <GeraSymbol size={36} /> : <PortalVerbo portal={portal} subtitle={subtitle} />}
      </div>
      <nav aria-label="Menu do portal" className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        <ul className="flex flex-col gap-1">
          {nav.map(({ path, label, icon: Icon }) => (
            <li key={path}>
              <NavLink
                to={path ? `${base}/${path}` : base}
                end={path === ''}
                title={collapsed ? label : undefined}
                aria-label={collapsed ? label : undefined}
                className={({ isActive }) =>
                  cx(
                    'flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold',
                    collapsed && 'justify-center px-0',
                    isActive ? 'bg-primary-soft text-on-primary-soft' : 'text-ink-muted hover:bg-bg-subtle hover:text-ink',
                  )
                }
              >
                <Icon size={20} aria-hidden className="shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
