// Contraste de cores pelo cálculo da WCAG 2.1 (funções puras). Usado para escolher o texto sobre a cor da entidade.

export const CONTRASTE_MINIMO = 4.5;

/** Cor hex de 3 ou 6 dígitos, com ou sem o #, em minúsculas e com 6 dígitos; null se não for uma cor hex válida. */
export function normalizarHex(texto: string): string | null {
  const t = texto.trim().replace(/^#/, '').toLowerCase();
  if (/^[0-9a-f]{3}$/.test(t)) return `#${t[0]}${t[0]}${t[1]}${t[1]}${t[2]}${t[2]}`;
  if (/^[0-9a-f]{6}$/.test(t)) return `#${t}`;
  return null;
}

function canais(hex: string): [number, number, number] {
  const h = normalizarHex(hex);
  if (!h) throw new Error(`Cor inválida: ${hex}`);
  return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

/** Luminância relativa (0 = preto, 1 = branco). */
export function luminancia(hex: string): number {
  const [r, g, b] = canais(hex).map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razão de contraste entre duas cores, de 1 a 21. */
export function razaoDeContraste(a: string, b: string): number {
  const la = luminancia(a);
  const lb = luminancia(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export interface TextoSobreCor {
  /** Qual texto usar sobre a cor; null quando nenhum dos dois chega a 4,5:1 (use a cor só em detalhes). */
  texto: 'tinta' | 'papel' | null;
  /** Razão do melhor dos dois. */
  razao: number;
}

/** Escolhe tinta ou papel, o que tiver mais contraste, desde que passe de 4,5:1. */
export function textoSobreCor(fundo: string, cores: { tinta: string; papel: string }): TextoSobreCor {
  const comTinta = razaoDeContraste(fundo, cores.tinta);
  const comPapel = razaoDeContraste(fundo, cores.papel);
  const [texto, razao] = comTinta >= comPapel ? (['tinta', comTinta] as const) : (['papel', comPapel] as const);
  return { texto: razao >= CONTRASTE_MINIMO ? texto : null, razao };
}
