import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CampaignProgress, cx, formatBRL, formatNumber } from '@gera/design-system';
import { Chips } from '../../components/shared/Chips';
import { EmptyState } from '../../components/shared/EmptyState';
import { FiltroPeriodo, usePeriodo } from '../../components/shared/FiltroPeriodo';
import { PageHeader } from '../../components/shared/PageHeader';
import { ErrorState, SkeletonList } from '../../components/shared/States';
import { Campo } from '../../components/ui/Campo';
import { inputClass } from '../../components/ui/form';
import { isoDay } from '../../lib/carteirinha';
import { formatDate, formatDateShort, formatMoeda } from '../../lib/format';
import { useCampanhasAdmin, useEntidades, useEventosAdmin } from '../../services/hooks';
import { PainelFinanceiro } from '../entidade/FinanceiroPage';

const EYEBROW = 'Administrador ACIJS';

function FiltroEntidade({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  const entidades = useEntidades();
  return (
    <Campo id="entidade" label="Entidade" className="min-w-[220px]">
      <select value={valor} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        <option value="">Todas as entidades</option>
        {entidades.data?.map((e) => (
          <option key={e.id} value={e.id}>{e.nome}</option>
        ))}
      </select>
    </Campo>
  );
}

export function EventosAdminPage() {
  const [entidadeId, setEntidadeId] = useState('');
  const [aba, setAba] = useState<'proximos' | 'realizados'>('proximos');
  const filtro = usePeriodo('ano');
  const eventos = useEventosAdmin(entidadeId || undefined);
  const hoje = isoDay(new Date());
  const proximos = eventos.data?.filter((e) => e.data >= hoje) ?? [];
  const realizados = (eventos.data?.filter((e) => e.data < hoje && e.data >= filtro.periodo.inicio && e.data <= filtro.periodo.fim) ?? []).reverse();
  const visiveis = aba === 'proximos' ? proximos : realizados;
  const vendidos = visiveis.reduce((s, e) => s + e.vendidos, 0);
  const receita = visiveis.reduce((s, e) => s + e.receita, 0);

  return (
    <>
      <PageHeader title="Eventos" eyebrow={EYEBROW} description="Eventos de todas as entidades, com ingressos vendidos e check-ins." />
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <FiltroEntidade valor={entidadeId} onChange={setEntidadeId} />
          <Chips
            label="Quando"
            valor={aba}
            onChange={setAba}
            opcoes={[
              { id: 'proximos', label: `Próximos · ${proximos.length}` },
              { id: 'realizados', label: `Realizados · ${realizados.length}` },
            ]}
          />
        </div>
        {aba === 'realizados' && <FiltroPeriodo {...filtro} />}
      </div>
      {eventos.isPending ? (
        <SkeletonList rows={5} />
      ) : eventos.isError ? (
        <ErrorState error={eventos.error} onRetry={() => eventos.refetch()} />
      ) : visiveis.length === 0 ? (
        <EmptyState title={aba === 'proximos' ? 'Nenhum evento marcado' : 'Nenhum evento realizado no período'} />
      ) : (
        <div className={cx('flex flex-col gap-3', eventos.isPlaceholderData && 'opacity-60')}>
          <p className="text-sm text-ink-muted">
            {formatNumber(visiveis.length)} eventos · {formatNumber(vendidos)} ingressos vendidos · {formatBRL(receita)} em ingressos
          </p>
          <div className="relative overflow-x-auto rounded-lg border border-border bg-bg-card shadow-card" tabIndex={0} role="region" aria-label="Tabela de eventos">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border text-ink-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Evento</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Entidade</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Data</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Vendidos</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Check-ins</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Ingressos (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visiveis.map((e) => (
                  <tr key={e.id}>
                    <td className="px-4 py-3 font-semibold text-ink">{e.titulo}</td>
                    <td className="px-4 py-3 text-ink-muted">{e.entidadeNome}</td>
                    <td className="px-4 py-3 tabular-nums text-ink">{formatDateShort(e.data)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink">
                      {formatNumber(e.vendidos)}/{formatNumber(e.total)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink">{formatNumber(e.checkIns)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink">{formatMoeda(e.receita)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

export function CampanhasAdminPage() {
  const [entidadeId, setEntidadeId] = useState('');
  const [aba, setAba] = useState<'ativas' | 'encerradas'>('ativas');
  const filtro = usePeriodo('trimestre');
  const campanhas = useCampanhasAdmin(filtro.periodo, entidadeId || undefined);
  const ativas = campanhas.data?.filter((c) => !c.encerrada) ?? [];
  const encerradas = campanhas.data?.filter((c) => c.encerrada) ?? [];
  const visiveis = aba === 'ativas' ? ativas : encerradas;
  const noPeriodo = (campanhas.data ?? []).reduce((s, c) => s + c.noPeriodo, 0);
  const navigate = useNavigate();

  return (
    <>
      <PageHeader title="Campanhas" eyebrow={EYEBROW} description="Campanhas de captação de todas as entidades, com meta, arrecadado e prazo." />
      <div className="mb-6 flex flex-wrap items-start gap-4">
        <FiltroEntidade valor={entidadeId} onChange={setEntidadeId} />
        <FiltroPeriodo {...filtro} />
      </div>
      {campanhas.isPending ? (
        <SkeletonList rows={3} />
      ) : campanhas.isError ? (
        <ErrorState error={campanhas.error} onRetry={() => campanhas.refetch()} />
      ) : (
        <div className={cx('flex flex-col gap-4', campanhas.isPlaceholderData && 'opacity-60')}>
          <p className="text-sm text-ink-muted">
            {formatBRL(noPeriodo)} arrecadados no período, somando todas as campanhas{entidadeId ? ' da entidade' : ''}.
          </p>
          <Chips
            label="Situação"
            valor={aba}
            onChange={setAba}
            opcoes={[
              { id: 'ativas', label: `No ar · ${ativas.length}` },
              { id: 'encerradas', label: `Encerradas · ${encerradas.length}` },
            ]}
          />
          {visiveis.length === 0 ? (
            <EmptyState title={aba === 'ativas' ? 'Nenhuma campanha no ar' : 'Nenhuma campanha encerrada'} />
          ) : (
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visiveis.map((c) => (
                <li key={c.id} className="flex flex-col gap-2">
                  <CampaignProgress
                    className="max-w-none flex-1"
                    title={c.titulo}
                    organization={c.entidadeNome}
                    raised={c.arrecadado}
                    goal={c.meta}
                    daysLeft={c.encerrada ? undefined : Math.max(0, Math.ceil((new Date(`${c.terminaEm}T23:59:59`).getTime() - Date.now()) / 86_400_000))}
                    ctaLabel="Ver no site"
                    onSupport={() => navigate(`/campanhas/${c.slug}`)}
                  />
                  <p className="text-sm text-ink-muted">
                    {formatNumber(c.apoiadores)} apoiadores · {formatMoeda(c.noPeriodo)} no período · prazo {formatDate(c.terminaEm)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}

export function FinanceiroAdminPage() {
  const [entidadeId, setEntidadeId] = useState('');
  const entidades = useEntidades();
  const nome = entidades.data?.find((e) => e.id === entidadeId)?.nome;
  return (
    <>
      <PageHeader title="Vendas e financeiro" eyebrow={EYEBROW} description="Ingressos, loja, campanhas, doações e patrocínios de todas as entidades, com as despesas e o saldo." />
      <div className="mb-6">
        <FiltroEntidade valor={entidadeId} onChange={setEntidadeId} />
      </div>
      <PainelFinanceiro key={entidadeId || 'todas'} entidadeId={entidadeId || undefined} titulo={nome ?? 'Todas as entidades'} mostrarVendas />
    </>
  );
}
