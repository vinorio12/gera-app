import { commit, delay, getDb } from '../mocks/db';
import { isoDay } from '../lib/carteirinha';
import type { Area, Oportunidade } from '../types/domain';
import { ServiceError } from './voluntarios';

export interface OportunidadeComEntidade extends Oportunidade {
  entidadeNome: string;
}

export async function listarOportunidadesAbertas(filtro: { area?: Area } = {}): Promise<OportunidadeComEntidade[]> {
  await delay();
  const db = getDb();
  const hoje = isoDay(new Date());
  const nomes = new Map(db.entidades.map((e) => [e.id, e.nome]));
  return db.oportunidades
    .filter((o) => o.data >= hoje && !o.encerradaEm && (!filtro.area || o.area === filtro.area))
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((o) => ({ ...o, entidadeNome: nomes.get(o.entidadeId) ?? '' }));
}

export async function inscrever(oportunidadeId: string, voluntarioId: string) {
  await delay();
  const o = getDb().oportunidades.find((x) => x.id === oportunidadeId);
  if (!o) throw new ServiceError('Essa oportunidade não existe mais.');
  if (o.encerradaEm) throw new ServiceError('A entidade encerrou as inscrições desta ação.');
  if (o.inscritos.length >= o.vagas) throw new ServiceError('As vagas acabaram. Que tal outra data?');
  commit(() => {
    if (!o.inscritos.includes(voluntarioId)) o.inscritos.push(voluntarioId);
  });
}

export async function cancelarInscricao(oportunidadeId: string, voluntarioId: string) {
  await delay();
  commit((db) => {
    const o = db.oportunidades.find((x) => x.id === oportunidadeId);
    if (o) o.inscritos = o.inscritos.filter((id) => id !== voluntarioId);
  });
}
