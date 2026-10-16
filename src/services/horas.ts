import { commit, delay, getDb, newId } from '../mocks/db';
import { isoDay, lerCodigo } from '../lib/carteirinha';
import type { Oportunidade, RegistroHoras } from '../types/domain';
import { auditar } from './sessao';
import { ServiceError } from './voluntarios';

export async function listarOportunidadesDaEntidade(entidadeId: string): Promise<Oportunidade[]> {
  await delay();
  return getDb()
    .oportunidades.filter((o) => o.entidadeId === entidadeId)
    .sort((a, b) => a.data.localeCompare(b.data));
}

export interface CheckInFeito {
  nome: string;
  horas: number;
  projeto: string;
}

/** Check-in do dia: a entidade lê o código do voluntário e confirma presença e horas da ação. */
export async function fazerCheckIn(input: { entidadeId: string; oportunidadeId: string; codigo: string }): Promise<CheckInFeito> {
  await delay();
  const db = getDb();
  const lido = lerCodigo(input.codigo);
  if ('erro' in lido) throw new ServiceError(lido.erro);
  const oportunidade = db.oportunidades.find((o) => o.id === input.oportunidadeId && o.entidadeId === input.entidadeId);
  if (!oportunidade) throw new ServiceError('Escolha a ação do check-in.');
  const v = db.voluntarios.find((x) => x.registro === lido.registro);
  const entidade = db.entidades.find((e) => e.id === input.entidadeId)!;
  if (!v || !v.entidadeIds.includes(input.entidadeId)) {
    throw new ServiceError(`Esse número não é de um voluntário da ${entidade.nome}.`);
  }
  const primeiroNome = v.nome.split(' ')[0];
  if (v.desligamento) throw new ServiceError(`${v.nome} está desligado(a). Reative o cadastro antes do check-in.`);
  if (!v.aprovadoEm) {
    throw new ServiceError(`O cadastro de ${v.nome} ainda não foi aprovado. Aprove em Voluntários e faça o check-in de novo.`);
  }
  if (db.horas.some((h) => h.voluntarioId === v.id && h.oportunidadeId === oportunidade.id)) {
    throw new ServiceError(`${primeiroNome} já fez check-in nesta ação.`);
  }
  commit((d) => {
    d.horas.push({
      id: newId('h'), voluntarioId: v.id, entidadeId: input.entidadeId, oportunidadeId: oportunidade.id,
      data: isoDay(new Date()), projeto: oportunidade.titulo, horas: oportunidade.horas, origem: 'qr',
    });
  });
  return { nome: v.nome, horas: oportunidade.horas, projeto: oportunidade.titulo };
}

export async function registrarHorasManual(input: {
  entidadeId: string;
  voluntarioId: string;
  data: string;
  projeto: string;
  horas: number;
  justificativa: string;
}) {
  await delay();
  const v = getDb().voluntarios.find((x) => x.id === input.voluntarioId && x.entidadeIds.includes(input.entidadeId));
  if (!v) throw new ServiceError('Escolha um voluntário da entidade.');
  if (!input.justificativa.trim()) throw new ServiceError('Registros manuais precisam de uma justificativa.');
  if (!(input.horas > 0 && input.horas <= 12)) throw new ServiceError('Informe entre 1 e 12 horas.');
  if (input.data > isoDay(new Date())) throw new ServiceError('A data não pode estar no futuro.');
  commit((d) => {
    d.horas.push({
      id: newId('h'), voluntarioId: v.id, entidadeId: input.entidadeId, oportunidadeId: null, data: input.data,
      projeto: input.projeto.trim() || 'Ação voluntária', horas: input.horas, origem: 'manual', justificativa: input.justificativa.trim(),
    });
  });
  auditar({ acao: 'Lançou horas à mão', entidadeId: input.entidadeId, alvo: v.nome, detalhe: `${input.horas} h em ${input.data}: ${input.justificativa.trim()}` });
}

export interface RegistroComNome extends RegistroHoras {
  nome: string;
}

export interface BancoDeHorasEntidade {
  doMes: number;
  doAno: number;
  recentes: RegistroComNome[];
}

export async function obterBancoDeHoras(entidadeId: string): Promise<BancoDeHorasEntidade> {
  await delay();
  const db = getDb();
  const hoje = isoDay(new Date());
  const registros = db.horas.filter((h) => h.entidadeId === entidadeId);
  const nomes = new Map(db.voluntarios.map((v) => [v.id, v.nome]));
  return {
    doMes: registros.filter((r) => r.data.startsWith(hoje.slice(0, 7))).reduce((s, r) => s + r.horas, 0),
    doAno: registros.filter((r) => r.data.startsWith(hoje.slice(0, 4))).reduce((s, r) => s + r.horas, 0),
    recentes: [...registros]
      .sort((a, b) => b.data.localeCompare(a.data) || b.id.localeCompare(a.id))
      .slice(0, 12)
      .map((r) => ({ ...r, nome: nomes.get(r.voluntarioId) ?? '' })),
  };
}
