// Dados do site público: tudo que qualquer visitante pode ver, sem dados pessoais.
import { subMonths } from 'date-fns';
import { delay, getDb } from '../mocks/db';
import { isoDay, statusDoVoluntario } from '../lib/carteirinha';
import type { Area, Beneficio, Campanha, Entidade, Evento, Oportunidade, Parceiro, Produto, Turno } from '../types/domain';
import { ServiceError } from './voluntarios';

const hoje = () => isoDay(new Date());
const nomeDaEntidade = (id: string) => getDb().entidades.find((e) => e.id === id)?.nome ?? '';

export interface ResumoPublico {
  entidades: number;
  voluntarios: number;
  horas: number;
  arrecadado12m: number;
}

/** Contadores da home: cada um mostra de onde vem o número. */
export async function obterResumoPublico(): Promise<ResumoPublico> {
  await delay();
  const db = getDb();
  const desde = isoDay(subMonths(new Date(), 12));
  return {
    entidades: db.entidades.filter((e) => e.ativa).length,
    voluntarios: db.voluntarios.filter((v) => statusDoVoluntario(v, db.horas.filter((h) => h.voluntarioId === v.id)) === 'ativo').length,
    horas: db.horas.reduce((s, h) => s + h.horas, 0),
    arrecadado12m: Math.round(db.entradas.filter((e) => e.data >= desde).reduce((s, e) => s + e.valor, 0)),
  };
}

// ---------- Oportunidades ----------

export type OportunidadePublica = Oportunidade & { entidadeNome: string; entidadeSlug: string };

const comEntidade = (o: Oportunidade): OportunidadePublica => {
  const e = getDb().entidades.find((x) => x.id === o.entidadeId);
  return { ...o, entidadeNome: e?.nome ?? '', entidadeSlug: e?.slug ?? '' };
};

export interface FiltroOportunidades {
  area?: Area;
  entidadeId?: string;
  turno?: Turno;
  usaFormacao?: boolean;
}

export async function listarOportunidades(f: FiltroOportunidades = {}): Promise<OportunidadePublica[]> {
  await delay();
  return getDb()
    .oportunidades.filter(
      (o) =>
        o.data >= hoje() &&
        !o.encerradaEm &&
        (!f.area || o.area === f.area) &&
        (!f.entidadeId || o.entidadeId === f.entidadeId) &&
        (!f.turno || o.turno === f.turno) &&
        (!f.usaFormacao || o.usaFormacao),
    )
    .sort((a, b) => a.data.localeCompare(b.data))
    .map(comEntidade);
}

export async function obterOportunidade(id: string): Promise<OportunidadePublica> {
  await delay();
  const o = getDb().oportunidades.find((x) => x.id === id);
  if (!o) throw new ServiceError('Essa oportunidade não existe mais. Veja as outras abertas.');
  return comEntidade(o);
}

// ---------- Eventos ----------

export type EventoPublico = Evento & { entidadeNome: string; precoMinimo: number; esgotado: boolean };

const eventoPublico = (e: Evento): EventoPublico => {
  const pagos = e.ingressos.filter((i) => i.preco > 0).map((i) => i.preco);
  return {
    ...e,
    entidadeNome: nomeDaEntidade(e.entidadeId),
    precoMinimo: e.ingressos.some((i) => i.preco === 0 && i.vendidos < i.total) ? 0 : Math.min(...pagos, Infinity),
    esgotado: e.ingressos.every((i) => i.vendidos >= i.total),
  };
};

export async function listarEventos(f: { entidadeId?: string } = {}): Promise<EventoPublico[]> {
  await delay();
  return getDb()
    .eventos.filter((e) => e.data >= hoje() && (!f.entidadeId || e.entidadeId === f.entidadeId))
    .sort((a, b) => a.data.localeCompare(b.data))
    .map(eventoPublico);
}

export async function obterEvento(slug: string): Promise<EventoPublico> {
  await delay();
  const e = getDb().eventos.find((x) => x.slug === slug);
  if (!e) throw new ServiceError('Esse evento não foi encontrado. Veja a agenda completa.');
  return eventoPublico(e);
}

