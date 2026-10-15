import type { ReactNode } from 'react';
import { GeraSymbol, cx } from '@gera/design-system';

interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  /** A ação que resolve o vazio, ex.: um <ButtonLink>. */
  action?: ReactNode;
  className?: string;
}

/** Estado vazio: a engrenagem parada em traço neutro, uma frase e a ação para resolver. */
export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cx(
        'flex flex-col items-center gap-3 rounded-lg border border-border bg-bg-card px-6 py-12 text-center shadow-card',
        className,
      )}
    >
      <span className="text-border-strong">
        <GeraSymbol size={56} variant="mono" title="" aria-hidden />
      </span>
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      {description && <div className="max-w-prose text-sm text-ink-muted">{description}</div>}
      {action && <div className="mt-2 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
