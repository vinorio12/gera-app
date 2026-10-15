import { IdCard } from 'lucide-react';
import { KpiCard, PortalVerbo, StatusBadge, formatHours } from '@gera/design-system';
import { ErrorState, SkeletonList } from '../../components/shared/States';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { useSession } from '../../lib/auth';
import { formatDateShort } from '../../lib/format';
import { useMeuPainel } from '../../services/hooks';
import { OportunidadeItem } from './OportunidadeItem';

export function VoluntarioHome() {
  const { userId, userName } = useSession();
  const painel = useMeuPainel(userId!);
  const firstName = userName.split(' ')[0];

  return (
    <div className="flex flex-col gap-4">
      <PortalVerbo portal="voluntario" subtitle={`Olá, ${firstName}!`} />
      {painel.isPending ? (
        <SkeletonList rows={3} />
      ) : painel.isError ? (
        <ErrorState error={painel.error} onRetry={() => painel.refetch()} />
      ) : (
        <>
          <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-bg-card p-4 shadow-card">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-ink-muted">Seu status</span>
              <StatusBadge status={painel.data.carteirinha.status} />
            </div>
            <ButtonLink to="/app/carteirinha" variant={painel.data.carteirinha.liberada ? 'primary' : 'secondary'}>
              <IdCard size={18} aria-hidden /> {painel.data.carteirinha.liberada ? 'Abrir carteirinha' : 'Ver o que falta'}
            </ButtonLink>
          </section>

          <div className="grid grid-cols-2 gap-3">
            <KpiCard className="min-w-0 p-4" label="Horas no mês" value={formatHours(painel.data.horasNoMes)} source="banco de horas" />
            <KpiCard className="min-w-0 p-4" label="Horas no ano" value={formatHours(painel.data.horasNoAno)} source="banco de horas" />
          </div>

          <section className="flex flex-col gap-3" aria-labelledby="proxima">
            <h2 id="proxima" className="text-lg font-bold text-ink">
              Sua próxima ação
            </h2>
            {painel.data.proximas[0] ? (
              <OportunidadeItem oportunidade={painel.data.proximas[0]} inscrito voluntarioId={userId!} />
            ) : (
              <p className="rounded-lg border border-border bg-bg-card p-4 text-ink-muted">
                Nenhuma ação marcada.{' '}
                {painel.data.sugestoes[0] && (
                  <>
                    Que tal {painel.data.sugestoes[0].titulo} de {formatDateShort(painel.data.sugestoes[0].data)}?
                  </>
                )}
              </p>
            )}
          </section>

          {painel.data.sugestoes.length > 0 && (
            <section className="flex flex-col gap-3" aria-labelledby="sugestoes">
              <h2 id="sugestoes" className="text-lg font-bold text-ink">
                Combina com você
              </h2>
              {painel.data.sugestoes.map((o) => (
                <OportunidadeItem key={o.id} oportunidade={o} inscrito={false} voluntarioId={userId!} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
