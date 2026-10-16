import { Check } from 'lucide-react';
import { cx } from '@gera/design-system';

/** Indicador de progresso de um fluxo em etapas (cadastro, criação de evento). */
export function Stepper({ passos, atual }: { passos: string[]; atual: number }) {
  return (
    <ol className="mb-6 flex gap-2" aria-label={`Passo ${atual + 1} de ${passos.length}`}>
      {passos.map((p, i) => {
        const feito = i < atual;
        const ativo = i === atual;
        return (
          <li key={p} className="flex min-w-0 flex-1 flex-col gap-2" aria-current={ativo ? 'step' : undefined}>
            <span className={cx('h-1.5 rounded-pill', feito || ativo ? 'bg-primary' : 'bg-border')} aria-hidden />
            <span className={cx('flex items-center gap-1 truncate text-xs font-semibold', ativo ? 'text-ink' : 'text-ink-muted')}>
              {feito && <Check size={14} aria-hidden className="shrink-0 text-link" />}
              <span className="truncate">
                <span className="sr-only">{feito ? 'Concluído: ' : ativo ? 'Atual: ' : ''}</span>
                {p}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
