// Indicadores dos painéis (Administrador e Entidade), sempre calculados para um período.
import { addDays, differenceInCalendarDays, format, startOfMonth, subMonths } from 'date-fns';
import { delay, getDb } from '../mocks/db';
import { isoDay, parseDate, statusDoVoluntario } from '../lib/carteirinha';
import type { Entrada, Evento, FonteReceita, MockDb, Produto } from '../types/domain';

export type PeriodoPreset = 'mes' | 'trimestre' | 'ano' | 'personalizado';

/** Intervalo de dias, com início e fim incluídos (yyyy-MM-dd). */
export interface Periodo {
  inicio: string;
  fim: string;
}

export function periodoDoPreset(preset: Exclude<PeriodoPreset, 'personalizado'>, hoje = new Date()): Periodo {
  const fim = isoDay(hoje);
  if (preset === 'mes') return { inicio: isoDay(startOfMonth(hoje)), fim };
  return { inicio: isoDay(addDays(subMonths(hoje, preset === 'trimestre' ? 3 : 12), 1)), fim };
}

/** O período imediatamente anterior, com o mesmo número de dias (para a variação). */
export function periodoAnterior(p: Periodo): Periodo {
  const dias = differenceInCalendarDays(parseDate(p.fim), parseDate(p.inicio)) + 1;
  const fim = addDays(parseDate(p.inicio), -1);
  return { inicio: isoDay(addDays(fim, -(dias - 1))), fim: isoDay(fim) };
}

const dentro = (data: string, p: Periodo) => data.slice(0, 10) >= p.inicio && data.slice(0, 10) <= p.fim;
// Arredonda no centavo: preços como R$ 49,90 acumulam sobra de ponto flutuante.
const soma = (lista: Array<{ valor: number }>) => Math.round(lista.reduce((s, e) => s + e.valor, 0) * 100) / 100;

export interface Indicador {
  atual: number;
  /** Mesmo indicador no período anterior; null quando não faz sentido comparar. */
  anterior: number | null;
}

interface Recorte {
  db: MockDb;
  entidadeId?: string;
}

const daEntidade = <T extends { entidadeId: string }>(lista: T[], entidadeId?: string) =>
  entidadeId ? lista.filter((x) => x.entidadeId === entidadeId) : lista;

function voluntariosDo({ db, entidadeId }: Recorte) {
  return entidadeId ? db.voluntarios.filter((v) => v.entidadeIds.includes(entidadeId)) : db.voluntarios;
}

function calcular(r: Recorte, p: Periodo) {
  const entradas = daEntidade(r.db.entradas, r.entidadeId).filter((e) => dentro(e.data, p));
  const horas = daEntidade(r.db.horas, r.entidadeId).filter((h) => dentro(h.data, p));
  const eventos = daEntidade(r.db.eventos, r.entidadeId).filter((e) => dentro(e.data, p));
  const voluntarios = voluntariosDo(r);
  const vendas = entradas.filter((e) => e.fonte === 'Ingressos' || e.fonte === 'Loja');
  return {
    arrecadado: soma(entradas),
    vendas: vendas.length,
    ingressosVendidos: entradas.filter((e) => e.fonte === 'Ingressos').reduce((s, e) => s + (e.quantidade ?? 0), 0),
    produtosVendidos: entradas.filter((e) => e.fonte === 'Loja').reduce((s, e) => s + (e.quantidade ?? 0), 0),
    horas: horas.reduce((s, h) => s + h.horas, 0),
    eventosRealizados: eventos.filter((e) => e.data <= isoDay(new Date())).length,
    novosCadastros: voluntarios.filter((v) => dentro(v.cadastroEm, p)).length,
    entradas,
  };
}

function indicador(atual: number, anterior: number | null): Indicador {
  return { atual, anterior };
}

/**
 * Só compara com o período anterior se ele estiver todo dentro dos dados que existem;
 * senão a variação sairia enorme e enganosa (ex.: +15.000% contra um período sem registros).
 */
function comparavel(db: MockDb, p: Periodo) {
  const inicioDosDados = db.entradas.reduce((min, e) => (e.data < min ? e.data : min), p.inicio);
  return periodoAnterior(p).inicio >= inicioDosDados;
}

export const FONTES: FonteReceita[] = ['Ingressos', 'Loja', 'Campanhas', 'Doações', 'Patrocínios'];

function porFonte(entradas: Entrada[]) {
  return FONTES.map((fonte) => ({ fonte, valor: soma(entradas.filter((e) => e.fonte === fonte)) }));
}

/** Horas por mês nos últimos 12 meses (o gráfico dá o contexto; o filtro de período vale para os números). */
function horasPorMes(r: Recorte, hoje = new Date()) {
  return Array.from({ length: 12 }, (_, i) => {
    const mes = format(subMonths(hoje, 11 - i), 'yyyy-MM');
    const horas = daEntidade(r.db.horas, r.entidadeId)
      .filter((h) => h.data.startsWith(mes))
      .reduce((s, h) => s + h.horas, 0);
    return { mes, horas };
  });
}

const proximosEventos = (lista: Evento[]) => {
  const hoje = isoDay(new Date());
  return lista.filter((e) => e.data >= hoje).sort((a, b) => a.data.localeCompare(b.data));
};

// ---------- Administrador: consolidado de todas as entidades, com filtro opcional ----------

