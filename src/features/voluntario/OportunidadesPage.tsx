import { useState } from 'react';
import { cx } from '@gera/design-system';
import { EmptyState } from '../../components/shared/EmptyState';
import { PageHeader } from '../../components/shared/PageHeader';
import { ErrorState, SkeletonList } from '../../components/shared/States';
import { useSession } from '../../lib/auth';
import { useOportunidadesAbertas } from '../../services/hooks';
import { AREAS, type Area } from '../../types/domain';
import { OportunidadeItem } from './OportunidadeItem';

export function OportunidadesPage() {
  const { userId } = useSession();
  const [area, setArea] = useState<Area | undefined>();
  const lista = useOportunidadesAbertas(area);

  return (
    <>
      <PageHeader title="Oportunidades" />
      <div className="-mx-4 mb-4 overflow-x-auto px-4">
        <div role="group" aria-label="Filtrar por área" className="flex w-max gap-2">
          {[undefined, ...AREAS].map((a) => (
            <button
              key={a ?? 'todas'}
              type="button"
              aria-pressed={area === a}
              onClick={() => setArea(a)}
              className={cx(
                'min-h-11 rounded-pill border px-4 text-sm font-semibold',
                area === a ? 'border-primary bg-primary-soft text-on-primary-soft' : 'border-border-strong bg-bg-card text-ink-muted',
              )}
            >
              {a ?? 'Todas'}
            </button>
          ))}
        </div>
      </div>
      {lista.isPending ? (
        <SkeletonList rows={3} />
      ) : lista.isError ? (
        <ErrorState error={lista.error} onRetry={() => lista.refetch()} />
      ) : lista.data.length === 0 ? (
        <EmptyState title="Nenhuma oportunidade nessa área agora" description="Novas ações entram toda semana. Veja as outras áreas." />
      ) : (
        <div className="flex flex-col gap-3">
          {lista.data.map((o) => (
            <OportunidadeItem key={o.id} oportunidade={o} inscrito={o.inscritos.includes(userId!)} voluntarioId={userId!} />
          ))}
        </div>
      )}
    </>
  );
}
