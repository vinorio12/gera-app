import type { SVGProps } from 'react';
import { GEAR_PATH, HEART_PATH, WORDMARK_PATH, TAGLINE_PATH, LOCKUP_VIEWBOX, SYMBOL_TRANSFORM } from './logoPaths';

type Variant = 'default' | 'negative' | 'mono';

const PALETTE: Record<Variant, { gear: string; heart: string; ink: string }> = {
  default: { gear: '#008434', heart: '#C8282B', ink: '#0C582C' },
  negative: { gear: '#95B32F', heart: '#FF6B5E', ink: '#FFFFFF' },
  mono: { gear: 'currentColor', heart: 'currentColor', ink: 'currentColor' },
};

export interface GeraSymbolProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  /** Lado do símbolo em px. Mínimo recomendado: 20. */
  size?: number;
  variant?: Variant;
  /** Gira a engrenagem (estado de carregamento). Respeita prefers-reduced-motion via .gr-spin. */
  spinning?: boolean;
  title?: string;
}

/** Engrenagem com coração. O furo é vazado, então funciona sobre qualquer fundo. */
export function GeraSymbol({ size = 32, variant = 'default', spinning = false, title = 'GERA', ...rest }: GeraSymbolProps) {
  const c = PALETTE[variant];
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label={title} {...rest}>
      <title>{title}</title>
      <g className={spinning ? 'gr-spin' : undefined} style={spinning ? { transformOrigin: '32px 32px' } : undefined}>
        <path d={GEAR_PATH} fill={c.gear} fillRule="evenodd" />
      </g>
      <path d={HEART_PATH} fill={c.heart} />
    </svg>
  );
}

export interface GeraLogoProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  /** Altura em px; a largura acompanha a proporção. */
  height?: number;
  variant?: Variant;
  /** Mostra CONECTAR · IMPULSIONAR · AMPLIAR · ENGAJAR. */
  tagline?: boolean;
}

/** Logo completo: símbolo + GERA (+ tagline dos quatro verbos). */
export function GeraLogo({ height = 48, variant = 'default', tagline = true, ...rest }: GeraLogoProps) {
  const c = PALETTE[variant];
  const viewBox = tagline ? LOCKUP_VIEWBOX : '0 0 228 76';
  const [, , w = 1, h = 1] = viewBox.split(' ').map(Number);
  return (
    <svg viewBox={viewBox} height={height} width={(height * w) / h} role="img" aria-label="GERA" {...rest}>
      <title>GERA</title>
      <g transform={SYMBOL_TRANSFORM}>
        <path d={GEAR_PATH} fill={c.gear} fillRule="evenodd" />
        <path d={HEART_PATH} fill={c.heart} />
      </g>
      <path d={WORDMARK_PATH} fill={c.ink} />
      {tagline && <path d={TAGLINE_PATH} fill={c.ink} fillOpacity={0.75} />}
    </svg>
  );
}