export interface PainelAdmin {
  entidadesAtivas: Indicador;
  voluntarios: Indicador;
  novosVoluntarios: Indicador;
  eventosRealizados: Indicador;
  arrecadado: Indicador;
  vendas: Indicador;
  horas: Indicador;
  horasPorMes: Array<{ mes: string; horas: number }>;
  arrecadacaoPorFonte: Array<{ fonte: FonteReceita; valor: number }>;
  rankingHoras: Array<{ entidade: string; valor: number }>;
  rankingArrecadacao: Array<{ entidade: string; valor: number }>;
  proximosEventos: Array<Evento & { entidadeNome: string }>;
  produtos: Array<Produto & { entidadeNome: string }>;
}

export async function obterPainelAdmin(input: { periodo: Periodo; entidadeId?: string }): Promise<PainelAdmin> {
  await delay();
  const db = getDb();
  const r: Recorte = { db, entidadeId: input.entidadeId };
  const atual = calcular(r, input.periodo);
  const antes = comparavel(db, input.periodo) ? calcular(r, periodoAnterior(input.periodo)) : null;
  const nomes = new Map(db.entidades.map((e) => [e.id, e.nome]));
  const entidades = input.entidadeId ? db.entidades.filter((e) => e.id === input.entidadeId) : db.entidades;
  const ativos = voluntariosDo(r).filter((v) => statusDoVoluntario(v, db.horas.filter((h) => h.voluntarioId === v.id)) !== 'desligado');

  const ranking = (valor: (entidadeId: string) => number) =>
    db.entidades.filter((e) => e.ativa).map((e) => ({ entidade: e.nome, valor: valor(e.id) })).sort((a, b) => b.valor - a.valor);

  return {
    entidadesAtivas: indicador(entidades.filter((e) => e.ativa).length, null),
    voluntarios: indicador(ativos.length, null),
    novosVoluntarios: indicador(atual.novosCadastros, antes?.novosCadastros ?? null),
    eventosRealizados: indicador(atual.eventosRealizados, antes?.eventosRealizados ?? null),
    arrecadado: indicador(atual.arrecadado, antes?.arrecadado ?? null),
    vendas: indicador(atual.vendas, antes?.vendas ?? null),
    horas: indicador(atual.horas, antes?.horas ?? null),
    horasPorMes: horasPorMes(r),
    arrecadacaoPorFonte: porFonte(atual.entradas),
    // Os rankings comparam todas as entidades no período, mesmo com o filtro de entidade.
    rankingHoras: ranking((id) => db.horas.filter((h) => h.entidadeId === id && dentro(h.data, input.periodo)).reduce((s, h) => s + h.horas, 0)),
    rankingArrecadacao: ranking((id) => soma(db.entradas.filter((e) => e.entidadeId === id && dentro(e.data, input.periodo)))),
    proximosEventos: proximosEventos(daEntidade(db.eventos, input.entidadeId))
      .slice(0, 5)
      .map((e) => ({ ...e, entidadeNome: nomes.get(e.entidadeId) ?? '' })),
    produtos: daEntidade(db.produtos, input.entidadeId)
      .filter((p) => p.estoque > 0)
      .sort((a, b) => a.estoque - b.estoque)
      .slice(0, 6)
      .map((p) => ({ ...p, entidadeNome: nomes.get(p.entidadeId) ?? '' })),
  };
}

// ---------- Entidade: só os dados da própria entidade ----------

export interface PainelEntidade {
  voluntariosAtivos: Indicador;
  horas: Indicador;
  proximosEventos: Indicador;
  ingressosVendidos: Indicador;
  produtosVendidos: Indicador;
  arrecadado: Indicador;
  novosCadastros: Indicador;
  horasPorMes: Array<{ mes: string; horas: number }>;
  pendencias: {
    aprovacoes: number;
    /** Inscritos em ações de hoje que ainda não fizeram check-in. */
    checkInsDeHoje: number;
    estoqueBaixo: Produto[];
  };
}

export async function obterPainelEntidade(input: { entidadeId: string; periodo: Periodo }): Promise<PainelEntidade> {
  await delay();
  const db = getDb();
  const r: Recorte = { db, entidadeId: input.entidadeId };
  const atual = calcular(r, input.periodo);
  const antes = comparavel(db, input.periodo) ? calcular(r, periodoAnterior(input.periodo)) : null;
  const voluntarios = voluntariosDo(r);
  const hoje = isoDay(new Date());
  const acoesDeHoje = db.oportunidades.filter((o) => o.entidadeId === input.entidadeId && o.data === hoje);

  return {
    voluntariosAtivos: indicador(
      voluntarios.filter((v) => statusDoVoluntario(v, db.horas.filter((h) => h.voluntarioId === v.id)) === 'ativo').length,
      null,
    ),
    horas: indicador(atual.horas, antes?.horas ?? null),
    proximosEventos: indicador(proximosEventos(daEntidade(db.eventos, input.entidadeId)).length, null),
    ingressosVendidos: indicador(atual.ingressosVendidos, antes?.ingressosVendidos ?? null),
    produtosVendidos: indicador(atual.produtosVendidos, antes?.produtosVendidos ?? null),
    arrecadado: indicador(atual.arrecadado, antes?.arrecadado ?? null),
    novosCadastros: indicador(atual.novosCadastros, antes?.novosCadastros ?? null),
    horasPorMes: horasPorMes(r),
    pendencias: {
      aprovacoes: voluntarios.filter((v) => !v.aprovadoEm && !v.desligamento).length,
      checkInsDeHoje: acoesDeHoje.reduce(
        (total, o) => total + o.inscritos.filter((id) => !db.horas.some((h) => h.voluntarioId === id && h.oportunidadeId === o.id)).length,
        0,
      ),
      estoqueBaixo: daEntidade(db.produtos, input.entidadeId).filter((p) => p.estoque <= 3),
    },
  };
}
