import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ValidationResult } from '@gera/design-system';
import { CodeReader } from '../../components/shared/CodeReader';
import { PageHeader } from '../../components/shared/PageHeader';
import { InlineError, Skeleton } from '../../components/shared/States';
import { formatDate } from '../../lib/format';
import { mensagemDeErro, useGeraMutation } from '../../services/hooks';
import { validarCarteirinha } from '../../services/parceiros';

/**
 * Validação pública da carteirinha (o QR leva para cá). Mostra só o que o parceiro vê:
 * nome, entidade, status, horas e validade (LGPD).
 */
export function ValidarPage() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const validar = useGeraMutation(validarCarteirinha);
  const { mutate, reset } = validar;

  useEffect(() => {
    reset();
    if (token) mutate(decodeURIComponent(token));
  }, [token, mutate, reset]);

  const r = validar.data;
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-10">
      <PageHeader title="Validar carteirinha" description="Confira se uma carteirinha GERA está ativa." />
      {validar.isPending ? (
        <Skeleton className="h-64 border border-border" />
      ) : r ? (
        <ValidationResult
          className="w-full"
          eligible={r.elegivel}
          name={r.nome}
          organization={r.entidade}
          status={r.status}
          hours={r.horas}
          validUntil={r.validaAte ? formatDate(r.validaAte) : undefined}
          reason={r.motivo}
        />
      ) : (
        <InlineError>{validar.isError ? mensagemDeErro(validar.error) : null}</InlineError>
      )}
      <CodeReader onCode={(c) => navigate(`/validar/${encodeURIComponent(c)}`)} busy={validar.isPending} submitLabel="Validar" />
      <p className="text-sm text-ink-muted">
        Tem um certificado de horas?{' '}
        <Link to="/validar/certificado" className="font-semibold text-link hover:underline">
          Validar certificado
        </Link>
      </p>
    </div>
  );
}
