// Modelo único dos documentos exportáveis (relatórios, extratos): a mesma estrutura vira prévia na tela,
// PDF (jsPDF) e planilha (CSV). As células guardam o número cru; o formato depende do destino.
import { formatDate, formatMoeda } from './format';

export type TipoColuna = 'texto' | 'moeda' | 'numero' | 'horas' | 'data';

export interface Coluna {
  titulo: string;
  tipo?: TipoColuna;
}

export type Celula = string | number;

export interface Secao {
  titulo: string;
  descricao?: string;
  colunas: Coluna[];
  linhas: Celula[][];
  /** Linha de total, já com as células na ordem das colunas. */
  total?: Celula[];
  /** Texto para quando não há linhas. */
  vazio?: string;
}

export interface Documento {
  titulo: string;
  /** Entidade e período, ex.: "AMA Jaraguá · 01/07/2026 a 30/09/2026". */
  subtitulo: string;
  geradoEm: string;
  destaques?: Array<{ rotulo: string; valor: string }>;
  secoes: Secao[];
  rodape?: string;
}

const numero = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const decimal = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Célula como aparece na tela e no PDF. */
export function formatarCelula(valor: Celula, tipo: TipoColuna = 'texto'): string {
  if (typeof valor === 'string') return tipo === 'data' && /^\d{4}-\d{2}-\d{2}/.test(valor) ? formatDate(valor) : valor;
  if (tipo === 'moeda') return formatMoeda(valor);
  if (tipo === 'horas') return `${numero.format(valor)} h`;
  return numero.format(valor);
}

/** Célula na planilha: números no formato pt-BR (1.234,56), sem "R$" nem "h", para somar no Excel. */
export function celulaCsv(valor: Celula, tipo: TipoColuna = 'texto'): string {
  if (typeof valor === 'number') return tipo === 'moeda' ? decimal.format(valor) : numero.format(valor);
  if (tipo === 'data' && /^\d{4}-\d{2}-\d{2}/.test(valor)) return formatDate(valor);
  return valor;
}

const escapar = (texto: string) => (/[";\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto);

/**
 * CSV para Excel em português: BOM (acentos certos), separador ";" e números pt-BR.
 * Cada seção vira um bloco com título, cabeçalho e linhas, separado por uma linha em branco.
 */
export function documentoParaCsv(doc: Documento): string {
  const linhas: string[][] = [[doc.titulo], [doc.subtitulo], [`Gerado em ${doc.geradoEm}`]];
  for (const d of doc.destaques ?? []) linhas.push([d.rotulo, d.valor]);
  for (const s of doc.secoes) {
    linhas.push([], [s.titulo], s.colunas.map((c) => c.titulo));
    for (const l of s.linhas) linhas.push(l.map((v, i) => celulaCsv(v, s.colunas[i]?.tipo)));
    if (s.total) linhas.push(s.total.map((v, i) => celulaCsv(v, s.colunas[i]?.tipo)));
  }
  return `﻿${linhas.map((l) => l.map(escapar).join(';')).join('\r\n')}\r\n`;
}

/** Texto simples, para copiar quando o download não funciona. */
export function documentoParaTexto(doc: Documento): string {
  const partes = [doc.titulo, doc.subtitulo, `Gerado em ${doc.geradoEm}`, ''];
  for (const d of doc.destaques ?? []) partes.push(`${d.rotulo}: ${d.valor}`);
  for (const s of doc.secoes) {
    partes.push('', s.titulo.toUpperCase(), s.colunas.map((c) => c.titulo).join(' | '));
    if (s.linhas.length === 0 && s.vazio) partes.push(s.vazio);
    for (const l of s.linhas) partes.push(l.map((v, i) => formatarCelula(v, s.colunas[i]?.tipo)).join(' | '));
    if (s.total) partes.push(s.total.map((v, i) => formatarCelula(v, s.colunas[i]?.tipo)).join(' | '));
  }
  if (doc.rodape) partes.push('', doc.rodape);
  return partes.join('\n');
}
