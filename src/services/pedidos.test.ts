import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDb, resetDb } from '../mocks/db';
import { acompanharPedido, criarPedido } from './pedidos';

const pagador = { nome: 'Teste Comprador', email: 'comprador@exemplo.com.br', voluntarioId: null };

beforeEach(() => resetDb());
afterEach(() => vi.restoreAllMocks());

/** O provedor simulado aprova depois de alguns segundos: avança o relógio dele. */
async function aprovar(pedidoId: string) {
  const real = Date.now();
  vi.spyOn(Date, 'now').mockReturnValue(real + 60_000);
  return acompanharPedido(pedidoId);
}

describe('pedidos', () => {
  it('ingresso gratuito sai pago na hora, com um QR por participante', async () => {
    const evento = getDb().eventos.find((e) => e.ingressos.some((i) => i.tipo === 'Gratuito' && i.vendidos < i.total) && e.data >= '2026-10-16')!;
    const antes = evento.ingressos.find((i) => i.tipo === 'Gratuito')!.vendidos;
    const { pedido } = await criarPedido({ tipo: 'ingressos', eventoSlug: evento.slug, ingressos: [{ tipo: 'Gratuito', quantidade: 2 }], participantes: ['Ana Teste', 'Beto Teste'] }, pagador, null);
    expect(pedido.status).toBe('pago');
    const emitidos = getDb().ingressosEmitidos.filter((i) => i.pedidoId === pedido.id);
    expect(emitidos.map((i) => i.participante)).toEqual(['Ana Teste', 'Beto Teste']);
    expect(emitidos.every((i) => i.codigo.startsWith('GERA-INGRESSO:') && i.usadoEm === null)).toBe(true);
    expect(getDb().eventos.find((e) => e.id === evento.id)!.ingressos.find((i) => i.tipo === 'Gratuito')!.vendidos).toBe(antes + 2);
  });

  it('loja: o pagamento aprovado baixa o estoque, registra a saída e entra no financeiro', async () => {
    const produto = getDb().produtos.find((p) => p.estoque >= 5)!;
    const estoque = produto.estoque;
    const { pedido } = await criarPedido({ tipo: 'loja', itens: [{ produtoId: produto.id, variacao: null, quantidade: 2 }], entrega: 'retirada' }, pagador, { metodo: 'pix' });
    expect(pedido.status).toBe('aguardando');
    const r = await aprovar(pedido.id);
    expect(r.pedido.status).toBe('pago');
    expect(getDb().produtos.find((p) => p.id === produto.id)!.estoque).toBe(estoque - 2);
    expect(getDb().movimentosEstoque.some((m) => m.produtoId === produto.id && m.tipo === 'saida' && m.motivo === 'Venda na loja' && m.quantidade === 2)).toBe(true);
    expect(getDb().entradas.some((e) => e.pedidoId === pedido.id && e.fonte === 'Loja')).toBe(true);
  });

  it('doação aprovada soma na campanha e no financeiro, com o nome de quem doou', async () => {
    const c = getDb().campanhas[0]!;
    const { arrecadado, apoiadores } = c;
    const { pedido } = await criarPedido({ tipo: 'doacao', campanhaSlug: c.slug, valor: 50, mensal: false }, pagador, { metodo: 'pix' });
    await aprovar(pedido.id);
    const depois = getDb().campanhas[0]!;
    expect(depois.arrecadado).toBe(arrecadado + 50);
    expect(depois.apoiadores).toBe(apoiadores + 1);
    expect(getDb().entradas.find((e) => e.pedidoId === pedido.id)).toMatchObject({ fonte: 'Campanhas', campanhaId: c.id, descricao: 'Teste Comprador' });
  });

  it('não vende mais do que o estoque nem aceita doação abaixo de R$ 5', async () => {
    const produto = getDb().produtos.find((p) => p.estoque > 0)!;
    await expect(
      criarPedido({ tipo: 'loja', itens: [{ produtoId: produto.id, variacao: null, quantidade: produto.estoque + 1 }], entrega: 'retirada' }, pagador, { metodo: 'pix' }),
    ).rejects.toThrow(/Só temos/);
    await expect(criarPedido({ tipo: 'doacao', campanhaSlug: getDb().campanhas[0]!.slug, valor: 2, mensal: false }, pagador, { metodo: 'pix' })).rejects.toThrow(/mínimo/);
  });
});
