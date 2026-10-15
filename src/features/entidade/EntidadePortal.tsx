import { Link, Route, Routes } from 'react-router-dom';
import { ChevronRight, UserRoundCheck } from 'lucide-react';
import { PortalVerbo } from '@gera/design-system';
import { DeskLayout } from '../../components/layout/DeskLayout';
import { NotFound } from '../../components/shared/NotFound';
import { ScreenPlaceholder } from '../../components/shared/ScreenPlaceholder';
import { placeholderRoutes } from '../../components/shared/placeholderRoutes';
import { useSession } from '../../lib/auth';
import { ENTIDADE_NAV } from '../../lib/portals';
import { useVoluntariosDaEntidade } from '../../services/hooks';
import { HorasPage } from './HorasPage';
import { VoluntarioPerfilPage } from './VoluntarioPerfilPage';
import { VoluntariosPage } from './VoluntariosPage';

const PRONTAS = new Set(['', 'voluntarios', 'horas']);

export default function EntidadePortal() {
  const { orgName } = useSession();
  return (
    <Routes>
      <Route element={<DeskLayout portal="entidade" nav={ENTIDADE_NAV} />}>
        <Route index element={<EntidadeHome />} />
        <Route path="voluntarios" element={<VoluntariosPage />} />
        <Route path="voluntarios/:id" element={<VoluntarioPerfilPage />} />
        <Route path="horas" element={<HorasPage />} />
        {placeholderRoutes(ENTIDADE_NAV.filter((item) => !PRONTAS.has(item.path)), orgName)}
        <Route path="*" element={<NotFound homePath="/entidade" />} />
      </Route>
    </Routes>
  );
}

function EntidadeHome() {
  const { orgId, orgName } = useSession();
  const voluntarios = useVoluntariosDaEntidade(orgId!);
  const home = ENTIDADE_NAV[0]!;
  const pendentes = voluntarios.data?.filter((r) => !r.voluntario.aprovadoEm && !r.voluntario.desligamento).length ?? 0;
  return (
    <>
      {/* No desktop o verbo já está no topo da barra lateral. */}
      <PortalVerbo portal="entidade" subtitle={orgName} className="mb-6 lg:hidden" />
      {pendentes > 0 && (
        <Link
          to="voluntarios"
          className="mb-6 flex min-h-14 items-center gap-3 rounded-lg border border-border bg-info-soft px-4 py-3 font-semibold text-on-info-soft"
        >
          <UserRoundCheck size={22} aria-hidden />
          <span className="flex-1">
            {pendentes === 1 ? '1 cadastro aguardando aprovação' : `${pendentes} cadastros aguardando aprovação`}
          </span>
          <ChevronRight size={20} aria-hidden />
        </Link>
      )}
      <ScreenPlaceholder title={home.label} eyebrow={orgName} summary={home.summary} />
    </>
  );
}
