import { Route, Routes } from 'react-router-dom';
import { DeskLayout } from '../../components/layout/DeskLayout';
import { NotFound } from '../../components/shared/NotFound';
import { placeholderRoutes } from '../../components/shared/placeholderRoutes';
import { useSession } from '../../lib/auth';
import { ENTIDADE_NAV } from '../../lib/portals';
import { HorasPage } from './HorasPage';
import { PainelPage } from './PainelPage';
import { VoluntarioPerfilPage } from './VoluntarioPerfilPage';
import { VoluntariosPage } from './VoluntariosPage';

const PRONTAS = new Set(['', 'voluntarios', 'horas']);

export default function EntidadePortal() {
  const { orgName } = useSession();
  return (
    <Routes>
      <Route element={<DeskLayout portal="entidade" nav={ENTIDADE_NAV} />}>
        <Route index element={<PainelPage />} />
        <Route path="voluntarios" element={<VoluntariosPage />} />
        <Route path="voluntarios/:id" element={<VoluntarioPerfilPage />} />
        <Route path="horas" element={<HorasPage />} />
        {placeholderRoutes(ENTIDADE_NAV.filter((item) => !PRONTAS.has(item.path)), orgName)}
        <Route path="*" element={<NotFound homePath="/entidade" />} />
      </Route>
    </Routes>
  );
}
