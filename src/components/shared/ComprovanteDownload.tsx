import { useState } from 'react';
import { FileDown } from 'lucide-react';
import { Button } from '@gera/design-system';
import { documentoDoPedido, type ContextoPedido } from '../../lib/comprovante';
import { salvarArquivo } from '../../lib/salvarArquivo';
import type { Pedido } from '../../types/domain';
import { DocumentoView } from './DocumentoView';
import { PreviaImpressao } from './PreviaImpressao';
import { InlineError } from './States';

/** Recibo de doação ou comprovante de compra em PDF; se o download for bloqueado, abre para imprimir. */
export function ComprovanteDownload({ pedido, contexto, className }: { pedido: Pedido; contexto: ContextoPedido; className?: string }) {
  const [gerando, setGerando] = useState(false);
  const [previa, setPrevia] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const doc = documentoDoPedido(pedido, contexto);
  const rotulo = pedido.tipo === 'doacao' ? 'Baixar recibo (PDF)' : 'Baixar comprovante (PDF)';
  const baixar = async () => {
    setErro(null);
    setGerando(true);
    try {
      const { documentoPdf } = await import('../../lib/pdf');
      const blob = await documentoPdf(doc);
      const r = await salvarArquivo(blob, `${pedido.tipo === 'doacao' ? 'recibo' : 'comprovante'}-${pedido.id}.pdf`, 'application/pdf');
      if (r.estado === 'previa') setPrevia(true);
      else if (r.estado === 'tentar-de-novo') setErro(r.mensagem);
    } catch {
      setPrevia(true);
    } finally {
      setGerando(false);
    }
  };
  return (
    <>
      <Button variant="secondary" onClick={baixar} disabled={gerando} className={className} aria-label={`${rotulo}: ${pedido.descricao}`}>
        <FileDown size={16} aria-hidden /> {gerando ? 'Gerando…' : rotulo}
      </Button>
      <InlineError>{erro}</InlineError>
      {previa && (
        <PreviaImpressao titulo={doc.titulo} onClose={() => setPrevia(false)}>
          <DocumentoView doc={doc} />
        </PreviaImpressao>
      )}
    </>
  );
}
