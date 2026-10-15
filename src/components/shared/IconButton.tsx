import { forwardRef, type ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cx } from '@gera/design-system';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  /** Obrigatório: é o nome acessível do botão. */
  label: string;
}

/** Botão só de ícone, com alvo de toque de 44px. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon: Icon, label, className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-ink-muted hover:bg-bg-subtle hover:text-ink',
        className,
      )}
      {...rest}
    >
      <Icon size={20} aria-hidden />
    </button>
  );
});
