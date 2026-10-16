import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Award, Bell, CalendarClock, Gift, IdCard, Ticket, UserRoundCheck, type LucideIcon } from 'lucide-react';
import { cx } from '@gera/design-system';
import { EmptyState } from '../../components/shared/EmptyState';
import { PageHeader } from '../../components/shared/PageHeader';
import { ErrorState, SkeletonList } from '../../components/shared/States';
import { useSession } from '../../lib/auth';
import { formatDateTime } from '../../lib/format';
import type { Notificacao } from '../../lib/notificacoes';
import { useGeraMutation, useNotificacoes } from '../../services/hooks';
import { marcarNotificacoesVistas } from '../../services/notificacoes';

const ICONE: Record<Notificacao['tipo'], LucideIcon> = {
  cadastro: UserRoundCheck,
  acao: CalendarClock,
  ingresso: Ticket,
  beneficio: Gift,
  carteirinha: IdCard,
  espera: Award,
};

/** Sino do cabeçalho: contador das notificações novas. */
export function SinoNotificacoes() {
  const { userId } = useSession();
  const n = useNotificacoes(userId!);
  const novas = n.data?.novas ?? 0;
  return (
    <Link
      to="/app/notificacoes"
      aria-label={novas ? `Notificações: ${novas} ${novas === 1 ? 'nova' : 'novas'}` : 'Notificações'}
      title="Notificações"
      className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-ink-muted hover:bg-bg-subtle hover:text-ink"
    >
      <Bell size={20} aria-hidden />
      {novas > 0 && (
        <span aria-hidden className="absolute right-0.5 top-0.5 inline-flex min-w-5 items-center justify-center rounded-pill border border-accent bg-accent-soft px-1 text-[11px] font-bold leading-4 text-on-accent-soft">
          {novas > 9 ? '9+' : novas}
        </span>
      )}
    </Link>
  );
}

export function NotificacoesPage() {
  const { userId } = useSession();
  const n = useNotificacoes(userId!);
  const marcar = useGeraMutation(() => marcarNotificacoesVistas(userId!));
  // Guarda o "vistas em" de quando a página abriu, para destacar o que era novo.
  const novasAoAbrir = useRef<number | null>(null);
  if (novasAoAbrir.current === null && n.data) novasAoAbrir.current = n.data.novas;
  const { mutate } = marcar;
  useEffect(() => {
    if (n.data && n.data.novas > 0) mutate();
  }, [n.data, mutate]);

  return (
    <>
      <PageHeader title="Notificações" />
      {n.isPending ? (
        <SkeletonList rows={4} />
      ) : n.isError ? (
        <ErrorState error={n.error} onRetry={() => n.refetch()} />
      ) : n.data.lista.length === 0 ? (
        <EmptyState title="Nenhuma notificação" description="Aqui chegam a aprovação do cadastro, os lembretes das ações, os ingressos e os benefícios novos." />
      ) : (
        <ul className="flex flex-col gap-2">
          {n.data.lista.map((item, i) => {
            const Icone = ICONE[item.tipo];
            const nova = i < (novasAoAbrir.current ?? 0);
            return (
              <li key={item.id}>
                <Link
                  to={item.link}
                  className={cx(
                    'flex items-start gap-3 rounded-lg border bg-bg-card p-4 shadow-card hover:bg-bg-subtle',
                    nova ? 'border-primary' : 'border-border',
                  )}
                >
                  <Icone size={22} aria-hidden className="mt-0.5 shrink-0 text-link" />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-ink">{item.titulo}</span>
                      {nova && <span className="rounded-sm bg-primary-soft px-1.5 py-0.5 text-xs font-bold text-on-primary-soft">Nova</span>}
                    </span>
                    <span className="block text-sm text-ink">{item.texto}</span>
                    <span className="block text-xs text-ink-muted">{formatDateTime(item.em)}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
