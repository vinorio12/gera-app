import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, Printer, X } from 'lucide-react';
import { Button } from '@gera/design-system';
import { IconButton } from './IconButton';

interface PreviaImpressaoProps {
  titulo: string;
  /** Texto simples para o botão "Copiar". */
  texto: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Quando o download é bloqueado (iframe da prévia, navegador), o conteúdo abre aqui em tela cheia,
 * para imprimir (ou salvar como PDF pela impressão) ou copiar.
 */
export function PreviaImpressao({ titulo, texto, onClose, children }: PreviaImpressaoProps) {
  const tituloId = useId();
  const fechar = useRef<HTMLButtonElement>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    fechar.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      area.current?.focus();
      area.current?.select();
    }
  };

  return createPortal(
    <div role="dialog" aria-modal="true" aria-labelledby={tituloId} className="area-impressao fixed inset-0 z-50 overflow-y-auto bg-bg-page">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-border bg-bg-card px-4 py-2 print:hidden">
        <h2 id={tituloId} className="mr-auto min-w-0 truncate font-bold text-ink">
          {titulo}
        </h2>
        <Button variant="secondary" onClick={() => window.print()}>
          <Printer size={18} aria-hidden /> Imprimir
        </Button>
        <Button variant="secondary" onClick={copiar}>
          {copiado ? <Check size={18} aria-hidden /> : <Copy size={18} aria-hidden />} {copiado ? 'Copiado' : 'Copiar texto'}
        </Button>
        <IconButton ref={fechar} icon={X} label="Fechar visualização" onClick={onClose} />
      </div>
      <p className="mx-auto max-w-3xl px-4 pt-4 text-sm text-ink-muted print:hidden">
        O download não está disponível aqui. Use "Imprimir" (dá para salvar como PDF) ou copie o texto.
      </p>
      <div className="mx-auto max-w-3xl p-4">
        <div className="rounded-lg border border-border bg-bg-card p-6 shadow-card print:border-0 print:p-0 print:shadow-none">{children}</div>
      </div>
      <textarea ref={area} readOnly value={texto} aria-label="Texto para copiar" className="sr-only" tabIndex={-1} />
    </div>,
    document.body,
  );
}
