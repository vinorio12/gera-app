// Gestão da entidade: oportunidades, eventos e ingressos, loja e estoque, campanhas e patrocinadores.
// Multi-tenant: toda função recebe a entidade e só mexe no que é dela.
import { commit, delay, getDb, newId } from '../mocks/db';
import { isoDay } from '../lib/carteirinha';
import { slugUnico } from '../lib/slug';
import type {
  Area,
  Campanha,
  Cota,
  Entrada,
  Evento,
  IngressoEmitido,
  MovimentoEstoque,
  Oportunidade,
  Patrocinador,
  Produto,
  TipoIngresso,
  Turno,
} from '../types/domain';
import { ServiceError } from './voluntarios';

const hoje = () => isoDay(new Date());
const arredonda = (v: number) => Math.round(v * 100) / 100;

function daEntidade<T extends { id: string; entidadeId: string }>(lista: T[], id: string, entidadeId: string, oQue: string): T {
  const item = lista.find((x) => x.id === id && x.entidadeId === entidadeId);
  if (!item) throw new ServiceError(`${oQue} não encontrado(a) nesta entidade.`);
  return item;
}

// ---------- Oportunidades ----------

export interface DadosOportunidade {
  titulo: string;
  descricao: string;
  data: string;
  turno: Turno;
  horas: number;
  vagas: number;
  local: string;
  area: Area;
  usaFormacao: boolean;
}

export interface OportunidadeGestao extends Oportunidade {
  /** Inscritos que já fizeram check-in. */
  presentes: number;
}

export async function listarOportunidadesGestao(entidadeId: string): Promise<OportunidadeGestao[]> {
  await delay();
  const db = getDb();
  return db.oportunidades
    .filter((o) => o.entidadeId === entidadeId)
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((o) => ({ ...o, presentes: new Set(db.horas.filter((h) => h.oportunidadeId === o.id).map((h) => h.voluntarioId)).size }));
}

export async function obterOportunidadeGestao(id: string, entidadeId: string): Promise<Oportunidade> {
  await delay();
  return { ...daEntidade(getDb().oportunidades, id, entidadeId, 'Oportunidade') };
}

function validarOportunidade(d: DadosOportunidade, novo: boolean, inscritos = 0) {
  if (d.titulo.trim().length < 3) throw new ServiceError('Dê um título à oportunidade.');
  if (d.descricao.trim().length < 10) throw new ServiceError('Conte em uma ou duas frases o que a pessoa vai fazer.');
  if (!d.data) throw new ServiceError('Escolha a data.');
  if (novo && d.data < hoje()) throw new ServiceError('A data não pode estar no passado.');
  if (!(d.horas >= 1 && d.horas <= 12)) throw new ServiceError('A ação vale entre 1 e 12 horas.');
  if (!(d.vagas >= 1)) throw new ServiceError('Ofereça ao menos 1 vaga.');
  if (d.vagas < inscritos) throw new ServiceError(`Já há ${inscritos} inscritos: as vagas não podem ser menos que isso.`);
  if (d.local.trim().length < 3) throw new ServiceError('Informe o local.');
}

export async function salvarOportunidade(input: DadosOportunidade & { entidadeId: string; id?: string }): Promise<Oportunidade> {
  await delay();
  const { entidadeId, id, ...d } = input;
  const limpo = { ...d, titulo: d.titulo.trim(), descricao: d.descricao.trim(), local: d.local.trim() };
  if (id) {
    const atual = daEntidade(getDb().oportunidades, id, entidadeId, 'Oportunidade');
    validarOportunidade(limpo, false, atual.inscritos.length);
    commit(() => Object.assign(atual, limpo));
    return { ...atual };
  }
  validarOportunidade(limpo, true);
  const nova: Oportunidade = { id: newId('o'), entidadeId, ...limpo, inscritos: [], encerradaEm: null };
  commit((db) => db.oportunidades.push(nova));
  return nova;
}

export async function encerrarOportunidade(id: string, entidadeId: string) {
  await delay();
  const o = daEntidade(getDb().oportunidades, id, entidadeId, 'Oportunidade');
  commit(() => (o.encerradaEm = hoje()));
}

export async function reabrirOportunidade(id: string, entidadeId: string) {
  await delay();
  const o = daEntidade(getDb().oportunidades, id, entidadeId, 'Oportunidade');
  if (o.data < hoje()) throw new ServiceError('Essa ação já passou. Crie uma nova data.');
  commit(() => (o.encerradaEm = null));
}

