import type { VolunteerStatus } from '@gera/design-system';
import { commit, delay, getDb, newId } from '../mocks/db';
import { dadosCarteirinha, elegibilidade, lerCodigo } from '../lib/carteirinha';
import type { Beneficio } from '../types/domain';
import { ServiceError } from './voluntarios';

/** LGPD: o parceiro vê só nome, entidade, status, horas e validade (e só o primeiro nome se não for elegível). */
export interface ResultadoValidacao {
  voluntarioId: string;
  elegivel: boolean;
  nome: string;
  entidade: string;
  status: VolunteerStatus;
  horas: number;
  validaAte: string | null;
  motivo?: string;
}

export async function validarCarteirinha(codigo: string): Promise<ResultadoValidacao> {
  await delay();
  const lido = lerCodigo(codigo);
  if ('erro' in lido) throw new ServiceError(lido.erro);
  const db = getDb();
  const v = db.voluntarios.find((x) => x.registro === lido.registro);
  if (!v) throw new ServiceError('Não existe carteirinha com esse número. Confira e tente de novo.');
  const dados = dadosCarteirinha(v, db.horas.filter((h) => h.voluntarioId === v.id));
  const resultado = elegibilidade(v, dados);
  const entidade = db.entidades.filter((e) => v.entidadeIds.includes(e.id)).map((e) => e.nome).join(' · ');
  return {
    voluntarioId: v.id,
    elegivel: resultado.elegivel,
    nome: resultado.elegivel ? v.nome : v.nome.split(' ')[0]!,
    entidade,
    status: dados.status,
    horas: dados.totalHoras,
    validaAte: dados.validaAte,
    ...(resultado.elegivel ? {} : { motivo: resultado.motivo }),
  };
}

export async function listarBeneficiosDoParceiro(parceiroId: string): Promise<Beneficio[]> {
  await delay();
  return getDb().beneficios.filter((b) => b.parceiroId === parceiroId);
}

export async function registrarUso(input: { parceiroId: string; beneficioId: string; voluntarioId: string }) {
  await delay();
  const db = getDb();
  if (!db.beneficios.some((b) => b.id === input.beneficioId && b.parceiroId === input.parceiroId && b.status === 'aprovado')) {
    throw new ServiceError('Escolha um dos seus benefícios aprovados.');
  }
  commit((d) => {
    d.resgates.push({ id: newId('r'), ...input, em: new Date().toISOString() });
  });
}

export interface ResgateDetalhado {
  id: string;
  em: string;
  beneficio: string;
  /** Só o primeiro nome: o histórico do parceiro não precisa de mais (LGPD). */
  voluntario: string;
}

export async function listarResgates(parceiroId: string): Promise<ResgateDetalhado[]> {
  await delay();
  const db = getDb();
  return db.resgates
    .filter((r) => r.parceiroId === parceiroId)
    .sort((a, b) => b.em.localeCompare(a.em))
    .map((r) => ({
      id: r.id,
      em: r.em,
      beneficio: db.beneficios.find((b) => b.id === r.beneficioId)?.titulo ?? '',
      voluntario: db.voluntarios.find((v) => v.id === r.voluntarioId)?.nome.split(' ')[0] ?? '',
    }));
}
