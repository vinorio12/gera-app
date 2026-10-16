// Fotos e banners enviados pelas pessoas: recorta, reduz e guarda como data URL leve.
// Com a API real, a imagem vai para um storage e o serviço guarda só o endereço (ver docs/INTEGRACAO.md).
import { corDoToken } from './coresPdf';

export type TipoImagem = 'foto' | 'banner';

/** Foto quadrada de 320 px (~60 KB) e banner 16:5 de 1600×500 (~250 KB). */
export const ESPECIFICACAO: Record<TipoImagem, { largura: number; altura: number; maxBytes: number; nome: string }> = {
  foto: { largura: 320, altura: 320, maxBytes: 60_000, nome: 'foto' },
  banner: { largura: 1600, altura: 500, maxBytes: 250_000, nome: 'banner' },
};

export const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp'] as const;
const TAMANHO_MAXIMO_ARQUIVO = 10 * 1024 * 1024;

export const MENSAGEM_NAO_COUBE = 'Não coube no navegador: tente uma imagem menor.';

export class ErroDeImagem extends Error {}

/** Recorte central, na proporção do destino (cobre a área toda, como `object-fit: cover`). */
export function recorteCentral(largura: number, altura: number, alvoLargura: number, alvoAltura: number) {
  const proporcaoAlvo = alvoLargura / alvoAltura;
  let sw = largura;
  let sh = largura / proporcaoAlvo;
  if (sh > altura) {
    sh = altura;
    sw = altura * proporcaoAlvo;
  }
  return { sx: (largura - sw) / 2, sy: (altura - sh) / 2, sw, sh };
}

/** Tamanho aproximado, em bytes, do conteúdo de uma data URL base64. */
export function bytesDaDataUrl(url: string): number {
  const base64 = url.slice(url.indexOf(',') + 1);
  const preenchimento = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - preenchimento;
}

/** Mensagem de erro (pt-BR) se o arquivo não serve; null se serve. */
export function validarArquivo(arquivo: { type: string; size: number }): string | null {
  if (!(TIPOS_ACEITOS as readonly string[]).includes(arquivo.type)) return 'Esse formato não serve. Use uma imagem JPG, PNG ou WebP.';
  if (arquivo.size > TAMANHO_MAXIMO_ARQUIVO) return 'Essa imagem é grande demais (máximo de 10 MB). Escolha uma menor.';
  return null;
}

/** Confere a imagem que chega ao serviço (já reduzida). Devolve a mensagem de erro ou null. */
export function validarImagemSalva(dataUrl: string, tipo: TipoImagem): string | null {
  if (!/^data:image\/(jpeg|webp|png);base64,/.test(dataUrl)) return 'Esse formato não serve. Use uma imagem JPG, PNG ou WebP.';
  // Folga de 15% sobre o alvo, porque o ajuste de qualidade não é exato.
  if (bytesDaDataUrl(dataUrl) > ESPECIFICACAO[tipo].maxBytes * 1.15) return `A ${ESPECIFICACAO[tipo].nome} ficou grande demais. Tente outra imagem.`;
  return null;
}

function carregar(arquivo: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ErroDeImagem('Não conseguimos abrir essa imagem. Tente outra, em JPG, PNG ou WebP.'));
    };
    img.src = url;
  });
}

const QUALIDADES = [0.88, 0.78, 0.68, 0.58, 0.48, 0.38];
const ESCALAS = [1, 0.85, 0.7, 0.55];

/**
 * Lê o arquivo, recorta (foto quadrada ou banner 16:5), reduz e codifica em WebP (ou JPEG, onde o navegador
 * não sabe WebP), baixando a qualidade e depois o tamanho até caber no limite do tipo.
 */
export async function prepararImagem(arquivo: File, tipo: TipoImagem): Promise<string> {
  const erro = validarArquivo(arquivo);
  if (erro) throw new ErroDeImagem(erro);
  const img = await carregar(arquivo);
  if (!img.width || !img.height) throw new ErroDeImagem('Não conseguimos abrir essa imagem. Tente outra, em JPG, PNG ou WebP.');
  const { largura, altura, maxBytes } = ESPECIFICACAO[tipo];
  const { sx, sy, sw, sh } = recorteCentral(img.width, img.height, largura, altura);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ErroDeImagem('Este navegador não consegue reduzir imagens. Tente em outro.');
  const mime = canvas.toDataURL('image/webp', 0.5).startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg';
  for (const escala of ESCALAS) {
    canvas.width = Math.round(largura * escala);
    canvas.height = Math.round(altura * escala);
    // Fundo de papel: PNG com transparência não vira preto no JPEG.
    ctx.fillStyle = corDoToken('papel');
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    for (const qualidade of QUALIDADES) {
      const url = canvas.toDataURL(mime, qualidade);
      if (bytesDaDataUrl(url) <= maxBytes) return url;
    }
  }
  throw new ErroDeImagem('Não deu para reduzir essa imagem o bastante. Tente uma mais simples ou menor.');
}