export async function excluirOportunidade(id: string, entidadeId: string) {
  await delay();
  const db = getDb();
  const o = daEntidade(db.oportunidades, id, entidadeId, 'Oportunidade');
  if (db.horas.some((h) => h.oportunidadeId === id)) {
    throw new ServiceError('Essa ação já tem horas registradas e entra no histórico. Encerre em vez de excluir.');
  }
  commit((d) => (d.oportunidades = d.oportunidades.filter((x) => x !== o)));
}

// ---------- Eventos e ingressos ----------

export interface EventoGestao extends Evento {
  vendidos: number;
  total: number;
  emitidos: number;
  checkIns: number;
}

const resumoEvento = (e: Evento): EventoGestao => {
  const emitidos = getDb().ingressosEmitidos.filter((i) => i.eventoId === e.id);
  return {
    ...e,
    vendidos: e.ingressos.reduce((s, i) => s + i.vendidos, 0),
    total: e.ingressos.reduce((s, i) => s + i.total, 0),
    emitidos: emitidos.length,
    checkIns: emitidos.filter((i) => i.usadoEm).length,
  };
};

export async function listarEventosGestao(entidadeId: string): Promise<EventoGestao[]> {
  await delay();
  return getDb()
    .eventos.filter((e) => e.entidadeId === entidadeId)
    .sort((a, b) => a.data.localeCompare(b.data))
    .map(resumoEvento);
}

export async function obterEventoGestao(id: string, entidadeId: string): Promise<EventoGestao> {
  await delay();
  return resumoEvento(daEntidade(getDb().eventos, id, entidadeId, 'Evento'));
}

export interface DadosEvento {
  titulo: string;
  descricao: string;
  data: string;
  horario: string;
  local: string;
  ingressos: Array<{ tipo: TipoIngresso; preco: number; total: number }>;
}

export async function salvarEvento(input: DadosEvento & { entidadeId: string; id?: string }): Promise<Evento> {
  await delay();
  const db = getDb();
  const { entidadeId, id } = input;
  const atual = id ? daEntidade(db.eventos, id, entidadeId, 'Evento') : null;
  if (input.titulo.trim().length < 3) throw new ServiceError('Dê um nome ao evento.');
  if (!input.data) throw new ServiceError('Escolha a data do evento.');
  if (!atual && input.data < hoje()) throw new ServiceError('A data não pode estar no passado.');
  if (!input.horario.trim()) throw new ServiceError('Informe o horário, por exemplo 19h30.');
  if (input.local.trim().length < 3) throw new ServiceError('Informe o local.');
  if (input.ingressos.length === 0) throw new ServiceError('Adicione ao menos um tipo de ingresso.');
  const tipos = new Set<string>();
  const ingressos = input.ingressos.map((i) => {
    if (tipos.has(i.tipo)) throw new ServiceError(`O tipo ${i.tipo} aparece duas vezes. Junte num só.`);
    tipos.add(i.tipo);
    const preco = i.tipo === 'Gratuito' ? 0 : arredonda(i.preco);
    if (i.tipo !== 'Gratuito' && !(preco > 0)) throw new ServiceError(`Informe o preço do ingresso ${i.tipo}.`);
    if (!(i.total >= 1)) throw new ServiceError(`Informe quantos ingressos ${i.tipo} há.`);
    const vendidos = atual?.ingressos.find((x) => x.tipo === i.tipo)?.vendidos ?? 0;
    if (i.total < vendidos) throw new ServiceError(`Já foram vendidos ${vendidos} ingressos ${i.tipo}: a quantidade não pode ser menor.`);
    return { tipo: i.tipo, preco, total: Math.round(i.total), vendidos };
  });
  const removidoComVenda = atual?.ingressos.find((x) => x.vendidos > 0 && !tipos.has(x.tipo));
  if (removidoComVenda) throw new ServiceError(`O tipo ${removidoComVenda.tipo} já tem ingressos vendidos e não pode sair do evento.`);
  const dados = { titulo: input.titulo.trim(), descricao: input.descricao.trim(), data: input.data, horario: input.horario.trim(), local: input.local.trim(), ingressos };
  if (atual) {
    commit(() => Object.assign(atual, dados));
    return { ...atual };
  }
  const novo: Evento = { id: newId('e'), slug: slugUnico(dados.titulo, db.eventos.map((e) => e.slug)), entidadeId, ...dados };
  commit((d) => d.eventos.push(novo));
  return novo;
}

export async function excluirEvento(id: string, entidadeId: string) {
  await delay();
  const e = daEntidade(getDb().eventos, id, entidadeId, 'Evento');
  if (e.ingressos.some((i) => i.vendidos > 0)) throw new ServiceError('Esse evento já tem ingressos vendidos e não pode ser excluído.');
  commit((d) => (d.eventos = d.eventos.filter((x) => x !== e)));
}

