import type { ComponentProps } from 'react';
import { GeraLogo } from '@gera/design-system';
import { useTheme } from '../../lib/theme';

/** GeraLogo que troca para o negativo no tema escuro (o padrão tem o "GERA" em verde-escuro). */
export function BrandLogo(props: Omit<ComponentProps<typeof GeraLogo>, 'variant'>) {
  const { theme } = useTheme();
  return <GeraLogo variant={theme === 'dark' ? 'negative' : 'default'} {...props} />;
}
