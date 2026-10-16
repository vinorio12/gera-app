import { useMemo, useState } from 'react';
import { StatusBadge, formatHours, type VolunteerStatus } from '@gera/design-system';
import { Chips } from '../../components/shared/Chips';
import { EmptyState } from '../../components/shared/EmptyState';
import { Exportar } from '../../components/shared/Exportar';
import { PageHeader } from '../../components/shared/PageHeader';
import { ErrorState, SkeletonList } from '../../components/shared/States';
import { Campo } from '../../components/ui/Campo';
import { inputClass } from '../../components/ui/form';
import type { Documento } from '../../lib/documento';
import { formatDate, formatDateTime } from '../../lib/format';
import { mascararCpf, type VoluntarioAdmin } from '../../services/admin';
import { useEntidades, useGeraMutation, usePedidosExclusao, useTodosVoluntarios } from '../../services/hooks';
import { atenderPedidoExclusao } from '../../services/perfil';
import { useToast } from '../../components/shared/Toast';
import { Button } from '@gera/design-system';
import { AREAS } from '../../types/domain';

const STATUS: Array<{ id: VolunteerStatus | 'todos'; label: string }> = [
  { id: 'todos', label: 'Todos' },
  { id: 'novo', label: 'Novos' },
  { id: 'ativo', label: 'Ativos' },
  { id: 'inativo', label: 'Inativos' },
  { id: 'desligado', label: 'Desligados' },
];
const LIMITE = 60;

