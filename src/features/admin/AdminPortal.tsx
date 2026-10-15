import { Route, Routes } from 'react-router-dom';
import { PortalVerbo } from '@gera/design-system';
import { DeskLayout } from '../../components/layout/DeskLayout';
import { NotFound } from '../../components/shared/NotFound';
import { placeholderRoutes } from '../../components/shared/placeholderRoutes';
import { ADMIN_NAV } from '../../lib/portals';
import { VisaoGeralPage } from './VisaoGeralPage';

const EYEBROW = 'Administrador ACIJS';

export default function AdminPortal() {
  return (
    <Routes>
      <Route element={<DeskLayout portal="admin" nav={ADMIN_NAV} />}>
        <Route index element={<AdminHome />} />
        {placeholderRoutes(ADMIN_NAV, EYEBROW)}
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
