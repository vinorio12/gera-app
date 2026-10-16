// Pedidos: compra na loja, ingressos e doações. O pedido nasce "aguardando", o PaymentProvider
// confirma o pagamento e só então o efeito acontece (estoque, campanha, ingressos, entrada no financeiro).
import { commit, delay, getDb, newId } from '../mocks/db';
import { isoDay } from '../lib/carteirinha';
import type { IngressoEmitido, MetodoPagamento, MockDb, Pedido } from '../types/domain';
import { paymentProvider, type Cobranca, type DadosCartao } from './pagamentos';
import { ServiceError } from './voluntarios';

interface Pagador {
  nome: string;
  email: string;
  voluntarioId: string | null;
}

interface Pagamento {
  metodo: MetodoPagamento;
  parcelas?: number;
  cartao?: DadosCartao;
}

export type NovoPedido =
  | { tipo: 'loja'; itens: Array<{ produtoId: string; variacao: string | null; quantidade: number }>; entrega: 'retirada' | 'entrega' }
  | { tipo: 'ingressos'; eventoSlug: string; ingressos: Array<{ tipo: string; quantidade: number }>; participantes: string[] }
  | { tipo: 'doacao'; campanhaSlug: string; valor: number; mensal: boolean };

const arredonda = (v: number) => Math.round(v * 100) / 100;

/** Monta o pedido conferindo estoque, vagas e valores com os dados atuais (nunca confia no que veio da tela). */
function montar(db: MockDb, input: NovoPedido, pagador: Pagador): Omit<Pedido, 'id' | 'metodo' | 'status' | 'criadoEm' | 'cobrancaId'> & { participantes?: string[] } {
  const comprador = { nome: pagador.nome.trim(), email: pagador.email.trim() };
  if (input.tipo === 'loja') {
    if (input.itens.length === 0) throw new ServiceError('Seu carrinho está vazio.');
    const itens = input.itens.map((i) => {
      const p = db.produtos.find((x) => x.id === i.produtoId);
      if (!p) throw new ServiceError('Um produto do carrinho saiu da loja. Remova e tente de novo.');
      if (i.quantidade > p.estoque) throw new ServiceError(`Só temos ${p.estoque} de ${p.nome}. Ajuste o carrinho.`);
      return { produtoId: p.id, nome: p.nome, variacao: i.variacao, quantidade: i.quantidade, preco: p.preco };
    });
    const entidades = new Set(itens.map((i) => db.produtos.find((p) => p.id === i.produtoId)!.entidadeId));
    return {
      tipo: 'loja',
      // Pedido de várias entidades: o protótipo registra na primeira; no real, o pedido é dividido.
      entidadeId: [...entidades][0]!,
      descricao: itens.length === 1 ? itens[0]!.nome : `${itens.length} produtos da loja solidária`,
      valor: arredonda(itens.reduce((s, i) => s + i.preco * i.quantidade, 0) + (input.entrega === 'entrega' ? 12 : 0)),
      comprador,
      voluntarioId: pagador.voluntarioId,
      itens,
      entrega: input.entrega,
    };
  }
  if (input.tipo === 'ingressos') {
    const e = db.eventos.find((x) => x.slug === input.eventoSlug);
    if (!e) throw new ServiceError('Esse evento não foi encontrado.');
    const escolhidos = input.ingressos.filter((i) => i.quantidade > 0);
    if (escolhidos.length === 0) throw new ServiceError('Escolha ao menos um ingresso.');
    const ingressos = escolhidos.map((i) => {
      const t = e.ingressos.find((x) => x.tipo === i.tipo);
      if (!t) throw new ServiceError('Esse tipo de ingresso não existe mais.');
      if (i.quantidade > t.total - t.vendidos) throw new ServiceError(`Restam ${t.total - t.vendidos} ingressos ${t.tipo}. Ajuste a quantidade.`);
      return { tipo: t.tipo, quantidade: i.quantidade, preco: t.preco };
    });
    const total = ingressos.reduce((s, i) => s + i.quantidade, 0);
    const participantes = input.participantes.map((n) => n.trim());
    if (participantes.length !== total || participantes.some((n) => n.length < 3)) {
      throw new ServiceError('Escreva o nome de cada participante: cada ingresso tem um QR próprio.');
    }
    return {
      tipo: 'ingressos',
      entidadeId: e.entidadeId,
      descricao: `${total} ${total === 1 ? 'ingresso' : 'ingressos'} · ${e.titulo}`,
      valor: arredonda(ingressos.reduce((s, i) => s + i.preco * i.quantidade, 0)),
      comprador,
      voluntarioId: pagador.voluntarioId,
      eventoId: e.id,
      ingressos,
      participantes,
    };
  }
  const c = db.campanhas.find((x) => x.slug === input.campanhaSlug);
  if (!c) throw new ServiceError('Essa campanha não foi encontrada.');
  if (!(input.valor >= 5)) throw new ServiceError('O valor mínimo de doação é R$ 5.');
  return {
    tipo: 'doacao',
    entidadeId: c.entidadeId,
    descricao: `${input.mensal ? 'Doação mensal' : 'Doação'} · ${c.titulo}`,
    valor: arredonda(input.valor),
    comprador,
    voluntarioId: pagador.voluntarioId,
    campanhaId: c.id,
    mensal: input.mensal,
  };
}

