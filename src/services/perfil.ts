// Perfil do voluntário: dados, disponibilidade, áreas, notificações, termo aceito e LGPD.
import { commit, delay, getDb, newId } from '../mocks/db';
import { isoDay } from '../lib/carteirinha';
import type { Area, PedidoExclusao, PreferenciasNotificacao, Voluntario } from '../types/domain';
import { AREAS } from '../types/domain';
import { auditar } from './sessao';
import { ServiceError } from './voluntarios';

function doVoluntario(id: string): Voluntario {
  const v = getDb().voluntarios.find((x) => x.id === id);
  if (!v) throw new ServiceError('Não encontramos seu cadastro.');
  return v;
}

export const PREFERENCIAS_PADRAO: PreferenciasNotificacao = { canais: ['app', 'email'], oportunidades: true, lembretes: true, beneficios: true, carteirinha: true };

export interface MeuPerfil {
  voluntario: Voluntario;
  entidades: string[];
  termo: { versao: string | null; aceitoEm: string | null; vigente: string; texto: string };
  pedidoExclusao: PedidoExclusao | null;
}

export async function obterMeuPerfil(voluntarioId: string): Promise<MeuPerfil> {
  await delay();
  const db = getDb();
  const v = doVoluntario(voluntarioId);
  return {
    voluntario: structuredClone({ ...v, preferencias: v.preferencias ?? PREFERENCIAS_PADRAO }),
    entidades: db.entidades.filter((e) => v.entidadeIds.includes(e.id)).map((e) => e.nome),
    termo: { versao: v.termoVersao ?? null, aceitoEm: v.termoAceitoEm, vigente: db.comite.termo.versao, texto: db.comite.termo.texto },
    pedidoExclusao: db.pedidosExclusao.find((p) => p.voluntarioId === voluntarioId && !p.atendidoEm) ?? null,
  };
}

export interface DadosPerfil {
  nome: string;
  email: string;
  telefone: string;
  formacao: string;
  profissao: string;
  empresa: string;
  disponibilidade: string[];
  areas: Area[];
  usaFormacao: boolean;
}

export async function salvarMeuPerfil(voluntarioId: string, d: DadosPerfil) {
  await delay();
  const v = doVoluntario(voluntarioId);
  if (d.nome.trim().length < 3 || !d.nome.trim().includes(' ')) throw new ServiceError('Escreva nome e sobrenome.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) throw new ServiceError('Confira o e-mail.');
  if (!/^\d{10,11}$/.test(d.telefone.replace(/\D/g, ''))) throw new ServiceError('Informe o telefone com DDD.');
  if (d.areas.length === 0 || d.areas.some((a) => !AREAS.includes(a))) throw new ServiceError('Escolha ao menos uma área de interesse.');
  if (d.disponibilidade.length === 0) throw new ServiceError('Marque ao menos um dia e turno.');
  commit(() =>
    Object.assign(v, {
      nome: d.nome.trim(),
      email: d.email.trim(),
      telefone: d.telefone.trim(),
      formacao: d.formacao.trim(),
      profissao: d.profissao.trim(),
      empresa: d.empresa.trim(),
      disponibilidade: d.disponibilidade,
      areas: d.areas,
      usaFormacao: d.usaFormacao,
    }),
  );
}

export async function salvarPreferencias(voluntarioId: string, p: PreferenciasNotificacao) {
  await delay(150);
  const v = doVoluntario(voluntarioId);
  if (p.canais.length === 0) throw new ServiceError('Deixe ao menos um canal ligado.');
  commit(() => (v.preferencias = { ...p }));
}

/** LGPD: tudo o que a GERA guarda sobre a pessoa, num JSON legível. */
export async function exportarMeusDados(voluntarioId: string) {
  await delay();
  const db = getDb();
  const v = doVoluntario(voluntarioId);
  const pedidos = db.pedidos.filter((p) => p.voluntarioId === voluntarioId);
  return {
    geradoEm: new Date().toISOString(),
    aviso: 'Dados pessoais guardados pela plataforma GERA (Comitê Social ACIJS), conforme a LGPD.',
    cadastro: v,
    entidades: db.entidades.filter((e) => v.entidadeIds.includes(e.id)).map((e) => ({ id: e.id, nome: e.nome })),
    bancoDeHoras: db.horas.filter((h) => h.voluntarioId === voluntarioId),
    inscricoes: db.oportunidades.filter((o) => o.inscritos.includes(voluntarioId)).map((o) => ({ id: o.id, titulo: o.titulo, data: o.data })),
    pedidos,
    ingressos: db.ingressosEmitidos.filter((i) => pedidos.some((p) => p.id === i.pedidoId)),
    certificados: db.certificados.filter((c) => c.voluntarioId === voluntarioId),
    usosDeBeneficios: db.resgates.filter((r) => r.voluntarioId === voluntarioId),
    pedidosDeExclusao: db.pedidosExclusao.filter((p) => p.voluntarioId === voluntarioId),
  };
}

export async function pedirExclusao(voluntarioId: string, motivo: string): Promise<PedidoExclusao> {
  await delay();
  const db = getDb();
  const v = doVoluntario(voluntarioId);
  const aberto = db.pedidosExclusao.find((p) => p.voluntarioId === voluntarioId && !p.atendidoEm);
  if (aberto) throw new ServiceError('Você já tem um pedido de exclusão em andamento.');
  const pedido: PedidoExclusao = { id: newId('lgpd'), voluntarioId, nome: v.nome, email: v.email, pedidoEm: new Date().toISOString(), motivo: motivo.trim(), atendidoEm: null };
  commit((d) => d.pedidosExclusao.push(pedido));
  auditar({ acao: 'Pediu exclusão dos dados (LGPD)', entidadeId: v.entidadeIds[0] ?? null, alvo: v.nome, detalhe: motivo.trim() || undefined });
  return pedido;
}

// ---------- Comitê ----------

export async function listarPedidosExclusao(): Promise<PedidoExclusao[]> {
  await delay();
  return [...getDb().pedidosExclusao].sort((a, b) => Number(!!a.atendidoEm) - Number(!!b.atendidoEm) || b.pedidoEm.localeCompare(a.pedidoEm));
}

/** No protótipo, só registra o atendimento; com a API, anonimiza o cadastro e apaga o que a lei permite. */
export async function atenderPedidoExclusao(id: string) {
  await delay();
  const p = getDb().pedidosExclusao.find((x) => x.id === id);
  if (!p) throw new ServiceError('Pedido não encontrado.');
  commit(() => (p.atendidoEm = isoDay(new Date())));
  auditar({ acao: 'Atendeu pedido de exclusão (LGPD)', entidadeId: null, alvo: p.nome });
}
