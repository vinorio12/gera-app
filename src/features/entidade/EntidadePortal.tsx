import { Route, Routes } from 'react-router-dom';
import { DeskLayout } from '../../components/layout/DeskLayout';
import { NotFound } from '../../components/shared/NotFound';
import { placeholderRoutes } from '../../components/shared/placeholderRoutes';
import { useSession } from '../../lib/auth';
import { ENTIDADE_NAV } from '../../lib/portals';
import { CampanhaDoacoesPage, CampanhaFormPage, CampanhasGestaoPage } from './CampanhasGestao';
import { EventoCheckInPage, EventoFormPage, EventosGestaoPage } from './EventosGestao';
import { CertificadosPage, EmitirCertificadosPage } from './CertificadosPage';
import { FinanceiroPage } from './FinanceiroPage';
import { HorasPage } from './HorasPage';
import { LojaGestaoPage, ProdutoFormPage } from './LojaGestao';
import { OportunidadeFormPage, OportunidadesGestaoPage } from './OportunidadesGestao';
import { PainelPage } from './PainelPage';
import { PatrocinadorFormPage, PatrocinadoresPage } from './PatrocinadoresPage';
import { RelatoriosPage } from './RelatoriosPage';
import { VoluntarioPerfilPage } from './VoluntarioPerfilPage';
import { VoluntariosPage } from './VoluntariosPage';

const PRONTAS = new Set(['', 'voluntarios', 'horas', 'oportunidades', 'eventos', 'loja', 'campanhas', 'patrocinadores', 'financeiro', 'certificados', 'relatorios']);

export default function EntidadePortal() {
  const { orgName } = useSession();
  return (
    <Routes>
      <Route element={<DeskLayout portal="entidade" nav={ENTIDADE_NAV} />}>
        <Route index element={<PainelPage />} />
        <Route path="voluntarios" element={<VoluntariosPage />} />
        <Route path="voluntarios/:id" element={<VoluntarioPerfilPage />} />
        <Route path="horas" element={<HorasPage />} />
        <Route path="oportunidades" element={<OportunidadesGestaoPage />} />
        <Route path="oportunidades/nova" element={<OportunidadeFormPage />} />
        <Route path="oportunidades/:id/editar" element={<OportunidadeFormPage />} />
        <Route path="eventos" element={<EventosGestaoPage />} />
        <Route path="eventos/novo" element={<EventoFormPage />} />
        <Route path="eventos/:id/editar" element={<EventoFormPage />} />
        <Route path="eventos/:id/checkin" element={<EventoCheckInPage />} />
        <Route path="loja" element={<LojaGestaoPage />} />
        <Route path="loja/novo" element={<ProdutoFormPage />} />
        <Route path="loja/:id/editar" element={<ProdutoFormPage />} />
        <Route path="campanhas" element={<CampanhasGestaoPage />} />
        <Route path="campanhas/nova" element={<CampanhaFormPage />} />
        <Route path="campanhas/:id" element={<CampanhaDoacoesPage />} />
        <Route path="campanhas/:id/editar" element={<CampanhaFormPage />} />
        <Route path="patrocinadores" element={<PatrocinadoresPage />} />
        <Route path="patrocinadores/novo" element={<PatrocinadorFormPage />} />
        <Route path="patrocinadores/:id/editar" element={<PatrocinadorFormPage />} />
        <Route path="financeiro" element={<FinanceiroPage />} />
        <Route path="certificados" element={<CertificadosPage />} />
        <Route path="certificados/emitir" element={<EmitirCertificadosPage />} />
        <Route path="relatorios" element={<RelatoriosPage />} />
        {placeholderRoutes(ENTIDADE_NAV.filter((item) => !PRONTAS.has(item.path)), orgName)}
        <Route path="*" element={<NotFound homePath="/entidade" />} />
      </Route>
    </Routes>
  );
}
