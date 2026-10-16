// Cores do PDF lidas dos tokens do design system (tema claro: o papel é branco), nunca escritas à mão.
import tokens from '@gera/design-system/tokens.json';

type Valor = string | { light: string; dark: string };
const lista = (tokens as { color: { tokens: Array<{ name: string; value: Valor }> } }).color.tokens;
const porNome = new Map(lista.map((t) => [t.name, t.value]));

/** Valor claro de um token, resolvendo referências como "{verde-900}". */
export function corDoToken(nome: string): string {
  const v = porNome.get(nome);
  if (!v) throw new Error(`Token de cor desconhecido: ${nome}`);
  const claro = typeof v === 'string' ? v : v.light;
  const ref = claro.match(/^\{(.+)\}$/);
  return ref ? corDoToken(ref[1]!) : claro;
}

export const CORES_PDF = {
  get marca() { return corDoToken('brand-deep'); },
  get primaria() { return corDoToken('primary'); },
  get texto() { return corDoToken('ink'); },
  get textoSuave() { return corDoToken('ink-muted'); },
  get borda() { return corDoToken('border'); },
  get fundoSuave() { return corDoToken('bg-subtle'); },
  get papel() { return corDoToken('bg-card'); },
  get destaque() { return corDoToken('highlight'); },
  get sobreMarca() { return corDoToken('on-brand-deep'); },
};
