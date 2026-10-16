import { Link } from 'react-router-dom';
import { Award } from 'lucide-react';
import { formatHours } from '@gera/design-system';
import { CertificadoDownload } from '../../components/shared/CertificadoDownload';
import { EmptyState } from '../../components/shared/EmptyState';
import { PageHeader } from '../../components/shared/PageHeader';
import { ErrorState, SkeletonList } from '../../components/shared/States';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { useSession } from '../../lib/auth';
import { formatDate } from '../../lib/format';
import { useMeusCertificados } from '../../services/hooks';

export function MeusCertificadosPage() {
  const { userId } = useSession();
  const lista = useMeusCertificados(userId!);
  return (
    <>
      <PageHeader title="Certificados" description="Seus certificados de horas. Cada um tem um código que qualquer pessoa confere no site da GERA." />
      {lista.isPending ? (
        <SkeletonList rows={2} />
      ) : lista.isError ? (
        <ErrorState error={lista.error} onRetry={() => lista.refetch()} />
      ) : lista.data.length === 0 ? (
        <EmptyState
          title="Nenhum certificado ainda"
          description="A entidade emite os certificados das suas horas. Enquanto isso, suas ações ficam em Minhas ações."
          action={<ButtonLink to="/app/acoes">Ver minhas ações</ButtonLink>}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {lista.data.map((c) => (
            <li key={c.id} className="flex flex-col gap-3 rounded-lg border border-border bg-bg-card p-4 shadow-card">
              <div className="flex items-start gap-3">
                <Award size={28} aria-hidden className="shrink-0 text-link" />
                <div className="min-w-0">
                  <p className="font-bold text-ink">{c.entidadeNome}</p>
                  <p className="text-sm text-ink-muted">
                    {formatHours(c.horas)} · {formatDate(c.inicio)} a {formatDate(c.fim)}
                  </p>
                  <p className="text-sm text-ink-muted">
                    Código{' '}
                    <Link to={`/validar/certificado/${c.codigo}`} className="font-mono font-semibold text-link hover:underline">
                      {c.codigo}
                    </Link>
                  </p>
                </div>
              </div>
              <CertificadoDownload certificado={c} variant="primary" />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
