import { useState } from 'react';
import { CalendarPlus, MessageCircle } from 'lucide-react';
import { Button, cx } from '@gera/design-system';
import { gerarIcs, linkWhatsApp, type EventoAgenda } from '../../lib/agenda';
import { baixarArquivo, nomeDeArquivo } from '../../lib/download';
import { useToast } from './Toast';
import { PreviaImpressao } from './PreviaImpressao';

/** Endereço público de uma página do site, para compartilhar. */
export const urlPublica = (caminho: string) => `${window.location.origin}${caminho}`;

interface AgendaCompartilharProps {
  agenda: EventoAgenda;
  textoWhatsApp: string;
  className?: string;
  /** Botões menores, para listas. */
  compacto?: boolean;
}

/** "Adicionar à agenda" (.ics) e "Compartilhar no WhatsApp" (wa.me com o texto pronto). */
export function AgendaCompartilhar({ agenda, textoWhatsApp, className, compacto }: AgendaCompartilharProps) {
  const toast = useToast();
  const [previa, setPrevia] = useState<string | null>(null);
  const adicionar = () => {
    const ics = gerarIcs(agenda);
    if (baixarArquivo(ics, `${nomeDeArquivo(agenda.titulo)}.ics`, 'text/calendar;charset=utf-8')) {
      toast.show('Arquivo da agenda baixado. Abra para salvar no seu calendário.');
    } else setPrevia(ics);
  };
  const tamanho = compacto ? 'min-h-10 px-3 py-2 text-sm' : '';
  return (
    <div className={cx('flex flex-wrap gap-2', className)}>
      <Button variant="secondary" onClick={adicionar} className={tamanho} aria-label={`Adicionar à agenda: ${agenda.titulo}`}>
        <CalendarPlus size={18} aria-hidden /> Adicionar à agenda
      </Button>
      <a
        href={linkWhatsApp(textoWhatsApp)}
        target="_blank"
        rel="noreferrer"
        className={cx('gr-btn gr-btn--secondary', tamanho)}
        aria-label={`Compartilhar no WhatsApp (abre em outra aba): ${agenda.titulo}`}
      >
        <MessageCircle size={18} aria-hidden /> Compartilhar no WhatsApp
      </a>
      {previa && (
        <PreviaImpressao titulo="Evento para a agenda (.ics)" texto={previa} onClose={() => setPrevia(null)}>
          <p className="mb-3 text-sm text-ink-muted">Copie o texto, salve num arquivo terminado em .ics e abra no seu calendário.</p>
          <pre className="whitespace-pre-wrap break-all font-mono text-xs text-ink">{previa}</pre>
        </PreviaImpressao>
      )}
    </div>
  );
}
