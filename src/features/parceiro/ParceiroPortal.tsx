import { Route, Routes } from 'react-router-dom';
import { PortalVerbo } from '@gera/design-system';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { EmptyState } from '../../components/shared/EmptyState';
import { NotFound } from '../../components/shared/NotFound';
import { placeholderRoutes } from '../../components/shared/placeholderRoutes';
import { useSession } from '../../lib/auth';
import { PARCEIRO_TABS } from '../../lib/portals';

export default function ParceiroPortal() {
  return (
    <Routes>
      <Route element={<MobileLayout portal="parceiro" tabs={PARCEIRO_TABS} />}>
        <Route index element={<ParceiroHome />} />
        {placeholderRoutes(PARCEIRO_TABS)}
        <Route path="*" element={<NotFound homePath="/parceiro" />} />
      </Route>
    </Routes>
  );
}

/** A tela inicial do Parceiro é o scanner. */
function ParceiroHome() {
  const { orgName } = useSession();
  const home = PARCEIRO_TABS[0]!;
  return (
    <div className="flex flex-col gap-4">
      <PortalVerbo portal="parceiro" subtitle={orgName} />
      <EmptyState title="O scanner entra na próxima etapa" description={home.summary} />
    </div>
  );
}
