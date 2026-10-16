import { cx } from '@gera/design-system';

interface ChipsProps<T extends string> {
  /** Nome do grupo para leitores de tela, ex.: "Filtrar por status". */
  label: string;
  opcoes: Array<{ id: T; label: string }>;
  valor: T;
  onChange: (id: T) => void;
  className?: string;
}

/** Chips de filtro (raio pill): um botão pressionado por vez. */
export function Chips<T extends string>({ label, opcoes, valor, onChange, className }: ChipsProps<T>) {
  return (
    <div role="group" aria-label={label} className={cx('flex flex-wrap gap-2', className)}>
      {opcoes.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={valor === o.id}
          onClick={() => onChange(o.id)}
          className={cx(
            'min-h-11 rounded-pill border px-4 text-sm font-semibold tabular-nums',
            valor === o.id ? 'border-primary bg-primary-soft text-on-primary-soft' : 'border-border-strong bg-bg-card text-ink-muted hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
