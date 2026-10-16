import { commit, delay, getDb } from '../mocks/db';
import { auditar } from './sessao';
import { dadosCarteirinha, isoDay, statusDoVoluntario, ultimaAcao, type DadosCarteirinha } from '../lib/carteirinha';
import type { VolunteerStatus } from '@gera/design-system';
import type { Entidade, Oportunidade, RegistroHoras, Voluntario } from '../types/domain';

/** Erro com mensagem pronta para a pessoa ler. */
export class ServiceError extends Error {}

export interface VoluntarioResumo {
  voluntario: Voluntario;
  status: VolunteerStatus;
  totalHoras: number;
  ultimaAcao: string | null;
}

const registrosDe = (voluntarioId: string, entidadeId?: string) =>
  getDb().horas.filter((h) => h.voluntarioId === voluntarioId && (!entidadeId || h.entidadeId === entidadeId));

function resumir(v: Voluntario, entidadeId?: string): VoluntarioResumo {
  const todos = registrosDe(v.id);
  const daEntidade = entidadeId ? todos.filter((h) => h.entidadeId === entidadeId) : todos;
  return {
    voluntario: v,
    // O status considera ações em qualquer entidade; as horas, só as da entidade que está olhando.
    status: statusDoVoluntario(v, todos),
    totalHoras: daEntidade.reduce((s, h) => s + h.horas, 0),
    ultimaAcao: ultimaAcao(daEntidade),
  };
}

const nomeDe = (id: string) => getDb().voluntarios.find((v) => v.id === id)?.nome ?? '';

/** Multi-tenant: a entidade só recebe os próprios voluntários. */
function daEntidade(id: string, entidadeId: string): Voluntario {
  const v = getDb().voluntarios.find((x) => x.id === id && x.entidadeIds.includes(entidadeId));
  if (!v) throw new ServiceError('Voluntário não encontrado nesta entidade.');
  return v;
}

export async function listarVoluntariosDaEntidade(entidadeId: string): Promise<VoluntarioResumo[]> {
  await delay();
  return getDb()
    .voluntarios.filter((v) => v.entidadeIds.includes(entidadeId))
    .map((v) => resumir(v, entidadeId))
    .sort((a, b) => a.voluntario.nome.localeCompare(b.voluntario.nome, 'pt-BR'));
}

export interface PerfilVoluntario extends VoluntarioResumo {
  registros: RegistroHoras[];
  carteirinha: DadosCarteirinha;
}

export async function obterVoluntarioDaEntidade(id: string, entidadeId: string): Promise<PerfilVoluntario> {
  await delay();
  const v = daEntidade(id, entidadeId);
  const registros = registrosDe(id, entidadeId).sort((a, b) => b.data.localeCompare(a.data));
  return { ...resumir(v, entidadeId), registros, carteirinha: dadosCarteirinha(v, registrosDe(id)) };
}

export async function aprovarVoluntario(id: string, entidadeId: string) {
  await delay();
  daEntidade(id, entidadeId);
  commit((db) => {
    const v = db.voluntarios.find((x) => x.id === id)!;
    v.aprovadoEm = isoDay(new Date());
  });
  auditar({ acao: 'Aprovou cadastro', entidadeId, alvo: nomeDe(id) });
}

export async function desligarVoluntario(id: string, entidadeId: string, motivo: string) {
  await delay();
  if (!motivo.trim()) throw new ServiceError('Escreva o motivo do desligamento.');
  daEntidade(id, entidadeId);
  commit((db) => {
    db.voluntarios.find((x) => x.id === id)!.desligamento = { em: isoDay(new Date()), motivo: motivo.trim() };
  });
  auditar({ acao: 'Desligou voluntário', entidadeId, alvo: nomeDe(id), detalhe: motivo.trim() });
}

export async function reativarVoluntario(id: string, entidadeId: string) {
  await delay();
  daEntidade(id, entidadeId);
  commit((db) => {
    db.voluntarios.find((x) => x.id === id)!.desligamento = null;
  });
  auditar({ acao: 'Reativou voluntário', entidadeId, alvo: nomeDe(id) });
}

export async function listarEntidades(): Promise<Entidade[]> {
  await delay();
  // Só as entidades no ar: as que esperam aprovação do comitê ficam de fora dos filtros e do cadastro.
  return getDb().entidades.filter((e) => e.ativa).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

// ---------- Visão do próprio voluntário ----------

export interface MeuPainel {
  voluntario: Voluntario;
  entidades: Entidade[];
  carteirinha: DadosCarteirinha;
  registros: RegistroHoras[];
  horasNoMes: number;
  horasNoAno: number;
  proximas: Oportunidade[];
  sugestoes: Oportunidade[];
}

export async function obterMeuPainel(voluntarioId: string): Promise<MeuPainel> {
  await delay();
  const db = getDb();
  const v = db.voluntarios.find((x) => x.id === voluntarioId);
  if (!v) throw new ServiceError('Não encontramos seu cadastro.');
  const registros = registrosDe(v.id).sort((a, b) => b.data.localeCompare(a.data));
  const hoje = isoDay(new Date());
  const futuras = db.oportunidades.filter((o) => o.data >= hoje && !o.encerradaEm).sort((a, b) => a.data.localeCompare(b.data));
  return {
    voluntario: v,
    entidades: db.entidades.filter((e) => v.entidadeIds.includes(e.id)),
    carteirinha: dadosCarteirinha(v, registros),
    registros,
    horasNoMes: registros.filter((r) => r.data.startsWith(hoje.slice(0, 7))).reduce((s, r) => s + r.horas, 0),
    horasNoAno: registros.filter((r) => r.data.startsWith(hoje.slice(0, 4))).reduce((s, r) => s + r.horas, 0),
    proximas: futuras.filter((o) => o.inscritos.includes(v.id)),
    sugestoes: futuras.filter((o) => !o.inscritos.includes(v.id) && v.areas.includes(o.area)).slice(0, 3),
  };
}
