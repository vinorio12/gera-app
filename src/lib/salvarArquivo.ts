// Salvar arquivo gerado no navegador. Ordem: (a) a capacidade "downloads" do claude.ai (página publicada,
// dentro de um quadro), (b) o <a download> fora de quadro, (c) a visualização, quando nada disso deu.
import { baixarArquivo } from './download';

/** Extensões que o claude.ai aceita salvar (o .ics não entra). */
const EXTENSOES_ACEITAS = ['pdf', 'csv', 'json', 'txt', 'md', 'html', 'png', 'jpg', 'svg', 'xlsx', 'zip'];

interface Downloads {
  save(arquivo: { filename: string; data: Blob | string }): Promise<{ status: 'saved' | 'delivered' }>;
}

export type ResultadoSalvar =
  | { estado: 'salvo' }
  /** A pessoa recusou o salvamento: não mostre nada. */
  | { estado: 'recusado' }
  | { estado: 'tentar-de-novo'; mensagem: string }
  /** Nenhum jeito de baixar funcionou: mostre a visualização. */
  | { estado: 'previa' };

const extensaoDe = (nome: string) => nome.split('.').pop()?.toLowerCase() ?? '';

async function capacidadeDownloads(): Promise<Downloads | null> {
  try {
    if (typeof window === 'undefined' || typeof window.claude?.use !== 'function') return null;
    const d = await window.claude.use('downloads');
    return d && typeof (d as Downloads).save === 'function' ? (d as Downloads) : null;
  } catch {
    return null;
  }
}

export async function salvarArquivo(conteudo: Blob | string, nome: string, tipo = 'text/plain;charset=utf-8'): Promise<ResultadoSalvar> {
  if (EXTENSOES_ACEITAS.includes(extensaoDe(nome))) {
    const downloads = await capacidadeDownloads();
    if (downloads) {
      try {
        await downloads.save({ filename: nome, data: conteudo });
        return { estado: 'salvo' };
      } catch (erro) {
        const code = (erro as { code?: string } | null)?.code;
        if (code === 'declined') return { estado: 'recusado' };
        if (code === 'rate_limited') return { estado: 'tentar-de-novo', mensagem: 'Muitos downloads em pouco tempo. Tente de novo em instantes.' };
        // "unavailable", "not_granted" e códigos desconhecidos seguem para a saída (c).
        return baixarArquivo(conteudo, nome, tipo) ? { estado: 'salvo' } : { estado: 'previa' };
      }
    }
  }
  return baixarArquivo(conteudo, nome, tipo) ? { estado: 'salvo' } : { estado: 'previa' };
}
