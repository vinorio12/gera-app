// Recibo de doação e comprovante de compra (loja e ingressos), no modelo de Documento (PDF e prévia).
import type { Pedido } from '../types/domain';
import type { Documento } from './documento';
import { formatDateTime, formatMoeda } from './format';

const METODO: Record<Pedido['metodo'], string> = { pix: 'Pix', cartao: 'Cartão de crédito', boleto: 'Boleto', gratuito: 'Gratuito' };

export interface ContextoPedido {
  entidadeNome: string;
  /** Título do evento ou da campanha, quando houver. */
  referencia?: string;
}

export function documentoDoPedido(p: Pedido, c: ContextoPedido): Documento {
  const doacao = p.tipo === 'doacao';
  const itens =
    p.tipo === 'loja'
      ? (p.itens ?? []).map((i) => [`${i.nome}${i.variacao ? ` (${i.variacao})` : ''}`, i.quantidade, i.preco, i.preco * i.quantidade])
      : p.tipo === 'ingressos'
        ? (p.ingressos ?? []).map((i) => [`Ingresso ${i.tipo}${c.referencia ? ` · ${c.referencia}` : ''}`, i.quantidade, i.preco, i.preco * i.quantidade])
        : [[`${p.mensal ? 'Doação mensal' : 'Doação'}${c.referencia ? ` · ${c.referencia}` : ''}`, 1, p.valor, p.valor]];
  if (p.tipo === 'loja' && p.entrega === 'entrega') itens.push(['Entrega', 1, 12, 12]);
  return {
    titulo: doacao ? 'Recibo de doação' : 'Comprovante de compra',
    subtitulo: `${c.entidadeNome} · pedido ${p.id.toUpperCase()}`,
    geradoEm: formatDateTime(new Date().toISOString()),
    destaques: [
      { rotulo: doacao ? 'Valor doado' : 'Valor pago', valor: `${formatMoeda(p.valor)}${p.mensal ? ' por mês' : ''}` },
      { rotulo: 'Data', valor: formatDateTime(p.criadoEm) },
      { rotulo: 'Forma de pagamento', valor: METODO[p.metodo] },
    ],
    secoes: [
      {
        titulo: doacao ? 'Doação' : 'Itens',
        colunas: [{ titulo: 'Descrição' }, { titulo: 'Qtd.', tipo: 'numero' }, { titulo: 'Preço', tipo: 'moeda' }, { titulo: 'Total', tipo: 'moeda' }],
        linhas: itens,
        total: ['Total', '', '', p.valor],
      },
      {
        titulo: doacao ? 'Quem doou' : 'Quem comprou',
        colunas: [{ titulo: 'Nome' }, { titulo: 'E-mail' }],
        linhas: [[p.comprador.nome, p.comprador.email]],
      },
    ],
    rodape: doacao
      ? `Recebemos com gratidão a sua doação para a ${c.entidadeNome}. Pagamento simulado no protótipo GERA · Comitê Social ACIJS.`
      : `Compra solidária: o valor vai para os projetos da ${c.entidadeNome}. Pagamento simulado no protótipo GERA · Comitê Social ACIJS.`,
  };
}
