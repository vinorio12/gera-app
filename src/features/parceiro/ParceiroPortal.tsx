import { Route, Routes } from 'react-router-dom';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { NotFound } from '../../components/shared/NotFound';
import { placeholderRoutes } from '../../components/shared/placeholderRoutes';
import { PARCEIRO_TABS } from '../../lib/portals';
import { EscanearPage } from './EscanearPage';
import { ResgatesPage } from './ResgatesPage';

const PRONTAS = new Set(['', 'resgates']);

export default function ParceiroPortal() {
  return (
    <Routes>
      <Route element={<MobileLayout portal="parceiro" tabs={PARCEIRO_TABS} />}>
        {/* A tela inicial do Parceiro é o scanner. */}
        <Route index element={<EscanearPage />} />
        <Route path="resgates" element={<ResgatesPage />} />
        {placeholderRoutes(PARCEIRO_TABS.filter((item) => !PRONTAS.has(item.path)))}
        <Route path="*" element={<NotFound homePath="/parceiro" />} />
      </Route>
    </Routes>
  );
}