export function VoluntariosAdminPage() {
  const lista = useTodosVoluntarios();
  const entidades = useEntidades();
  const [status, setStatus] = useState<VolunteerStatus | 'todos'>('todos');
  const [entidadeId, setEntidadeId] = useState('');
  const [area, setArea] = useState('');
  const [busca, setBusca] = useState('');
  const [mostrar, setMostrar] = useState(LIMITE);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return (lista.data ?? []).filter(
      (r) =>
        (status === 'todos' || r.status === status) &&
        (!entidadeId || r.voluntario.entidadeIds.includes(entidadeId)) &&
        (!area || r.voluntario.areas.includes(area as (typeof AREAS)[number])) &&
        (!termo || r.voluntario.nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(termo)),
    );
  }, [lista.data, status, entidadeId, area, busca]);

  return (
    <>
      <PageHeader title="Voluntários" eyebrow="Administrador ACIJS" description="Os voluntários de todas as entidades num lugar só." />
      <PedidosLgpd />
      {lista.isPending ? (
        <SkeletonList rows={6} />
      ) : lista.isError ? (
        <ErrorState error={lista.error} onRetry={() => lista.refetch()} />
      ) : (
        <div className="flex flex-col gap-4">
          <Chips
            label="Filtrar por status"
            valor={status}
            onChange={setStatus}
            opcoes={STATUS.map((s) => ({ id: s.id, label: `${s.label} · ${s.id === 'todos' ? lista.data.length : lista.data.filter((r) => r.status === s.id).length}` }))}
          />
          <div className="flex flex-wrap items-end gap-4">
            <Campo id="busca" label="Buscar por nome" className="min-w-[220px] flex-1">
              <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} className={inputClass} />
            </Campo>
            <Campo id="entidade" label="Entidade" className="min-w-[200px]">
              <select value={entidadeId} onChange={(e) => setEntidadeId(e.target.value)} className={inputClass}>
                <option value="">Todas</option>
                {entidades.data?.map((e) => (
                  <option key={e.id} value={e.id}>{e.nome}</option>
                ))}
              </select>
            </Campo>
            <Campo id="area" label="Área de interesse" className="min-w-[180px]">
              <select value={area} onChange={(e) => setArea(e.target.value)} className={inputClass}>
                <option value="">Todas</option>
                {AREAS.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </Campo>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-muted" aria-live="polite">
              {filtrados.length} {filtrados.length === 1 ? 'voluntário' : 'voluntários'} com esses filtros.
            </p>
            <Exportar doc={documento(filtrados)} />
          </div>
          {filtrados.length === 0 ? (
            <EmptyState title="Ninguém com esses filtros" description="Troque o status, a entidade ou a busca." />
          ) : (
            <>
              <div className="relative overflow-x-auto rounded-lg border border-border bg-bg-card shadow-card">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b border-border text-ink-muted">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-semibold">Nome</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Entidade</th>
                      <th scope="col" className="px-4 py-3 text-right font-semibold">Horas</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Última ação</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Áreas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtrados.slice(0, mostrar).map((r) => (
                      <tr key={r.voluntario.id}>
                        <td className="px-4 py-3 font-semibold text-ink">{r.voluntario.nome}</td>
                        <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                        <td className="px-4 py-3 text-ink-muted">{r.entidades.join(', ')}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-ink">{formatHours(r.totalHoras)}</td>
                        <td className="px-4 py-3 tabular-nums text-ink-muted">{r.ultimaAcao ? formatDate(r.ultimaAcao) : '—'}</td>
                        <td className="px-4 py-3 text-ink-muted">{r.voluntario.areas.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {mostrar < filtrados.length && (
                <button type="button" onClick={() => setMostrar((m) => m + LIMITE)} className="gr-btn gr-btn--secondary self-start">
                  Mostrar mais ({filtrados.length - mostrar} restantes)
                </button>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}

/** Pedidos de exclusão de dados feitos pelos voluntários no perfil (LGPD). */
function PedidosLgpd() {
  const pedidos = usePedidosExclusao();
  const toast = useToast();
  const atender = useGeraMutation(atenderPedidoExclusao);
  const abertos = pedidos.data?.filter((p) => !p.atendidoEm) ?? [];
  if (!pedidos.data || pedidos.data.length === 0) return null;
  return (
    <section aria-labelledby="lgpd" className="mb-6 rounded-lg border border-border bg-bg-card p-4 shadow-card">
      <h2 id="lgpd" className="mb-1 text-lg font-bold text-ink">Pedidos de exclusão (LGPD) · {abertos.length} em aberto</h2>
      <p className="mb-3 text-sm text-ink-muted">A lei dá 15 dias para responder. Ao atender, o cadastro é excluído e o histórico de horas fica anônimo.</p>
      <ul className="divide-y divide-border">
        {pedidos.data.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
            <div className="min-w-0">
              <p className="font-semibold text-ink">{p.nome}</p>
              <p className="text-sm text-ink-muted">
                {p.email} · pedido em {formatDateTime(p.pedidoEm)}
                {p.motivo && ` · "${p.motivo}"`}
              </p>
            </div>
            {p.atendidoEm ? (
              <span className="text-sm font-semibold text-ink-muted">Atendido em {formatDate(p.atendidoEm)}</span>
            ) : (
              <Button variant="secondary" disabled={atender.isPending} onClick={() => atender.mutate(p.id, { onSuccess: () => toast.show(`Pedido de ${p.nome} marcado como atendido.`) })}>
                Marcar como atendido
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Exportação com o CPF mascarado (LGPD): só os 6 dígitos do meio. */
function documento(lista: VoluntarioAdmin[]): Documento {
  return {
    titulo: 'Voluntários',
    subtitulo: `Todas as entidades · ${lista.length} voluntários`,
    geradoEm: formatDateTime(new Date().toISOString()),
    secoes: [
      {
        titulo: 'Cadastro',
        descricao: 'CPF mascarado: a exportação não leva o número completo.',
        colunas: [{ titulo: 'Nome' }, { titulo: 'CPF' }, { titulo: 'Status' }, { titulo: 'Entidade' }, { titulo: 'Áreas' }, { titulo: 'Empresa' }, { titulo: 'Cadastro', tipo: 'data' }, { titulo: 'Horas', tipo: 'horas' }],
        linhas: lista.map((r) => [
          r.voluntario.nome,
          mascararCpf(r.voluntario.cpf),
          STATUS.find((s) => s.id === r.status)?.label.replace(/s$/, '') ?? r.status,
          r.entidades.join(', '),
          r.voluntario.areas.join(', '),
          r.voluntario.empresa ?? '',
          r.voluntario.cadastroEm,
          r.totalHoras,
        ]),
      },
    ],
  };
}
