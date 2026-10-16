import { useMemo, useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { Button, KpiCard, cx, formatBRL, formatNumber } from '@gera/design-system';
import { Chips } from '../../components/shared/Chips';
import { Dialog } from '../../components/shared/Dialog';
import { EmptyState } from '../../components/shared/EmptyState';
import { Exportar } from '../../components/shared/Exportar';
import { FiltroPeriodo, usePeriodo } from '../../components/shared/FiltroPeriodo';
import { FluxoMensalChart } from '../../components/shared/FluxoMensalChart';
import { PageHeader } from '../../components/shared/PageHeader';
import { RankingBars } from '../../components/shared/RankingBars';
import { ErrorState, InlineError, Skeleton } from '../../components/shared/States';
import { useToast } from '../../components/shared/Toast';
import { cardClass } from '../../components/ui/card';
import { Campo } from '../../components/ui/Campo';
import { inputClass } from '../../components/ui/form';
import { useSession } from '../../lib/auth';
import { isoDay } from '../../lib/carteirinha';
import type { Documento } from '../../lib/documento';
import { formatDate, formatDateTime, formatMoeda } from '../../lib/format';
import { lancarDespesa, type Lancamento } from '../../services/financeiro';
import { mensagemDeErro, useFinanceiro, useGeraMutation } from '../../services/hooks';
import type { Periodo } from '../../services/indicadores';
import { CATEGORIAS_DESPESA, type CategoriaDespesa } from '../../types/domain';

export function FinanceiroPage() {
  const { orgId, orgName } = useSession();
  const [lancando, setLancando] = useState(false);
  return (
    <>
      <PageHeader
        title="Financeiro"
        eyebrow={orgName}
        description="As entradas chegam sozinhas (ingressos, loja, campanhas, doações e patrocínios). As despesas você lança aqui."
        actions={
          <Button onClick={() => setLancando(true)}>
            <Plus size={18} aria-hidden /> Lançar despesa
          </Button>
        }
      />
      <PainelFinanceiro entidadeId={orgId} titulo={orgName ?? ''} />
      {lancando && <DespesaDialog onClose={() => setLancando(false)} />}
    </>
  );
}

type FiltroTipo = 'todos' | 'entrada' | 'despesa';

/** Resumo, gráfico e extrato do período. Sem entidade, consolida todas (visão do comitê). */
export function PainelFinanceiro({ entidadeId, titulo, mostrarVendas = false }: { entidadeId?: string; titulo: string; mostrarVendas?: boolean }) {
  const filtro = usePeriodo('trimestre');
  const fin = useFinanceiro(filtro.periodo, entidadeId);
  const [tipo, setTipo] = useState<FiltroTipo>('todos');
  const [grupo, setGrupo] = useState('');
  const [mostrar, setMostrar] = useState(40);
  const extrato = useMemo(
    () => fin.data?.extrato.filter((l) => (tipo === 'todos' || l.tipo === tipo) && (!grupo || l.grupo === grupo)) ?? [],
    [fin.data, tipo, grupo],
  );
  const grupos = useMemo(() => [...new Set(fin.data?.extrato.filter((l) => tipo === 'todos' || l.tipo === tipo).map((l) => l.grupo) ?? [])].sort(), [fin.data, tipo]);

  return (
    <div className="flex flex-col gap-6">
      <FiltroPeriodo {...filtro} />
      {fin.isError ? (
        <ErrorState error={fin.error} onRetry={() => fin.refetch()} />
      ) : !fin.data ? (
        <Skeleton className="h-96 border border-border" />
      ) : (
        <div className={cx('flex flex-col gap-6', fin.isPlaceholderData && 'opacity-60')} aria-busy={fin.isFetching}>
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard className="min-w-0" label="Entradas" value={formatBRL(fin.data.entradas)} source="pagamentos aprovados (simulados) e patrocínios" />
            <KpiCard className="min-w-0" label="Despesas" value={formatBRL(fin.data.despesas)} source="despesas lançadas pela entidade" />
            <KpiCard
              className="min-w-0"
              label="Saldo do período"
              value={formatBRL(fin.data.saldo)}
              delta={{ text: fin.data.saldo >= 0 ? 'entrou mais do que saiu' : 'saiu mais do que entrou', direction: fin.data.saldo >= 0 ? 'up' : 'down' }}
              source="entradas menos despesas"
            />
          </div>
          {mostrarVendas && (
            <div className="grid gap-4 sm:grid-cols-3">
              <KpiCard className="min-w-0" label="Vendas (pedidos)" value={formatNumber(fin.data.vendas.pedidos)} source="pedidos de ingressos e da loja" />
              <KpiCard className="min-w-0" label="Ingressos vendidos" value={formatNumber(fin.data.vendas.ingressos)} source="pedidos de ingressos" />
              <KpiCard className="min-w-0" label="Produtos vendidos" value={formatNumber(fin.data.vendas.produtos)} source="pedidos da loja" />
            </div>
          )}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <section className={cardClass} aria-labelledby="fluxo">
              <h2 id="fluxo" className="mb-1 text-lg font-bold text-ink">Entradas e despesas por mês</h2>
              <p className="mb-3 text-sm text-ink-muted">No período escolhido.</p>
              <FluxoMensalChart dados={fin.data.porMes} />
            </section>
            <section className={cardClass} aria-labelledby="por-fonte">
              <h2 id="por-fonte" className="mb-4 text-lg font-bold text-ink">Entradas por fonte</h2>
              <RankingBars itens={fin.data.porFonte.map((f) => ({ rotulo: f.fonte, valor: f.valor }))} formatar={formatBRL} />
              {fin.data.porCategoria.length > 0 && (
                <>
                  <h2 className="mb-4 mt-6 text-lg font-bold text-ink">Despesas por categoria</h2>
                  <RankingBars itens={fin.data.porCategoria.map((c) => ({ rotulo: c.categoria, valor: c.valor }))} formatar={formatBRL} />
                </>
              )}
            </section>
          </div>

          {!entidadeId && fin.data.porEntidade.length > 1 && (
            <section className={cardClass} aria-labelledby="por-entidade">
              <h2 id="por-entidade" className="mb-3 text-lg font-bold text-ink">Por entidade</h2>
              <div className="relative overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="text-ink-muted">
                    <tr>
                      <th scope="col" className="py-2 font-semibold">Entidade</th>
                      <th scope="col" className="py-2 text-right font-semibold">Entradas</th>
                      <th scope="col" className="py-2 text-right font-semibold">Despesas</th>
                      <th scope="col" className="py-2 text-right font-semibold">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {fin.data.porEntidade.map((e) => (
                      <tr key={e.entidadeId}>
                        <td className="py-2 text-ink">{e.entidade}</td>
                        <td className="py-2 text-right tabular-nums text-ink">{formatMoeda(e.entradas)}</td>
                        <td className="py-2 text-right tabular-nums text-ink">{formatMoeda(e.despesas)}</td>
                        <td className="py-2 text-right font-semibold tabular-nums text-ink">{formatMoeda(e.saldo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <section aria-labelledby="extrato" className="flex flex-col gap-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 id="extrato" className="text-2xl font-bold text-ink">Extrato</h2>
              <Exportar doc={documentoDoExtrato(extrato, titulo, filtro.periodo, !entidadeId)} />
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <Chips
                label="Tipo de lançamento"
                valor={tipo}
                onChange={(t) => {
                  setTipo(t);
                  setGrupo('');
                }}
                opcoes={[
                  { id: 'todos', label: 'Tudo' },
                  { id: 'entrada', label: 'Entradas' },
                  { id: 'despesa', label: 'Despesas' },
                ]}
              />
              <Campo id="grupo" label={tipo === 'despesa' ? 'Categoria' : tipo === 'entrada' ? 'Fonte' : 'Fonte ou categoria'} className="min-w-[200px]">
                <select value={grupo} onChange={(e) => setGrupo(e.target.value)} className={inputClass}>
                  <option value="">Todas</option>
                  {grupos.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </Campo>
            </div>
            {extrato.length === 0 ? (
              <EmptyState title="Nenhum lançamento com esse filtro" description="Troque o período ou o tipo de lançamento." />
            ) : (
              <>
                <ul className="divide-y divide-border rounded-lg border border-border bg-bg-card shadow-card">
                  {extrato.slice(0, mostrar).map((l) => (
                    <li key={`${l.tipo}-${l.id}`} className="flex items-start justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="break-words font-semibold text-ink">{l.descricao}</p>
                        <p className="text-sm text-ink-muted">
                          {formatDate(l.data)} · {l.grupo}
                          {!entidadeId && ` · ${l.entidadeNome}`}
                        </p>
                      </div>
                      <span className={cx('shrink-0 font-bold tabular-nums', l.tipo === 'entrada' ? 'text-ink' : 'text-on-accent-soft')}>
                        {l.tipo === 'entrada' ? '+' : '-'}
                        {formatMoeda(l.valor)}
                        <span className="sr-only">{l.tipo === 'entrada' ? ' de entrada' : ' de despesa'}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-ink-muted">
                  Mostrando {Math.min(mostrar, extrato.length)} de {extrato.length} lançamentos.
                </p>
                {mostrar < extrato.length && (
                  <Button variant="secondary" className="self-start" onClick={() => setMostrar((m) => m + 60)}>
                    Mostrar mais
                  </Button>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function documentoDoExtrato(extrato: Lancamento[], titulo: string, p: Periodo, comEntidade: boolean): Documento {
  const entradas = extrato.filter((l) => l.tipo === 'entrada').reduce((s, l) => s + l.valor, 0);
  const despesas = extrato.filter((l) => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0);
  return {
    titulo: 'Extrato financeiro',
    subtitulo: `${titulo} · ${formatDate(p.inicio)} a ${formatDate(p.fim)}`,
    geradoEm: formatDateTime(new Date().toISOString()),
    destaques: [
      { rotulo: 'Entradas', valor: formatMoeda(entradas) },
      { rotulo: 'Despesas', valor: formatMoeda(despesas) },
      { rotulo: 'Saldo', valor: formatMoeda(entradas - despesas) },
    ],
    secoes: [
      {
        titulo: 'Lançamentos',
        colunas: [{ titulo: 'Data', tipo: 'data' }, ...(comEntidade ? [{ titulo: 'Entidade' }] : []), { titulo: 'Tipo' }, { titulo: 'Fonte ou categoria' }, { titulo: 'Descrição' }, { titulo: 'Valor', tipo: 'moeda' }],
        linhas: extrato.map((l) => [l.data, ...(comEntidade ? [l.entidadeNome] : []), l.tipo === 'entrada' ? 'Entrada' : 'Despesa', l.grupo, l.descricao, l.tipo === 'entrada' ? l.valor : -l.valor]),
        vazio: 'Nenhum lançamento.',
      },
    ],
  };
}

function DespesaDialog({ onClose }: { onClose: () => void }) {
  const { orgId } = useSession();
  const toast = useToast();
  const lancar = useGeraMutation(lancarDespesa);
  const [d, setD] = useState({ categoria: CATEGORIAS_DESPESA[0] as CategoriaDespesa, descricao: '', valor: '', data: isoDay(new Date()) });
  const set = (k: keyof typeof d) => (e: { target: { value: string } }) => setD((x) => ({ ...x, [k]: e.target.value }));
  const enviar = (e?: FormEvent) => {
    e?.preventDefault();
    lancar.mutate(
      { entidadeId: orgId!, categoria: d.categoria, descricao: d.descricao, valor: Number(d.valor.replace(/\./g, '').replace(',', '.')), data: d.data },
      {
        onSuccess: (r) => {
          toast.show(`Despesa de ${formatMoeda(r.valor)} lançada. Ela fica no histórico de auditoria.`);
          onClose();
        },
      },
    );
  };
  return (
    <Dialog
      open
      onClose={onClose}
      title="Lançar despesa"
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => enviar()} disabled={lancar.isPending}>
            {lancar.isPending ? 'Lançando…' : 'Lançar despesa'}
          </Button>
        </>
      }
    >
      <form onSubmit={enviar} className="grid gap-3 text-ink sm:grid-cols-2">
        <Campo id="categoria" label="Categoria">
          <select value={d.categoria} onChange={set('categoria')} className={inputClass}>
            {CATEGORIAS_DESPESA.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Campo>
        <Campo id="data" label="Data">
          <input type="date" value={d.data} max={isoDay(new Date())} onChange={set('data')} className={inputClass} />
        </Campo>
        <Campo id="descricao" label="Descrição" className="sm:col-span-2">
          <input value={d.descricao} onChange={set('descricao')} placeholder="Material de oficina" className={inputClass} />
        </Campo>
        <Campo id="valor" label="Valor (R$)">
          <input inputMode="decimal" value={d.valor} onChange={set('valor')} placeholder="150,00" className={inputClass} />
        </Campo>
        <div className="sm:col-span-2">
          <InlineError>{lancar.isError ? mensagemDeErro(lancar.error) : null}</InlineError>
        </div>
        <button type="submit" hidden />
      </form>
    </Dialog>
  );
}
