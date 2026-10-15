import { cx } from './cx';

/** Cremalheira: fileira de dentes de engrenagem usada como divisória. */
export function Rack({ className }: { className?: string }) {
  return <div className={cx('gr-rack', className)} role="separator" />;
}
