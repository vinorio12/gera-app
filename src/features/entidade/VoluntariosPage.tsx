import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button, StatusBadge, cx, formatHours, type VolunteerStatus } from '@gera/design-system';
import { EmptyState } from '../../components/shared/EmptyState';
import { PageHeader } from '../../components/shared/PageHeader';
import { ErrorState, SkeletonList } from '../../components/shared/States';
import { useToast } from '../../components/shared/Toast';
import { useSession } from '../../lib/auth';
import { formatDate } from '../../lib/format';
import { useGeraMutation, useParaReengajar, useVoluntariosDaEntidade } from '../../services/hooks';
import { MessageCircle } from 'lucide-react';
import { linkWhatsApp } from '../../lib/agenda';
import { aprovarVoluntario } from '../../services/voluntarios';

const FILTROS: Array<{ id: VolunteerStatus | 'todos'; label: string }> = [
  { id: 'todos', label: 'Todos' },
  { id: 'novo', label: 'Novos' },
  { id: 'ativo', label: 'Ativos' },
  { id: 'inativo', label: 'Inativos' },
  { id: 'desligado', label: 'Desligados' },
];

export function VoluntariosPage() {
  const { orgId, orgName } = useSession();
  const lista = useVoluntariosDaEntidade(orgId!);
  const [filtro, setFiltro] = useState<VolunteerStatus | 'todos'>('todos');
  const toast = useToast();
  const aprovar = useGeraMutation((id: string) => aprovarVoluntario(id, orgId!));

  return (
    <>
      <PageHeader title="Voluntários" eyebrow={orgName} />
      {lista.isPending ? (
        <SkeletonList rows={6} />
      ) : lista.isError ? (
        <ErrorState error={lista.error} onRetry={() => lista.refetch()} />
      ) : (
        <div className="flex flex-col gap-6">
          {(() => {
            const pendentes = lista.data.filter((r) => !r.voluntario.aprovadoEm && !r.voluntario.desligamento);
            if (pendentes.length === 0) return null;
            return (
              <section aria-labelledby="pendentes" className="rounded-lg border border-border bg-bg-card p-4 shadow-card">
                <h2 id="pendentes" className="mb-3 text-lg font-bold text-ink">
                  Aguardando aprovação ({pendentes.length})
                </h2>
                <ul className="flex flex-col divide-y divide-border">
                  {pendentes.map(({ voluntario: v }) => (
                    <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <Link to={v.id} className="font-semibold text-link hover:underline">
                          {v.nome}
                        </Link>
                        <p className="text-sm text-ink-muted">
                          Cadastro em {formatDate(v.cadastroEm)} · {v.areas.join(', ')}
                        </p>
                      </div>
                      <Button
                        disabled={aprovar.isPending}
                        onClick={() =>
                          aprovar.mutate(v.id, {
                            onSuccess: () => toast.show(`${v.nome} aprovado(a). No primeiro check-in, a carteirinha é liberada.`),
                          })
                        }
                      >
                        Aprovar cadastro
                      </Button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })()}

          <ParaReengajarSecao />

          <section aria-labelledby="todos" className="flex flex-col gap-3">
            <h2 id="todos" className="sr-only">
              Todos os voluntários
            </h2>
            <div role="group" aria-label="Filtrar por status" className="flex flex-wrap gap-2">
              {FILTROS.map((f) => {
                const total = f.id === 'todos' ? lista.data.length : lista.data.filter((r) => r.status === f.id).length;
                return (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={filtro === f.id}
                    onClick={() => setFiltro(f.id)}
                    className={cx(
                      'min-h-11 rounded-pill border px-4 text-sm font-semibold tabular-nums',
                      filtro === f.id ? 'border-primary bg-primary-soft text-on-primary-soft' : 'border-border-strong bg-bg-card text-ink-muted',
                    )}
                  >
                    {f.label} · {total}
                  </button>
                );
              })}
            </div>
            {(() => {
              const visiveis = lista.data.filter((r) => filtro === 'todos' || r.status === filtro);
              if (visiveis.length === 0) return <EmptyState title="Ninguém com esse status agora" />;
              return (
                <div className="relative overflow-x-auto rounded-lg border border-border bg-bg-card shadow-card" tabIndex={0} role="region" aria-label="Tabela de voluntários">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="border-b border-border text-ink-muted">
                      <tr>
                        <th scope="col" className="px-4 py-3 font-semibold">Nome</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                        <th scope="col" className="px-4 py-3 text-right font-semibold">Horas</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Última ação</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Áreas de interesse</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {visiveis.map((r) => (
                        <tr key={r.voluntario.id}>
                          <td className="px-4 py-3">
                            <Link to={r.voluntario.id} className="font-semibold text-link hover:underline">
                              {r.voluntario.nome}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={r.status} />
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-ink">{formatHours(r.totalHoras)}</td>
                          <td className="px-4 py-3 tabular-nums text-ink-muted">{r.ultimaAcao ? formatDate(r.ultimaAcao) : '—'}</td>
                          <td className="px-4 py-3 text-ink-muted">{r.voluntario.areas.join(', ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </section>
        </div>
      )}
    </>
  );
}

/** Ativos sem ação há 5 meses ou mais: uma mensagem agora evita que fiquem inativos. */
function ParaReengajarSecao() {
  const { orgId } = useSession();
  const lista = useParaReengajar(orgId!);
  const { hash } = useLocation();
  // Vindo da pendência do Painel (#reengajar), rola até a lista quando ela carrega.
  useEffect(() => {
    if (hash === '#reengajar' && lista.data?.length) document.getElementById('reengajar')?.scrollIntoView();
  }, [hash, lista.data]);
  if (!lista.data || lista.data.length === 0) return null;
  return (
    <section id="reengajar" aria-labelledby="reengajar-titulo" className="scroll-mt-24 rounded-lg border border-border bg-bg-card p-4 shadow-card">
      <h2 id="reengajar-titulo" className="mb-1 text-lg font-bold text-ink">
        Para reengajar ({lista.data.length})
      </h2>
      <p className="mb-3 text-sm text-ink-muted">Ainda ativos, mas sem ação há 5 meses ou mais. Com 6 meses, a carteirinha fica inativa.</p>
      <ul className="flex flex-col divide-y divide-border">
        {lista.data.map((r) => (
          <li key={r.voluntario.id} className="flex flex-col gap-2 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <Link to={r.voluntario.id} className="font-semibold text-link hover:underline">
                  {r.voluntario.nome}
                </Link>
                <p className="text-sm text-ink-muted">
                  Última ação em {formatDate(r.ultimaAcao)}, há {r.dias} dias · {r.voluntario.telefone}
                </p>
              </div>
              <a href={linkWhatsApp(r.mensagem, r.voluntario.telefone)} target="_blank" rel="noreferrer" className="gr-btn gr-btn--secondary" aria-label={`Mandar mensagem no WhatsApp para ${r.voluntario.nome} (abre em outra aba)`}>
                <MessageCircle size={18} aria-hidden /> WhatsApp
              </a>
            </div>
            <p className="rounded-md bg-bg-subtle px-3 py-2 text-sm text-ink">{r.mensagem}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
