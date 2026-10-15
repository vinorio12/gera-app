import type { Config } from 'tailwindcss';
import geraPreset from '@gera/design-system/tailwind-preset';

export default {
  presets: [geraPreset],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    // Tira a paleta padrão do Tailwind (red-500, gray-200...): só existem as cores dos tokens,
    // que o preset acrescenta via extend.
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      inherit: 'inherit',
    },
    extend: {
      borderColor: { DEFAULT: 'var(--border)' },
      ringColor: { DEFAULT: 'var(--focus-ring)' },
    },
  },
} satisfies Config;
