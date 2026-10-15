import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, ShoppingCart, X } from 'lucide-react';
import { GeraLogo, cx } from '@gera/design-system';
import { PORTAL_HOME, useAuth } from '../../lib/auth';
import { useCart } from '../../lib/cart';
import { PUBLIC_NAV } from '../../lib/portals';
import { BrandLogo } from '../shared/BrandLogo';
import { IconButton } from '../shared/IconButton';
import { SkipLink } from '../shared/SkipLink';
import { ThemeToggle } from '../shared/ThemeToggle';
import { ButtonLink } from '../ui/ButtonLink';
import acijsLogo from '../../assets/idealizadores/acijs.png';
import catolicaLogo from '../../assets/idealizadores/catolica.png';
import wegLogo from '../../assets/idealizadores/weg.png';

const IDEALIZADORES = [
  { src: acijsLogo, alt: 'ACIJS, Associação Empresarial de Jaraguá do Sul' },
  { src: wegLogo, alt: 'WEG' },
  { src: catolicaLogo, alt: 'Católica SC, Centro Universitário' },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cx(
    'flex min-h-11 items-center rounded-md px-3 text-sm font-semibold',
    isActive ? 'bg-primary-soft text-on-primary-soft' : 'text-ink-muted hover:bg-bg-subtle hover:text-ink',
  );

/** Site público: cabeçalho com navegação e rodapé institucional. */
export function PublicLayout() {
  const { session } = useAuth();
  const { total: itensNoCarrinho } = useCart();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-bg-page">
      <SkipLink />
      <header className="sticky top-0 z-30 border-b border-border bg-bg-card">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-4 px-4">
          <Link to="/" aria-label="GERA, página inicial" className="shrink-0">
            <BrandLogo height={36} tagline={false} />
          </Link>
          <nav aria-label="Principal" className="hidden flex-1 lg:block">
            <ul className="flex gap-1">
              {PUBLIC_NAV.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} className={navLinkClass}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            {/* No celular a troca de tema fica dentro do menu, para o cabeçalho caber em 360px. */}
            <ThemeToggle className="hidden sm:inline-flex" />
            {itensNoCarrinho > 0 && (
              <Link
                to="/carrinho"
                aria-label={`Carrinho, ${itensNoCarrinho} ${itensNoCarrinho === 1 ? 'item' : 'itens'}`}
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-md text-ink-muted hover:bg-bg-subtle hover:text-ink"
              >
                <ShoppingCart size={20} aria-hidden />
                <span aria-hidden className="absolute right-1 top-1 min-w-5 rounded-pill bg-highlight px-1 text-center text-xs font-bold leading-5 text-on-highlight">
                  {itensNoCarrinho}
                </span>
              </Link>
            )}
            {session ? (
              <ButtonLink to={PORTAL_HOME[session.role]}>Meu portal</ButtonLink>
            ) : (
              <ButtonLink to="/entrar">Entrar</ButtonLink>
            )}
            <IconButton
              className="lg:hidden"
              icon={menuOpen ? X : Menu}
              label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={menuOpen}
              aria-controls="menu-publico"
              onClick={() => setMenuOpen((open) => !open)}
            />
          </div>
        </div>
        {menuOpen && (
          <nav id="menu-publico" aria-label="Principal" className="border-t border-border lg:hidden">
            <ul className="mx-auto flex max-w-[1200px] flex-col gap-1 px-4 py-3">
              {PUBLIC_NAV.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} className={navLinkClass}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
              <li className="flex items-center justify-between border-t border-border pt-2 sm:hidden">
                <span className="px-3 text-sm font-semibold text-ink-muted">Tema</span>
                <ThemeToggle />
              </li>
            </ul>
          </nav>
        )}
      </header>

      <main id="conteudo" className="flex-1">
        <Outlet />
      </main>

      <PublicFooter />
    </div>
  );
}

function PublicFooter() {
  return (
    <footer className="text-on-brand-deep">
      <div className="bg-brand-deep">
        <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-10 md:grid-cols-[auto_1fr] md:gap-16">
          <GeraLogo variant="negative" height={56} />
          <nav aria-label="Rodapé">
            <ul className="grid grid-cols-2 gap-x-8 gap-y-1 sm:grid-cols-3">
              {[...PUBLIC_NAV, { to: '/cadastro', label: 'Quero ser voluntário' }, { to: '/entrar', label: 'Entrar' }].map(
                (item) => (
                  <li key={item.to}>
                    <Link to={item.to} className="inline-flex min-h-11 items-center text-sm font-semibold hover:underline">
                      {item.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </nav>
        </div>
      </div>
      <div className="bg-verde-950">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-semibold">Uma iniciativa do Comitê Social ACIJS e da WEG</p>
          {/* A marca "Jaraguá do Sul · Orgulho de Ser" só entra quando houver autorização da Prefeitura. */}
          <div className="flex flex-col gap-2 md:items-end">
            <p className="font-display text-base leading-5 tracking-[0.08em] opacity-90">IDEALIZADORES</p>
            <ul className="flex flex-wrap gap-2">
              {IDEALIZADORES.map(({ src, alt }) => (
                // Placa branca (papel) em qualquer tema: os logos oficiais são coloridos e pedem fundo claro.
                <li key={alt} className="flex h-12 items-center rounded-md bg-papel px-2.5 sm:h-14 sm:px-3">
                  <img src={src} alt={alt} className="h-8 w-auto sm:h-9" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
