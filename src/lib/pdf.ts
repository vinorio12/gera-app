// PDFs gerados no navegador com jsPDF, carregado só quando alguém pede um arquivo.
// Logo do pacote, cores dos tokens (coresPdf) e o QR do código de verificação.
import type { jsPDF as JsPdf } from 'jspdf';
import logoSvg from '@gera/design-system/assets/gera-logo.svg?raw';
import { CORES_PDF } from './coresPdf';
import { formatarCelula, type Documento } from './documento';
import { formatDate } from './format';

async function novoPdf(orientation: 'portrait' | 'landscape') {
  const { jsPDF } = await import('jspdf');
  return new jsPDF({ unit: 'mm', format: 'a4', orientation });
}

/** Desenha o SVG num canvas e devolve um PNG (o jsPDF não lê SVG). */
async function svgParaPng(svg: string, larguraPx = 640): Promise<{ dataUrl: string; proporcao: number }> {
  const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const [w, h] = vb ? [Number(vb[1]), Number(vb[2])] : [331, 90];
  const comTamanho = svg.replace('<svg ', `<svg width="${w}" height="${h}" `);
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(comTamanho)}`;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = larguraPx;
  canvas.height = Math.round((larguraPx * h) / w);
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return { dataUrl: canvas.toDataURL('image/png'), proporcao: h / w };
}

async function qrPng(texto: string) {
  const QRCode = (await import('qrcode')).default;
  return QRCode.toDataURL(texto, { margin: 1, width: 360, errorCorrectionLevel: 'M', color: { dark: CORES_PDF.texto, light: CORES_PDF.papel } });
}

/** A cremalheira da marca: uma fileira de dentes (tooth-width 8px, gap 6px, height 5px em escala). */
function cremalheira(pdf: JsPdf, x: number, y: number, largura: number) {
  pdf.setFillColor(CORES_PDF.primaria);
  pdf.rect(x, y + 1.2, largura, 0.8, 'F');
  for (let i = x; i + 2 <= x + largura; i += 3.5) pdf.rect(i, y, 2, 1.2, 'F');
}

async function logo(pdf: JsPdf, x: number, y: number, largura: number) {
  const { dataUrl, proporcao } = await svgParaPng(logoSvg);
  pdf.addImage(dataUrl, 'PNG', x, y, largura, largura * proporcao, undefined, 'FAST');
  return largura * proporcao;
}

// ---------- Certificado ----------

export interface DadosCertificadoPdf {
  nome: string;
  entidadeNome: string;
  horas: number;
  inicio: string;
  fim: string;
  emitidoEm: string;
  emitidoPor: string;
  codigo: string;
  urlValidacao: string;
}

export async function certificadoPdf(c: DadosCertificadoPdf): Promise<Blob> {
  const pdf = await novoPdf('landscape');
  const W = 297;
  pdf.setDrawColor(CORES_PDF.marca);
  pdf.setLineWidth(1.2);
  pdf.rect(10, 10, W - 20, 190);
  cremalheira(pdf, 20, 18, W - 40);
  await logo(pdf, 20, 26, 62);

  pdf.setTextColor(CORES_PDF.marca);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(28);
  pdf.text('CERTIFICADO DE VOLUNTARIADO', W / 2, 66, { align: 'center' });

  pdf.setTextColor(CORES_PDF.texto);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(14);
  pdf.text('Certificamos que', W / 2, 86, { align: 'center' });
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.text(c.nome, W / 2, 99, { align: 'center' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(14);
  const horas = c.horas === 1 ? '1 hora' : `${c.horas.toLocaleString('pt-BR')} horas`;
  const corpo = `atuou como voluntário(a) na ${c.entidadeNome}, somando ${horas} de trabalho voluntário entre ${formatDate(c.inicio)} e ${formatDate(c.fim)}, registradas no banco de horas da plataforma GERA.`;
  pdf.text(pdf.splitTextToSize(corpo, 210), W / 2, 112, { align: 'center' });

  pdf.setFontSize(11);
  pdf.setTextColor(CORES_PDF.textoSuave);
  pdf.text(`Jaraguá do Sul, ${formatDate(c.emitidoEm)}`, 24, 168);
  pdf.text(`Emitido por ${c.emitidoPor}`, 24, 175);
  pdf.text('Comitê Social ACIJS · Plataforma GERA', 24, 182);

  pdf.addImage(await qrPng(c.urlValidacao), 'PNG', W - 66, 140, 40, 40, undefined, 'FAST');
  pdf.setFontSize(10);
  pdf.setTextColor(CORES_PDF.texto);
  pdf.setFont('helvetica', 'bold');
  pdf.text(c.codigo, W - 46, 186, { align: 'center' });
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(CORES_PDF.textoSuave);
  pdf.setFontSize(8);
  pdf.text('Confira em /validar/certificado', W - 46, 191, { align: 'center' });
  return pdf.output('blob');
}

// ---------- Documento (relatórios, recibos) ----------

/** Relatório em A4 retrato: cabeçalho com logo, destaques, tabelas com quebra de página e rodapé numerado. */
export async function documentoPdf(doc: Documento): Promise<Blob> {
  const pdf = await novoPdf('portrait');
  const W = 210;
  const M = 16;
  const util = W - 2 * M;
  const altLogo = await logo(pdf, M, 14, 42);
  let y = 14 + altLogo + 6;
  cremalheira(pdf, M, y, util);
  y += 9;

  pdf.setTextColor(CORES_PDF.marca);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text(pdf.splitTextToSize(doc.titulo, util), M, y);
  y += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(CORES_PDF.textoSuave);
  pdf.text(pdf.splitTextToSize(`${doc.subtitulo} · gerado em ${doc.geradoEm}`, util), M, y);
  y += 8;

  const novaPagina = () => {
    pdf.addPage();
    y = 18;
  };
  const garantir = (altura: number) => {
    if (y + altura > 280) novaPagina();
  };

  if (doc.destaques?.length) {
    const porLinha = 3;
    const larg = (util - (porLinha - 1) * 4) / porLinha;
    doc.destaques.forEach((d, i) => {
      if (i % porLinha === 0) {
        if (i > 0) y += 20;
        garantir(18);
      }
      const x = M + (i % porLinha) * (larg + 4);
      pdf.setFillColor(CORES_PDF.fundoSuave);
      pdf.rect(x, y, larg, 16, 'F');
      pdf.setFontSize(8);
      pdf.setTextColor(CORES_PDF.textoSuave);
      pdf.setFont('helvetica', 'normal');
      pdf.text(d.rotulo, x + 3, y + 5);
      pdf.setFontSize(12);
      pdf.setTextColor(CORES_PDF.texto);
      pdf.setFont('helvetica', 'bold');
      pdf.text(d.valor, x + 3, y + 12);
    });
    y += 24;
  }

  for (const s of doc.secoes) {
    garantir(22);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(CORES_PDF.texto);
    pdf.text(s.titulo, M, y);
    y += 5;
    if (s.descricao) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(CORES_PDF.textoSuave);
      const linhas = pdf.splitTextToSize(s.descricao, util);
      pdf.text(linhas, M, y);
      y += linhas.length * 4;
    }
    // Colunas de texto ficam com o dobro da largura das numéricas.
    const pesos = s.colunas.map((c) => (!c.tipo || c.tipo === 'texto' ? 2 : 1));
    const larguras = pesos.map((p) => (p / pesos.reduce((a, b) => a + b, 0)) * util);
    const xs = larguras.map((_, i) => M + larguras.slice(0, i).reduce((a, b) => a + b, 0));
    const direita = (i: number) => !!s.colunas[i]?.tipo && s.colunas[i]!.tipo !== 'texto' && s.colunas[i]!.tipo !== 'data';
    const cabecalho = () => {
      pdf.setFillColor(CORES_PDF.fundoSuave);
      pdf.rect(M, y, util, 6.5, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(CORES_PDF.textoSuave);
      s.colunas.forEach((c, i) => pdf.text(c.titulo, direita(i) ? xs[i]! + larguras[i]! - 2 : xs[i]! + 2, y + 4.4, { align: direita(i) ? 'right' : 'left' }));
      y += 6.5;
    };
    const linha = (celulas: Array<string | number>, negrito = false) => {
      pdf.setFont('helvetica', negrito ? 'bold' : 'normal');
      pdf.setFontSize(8.5);
      const textos = celulas.map((v, i) => pdf.splitTextToSize(formatarCelula(v, s.colunas[i]?.tipo), larguras[i]! - 4) as string[]);
      const altura = Math.max(...textos.map((t) => t.length)) * 3.8 + 2.6;
      if (y + altura > 280) {
        novaPagina();
        cabecalho();
        pdf.setFont('helvetica', negrito ? 'bold' : 'normal');
        pdf.setFontSize(8.5);
      }
      pdf.setTextColor(CORES_PDF.texto);
      textos.forEach((t, i) => pdf.text(t, direita(i) ? xs[i]! + larguras[i]! - 2 : xs[i]! + 2, y + 4, { align: direita(i) ? 'right' : 'left' }));
      y += altura;
      pdf.setDrawColor(CORES_PDF.borda);
      pdf.setLineWidth(0.2);
      pdf.line(M, y, M + util, y);
    };
    cabecalho();
    if (s.linhas.length === 0) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(CORES_PDF.textoSuave);
      pdf.text(s.vazio ?? 'Nada no período.', M + 2, y + 4.5);
      y += 7;
    }
    s.linhas.forEach((l) => linha(l));
    if (s.total) linha(s.total, true);
    y += 8;
  }

  const paginas = pdf.getNumberOfPages();
  for (let p = 1; p <= paginas; p++) {
    pdf.setPage(p);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(CORES_PDF.textoSuave);
    pdf.text(doc.rodape ?? 'Plataforma GERA · Comitê Social ACIJS', M, 290);
    pdf.text(`Página ${p} de ${paginas}`, W - M, 290, { align: 'right' });
  }
  return pdf.output('blob');
}
