import { Route, Routes } from 'react-router-dom';
import { PortalVerbo } from '@gera/design-system';
import { DeskLayout } from '../../components/layout/DeskLayout';
import { NotFound } from '../../components/shared/NotFound';
import { PageHeader } from '../../components/shared/PageHeader';
import { placeholderRoutes } from '../../components/shared/placeholderRoutes';
import { ADMIN_NAV } from '../../lib/portals';
import { PainelRelatorios } from '../entidade/RelatoriosPage';
import { ConfiguracoesAdminPage } from './ConfiguracoesAdminPage';
import { CampanhasAdminPage, EventosAdminPage, FinanceiroAdminPage } from './ConsolidadosPages';
import { EntidadesAdminPage, NovaEntidadePage } from './EntidadesAdminPage';
import { VisaoGeralPage } from './VisaoGeralPage';
import { VoluntariosAdminPage } from './VoluntariosAdminPage';

const EYEBROW = 'Administrador ACIJS';
const PRONTAS = new Set(['', 'entidades', 'voluntarios', 'eventos', 'campanhas', 'financeiro', 'relatorios', 'configuracoes']);

export default function AdminPortal() {
  return (
    <Routes>
      <Route element={<DeskLayout portal="admin" nav={ADMIN_NAV} />}>
        <Route index element={<AdminHome />} />
        <Route path="entidades" element={<EntidadesAdminPage />} />
        <Route path="entidades/nova" element={<NovaEntidadePage />} />
        <Route path="voluntarios" element={<VoluntariosAdminPage />} />
        <Route path="eventos" element={<EventosAdminPage />} />
        <Route path="campanhas" element={<CampanhasAdminPage />} />
        <Route path="financeiro" element={<FinanceiroAdminPage />} />
        <Route path="relatorios" element={<AdminRelatorios />} />
        <Route path="configuracoes" element={<ConfiguracoesAdminPage />} />
        {placeholderRoutes(ADMIN_NAV.filter((item) => !PRONTAS.has(item.path)), EYEBROW)}
        <Route path="*" element={<NotFound homePath="/admin" />} />
      </Route>
    </Routes>
  );
}

function AdminHome() {
  return (
    <>
      {/* No desktop o verbo já está no topo da barra lateral. */}
      <PortalVerbo portal="admin" className="mb-6 lg:hidden" />
      <VisaoGeralPage />
    </>
  );
}

function AdminRelatorios() {
  return (
    <>
      <PageHeader title="Relatórios" eyebrow={EYEBROW} description="Prestação de contas e voluntariado corporativo por entidade ou de todas juntas." />
      <PainelRelatorios />
    </>
  );
}