export interface IngressoDoEvento extends IngressoEmitido {
  comprador: string;
}

export async function listarIngressosDoEvento(eventoId: string, entidadeId: string): Promise<IngressoDoEvento[]> {
  await delay();
  const db = getDb();
  daEntidade(db.eventos, eventoId, entidadeId, 'Evento');
  return db.ingressosEmitidos
    .filter((i) => i.eventoId === eventoId)
    .map((i) => ({ ...i, comprador: db.pedidos.find((p) => p.id === i.pedidoId)?.comprador.nome ?? '' }))
    .sort((a, b) => a.participante.localeCompare(b.participante, 'pt-BR'));
}

/** Lê "GERA-INGRESSO:<id>" (QR) ou o código digitado (com ou sem o prefixo). */
export function lerCodigoIngresso(texto: string): string | null {
  const t = texto.trim();
  const m = t.match(/^(?:GERA-INGRESSO:)?(ing-[a-z0-9-]+)$/i);
  return m ? m[1]!.toLowerCase() : null;
}

export interface CheckInIngresso {
  participante: string;
  tipo: string;
}

export async function checkInIngresso(input: { entidadeId: string; eventoId: string; codigo: string }): Promise<CheckInIngresso> {
  await delay();
  const db = getDb();
  const evento = daEntidade(db.eventos, input.eventoId, input.entidadeId, 'Evento');
  const id = lerCodigoIngresso(input.codigo);
  if (!id) throw new ServiceError('Esse código não é de um ingresso GERA. Ele começa com GERA-INGRESSO.');
  const ingresso = db.ingressosEmitidos.find((i) => i.id === id);
  if (!ingresso) throw new ServiceError('Não encontramos esse ingresso. Confira o código.');
  if (ingresso.eventoId !== evento.id) {
    const outro = db.eventos.find((e) => e.id === ingresso.eventoId);
    throw new ServiceError(`Esse ingresso é de outro evento${outro ? `: ${outro.titulo}` : ''}.`);
  }
  if (ingresso.usadoEm) {
    const quando = new Date(ingresso.usadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    throw new ServiceError(`Ingresso já usado: ${ingresso.participante} entrou às ${quando}.`);
  }
  commit(() => (ingresso.usadoEm = new Date().toISOString()));
  return { participante: ingresso.participante, tipo: ingresso.tipo };
}

// ---------- Loja e estoque ----------

export const ESTOQUE_BAIXO = 3;

export interface ProdutoGestao extends Produto {
  vendidos: number;
}

export async function listarProdutosGestao(entidadeId: string): Promise<ProdutoGestao[]> {
  await delay();
  const db = getDb();
  return db.produtos
    .filter((p) => p.entidadeId === entidadeId)
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    .map((p) => ({
      ...p,
      vendidos: db.movimentosEstoque.filter((m) => m.produtoId === p.id && m.motivo === 'Venda na loja').reduce((s, m) => s + m.quantidade, 0),
    }));
}

export async function obterProdutoGestao(id: string, entidadeId: string): Promise<Produto> {
  await delay();
  return { ...daEntidade(getDb().produtos, id, entidadeId, 'Produto') };
}

export interface DadosProduto {
  nome: string;
  tipo: Produto['tipo'];
  preco: number;
  variacoes: string[];
  /** Só na criação: vira a primeira entrada de estoque. */
  estoqueInicial?: number;
}

export async function salvarProduto(input: DadosProduto & { entidadeId: string; id?: string }): Promise<Produto> {
  await delay();
  const db = getDb();
  if (input.nome.trim().length < 3) throw new ServiceError('Dê um nome ao produto.');
  if (!(input.preco > 0)) throw new ServiceError('Informe o preço.');
  const variacoes = [...new Set(input.variacoes.map((v) => v.trim()).filter(Boolean))];
  const dados = { nome: input.nome.trim(), tipo: input.tipo, preco: arredonda(input.preco), variacoes };
  if (input.id) {
    const atual = daEntidade(db.produtos, input.id, input.entidadeId, 'Produto');
    commit(() => Object.assign(atual, dados, { slug: slugUnico(dados.nome, db.produtos.map((p) => p.slug), atual.slug) }));
    return { ...atual };
  }
  const inicial = Math.max(0, Math.round(input.estoqueInicial ?? 0));
  const novo: Produto = { id: newId('pr'), slug: slugUnico(dados.nome, db.produtos.map((p) => p.slug)), entidadeId: input.entidadeId, ...dados, estoque: inicial };
  commit((d) => {
    d.produtos.push(novo);
    if (inicial > 0) {
      d.movimentosEstoque.push({ id: newId('me'), produtoId: novo.id, entidadeId: input.entidadeId, tipo: 'entrada', quantidade: inicial, motivo: 'Estoque inicial', em: new Date().toISOString() });
    }
  });
  return novo;
}

export async function movimentarEstoque(input: { entidadeId: string; produtoId: string; tipo: MovimentoEstoque['tipo']; quantidade: number; motivo: string }) {
  await delay();
  const p = daEntidade(getDb().produtos, input.produtoId, input.entidadeId, 'Produto');
  const q = Math.round(input.quantidade);
  if (!(q >= 1)) throw new ServiceError('Informe a quantidade.');
  if (!input.motivo.trim()) throw new ServiceError('Escreva o motivo: ele fica no histórico.');
  if (input.tipo === 'saida' && q > p.estoque) throw new ServiceError(`Só há ${p.estoque} em estoque.`);
  commit((d) => {
    p.estoque += input.tipo === 'entrada' ? q : -q;
    d.movimentosEstoque.push({ id: newId('me'), produtoId: p.id, entidadeId: input.entidadeId, tipo: input.tipo, quantidade: q, motivo: input.motivo.trim(), em: new Date().toISOString() });
  });
}

export interface MovimentoDetalhado extends MovimentoEstoque {
  produto: string;
}

export async function listarMovimentos(entidadeId: string): Promise<MovimentoDetalhado[]> {
  await delay();
  const db = getDb();
  const nomes = new Map(db.produtos.map((p) => [p.id, p.nome]));
  return db.movimentosEstoque
    .filter((m) => m.entidadeId === entidadeId)
    .sort((a, b) => b.em.localeCompare(a.em))
    .map((m) => ({ ...m, produto: nomes.get(m.produtoId) ?? 'Produto removido' }));
}

// ---------- Campanhas ----------

export interface CampanhaGestao extends Campanha {
  diasRestantes: number;
  encerrada: boolean;
}

const resumoCampanha = (c: Campanha): CampanhaGestao => ({
  ...c,
  diasRestantes: Math.max(0, Math.ceil((new Date(`${c.terminaEm}T23:59:59`).getTime() - Date.now()) / 86_400_000)),
  encerrada: c.terminaEm < hoje(),
});

export async function listarCampanhasGestao(entidadeId: string): Promise<CampanhaGestao[]> {
  await delay();
  return getDb()
    .campanhas.filter((c) => c.entidadeId === entidadeId)
    .sort((a, b) => b.terminaEm.localeCompare(a.terminaEm))
    .map(resumoCampanha);
}

export interface DadosCampanha {
  titulo: string;
  historia: string;
  meta: number;
  terminaEm: string;
}

export async function salvarCampanha(input: DadosCampanha & { entidadeId: string; id?: string }): Promise<Campanha> {
  await delay();
  const db = getDb();
  if (input.titulo.trim().length < 3) throw new ServiceError('Dê um nome à campanha.');
  if (input.historia.trim().length < 20) throw new ServiceError('Conte a história em pelo menos uma frase: é ela que convence quem doa.');
  if (!(input.meta >= 100)) throw new ServiceError('A meta mínima é R$ 100.');
  if (!input.terminaEm) throw new ServiceError('Escolha até quando a campanha fica no ar.');
  const dados = { titulo: input.titulo.trim(), historia: input.historia.trim(), meta: Math.round(input.meta), terminaEm: input.terminaEm };
  if (input.id) {
    const atual = daEntidade(db.campanhas, input.id, input.entidadeId, 'Campanha');
    if (dados.meta < atual.arrecadado) throw new ServiceError('A meta não pode ser menor que o já arrecadado.');
    commit(() => Object.assign(atual, dados));
    return { ...atual };
  }
  if (dados.terminaEm < hoje()) throw new ServiceError('O prazo não pode estar no passado.');
  const nova: Campanha = { id: newId('c'), slug: slugUnico(dados.titulo, db.campanhas.map((c) => c.slug)), entidadeId: input.entidadeId, ...dados, arrecadado: 0, apoiadores: 0 };
  commit((d) => d.campanhas.push(nova));
  return nova;
}

export interface DoacoesDaCampanha {
  campanha: CampanhaGestao;
  doacoes: Entrada[];
  total: number;
}

export async function obterDoacoesDaCampanha(id: string, entidadeId: string): Promise<DoacoesDaCampanha> {
  await delay();
  const db = getDb();
  const c = daEntidade(db.campanhas, id, entidadeId, 'Campanha');
  const doacoes = db.entradas.filter((e) => e.campanhaId === id).sort((a, b) => b.data.localeCompare(a.data) || b.id.localeCompare(a.id));
  return { campanha: resumoCampanha(c), doacoes, total: arredonda(doacoes.reduce((s, e) => s + e.valor, 0)) };
}

// ---------- Patrocinadores ----------

export async function listarPatrocinadores(entidadeId: string): Promise<Patrocinador[]> {
  await delay();
  const ordem: Cota[] = ['Ouro', 'Prata', 'Bronze', 'Apoio'];
  return getDb()
    .patrocinadores.filter((p) => p.entidadeId === entidadeId)
    .sort((a, b) => ordem.indexOf(a.cota) - ordem.indexOf(b.cota) || a.nome.localeCompare(b.nome, 'pt-BR'))
    .map((p) => ({ ...p, contrapartidas: p.contrapartidas.map((c) => ({ ...c })) }));
}

export async function obterPatrocinador(id: string, entidadeId: string): Promise<Patrocinador> {
  await delay();
  return structuredClone(daEntidade(getDb().patrocinadores, id, entidadeId, 'Patrocinador'));
}

export interface DadosPatrocinador {
  nome: string;
  cota: Cota;
  valor: number;
  inicio: string;
  fim: string;
  contato: string;
  contrapartidas: string[];
}

export async function salvarPatrocinador(input: DadosPatrocinador & { entidadeId: string; id?: string }): Promise<Patrocinador> {
  await delay();
  const db = getDb();
  if (input.nome.trim().length < 2) throw new ServiceError('Informe o nome do patrocinador.');
  if (!(input.valor > 0)) throw new ServiceError('Informe o valor da cota.');
  if (!input.inicio || !input.fim) throw new ServiceError('Informe o início e o fim da vigência.');
  if (input.fim < input.inicio) throw new ServiceError('O fim da vigência vem depois do início.');
  const textos = [...new Set(input.contrapartidas.map((t) => t.trim()).filter(Boolean))];
  const dados = { nome: input.nome.trim(), cota: input.cota, valor: arredonda(input.valor), inicio: input.inicio, fim: input.fim, contato: input.contato.trim() };
  const descricao = `Cota ${dados.cota} · ${dados.nome}`;
  if (input.id) {
    const atual = daEntidade(db.patrocinadores, input.id, input.entidadeId, 'Patrocinador');
    commit((d) => {
      Object.assign(atual, dados, {
        // Mantém o "entregue" das contrapartidas que continuam na lista.
        contrapartidas: textos.map((texto, i) => atual.contrapartidas.find((c) => c.texto === texto) ?? { id: `${atual.id}-c${Date.now()}-${i}`, texto, entregue: false }),
      });
      const entrada = d.entradas.find((e) => e.patrocinadorId === atual.id);
      if (entrada) Object.assign(entrada, { valor: dados.valor, data: dados.inicio, descricao });
      else d.entradas.push({ id: newId('en'), entidadeId: input.entidadeId, fonte: 'Patrocínios', valor: dados.valor, data: dados.inicio, patrocinadorId: atual.id, descricao });
    });
    return structuredClone(atual);
  }
  const id = newId('pat');
  const novo: Patrocinador = { id, entidadeId: input.entidadeId, ...dados, contrapartidas: textos.map((texto, i) => ({ id: `${id}-c${i}`, texto, entregue: false })) };
  commit((d) => {
    d.patrocinadores.push(novo);
    d.entradas.push({ id: newId('en'), entidadeId: input.entidadeId, fonte: 'Patrocínios', valor: dados.valor, data: dados.inicio, patrocinadorId: id, descricao });
  });
  return novo;
}

export async function marcarContrapartida(input: { entidadeId: string; patrocinadorId: string; contrapartidaId: string; entregue: boolean }) {
  await delay(120);
  const p = daEntidade(getDb().patrocinadores, input.patrocinadorId, input.entidadeId, 'Patrocinador');
  const c = p.contrapartidas.find((x) => x.id === input.contrapartidaId);
  if (!c) throw new ServiceError('Contrapartida não encontrada.');
  commit(() => (c.entregue = input.entregue));
}

export async function excluirPatrocinador(id: string, entidadeId: string) {
  await delay();
  const p = daEntidade(getDb().patrocinadores, id, entidadeId, 'Patrocinador');
  commit((d) => {
    d.patrocinadores = d.patrocinadores.filter((x) => x !== p);
    d.entradas = d.entradas.filter((e) => e.patrocinadorId !== id);
  });
}
