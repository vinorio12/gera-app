import { useMemo } from 'react';
import { useTheme } from './theme';

/**
 * Lê os valores atuais dos tokens de cor (para bibliotecas como o Recharts, que escrevem a cor
 * direto no SVG). Recalcula quando o tema muda, então claro e escuro saem dos mesmos tokens.
 * Passe a lista como constante (fora do componente), para não recalcular a cada render.
 */
export function useTokenColors<const T extends readonly string[]>(tokens: T): Record<T[number], string> {
  const { theme } = useTheme();
  return useMemo(() => {
    const styles = getComputedStyle(document.documentElement);
    return Object.fromEntries(tokens.map((t) => [t, styles.getPropertyValue(`--${t}`).trim()])) as Record<T[number], string>;
  }, [theme, tokens]);
}