// ---------- Campanhas ----------

export type CampanhaPublica = Campanha & { entidadeNome: string; diasRestantes: number };

const campanhaPublica = (c: Campanha): CampanhaPublica => ({
  ...c,
  entidadeNome: nomeDaEntidade(c.entidadeId),
  diasRestantes: Math.max(0, Math.ceil((new Date(`${c.terminaEm}T23:59:59`).getTime() - Date.now()) / 86_400_000)),
});

export async function listarCampanhas(f: { entidadeId?: string } = {}): Promise<CampanhaPublica[]> {
  await delay();
  return getDb()
    .campanhas.filter((c) => c.terminaEm >= hoje() && (!f.entidadeId || c.entidadeId === f.entidadeId))
    .sort((a, b) => a.terminaEm.localeCompare(b.terminaEm))
    .map(campanhaPublica);
}

export async function obterCampanha(slug: string): Promise<CampanhaPublica> {
  await delay();
  const c = getDb().campanhas.find((x) => x.slug === slug);
  if (!c) throw new ServiceError('Essa campanha não foi encontrada. Veja as campanhas ativas.');
  return campanhaPublica(c);
}

// ---------- Loja ----------

export type ProdutoPublico = Produto & { entidadeNome: string };

export async function listarProdutos(f: { entidadeId?: string } = {}): Promise<ProdutoPublico[]> {
  await delay();
  return getDb()
    .produtos.filter((p) => !f.entidadeId || p.entidadeId === f.entidadeId)
    .sort((a, b) => Number(b.estoque > 0) - Number(a.estoque > 0) || a.nome.localeCompare(b.nome, 'pt-BR'))
    .map((p) => ({ ...p, entidadeNome: nomeDaEntidade(p.entidadeId) }));
}

export async function obterProduto(slug: string): Promise<ProdutoPublico> {
  await delay();
  const p = getDb().produtos.find((x) => x.slug === slug);
  if (!p) throw new ServiceError('Esse produto não está mais na loja.');
  return { ...p, entidadeNome: nomeDaEntidade(p.entidadeId) };
}

/** Produtos do carrinho, para mostrar nome, preço e estoque atuais. */
export async function obterProdutosPorId(ids: string[]): Promise<ProdutoPublico[]> {
  await delay(120);
  return getDb()
    .produtos.filter((p) => ids.includes(p.id))
    .map((p) => ({ ...p, entidadeNome: nomeDaEntidade(p.entidadeId) }));
}

// ---------- Entidades e parceiros ----------

export interface EntidadePublica extends Entidade {
  voluntariosAtivos: number;
  horasNoAno: number;
}

const entidadePublica = (e: Entidade): EntidadePublica => {
  const db = getDb();
  const ano = hoje().slice(0, 4);
  return {
    ...e,
    voluntariosAtivos: db.voluntarios.filter(
      (v) => v.entidadeIds.includes(e.id) && statusDoVoluntario(v, db.horas.filter((h) => h.voluntarioId === v.id)) === 'ativo',
    ).length,
    horasNoAno: db.horas.filter((h) => h.entidadeId === e.id && h.data.startsWith(ano)).reduce((s, h) => s + h.horas, 0),
  };
};

export async function listarEntidadesPublicas(): Promise<EntidadePublica[]> {
  await delay();
  return getDb()
    .entidades.filter((e) => e.ativa)
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    .map(entidadePublica);
}

export async function obterEntidadePublica(slug: string): Promise<EntidadePublica> {
  await delay();
  const e = getDb().entidades.find((x) => x.slug === slug && x.ativa);
  if (!e) throw new ServiceError('Essa entidade não foi encontrada.');
  return entidadePublica(e);
}

export type ParceiroPublico = Parceiro & { beneficios: Beneficio[] };

export async function listarParceiros(): Promise<ParceiroPublico[]> {
  await delay();
  const db = getDb();
  // Só parceiros e benefícios aprovados pelo comitê.
  return db.parceiros
    .filter((p) => p.status === 'aprovado')
    .map((p) => ({ ...p, beneficios: db.beneficios.filter((b) => b.parceiroId === p.id && b.status === 'aprovado') }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}
