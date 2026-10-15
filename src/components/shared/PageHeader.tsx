import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  /** Sobretítulo em Bebas Neue, ex.: o nome da entidade. */
  eyebrow?: string;
  description?: ReactNode;
  actions?: ReactNode;
}

/** Título de página em Bebas Neue (44/44). Bebas é só caixa alta, então o texto vai em maiúsculas. */
export function PageHeader({ title, eyebrow, description, actions }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="font-display text-base uppercase leading-5 tracking-[0.08em] text-ink-muted">{eyebrow}</p>
        )}
        {/* break-words: enquanto a Bebas carrega, a fonte reserva é mais larga e "OPORTUNIDADES" estoura 360px. */}
        <h1 className="break-words font-display text-[44px] uppercase leading-[44px] text-ink">{title}</h1>
        {description && <p className="mt-2 max-w-prose text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
