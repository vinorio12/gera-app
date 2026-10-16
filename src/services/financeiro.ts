// Financeiro: entradas automáticas (pagamentos e patrocínios), despesas lançadas à mão, saldo e extrato.
import { eachMonthOfInterval, format } from 'date-fns';
import { commit, delay, getDb, newId } from '../mocks/db';
import { isoDay, parseDate } from '../lib/carteirinha';
import type { CategoriaDespesa, Despesa, FonteReceita } from '../types/domain';
import { CATEGORIAS_DESPESA } from '../types/domain';
import { FONTES, type Periodo } from './indicadores';
import { atorAtual, auditar } from './sessao';
import { ServiceError } from './voluntarios';

const dentro = (data: string, p: Periodo) => data.slice(0, 10) >= p.inicio && data.slice(0, 10) <= p.fim;
const centavos = (v: number) => Math.round(v * 100) / 100;
const soma = (lista: Array<{ valor: number }>) => centavos(lista.reduce((s, e) => s + e.valor, 0));

export interface Lancamento {
  id: string;
  data: string;
  tipo: 'entrada' | 'despesa';
  /** Fonte (entrada) ou categoria (despesa). */
  grupo: FonteReceita | CategoriaDespesa;
  descricao: string;
  valor: number;
  entidadeId: string;
  entidadeNome: string;
}

export interface ResumoFinanceiro {
  entradas: number;
  despesas: number;
  saldo: number;
  porFonte: Array<{ fonte: FonteReceita; valor: number }>;
  porCategoria: Array<{ categoria: CategoriaDespesa; valor: number }>;
  /** Mês a mês dentro do período. */
  porMes: Array<{ mes: string; entradas: number; despesas: number }>;
  extrato: Lancamento[];
  porEntidade: Array<{ entidadeId: string; entidade: string; entradas: number; despesas: number; saldo: number }>;
  /** Vendas no período: pedidos de ingressos e da loja e unidades vendidas. */
  vendas: { pedidos: number; ingressos: number; produtos: number };
}

const descricaoPadrao: Record<FonteReceita, string> = {
  Ingressos: 'Venda de ingressos',
  Loja: 'Venda na loja',
  Campanhas: 'Apoio a campanha',
  Doações: 'Doação direta',
  Patrocínios: 'Patrocínio',
};

/** Sem entidade, consolida todas (visão do comitê). */
export async function obterFinanceiro(input: { periodo: Periodo; entidadeId?: string }): Promise<ResumoFinanceiro> {
  await delay();
  const db = getDb();
  const nomes = new Map(db.entidades.map((e) => [e.id, e.nome]));
  const daEntidade = <T extends { entidadeId: string }>(l: T[]) => (input.entidadeId ? l.filter((x) => x.entidadeId === input.entidadeId) : l);
  const entradas = daEntidade(db.entradas).filter((e) => dentro(e.data, input.periodo));
  const despesas = daEntidade(db.despesas).filter((d) => dentro(d.data, input.periodo));
  const campanhas = new Map(db.campanhas.map((c) => [c.id, c.titulo]));

  const extrato: Lancamento[] = [
    ...entradas.map((e) => ({
      id: e.id,
      data: e.data,
      tipo: 'entrada' as const,
      grupo: e.fonte,
      descricao:
        e.fonte === 'Campanhas' && e.campanhaId
          ? `${campanhas.get(e.campanhaId) ?? 'Campanha'}${e.descricao ? ` · ${e.descricao}` : ''}`
          : e.descricao ?? (e.quantidade ? `${descricaoPadrao[e.fonte]} (${e.quantidade})` : descricaoPadrao[e.fonte]),
      valor: e.valor,
      entidadeId: e.entidadeId,
      entidadeNome: nomes.get(e.entidadeId) ?? '',
    })),
    ...despesas.map((d) => ({
      id: d.id,
      data: d.data,
      tipo: 'despesa' as const,
      grupo: d.categoria,
      descricao: d.descricao,
      valor: d.valor,
      entidadeId: d.entidadeId,
      entidadeNome: nomes.get(d.entidadeId) ?? '',
    })),
  ].sort((a, b) => b.data.localeCompare(a.data) || a.tipo.localeCompare(b.tipo) || b.id.localeCompare(a.id));

  const meses = eachMonthOfInterval({ start: parseDate(input.periodo.inicio), end: parseDate(input.periodo.fim) }).map((m) => format(m, 'yyyy-MM'));
  const entidades = input.entidadeId ? db.entidades.filter((e) => e.id === input.entidadeId) : db.entidades;
  const totalEntradas = soma(entradas);
  const totalDespesas = soma(despesas);

  return {
    entradas: totalEntradas,
    despesas: totalDespesas,
    saldo: centavos(totalEntradas - totalDespesas),
    porFonte: FONTES.map((fonte) => ({ fonte, valor: soma(entradas.filter((e) => e.fonte === fonte)) })),
    porCategoria: CATEGORIAS_DESPESA.map((categoria) => ({ categoria, valor: soma(despesas.filter((d) => d.categoria === categoria)) })).filter((c) => c.valor > 0),
    porMes: meses.map((mes) => ({
      mes,
      entradas: soma(entradas.filter((e) => e.data.startsWith(mes))),
      despesas: soma(despesas.filter((d) => d.data.startsWith(mes))),
    })),
    extrato,
    porEntidade: entidades
      .map((e) => {
        const en = soma(entradas.filter((x) => x.entidadeId === e.id));
        const de = soma(despesas.filter((x) => x.entidadeId === e.id));
        return { entidadeId: e.id, entidade: e.nome, entradas: en, despesas: de, saldo: centavos(en - de) };
      })
      .sort((a, b) => b.entradas - a.entradas),
    vendas: {
      pedidos: entradas.filter((e) => e.fonte === 'Ingressos' || e.fonte === 'Loja').length,
      ingressos: entradas.filter((e) => e.fonte === 'Ingressos').reduce((s, e) => s + (e.quantidade ?? 0), 0),
      produtos: entradas.filter((e) => e.fonte === 'Loja').reduce((s, e) => s + (e.quantidade ?? 0), 0),
    },
  };
}

export async function lancarDespesa(input: { entidadeId: string; categoria: CategoriaDespesa; descricao: string; valor: number; data: string }): Promise<Despesa> {
  await delay();
  const entidade = getDb().entidades.find((e) => e.id === input.entidadeId);
  if (!entidade) throw new ServiceError('Entidade não encontrada.');
  if (!CATEGORIAS_DESPESA.includes(input.categoria)) throw new ServiceError('Escolha a categoria.');
  if (input.descricao.trim().length < 3) throw new ServiceError('Descreva a despesa (ex.: Material de oficina).');
  if (!(input.valor > 0)) throw new ServiceError('Informe o valor.');
  if (!input.data) throw new ServiceError('Informe a data.');
  if (input.data > isoDay(new Date())) throw new ServiceError('A data não pode estar no futuro.');
  const despesa: Despesa = {
    id: newId('d'),
    entidadeId: input.entidadeId,
    categoria: input.categoria,
    descricao: input.descricao.trim(),
    valor: centavos(input.valor),
    data: input.data,
    lancadaPor: atorAtual(),
  };
  commit((db) => db.despesas.push(despesa));
  auditar({
    acao: 'Lançou despesa',
    entidadeId: input.entidadeId,
    alvo: despesa.descricao,
    detalhe: `${despesa.categoria} · ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(despesa.valor)} em ${despesa.data}`,
  });
  return despesa;
}
