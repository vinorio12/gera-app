import { KpiCard, formatHours } from '@gera/design-system';
import { EmptyState } from '../../components/shared/EmptyState';
import { HoursTimeline } from '../../components/shared/HoursTimeline';
import { PageHeader } from '../../components/shared/PageHeader';
import { ErrorState, SkeletonList } from '../../components/shared/States';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { useSession } from '../../lib/auth';
import { useMeuPainel } from '../../services/hooks';

export function AcoesPage() {
  const { userId } = useSession();
  const painel = useMeuPainel(userId!);

  return (
    <>
      <PageHeader title="Minhas ações" />
      {painel.isPending ? (
        <SkeletonList />
      ) : painel.isError ? (
        <ErrorState error={painel.error} onRetry={() => painel.refetch()} />
      ) : painel.data.registros.length === 0 ? (
        <EmptyState
          title="Nenhuma ação ainda"
          description={
            painel.data.sugestoes[0]
              ? `Que tal ${painel.data.sugestoes[0].titulo}? Cada ação validada vira horas no seu banco.`
              : 'Cada ação validada vira horas no seu banco.'
          }
          action={<ButtonLink to="/app/oportunidades">Ver oportunidades</ButtonLink>}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3">
            <KpiCard className="min-w-0 p-4" label="No mês" value={formatHours(painel.data.horasNoMes)} source="banco de horas" />
            <KpiCard className="min-w-0 p-4" label="No ano" value={formatHours(painel.data.horasNoAno)} source="banco de horas" />
          </div>
          <p className="text-sm text-ink-muted">
            Ao todo, <strong className="text-ink">{formatHours(painel.data.carteirinha.totalHoras)}</strong> geradas desde o seu cadastro.
          </p>
          <HoursTimeline
            registros={painel.data.registros}
            nomeDaEntidade={(id) => painel.data.entidades.find((e) => e.id === id)?.nome ?? ''}
          />
        </div>
      )}
    </>
  );
}
