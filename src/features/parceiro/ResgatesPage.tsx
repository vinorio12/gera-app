import { EmptyState } from '../../components/shared/EmptyState';
import { PageHeader } from '../../components/shared/PageHeader';
import { ErrorState, SkeletonList } from '../../components/shared/States';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { useSession } from '../../lib/auth';
import { formatDateTime } from '../../lib/format';
import { useResgates } from '../../services/hooks';

export function ResgatesPage() {
  const { orgId, orgName } = useSession();
  const resgates = useResgates(orgId!);

  return (
    <>
      <PageHeader title="Resgates" eyebrow={orgName} />
      {resgates.isPending ? (
        <SkeletonList />
      ) : resgates.isError ? (
        <ErrorState error={resgates.error} onRetry={() => resgates.refetch()} />
      ) : resgates.data.length === 0 ? (
        <EmptyState
          title="Nenhum resgate ainda"
          description="Quando um voluntário usar um benefício, ele aparece aqui."
          action={<ButtonLink to="/parceiro">Validar carteirinha</ButtonLink>}
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-bg-card shadow-card">
          {resgates.data.map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="font-semibold text-ink">{r.beneficio}</p>
                <p className="text-sm text-ink-muted">{r.voluntario}</p>
              </div>
              <span className="shrink-0 text-sm tabular-nums text-ink-muted">{formatDateTime(r.em)}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
