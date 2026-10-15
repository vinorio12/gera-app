import { Route, Routes } from 'react-router-dom';
import { PortalVerbo } from '@gera/design-system';
import { DeskLayout } from '../../components/layout/DeskLayout';
import { NotFound } from '../../components/shared/NotFound';
import { ScreenPlaceholder } from '../../components/shared/ScreenPlaceholder';
import { placeholderRoutes } from '../../components/shared/placeholderRoutes';
import { useSession } from '../../lib/auth';
import { ENTIDADE_NAV } from '../../lib/portals';

export default function EntidadePortal() {
  const { orgName } = useSession();
  return (
    <Routes>
      <Route element={<DeskLayout portal="entidade" nav={ENTIDADE_NAV} />}>
        <Route index element={<EntidadeHome />} />
        {placeholderRoutes(ENTIDADE_NAV, orgName)}
        <Route
          path="voluntarios/:id"
          element={
            <ScreenPlaceholder
              title="Perfil do voluntário"
              eyebrow={orgName}
              summary="Dados, histórico de ações, banco de horas, certificados e as ações de aprovar, desligar com motivo e reativar."
            />
          }
        />
        <Route path="*" element={<NotFound homePath="/entidade" />} />
      </Route>
    </Routes>
  );
}

function EntidadeHome() {
  const { orgName } = useSession();
  const home = ENTIDADE_NAV[0]!;
  return (
    <>
      {/* No desktop o verbo já está no topo da barra lateral. */}
      <PortalVerbo portal="entidade" subtitle={orgName} className="mb-6 lg:hidden" />
      <ScreenPlaceholder title={home.label} eyebrow={orgName} summary={home.summary} />
    </>
  );
}
