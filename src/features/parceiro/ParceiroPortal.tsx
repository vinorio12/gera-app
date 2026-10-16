import { Route, Routes } from 'react-router-dom';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { NotFound } from '../../components/shared/NotFound';
import { placeholderRoutes } from '../../components/shared/placeholderRoutes';
import { PARCEIRO_TABS } from '../../lib/portals';
import { EscanearPage } from './EscanearPage';
import { BeneficioFormPage, BeneficiosParceiroPage, EmpresaPage, PainelEsgPage } from './ParceiroPages';
import { ResgatesPage } from './ResgatesPage';

const PRONTAS = new Set(['', 'resgates', 'painel', 'beneficios', 'empresa']);

export default function ParceiroPortal() {
  return (
    <Routes>
      <Route element={<MobileLayout portal="parceiro" tabs={PARCEIRO_TABS} />}>
        {/* A tela inicial do Parceiro é o scanner. */}
        <Route index element={<EscanearPage />} />
        <Route path="resgates" element={<ResgatesPage />} />
        <Route path="painel" element={<PainelEsgPage />} />
        <Route path="beneficios" element={<BeneficiosParceiroPage />} />
        <Route path="beneficios/novo" element={<BeneficioFormPage />} />
        <Route path="beneficios/:id/editar" element={<BeneficioFormPage />} />
        <Route path="empresa" element={<EmpresaPage />} />
        {placeholderRoutes(PARCEIRO_TABS.filter((item) => !PRONTAS.has(item.path)))}
        <Route path="*" element={<NotFound homePath="/parceiro" />} />
      </Route>
    </Routes>
  );
}