/** Participantes ficam guardados só até a emissão dos ingressos. */
const participantesPendentes = new Map<string, string[]>();

export interface PedidoCriado {
  pedido: Pedido;
  cobranca: Cobranca | null;
}

export async function criarPedido(input: NovoPedido, pagador: Pagador, pagamento: Pagamento | null): Promise<PedidoCriado> {
  await delay(150);
  if (pagador.nome.trim().length < 3) throw new ServiceError('Escreva seu nome completo.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pagador.email.trim())) throw new ServiceError('Confira o e-mail: é para ele que vai o comprovante.');
  const { participantes, ...dados } = montar(getDb(), input, pagador);
  const pedido: Pedido = {
    ...dados,
    id: newId('ped'),
    metodo: dados.valor === 0 ? 'gratuito' : pagamento!.metodo,
    status: 'aguardando',
    criadoEm: new Date().toISOString(),
    cobrancaId: null,
  };
  if (participantes) participantesPendentes.set(pedido.id, participantes);

  if (dados.valor === 0) {
    commit((db) => db.pedidos.push(pedido));
    concluir(pedido.id);
    return { pedido: getDb().pedidos.find((p) => p.id === pedido.id)!, cobranca: null };
  }
  if (!pagamento) throw new ServiceError('Escolha como pagar.');
  const nova = { metodo: pagamento.metodo, valor: dados.valor, descricao: dados.descricao, pagador: dados.comprador, parcelas: pagamento.parcelas, cartao: pagamento.cartao };
  const cobranca = input.tipo === 'doacao' && input.mensal ? await paymentProvider.criarAssinatura(nova) : await paymentProvider.criarCobranca(nova);
  pedido.cobrancaId = cobranca.id;
  if (cobranca.status === 'recusada') pedido.status = 'recusado';
  commit((db) => db.pedidos.push(pedido));
  return { pedido, cobranca };
}

/** Aplica o efeito do pedido pago: entrada no financeiro, estoque, campanha e ingressos. */
function concluir(pedidoId: string) {
  commit((db) => {
    const p = db.pedidos.find((x) => x.id === pedidoId);
    if (!p || p.status === 'pago') return;
    p.status = 'pago';
    const hoje = isoDay(new Date());
    if (p.tipo === 'loja') {
      p.itens!.forEach((i) => {
        const prod = db.produtos.find((x) => x.id === i.produtoId);
        if (prod) {
          prod.estoque = Math.max(0, prod.estoque - i.quantidade);
          db.movimentosEstoque.push({ id: newId('me'), produtoId: prod.id, entidadeId: prod.entidadeId, tipo: 'saida', quantidade: i.quantidade, motivo: 'Venda na loja', em: new Date().toISOString() });
        }
        db.entradas.push({ id: newId('en'), entidadeId: prod?.entidadeId ?? p.entidadeId, fonte: 'Loja', valor: arredonda(i.preco * i.quantidade), quantidade: i.quantidade, data: hoje, descricao: `${i.quantidade}× ${i.nome}`, pedidoId: p.id });
      });
    }
    if (p.tipo === 'ingressos') {
      const e = db.eventos.find((x) => x.id === p.eventoId)!;
      const nomes = participantesPendentes.get(p.id) ?? [];
      let n = 0;
      p.ingressos!.forEach((i) => {
        const t = e.ingressos.find((x) => x.tipo === i.tipo);
        if (t) t.vendidos += i.quantidade;
        for (let k = 0; k < i.quantidade; k++) {
          const id = newId('ing');
          db.ingressosEmitidos.push({ id, pedidoId: p.id, eventoId: e.id, tipo: i.tipo, participante: nomes[n++] ?? p.comprador.nome, codigo: `GERA-INGRESSO:${id}`, usadoEm: null });
        }
      });
      participantesPendentes.delete(p.id);
      if (p.valor > 0) {
        db.entradas.push({ id: newId('en'), entidadeId: p.entidadeId, fonte: 'Ingressos', valor: p.valor, quantidade: n, data: hoje, descricao: p.descricao, pedidoId: p.id });
      }
    }
    if (p.tipo === 'doacao') {
      const c = db.campanhas.find((x) => x.id === p.campanhaId);
      if (c) {
        c.arrecadado = arredonda(c.arrecadado + p.valor);
        c.apoiadores += 1;
      }
      db.entradas.push({ id: newId('en'), entidadeId: p.entidadeId, fonte: 'Campanhas', valor: p.valor, data: hoje, campanhaId: p.campanhaId ?? undefined, descricao: p.comprador.nome, pedidoId: p.id });
    }
  });
}

export interface AndamentoPedido {
  pedido: Pedido;
  cobranca: Cobranca | null;
  ingressos: IngressoEmitido[];
}

/** Consulta o pagamento e, se aprovado, conclui o pedido. A tela chama isso a cada segundo. */
export async function acompanharPedido(pedidoId: string): Promise<AndamentoPedido> {
  const pedido = getDb().pedidos.find((p) => p.id === pedidoId);
  if (!pedido) throw new ServiceError('Não encontramos esse pedido.');
  let cobranca: Cobranca | null = null;
  if (pedido.cobrancaId && pedido.status === 'aguardando') {
    cobranca = await paymentProvider.consultarStatus(pedido.cobrancaId);
    if (cobranca.status === 'aprovada') concluir(pedido.id);
    if (cobranca.status === 'recusada' || cobranca.status === 'expirada') commit(() => (pedido.status = 'recusado'));
  } else if (pedido.cobrancaId) {
    cobranca = await paymentProvider.consultarStatus(pedido.cobrancaId).catch(() => null);
  }
  const atual = getDb().pedidos.find((p) => p.id === pedidoId)!;
  return { pedido: { ...atual }, cobranca, ingressos: getDb().ingressosEmitidos.filter((i) => i.pedidoId === pedidoId) };
}

// ---------- Visão do voluntário ----------

export interface MeuIngresso extends IngressoEmitido {
  eventoTitulo: string;
  eventoData: string;
  eventoHorario: string;
  local: string;
}

export async function listarMeusIngressos(voluntarioId: string): Promise<MeuIngresso[]> {
  await delay();
  const db = getDb();
  const meus = new Set(db.pedidos.filter((p) => p.voluntarioId === voluntarioId && p.status === 'pago').map((p) => p.id));
  return db.ingressosEmitidos
    .filter((i) => meus.has(i.pedidoId))
    .map((i) => {
      const e = db.eventos.find((x) => x.id === i.eventoId)!;
      return { ...i, eventoTitulo: e.titulo, eventoData: e.data, eventoHorario: e.horario, local: e.local };
    })
    .sort((a, b) => a.eventoData.localeCompare(b.eventoData));
}

export async function listarMinhasDoacoes(voluntarioId: string): Promise<Pedido[]> {
  await delay();
  return getDb()
    .pedidos.filter((p) => p.voluntarioId === voluntarioId && p.tipo === 'doacao' && p.status === 'pago')
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}
