import { useState } from 'react';
import { Eye, FileDown, FileSpreadsheet } from 'lucide-react';
import { Button } from '@gera/design-system';
import { documentoParaCsv, documentoParaTexto, type Documento } from '../../lib/documento';
import { baixarArquivo, nomeDeArquivo } from '../../lib/download';
import { DocumentoView } from './DocumentoView';
import { InlineError } from './States';
import { PreviaImpressao } from './PreviaImpressao';

/** Botões de exportação (PDF e planilha) com a visualização para imprimir quando o download falha. */
export function Exportar({ doc, csv = true }: { doc: Documento; csv?: boolean }) {
  const [previa, setPrevia] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const nome = nomeDeArquivo(`${doc.titulo} ${doc.subtitulo}`);

  const pdf = async () => {
    setErro(null);
    setGerando(true);
    try {
      const { documentoPdf } = await import('../../lib/pdf');
      const blob = await documentoPdf(doc);
      if (!baixarArquivo(blob, `${nome}.pdf`)) setPrevia(true);
    } catch {
      setErro('Não deu para gerar o PDF aqui. Abrimos a versão para imprimir.');
      setPrevia(true);
    } finally {
      setGerando(false);
    }
  };
  const planilha = () => {
    if (!baixarArquivo(documentoParaCsv(doc), `${nome}.csv`, 'text/csv;charset=utf-8')) setPrevia(true);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button onClick={pdf} disabled={gerando}>
          <FileDown size={18} aria-hidden /> {gerando ? 'Gerando PDF…' : 'Baixar PDF'}
        </Button>
        {csv && (
          <Button variant="secondary" onClick={planilha}>
            <FileSpreadsheet size={18} aria-hidden /> Baixar planilha (CSV)
          </Button>
        )}
        <Button variant="ghost" onClick={() => setPrevia(true)}>
          <Eye size={18} aria-hidden /> Ver para imprimir
        </Button>
      </div>
      <InlineError>{erro}</InlineError>
      {previa && (
        <PreviaImpressao titulo={doc.titulo} texto={documentoParaTexto(doc)} onClose={() => setPrevia(false)}>
          <DocumentoView doc={doc} />
        </PreviaImpressao>
      )}
    </div>
  );
}
