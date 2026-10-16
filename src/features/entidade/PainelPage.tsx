import { Link } from 'react-router-dom';
import { Award, CalendarPlus, ChevronRight, HandHeart, Handshake, HeartPulse, PackagePlus, ScanLine, UserRoundCheck, Boxes } from 'lucide-react';
import { KpiCard, PortalVerbo, formatBRL, formatHours, formatNumber } from '@gera/design-system';
import { FiltroPeriodo, usePeriodo } from '../../components/shared/FiltroPeriodo';
import { HorasPorMesChart } from '../../components/shared/HorasPorMesChart';
import { PageHeader } from '../../components/shared/PageHeader';
import { ErrorState, Skeleton } from '../../components/shared/States';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { useSession } from '../../lib/auth';
import { variacao } from '../../lib/variacao';
import { usePainelEntidade } from '../../services/hooks';

const cardClass = 'rounded-lg border border-border bg-bg-card p-5 shadow-card';

const ATALHOS = [
  { to: 'certificados/emitir', label: 'Emitir certificado', icon: Award },
  { to: 'eventos/novo', label: 'Novo evento', icon: CalendarPlus },
  { to: 'patrocinadores/novo', label: 'Novo patrocinador', icon: Handshake },
  { to: 'loja/novo', label: 'Novo produto', icon: PackagePlus },
  { to: 'oportunidades/nova', label: 'Nova oportunidade', icon: HandHeart },
];

export function PainelPage() {
  const { orgId, orgName } = useSession();
  const filtro = usePeriodo('mes');
  const painel = usePainelEntidade(orgId!, filtro.periodo);

  return (
    <>
      {/* No desktop o verbo já está no topo da barra lateral. */}
      <PortalVerbo portal="entidade" subtitle={orgName} className="mb-6 lg:hidden" />
      <PageHeader title="Painel" eyebrow={orgName} />

      <nav aria-label="Atalhos" className="mb-6 flex flex-wrap gap-2">
        {ATALHOS.map(({ to, label, icon: Icon }) => (
          <ButtonLink key={to} to={to} variant="secondary">
            <Icon size={18} aria-hidden /> {label}
          </ButtonLink>
        ))}
      </nav>

      {painel.isError ? (
        <ErrorState error={painel.error} onRetry={() => painel.refetch()} />
      ) : !painel.data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" role="status" aria-label="Carregando indicadores">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-40 border border-border" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <Pendencias {...painel.data.pendencias} />

          <div className="mb-[-8px]">
            <FiltroPeriodo {...filtro} />
          </div>
          <div
            className={painel.isPlaceholderData ? 'grid gap-4 opacity-60 sm:grid-cols-2 xl:grid-cols-4' : 'grid gap-4 sm:grid-cols-2 xl:grid-cols-4'}
            aria-busy={painel.isFetching}
          >
            <KpiCard className="min-w-0" label="Voluntários ativos" value={formatNumber(painel.data.voluntariosAtivos.atual)} source="voluntários com ação nos últimos 6 meses" />
            <KpiCard className="min-w-0" label="Horas voluntárias" value={formatHours(painel.data.horas.atual)} delta={variacao(painel.data.horas)} source="banco de horas" />
            <KpiCard className="min-w-0" label="Novos cadastros" value={formatNumber(painel.data.novosCadastros.atual)} delta={variacao(painel.data.novosCadastros)} source="cadastro de voluntários" />
            <KpiCard className="min-w-0" label="Próximos eventos" value={formatNumber(painel.data.proximosEventos.atual)} source="agenda da entidade" />
            <KpiCard className="min-w-0" label="Ingressos vendidos" value={formatNumber(painel.data.ingressosVendidos.atual)} delta={variacao(painel.data.ingressosVendidos)} source="pedidos de ingressos" />
            <KpiCard className="min-w-0" label="Produtos vendidos" value={formatNumber(painel.data.produtosVendidos.atual)} delta={variacao(painel.data.produtosVendidos)} source="pedidos da loja" />
            <KpiCard className="min-w-0 sm:col-span-2" label="Valor arrecadado" value={formatBRL(painel.data.arrecadado.atual)} delta={variacao(painel.data.arrecadado)} source="ingressos, loja, campanhas, doações e patrocínios (simulados)" />
          </div>

          <section className={cardClass} aria-labelledby="horas-mes">
            <h2 id="horas-mes" className="text-lg font-bold text-ink">
              Horas por mês
            </h2>
            <p className="mb-4 text-sm text-ink-muted">Últimos 12 meses. Fonte: banco de horas.</p>
            <HorasPorMesChart dados={painel.data.horasPorMes} />
          </section>
        </div>
      )}
    </>
  );
}

function Pendencias({ aprovacoes, checkInsDeHoje, estoqueBaixo, paraReengajar }: { aprovacoes: number; checkInsDeHoje: number; estoqueBaixo: Array<{ id: string; nome: string; estoque: number }>; paraReengajar: number }) {
  const itens = [
    aprovacoes > 0 && { to: 'voluntarios', icon: UserRoundCheck, texto: aprovacoes === 1 ? '1 cadastro aguardando aprovação' : `${aprovacoes} cadastros aguardando aprovação` },
    checkInsDeHoje > 0 && { to: 'horas', icon: ScanLine, texto: checkInsDeHoje === 1 ? '1 check-in para validar hoje' : `${checkInsDeHoje} check-ins para validar hoje` },
    paraReengajar > 0 && { to: 'voluntarios#reengajar', icon: HeartPulse, texto: paraReengajar === 1 ? '1 voluntário para reengajar' : `${paraReengajar} voluntários para reengajar` },
    ...estoqueBaixo.map((p) => ({ to: 'loja', icon: Boxes, texto: `${p.nome}: ${p.estoque === 0 ? 'esgotado' : `últimas ${p.estoque} unidades`}` })),
  ].filter((x): x is { to: string; icon: typeof Boxes; texto: string } => !!x);

  if (itens.length === 0) {
    return <p className={`${cardClass} text-ink-muted`}>Nenhuma pendência. Tudo em dia por aqui.</p>;
  }
  return (
    <section className={cardClass} aria-labelledby="pendencias">
      <h2 id="pendencias" className="mb-2 text-lg font-bold text-ink">
        Pendências
      </h2>
      <ul className="divide-y divide-border">
        {itens.map(({ to, icon: Icon, texto }) => (
          <li key={texto}>
            <Link to={to} className="flex min-h-12 items-center gap-3 py-2 font-semibold text-ink hover:text-link">
              <Icon size={20} aria-hidden className="shrink-0 text-link" />
              <span className="flex-1">{texto}</span>
              <ChevronRight size={18} aria-hidden className="text-ink-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
