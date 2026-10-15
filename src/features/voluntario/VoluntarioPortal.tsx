import { Link, Route, Routes } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { PortalVerbo } from '@gera/design-system';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { NotFound } from '../../components/shared/NotFound';
import { placeholderRoutes } from '../../components/shared/placeholderRoutes';
import { VOLUNTARIO_MORE, VOLUNTARIO_TABS } from '../../lib/portals';
import { AcoesPage } from './AcoesPage';
import { CarteirinhaPage } from './CarteirinhaPage';
import { OportunidadesPage } from './OportunidadesPage';
import { VoluntarioHome } from './VoluntarioHome';

/** Telas já construídas; o resto da navegação ainda usa a tela provisória. */
const PRONTAS = new Set(['', 'oportunidades', 'carteirinha', 'acoes', 'mais']);

export default function VoluntarioPortal() {
  return (
    <Routes>
      <Route element={<MobileLayout portal="voluntario" tabs={VOLUNTARIO_TABS} moreItems={VOLUNTARIO_MORE} />}>
        <Route index element={<VoluntarioHome />} />
        <Route path="oportunidades" element={<OportunidadesPage />} />
        <Route path="carteirinha" element={<CarteirinhaPage />} />
        <Route path="acoes" element={<AcoesPage />} />
        <Route path="mais" element={<VoluntarioMais />} />
        {placeholderRoutes([...VOLUNTARIO_TABS, ...VOLUNTARIO_MORE].filter((item) => !PRONTAS.has(item.path)))}
        <Route path="*" element={<NotFound homePath="/app" />} />
      </Route>
    </Routes>
  );
}

function VoluntarioMais() {
  return (
    <div className="flex flex-col gap-4">
      <PortalVerbo portal="voluntario" />
      <nav aria-label="Mais opções">
        <ul className="overflow-hidden rounded-lg border border-border bg-bg-card shadow-card">
          {VOLUNTARIO_MORE.map(({ path, label, icon: Icon }) => (
            <li key={path} className="border-b border-border last:border-b-0">
              <Link to={`/app/${path}`} className="flex min-h-14 items-center gap-3 px-4 font-semibold text-ink hover:bg-bg-subtle">
                <Icon size={20} aria-hidden className="text-link" />
                <span className="flex-1">{label}</span>
                <ChevronRight size={20} aria-hidden className="text-ink-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
