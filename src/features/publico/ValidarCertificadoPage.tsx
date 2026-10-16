import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BadgeCheck } from 'lucide-react';
import { Button, formatHours } from '@gera/design-system';
import { PageHeader } from '../../components/shared/PageHeader';
import { InlineError, Skeleton } from '../../components/shared/States';
import { Campo } from '../../components/ui/Campo';
import { inputClass } from '../../components/ui/form';
import { formatDate } from '../../lib/format';
import { mensagemDeErro, useValidacaoCertificado } from '../../services/hooks';

/** Validação pública do certificado (o QR do PDF leva para cá). Mostra só o que está no certificado. */
export function ValidarCertificadoPage() {
  const { codigo = '' } = useParams();
  const navigate = useNavigate();
  const [texto, setTexto] = useState('');
  const validacao = useValidacaoCertificado(decodeURIComponent(codigo));
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (texto.trim()) navigate(`/validar/certificado/${encodeURIComponent(texto.trim())}`);
  };
  const c = validacao.data;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-10">
      <PageHeader title="Validar certificado" description="Confira se um certificado de horas da GERA é verdadeiro." />
      {codigo &&
        (validacao.isPending ? (
          <Skeleton className="h-48 border border-border" />
        ) : c ? (
          <section aria-labelledby="valido" className="flex flex-col gap-3 rounded-lg border-2 border-primary bg-bg-card p-5 shadow-card">
            <h2 id="valido" className="flex items-center gap-2 text-lg font-bold text-on-primary-soft">
              <BadgeCheck size={24} aria-hidden /> Certificado válido
            </h2>
            <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
              <dt className="font-semibold text-ink-muted">Voluntário(a)</dt>
              <dd className="text-ink">{c.nome}</dd>
              <dt className="font-semibold text-ink-muted">Entidade</dt>
              <dd className="text-ink">{c.entidadeNome}</dd>
              <dt className="font-semibold text-ink-muted">Horas</dt>
              <dd className="text-ink">{formatHours(c.horas)}</dd>
              <dt className="font-semibold text-ink-muted">Período</dt>
              <dd className="text-ink">
                {formatDate(c.inicio)} a {formatDate(c.fim)}
              </dd>
              <dt className="font-semibold text-ink-muted">Emitido em</dt>
              <dd className="text-ink">{formatDate(c.emitidoEm)}</dd>
              <dt className="font-semibold text-ink-muted">Código</dt>
              <dd className="font-mono text-ink">{c.codigo}</dd>
            </dl>
          </section>
        ) : (
          <InlineError>{validacao.isError ? mensagemDeErro(validacao.error) : null}</InlineError>
        ))}
      <form onSubmit={enviar} className="flex flex-col gap-2">
        <Campo id="codigo" label={codigo ? 'Validar outro código' : 'Código do certificado'} dica="Está no rodapé do certificado, ex.: GERA-7K2M-4QXA.">
          <input value={texto} onChange={(e) => setTexto(e.target.value)} autoCapitalize="characters" spellCheck={false} className={`${inputClass} font-mono`} />
        </Campo>
        <Button type="submit" className="self-start" disabled={!texto.trim()}>
          Validar
        </Button>
      </form>
      <p className="text-sm text-ink-muted">
        Quer conferir uma carteirinha?{' '}
        <Link to="/validar" className="font-semibold text-link hover:underline">
          Validar carteirinha
        </Link>
      </p>
    </div>
  );
}
