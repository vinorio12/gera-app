import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { FileDown } from 'lucide-react';
import { Button, Rack, type ButtonVariant } from '@gera/design-system';
import { baixarArquivo } from '../../lib/download';
import { formatDate } from '../../lib/format';
import type { CertificadoDetalhado } from '../../services/certificados';
import { BrandLogo } from './BrandLogo';
import { PreviaImpressao } from './PreviaImpressao';

/** Endereço público de validação, que vai no QR do certificado. */
export const urlValidacaoCertificado = (codigo: string) => `${window.location.origin}/validar/certificado/${codigo}`;

const textoDoCertificado = (c: CertificadoDetalhado) =>
  [
    'CERTIFICADO DE VOLUNTARIADO',
    `Certificamos que ${c.nome} atuou como voluntário(a) na ${c.entidadeNome}, somando ${c.horas} horas de trabalho voluntário entre ${formatDate(c.inicio)} e ${formatDate(c.fim)}.`,
    `Emitido em ${formatDate(c.emitidoEm)} por ${c.emitidoPor}. Comitê Social ACIJS · Plataforma GERA.`,
    `Código de verificação: ${c.codigo}`,
    `Confira em ${urlValidacaoCertificado(c.codigo)}`,
  ].join('\n\n');

/** Baixa o PDF do certificado; se o download for bloqueado, abre a versão para imprimir. */
export function CertificadoDownload({ certificado: c, variant = 'secondary', label = 'Baixar PDF' }: { certificado: CertificadoDetalhado; variant?: ButtonVariant; label?: string }) {
  const [gerando, setGerando] = useState(false);
  const [previa, setPrevia] = useState(false);
  const baixar = async () => {
    setGerando(true);
    try {
      const { certificadoPdf } = await import('../../lib/pdf');
      const blob = await certificadoPdf({ ...c, urlValidacao: urlValidacaoCertificado(c.codigo) });
      if (!baixarArquivo(blob, `certificado-${c.codigo.toLowerCase()}.pdf`)) setPrevia(true);
    } catch {
      setPrevia(true);
    } finally {
      setGerando(false);
    }
  };
  return (
    <>
      <Button variant={variant} onClick={baixar} disabled={gerando} aria-label={`${label}: certificado de ${c.nome}, ${formatDate(c.inicio)} a ${formatDate(c.fim)}`}>
        <FileDown size={16} aria-hidden /> {gerando ? 'Gerando…' : label}
      </Button>
      {previa && (
        <PreviaImpressao titulo={`Certificado · ${c.nome}`} texto={textoDoCertificado(c)} onClose={() => setPrevia(false)}>
          <CertificadoView certificado={c} />
        </PreviaImpressao>
      )}
    </>
  );
}

/** O certificado em HTML (mesmo conteúdo do PDF), para imprimir quando o download não funciona. */
export function CertificadoView({ certificado: c }: { certificado: CertificadoDetalhado }) {
  return (
    <div className="flex flex-col gap-5 rounded-lg border-2 border-brand-deep p-6 text-center text-ink">
      <Rack />
      <BrandLogo height={44} className="self-start" />
      <h3 className="font-display text-[34px] uppercase leading-9 text-ink">Certificado de voluntariado</h3>
      <p>Certificamos que</p>
      <p className="text-2xl font-bold">{c.nome}</p>
      <p className="mx-auto max-w-prose">
        atuou como voluntário(a) na {c.entidadeNome}, somando <strong>{c.horas} horas</strong> de trabalho voluntário entre {formatDate(c.inicio)} e{' '}
        {formatDate(c.fim)}, registradas no banco de horas da plataforma GERA.
      </p>
      <div className="flex flex-wrap items-end justify-between gap-4 pt-4 text-left text-sm text-ink-muted">
        <div>
          <p>Jaraguá do Sul, {formatDate(c.emitidoEm)}</p>
          <p>Emitido por {c.emitidoPor}</p>
          <p>Comitê Social ACIJS · Plataforma GERA</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="rounded-md bg-papel p-1">
            <QRCodeSVG value={urlValidacaoCertificado(c.codigo)} size={96} title={`QR para validar o certificado ${c.codigo}`} />
          </div>
          <p className="font-bold text-ink">{c.codigo}</p>
        </div>
      </div>
    </div>
  );
}
