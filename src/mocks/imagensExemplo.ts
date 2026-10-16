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
