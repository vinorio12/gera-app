import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X } from 'lucide-react';
import { Button } from '@gera/design-system';
import { dentroDeQuadro } from '../../lib/download';
import { IconButton } from './IconButton';

interface PreviaImpressaoProps {
  titulo: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Quando o download é bloqueado, o conteúdo abre aqui em tela cheia. Fora de um quadro dá para imprimir
 * (ou salvar como PDF pela impressão); dentro de um quadro (página publicada) a impressão não funciona,
 * então o texto fica para selecionar e copiar.
 */
export function PreviaImpressao({ titulo, onClose, children }: PreviaImpressaoProps) {
  const tituloId = useId();
  const fechar = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fechar.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const quadro = dentroDeQuadro();

  return createPortal(
    <div role="dialog" aria-modal="true" aria-labelledby={tituloId} className="area-impressao fixed inset-0 z-50 overflow-y-auto bg-bg-page">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-border bg-bg-card px-4 py-2 print:hidden">
        <h2 id={tituloId} className="mr-auto min-w-0 truncate font-bold text-ink">
          {titulo}
        </h2>
        {!quadro && (
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer size={18} aria-hidden /> Imprimir
          </Button>
        )}
        <IconButton ref={fechar} icon={X} label="Fechar visualização" onClick={onClose} />
      </div>
      <p className="mx-auto max-w-3xl px-4 pt-4 text-sm text-ink-muted print:hidden">
        {quadro
          ? 'O download não está disponível aqui. Selecione o texto abaixo para copiar.'
          : 'O download não está disponível aqui. Use "Imprimir" (dá para salvar como PDF).'}
      </p>
      <div className="mx-auto max-w-3xl p-4">
        <div className="rounded-lg border border-border bg-bg-card p-6 shadow-card print:border-0 print:p-0 print:shadow-none">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
