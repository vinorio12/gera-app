// Configurações da entidade: dados, marca (cor de destaque entre os tokens de portal) e equipe.
import { commit, delay, getDb, newId } from '../mocks/db';
import { isoDay } from '../lib/carteirinha';
import { CORES_DESTAQUE, type CorDestaque, type Entidade, type MembroEquipe } from '../types/domain';
import { auditar } from './sessao';
import { ServiceError } from './voluntarios';

function daEntidade(entidadeId: string): Entidade {
  const e = getDb().entidades.find((x) => x.id === entidadeId);
  if (!e) throw new ServiceError('Entidade não encontrada.');
  return e;
}

export async function obterEntidadeConfig(entidadeId: string): Promise<Entidade> {
  await delay();
  return structuredClone(daEntidade(entidadeId));
}

export type DadosEntidade = Pick<Entidade, 'nome' | 'causa' | 'bairro' | 'cnpj' | 'email' | 'telefone' | 'responsavel' | 'areas'>;

export async function salvarDadosEntidade(entidadeId: string, d: DadosEntidade) {
  await delay();
  const e = daEntidade(entidadeId);
  if (d.nome.trim().length < 3) throw new ServiceError('Informe o nome da entidade.');
  if (d.causa.trim().length < 10) throw new ServiceError('Descreva a causa em uma frase.');
  if (d.areas.length === 0) throw new ServiceError('Escolha ao menos uma área.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) throw new ServiceError('Confira o e-mail.');
  commit(() =>
    Object.assign(e, {
      nome: d.nome.trim(),
      causa: d.causa.trim(),
      bairro: d.bairro.trim(),
      cnpj: d.cnpj.trim(),
      email: d.email.trim(),
      telefone: d.telefone.trim(),
      responsavel: d.responsavel.trim(),
      areas: d.areas,
    }),
  );
}

export async function definirCorDestaque(entidadeId: string, cor: CorDestaque) {
  await delay(150);
  if (!CORES_DESTAQUE.includes(cor)) throw new ServiceError('Escolha uma das cores da GERA.');
  const e = daEntidade(entidadeId);
  commit(() => (e.corDestaque = cor));
}

export async function convidarMembro(entidadeId: string, input: { nome: string; email: string; papel: MembroEquipe['papel'] }) {
  await delay();
  const e = daEntidade(entidadeId);
  if (input.nome.trim().length < 3) throw new ServiceError('Informe o nome.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) throw new ServiceError('Confira o e-mail: é para ele que vai o convite.');
  if (e.equipe.some((m) => m.email.toLowerCase() === input.email.trim().toLowerCase())) throw new ServiceError('Essa pessoa já está na equipe.');
  commit(() =>
    e.equipe.push({ id: newId('m'), nome: input.nome.trim(), email: input.email.trim(), papel: input.papel, desde: isoDay(new Date()), convitePendente: true }),
  );
  auditar({ acao: 'Convidou membro da equipe', entidadeId, alvo: input.nome.trim(), detalhe: input.papel });
}

export async function removerMembro(entidadeId: string, membroId: string) {
  await delay();
  const e = daEntidade(entidadeId);
  const m = e.equipe.find((x) => x.id === membroId);
  if (!m) throw new ServiceError('Membro não encontrado.');
  if (m.papel === 'Administrador' && e.equipe.filter((x) => x.papel === 'Administrador').length === 1) {
    throw new ServiceError('A entidade precisa de ao menos um administrador. Convide outro antes de remover.');
  }
  commit(() => (e.equipe = e.equipe.filter((x) => x.id !== membroId)));
  auditar({ acao: 'Removeu membro da equipe', entidadeId, alvo: m.nome });
}
