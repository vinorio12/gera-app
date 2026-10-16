import { commit, delay, getDb } from '../mocks/db';
import { dadosCarteirinha } from '../lib/carteirinha';
import { gerarNotificacoes, naoVistas, type Notificacao } from '../lib/notificacoes';
import { PREFERENCIAS_PADRAO } from './perfil';
import { ServiceError } from './voluntarios';

export interface MinhasNotificacoes {
  lista: Notificacao[];
  novas: number;
}

export async function listarNotificacoes(voluntarioId: string): Promise<MinhasNotificacoes> {
  await delay(150);
  const db = getDb();
  const v = db.voluntarios.find((x) => x.id === voluntarioId);
  if (!v) throw new ServiceError('Não encontramos seu cadastro.');
  const lista = gerarNotificacoes({
    voluntario: v,
    carteirinha: dadosCarteirinha(v, db.horas.filter((h) => h.voluntarioId === v.id)),
    entidades: db.entidades,
    oportunidades: db.oportunidades,
    pedidos: db.pedidos,
    eventos: db.eventos,
    beneficios: db.beneficios,
    parceiros: db.parceiros,
    avisos: db.avisos.filter((a) => a.voluntarioId === voluntarioId),
    preferencias: v.preferencias ?? PREFERENCIAS_PADRAO,
  });
  return { lista, novas: naoVistas(lista, v.notificacoesVistasEm) };
}

/** Abrir a lista zera o contador do sino. */
export async function marcarNotificacoesVistas(voluntarioId: string) {
  await delay(80);
  const v = getDb().voluntarios.find((x) => x.id === voluntarioId);
  if (v) commit(() => (v.notificacoesVistasEm = new Date().toISOString()));
}
