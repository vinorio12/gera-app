import { useState } from 'react';
import { FileDown } from 'lucide-react';
import { Button } from '@gera/design-system';
import { documentoDoPedido, type ContextoPedido } from '../../lib/comprovante';
import { documentoParaTexto } from '../../lib/documento';
import { baixarArquivo } from '../../lib/download';
import type { Pedido } from '../../types/domain';
import { DocumentoView } from './DocumentoView';
import { PreviaImpressao } from './PreviaImpressao';

/** Recibo de doação ou comprovante de compra em PDF; se o download for bloqueado, abre para imprimir. */
export function ComprovanteDownload({ pedido, contexto, className }: { pedido: Pedido; contexto: ContextoPedido; className?: string }) {
  const [gerando, setGerando] = useState(false);
  const [previa, setPrevia] = useState(false);
  const doc = documentoDoPedido(pedido, contexto);
  const rotulo = pedido.tipo === 'doacao' ? 'Baixar recibo (PDF)' : 'Baixar comprovante (PDF)';
  const baixar = async () => {
    setGerando(true);
    try {
      const { documentoPdf } = await import('../../lib/pdf');
      const blob = await documentoPdf(doc);
      if (!baixarArquivo(blob, `${pedido.tipo === 'doacao' ? 'recibo' : 'comprovante'}-${pedido.id}.pdf`)) setPrevia(true);
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
      {previa && (
        <PreviaImpressao titulo={doc.titulo} texto={documentoParaTexto(doc)} onClose={() => setPrevia(false)}>
          <DocumentoView doc={doc} />
        </PreviaImpressao>
      )}
    </>
  );
}
