import { useId, useState } from 'react';
import { KpiCard, formatBRL, formatHours, formatNumber } from '@gera/design-system';
import { FiltroPeriodo, usePeriodo } from '../../components/shared/FiltroPeriodo';
import { HorasPorMesChart } from '../../components/shared/HorasPorMesChart';
import { PageHeader } from '../../components/shared/PageHeader';
import { RankingBars } from '../../components/shared/RankingBars';
import { ErrorState, Skeleton } from '../../components/shared/States';
import { inputClass, labelClass } from '../../components/ui/form';
import { formatDateShort, formatMoeda } from '../../lib/format';
import { variacao } from '../../lib/variacao';
import { useEntidades, usePainelAdmin } from '../../services/hooks';

const cardClass = 'rounded-lg border border-border bg-bg-card p-5 shadow-card';

export function VisaoGeralPage() {
  const filtro = usePeriodo('mes');
  const [entidadeId, setEntidadeId] = useState('');
  const entidades = useEntidades();
  const painel = usePainelAdmin(filtro.periodo, entidadeId || undefined);
  const selectId = useId();
  const nomeFiltrado = entidades.data?.find((e) => e.id === entidadeId)?.nome;

  return (
    <>
      <PageHeader title="Visão geral" eyebrow="Administrador ACIJS" />

      {/* Filtros numa linha só, acima de tudo que eles mudam. */}
      <div className="mb-6 flex flex-wrap items-start gap-4">
        <FiltroPeriodo {...filtro} />
        <div className="flex min-w-[220px] flex-col gap-1">
          <label htmlFor={selectId} className={labelClass}>
            Entidade
          </label>
          <select id={selectId} value={entidadeId} onChange={(e) => setEntidadeId(e.target.value)} className={inputClass}>
            <option value="">Todas as entidades</option>
            {entidades.data?.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {painel.isError ? (
        <ErrorState error={painel.error} onRetry={() => painel.refetch()} />
      ) : !painel.data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Carregando indicadores">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-40 border border-border" />
          ))}
        </div>
      ) : (
        <div className={painel.isPlaceholderData ? 'flex flex-col gap-6 opacity-60 transition-opacity' : 'flex flex-col gap-6'} aria-busy={painel.isFetching}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <KpiCard className="min-w-0" label="Entidades ativas" value={formatNumber(painel.data.entidadesAtivas.atual)} source="cadastro de entidades do comitê" />
            <KpiCard
              className="min-w-0"
              label="Voluntários"
              value={formatNumber(painel.data.voluntarios.atual)}
              delta={painel.data.novosVoluntarios.atual > 0 ? { text: `${formatNumber(painel.data.novosVoluntarios.atual)} novos no período`, direction: 'up' } : undefined}
              source="cadastro de voluntários (sem desligados)"
            />
            <KpiCard
              className="min-w-0"
              label="Eventos realizados"
              value={formatNumber(painel.data.eventosRealizados.atual)}
              delta={variacao(painel.data.eventosRealizados)}
              source="agenda de eventos das entidades"
            />
            <KpiCard
              className="min-w-0"
              label="Valor arrecadado"
              value={formatBRL(painel.data.arrecadado.atual)}
              delta={variacao(painel.data.arrecadado)}
              source="pagamentos de ingressos, loja, campanhas e doações (simulados)"
            />
            <KpiCard
              className="min-w-0"
              label="Vendas realizadas"
              value={formatNumber(painel.data.vendas.atual)}
              delta={variacao(painel.data.vendas)}
              source="pedidos de ingressos e da loja"
            />
            <KpiCard
              className="min-w-0"
              label="Horas de voluntariado"
              value={formatHours(painel.data.horas.atual)}
              delta={variacao(painel.data.horas)}
              source="banco de horas (check-ins e registros manuais)"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <section className={cardClass} aria-labelledby="horas-mes">
              <h2 id="horas-mes" className="text-lg font-bold text-ink">
                Horas por mês{nomeFiltrado ? ` · ${nomeFiltrado}` : ''}
              </h2>
              <p className="mb-4 text-sm text-ink-muted">Últimos 12 meses. Fonte: banco de horas.</p>
              <HorasPorMesChart dados={painel.data.horasPorMes} />
            </section>
            <section className={cardClass} aria-labelledby="fontes">
              <h2 id="fontes" className="text-lg font-bold text-ink">
                Arrecadação por fonte
              </h2>
              <p className="mb-4 text-sm text-ink-muted">No período. Fonte: pagamentos (simulados).</p>
              <RankingBars itens={painel.data.arrecadacaoPorFonte.map((f) => ({ rotulo: f.fonte, valor: f.valor }))} formatar={formatBRL} />
            </section>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <section className={cardClass} aria-labelledby="rank-horas">
              <h2 id="rank-horas" className="mb-4 text-lg font-bold text-ink">
                Entidades por horas no período
              </h2>
              <RankingBars itens={painel.data.rankingHoras.map((r) => ({ rotulo: r.entidade, valor: r.valor }))} formatar={formatHours} destaque={nomeFiltrado} />
            </section>
            <section className={cardClass} aria-labelledby="rank-valor">
              <h2 id="rank-valor" className="mb-4 text-lg font-bold text-ink">
                Entidades por arrecadação no período
              </h2>
              <RankingBars itens={painel.data.rankingArrecadacao.map((r) => ({ rotulo: r.entidade, valor: r.valor }))} formatar={formatBRL} destaque={nomeFiltrado} />
            </section>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <section className={cardClass} aria-labelledby="prox-eventos">
              <h2 id="prox-eventos" className="mb-3 text-lg font-bold text-ink">
                Próximos eventos
              </h2>
              <ul className="divide-y divide-border">
                {painel.data.proximosEventos.map((e) => (
                  <li key={e.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{e.titulo}</p>
                      <p className="text-sm text-ink-muted">{e.entidadeNome} · {e.local}</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">{formatDateShort(e.data)}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className={cardClass} aria-labelledby="produtos">
              <h2 id="produtos" className="mb-3 text-lg font-bold text-ink">
                Produtos disponíveis
              </h2>
              <ul className="divide-y divide-border">
                {painel.data.produtos.map((p) => (
                  <li key={p.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{p.nome}</p>
                      <p className="text-sm text-ink-muted">{p.entidadeNome} · {formatMoeda(p.preco)}</p>
                    </div>
                    <span
                      className={
                        p.estoque <= 3
                          ? 'shrink-0 rounded-sm bg-accent-soft px-2 py-1 text-xs font-bold text-on-accent-soft'
                          : 'shrink-0 text-sm tabular-nums text-ink-muted'
                      }
                    >
                      {p.estoque <= 3 ? `Últimas ${p.estoque}` : `${formatNumber(p.estoque)} em estoque`}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      )}
    </>
  );
}
