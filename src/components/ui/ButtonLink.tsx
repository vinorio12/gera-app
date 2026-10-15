import { Link, type LinkProps } from 'react-router-dom';
import { cx, type ButtonVariant } from '@gera/design-system';

/**
 * Link de navegação com a cara do <Button> do design system. Reusa as classes gr-btn do pacote
 * (como o EventCard faz), porque o Button do pacote é sempre um <button>.
 */
export function ButtonLink({ variant = 'primary', className, ...rest }: LinkProps & { variant?: ButtonVariant }) {
  return <Link className={cx('gr-btn', `gr-btn--${variant}`, className)} {...rest} />;
}
