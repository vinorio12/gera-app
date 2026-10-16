// Imagens de exemplo (logo e banner) geradas no código: SVG simples com as cores dos tokens, convertido em data URL.
// Nenhuma foto de pessoa real. As cores vêm do tokens.json; não há hex escrito aqui.
import { corDoToken } from '../lib/coresPdf';

const comoDataUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/** Logo quadrado de 320 px com as iniciais sobre um fundo de token. */
export function logoExemplo(iniciais: string, fundo: string, texto: string, detalhe: string): string {
  return comoDataUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320">` +
      `<rect width="320" height="320" fill="${corDoToken(fundo)}"/>` +
      `<circle cx="270" cy="50" r="70" fill="${corDoToken(detalhe)}" opacity="0.45"/>` +
      `<circle cx="40" cy="300" r="48" fill="${corDoToken(detalhe)}" opacity="0.3"/>` +
      `<text x="160" y="200" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="110" font-weight="700" fill="${corDoToken(texto)}">${iniciais}</text>` +
      `</svg>`,
  );
}

/** Banner 16:5 (1600×500) com formas simples nas cores de dois tokens. */
export function bannerExemplo(fundo: string, forma1: string, forma2: string): string {
  return comoDataUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 500" width="1600" height="500">` +
      `<rect width="1600" height="500" fill="${corDoToken(fundo)}"/>` +
      `<circle cx="1380" cy="80" r="260" fill="${corDoToken(forma1)}" opacity="0.5"/>` +
      `<circle cx="1180" cy="430" r="120" fill="${corDoToken(forma2)}" opacity="0.6"/>` +
      `<circle cx="180" cy="520" r="200" fill="${corDoToken(forma1)}" opacity="0.35"/>` +
      `<rect x="0" y="470" width="1600" height="30" fill="${corDoToken(forma2)}"/>` +
      `</svg>`,
  );
}

/** Iniciais de um nome de entidade ou empresa: a primeira letra das duas primeiras palavras com mais de 2 letras. */
export const iniciaisExemplo = (nome: string) =>
  nome
    .split(/\s+/)
    .filter((p) => p.length > 2)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');

/** Combinações de tokens para variar os exemplos: [fundo do banner, forma 1, forma 2, fundo do logo, texto do logo, detalhe do logo]. */
export const PALETAS_EXEMPLO: ReadonlyArray<readonly [string, string, string, string, string, string]> = [
  ['brand-deep', 'primary', 'highlight', 'brand-deep', 'papel', 'primary'],
  ['primary', 'brand-deep', 'secondary', 'portal-conectar', 'tinta', 'brand-deep'],
  ['brand-deep', 'secondary', 'primary', 'highlight', 'tinta', 'brand-deep'],
  ['primary', 'highlight', 'brand-deep', 'primary', 'papel', 'secondary'],
  ['portal-conectar', 'brand-deep', 'primary', 'brand-deep', 'papel', 'highlight'],
  ['highlight', 'brand-deep', 'primary', 'primary', 'papel', 'highlight'],
];

/** Foto de perfil de exemplo: silhueta simples (cabeça e ombros) sobre um token. Não é foto de pessoa real. */
export function avatarExemplo(fundo: string, silhueta: string): string {
  return comoDataUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320">` +
      `<rect width="320" height="320" fill="${corDoToken(fundo)}"/>` +
      `<circle cx="160" cy="125" r="62" fill="${corDoToken(silhueta)}"/>` +
      `<path d="M40 320c0-72 50-112 120-112s120 40 120 112z" fill="${corDoToken(silhueta)}"/>` +
      `</svg>`,
  );
}
