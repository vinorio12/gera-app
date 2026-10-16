import { commit, delay, getDb, newId } from '../mocks/db';
import { isoDay } from '../lib/carteirinha';
import { formatDateShort } from '../lib/format';
import { preencherVagas } from '../lib/listaEspera';
import type { Area, MockDb, Oportunidade } from '../types/domain';
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

function aberta(id: string): Oportunidade {
  const o = getDb().oportunidades.find((x) => x.id === id);
  if (!o) throw new ServiceError('Essa oportunidade não existe mais.');
  if (o.encerradaEm) throw new ServiceError('A entidade encerrou as inscrições desta ação.');
  if (o.data < isoDay(new Date())) throw new ServiceError('Essa ação já aconteceu.');
  return o;
}

export async function inscrever(oportunidadeId: string, voluntarioId: string) {
  await delay();
  const o = aberta(oportunidadeId);
  if (o.inscritos.length >= o.vagas) throw new ServiceError('As vagas acabaram. Entre na lista de espera: se alguém cancelar, a vaga é sua.');
  commit(() => {
    if (!o.inscritos.includes(voluntarioId)) o.inscritos.push(voluntarioId);
    o.espera = o.espera.filter((id) => id !== voluntarioId);
  });
}

/** Avisa quem saiu da fila e entrou na ação (aparece no sino do app). */
function avisarVagaLiberada(db: MockDb, o: Oportunidade, ids: string[]) {
  ids.forEach((voluntarioId) =>
    db.avisos.push({
      id: newId('av'),
      voluntarioId,
      em: new Date().toISOString(),
      titulo: 'Vaga liberada: você está inscrito',
      texto: `Abriu uma vaga em ${o.titulo} (${formatDateShort(o.data)}, ${o.turno.toLowerCase()}) e você era o próximo da lista de espera.`,
      link: '/app',
    }),
  );
}

/** Ao cancelar, a vaga vai para o primeiro da lista de espera, que recebe um aviso. */
export async function cancelarInscricao(oportunidadeId: string, voluntarioId: string) {
  await delay();
  commit((db) => {
    const o = db.oportunidades.find((x) => x.id === oportunidadeId);
    if (!o) return;
    o.inscritos = o.inscritos.filter((id) => id !== voluntarioId);
    if (!o.encerradaEm && o.data >= isoDay(new Date())) avisarVagaLiberada(db, o, preencherVagas(o));
  });
}

export async function entrarNaFila(oportunidadeId: string, voluntarioId: string) {
  await delay();
  const o = aberta(oportunidadeId);
  if (o.inscritos.includes(voluntarioId)) throw new ServiceError('Você já está inscrito nesta ação.');
  if (o.inscritos.length < o.vagas) throw new ServiceError('Ainda há vagas: faça a inscrição direto.');
  commit(() => {
    if (!o.espera.includes(voluntarioId)) o.espera.push(voluntarioId);
  });
  return o.espera.indexOf(voluntarioId) + 1;
}

export async function sairDaFila(oportunidadeId: string, voluntarioId: string) {
  await delay();
  commit((db) => {
    const o = db.oportunidades.find((x) => x.id === oportunidadeId);
    if (o) o.espera = o.espera.filter((id) => id !== voluntarioId);
  });
}

/** Quando a entidade aumenta as vagas, a fila anda (usado ao salvar a oportunidade). */
export function andarFila(db: MockDb, o: Oportunidade) {
  avisarVagaLiberada(db, o, preencherVagas(o));
}
