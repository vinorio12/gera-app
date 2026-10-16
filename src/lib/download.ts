// Download de arquivos gerados no navegador. Dentro de um quadro (iframe da prévia publicada) o
// download costuma ser bloqueado: aí quem chama mostra o conteúdo para imprimir ou copiar.

export function dentroDeQuadro(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

/** Tenta baixar; devolve false quando não dá (quadro ou navegador bloqueando). */
export function baixarArquivo(conteudo: Blob | string, nome: string, tipo = 'text/plain;charset=utf-8'): boolean {
  if (dentroDeQuadro()) return false;
  try {
    const blob = typeof conteudo === 'string' ? new Blob([conteudo], { type: tipo }) : conteudo;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nome;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
    return true;
  } catch {
    return false;
  }
}

/** "Prestação de contas · AMA Jaraguá" → "prestacao-de-contas-ama-jaragua". */
export const nomeDeArquivo = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
