// Notificações do app do voluntário, geradas a partir dos dados (nada é guardado além de "até quando já vi").
// Função pura: recebe os dados e o "agora", para dar para testar.
import { addDays, differenceInCalendarDays } from 'date-fns';
import type { Beneficio, Entidade, Evento, Oportunidade, Parceiro, Pedido, PreferenciasNotificacao, Voluntario } from '../types/domain';
import { isoDay, parseDate, type DadosCarteirinha } from './carteirinha';

export interface Notificacao {
  id: string;
  /** Quando aconteceu (ordena a lista e decide se é nova). */
  em: string;
  titulo: string;
  texto: string;
  link: string;
  tipo: 'cadastro' | 'acao' | 'ingresso' | 'beneficio' | 'carteirinha' | 'espera';
}

export interface EntradaNotificacoes {
  voluntario: Voluntario;
  carteirinha: DadosCarteirinha;
  entidades: Entidade[];
  oportunidades: Oportunidade[];
  pedidos: Pedido[];
  eventos: Evento[];
  beneficios: Beneficio[];
  parceiros: Parceiro[];
  /** Avisos guardados (ex.: vaga liberada da lista de espera). */
  avisos?: Array<{ id: string; em: string; titulo: string; texto: string; link: string }>;
  preferencias: PreferenciasNotificacao;
}

const plural = (n: number, um: string, varios: string) => (n === 1 ? um : varios);
/** Data e hora locais em ISO (UTC), para comparar com o "vistas em". */
const quando = (data: string, hora: string) => new Date(`${data}T${hora}`).toISOString();

export function gerarNotificacoes(d: EntradaNotificacoes, agora = new Date()): Notificacao[] {
  const lista: Notificacao[] = [];
  const hoje = isoDay(agora);
  const amanha = isoDay(addDays(agora, 1));
  const v = d.voluntario;

  if (v.aprovadoEm) {
    const entidade = d.entidades.find((e) => v.entidadeIds.includes(e.id))?.nome ?? 'A entidade';
    lista.push({
      id: `aprovado-${v.id}`,
      em: quando(v.aprovadoEm, '09:00:00'),
      titulo: 'Cadastro aprovado',
      texto: d.carteirinha.liberada
        ? `${entidade} aprovou seu cadastro. Sua carteirinha já está liberada.`
        : `${entidade} aprovou seu cadastro. No primeiro check-in, a carteirinha é liberada.`,
      link: '/app/carteirinha',
      tipo: 'cadastro',
    });
  }

  if (d.preferencias.lembretes) {
    d.oportunidades
      .filter((o) => o.data === amanha && o.inscritos.includes(v.id) && !o.encerradaEm)
      .forEach((o) =>
        lista.push({
          id: `amanha-${o.id}`,
          em: quando(hoje, '08:00:00'),
          titulo: 'Sua ação é amanhã',
          texto: `${o.titulo}, ${o.turno.toLowerCase()}, em ${o.local}. Leve o código de presença da carteirinha.`,
          link: '/app',
          tipo: 'acao',
        }),
      );
  }

  d.pedidos
    .filter((p) => p.voluntarioId === v.id && p.tipo === 'ingressos' && p.status === 'pago')
    .forEach((p) => {
      const evento = d.eventos.find((e) => e.id === p.eventoId);
      const n = p.ingressos?.reduce((s, i) => s + i.quantidade, 0) ?? 1;
      lista.push({
        id: `ingresso-${p.id}`,
        em: p.criadoEm,
        titulo: plural(n, 'Ingresso confirmado', 'Ingressos confirmados'),
        texto: `${n} ${plural(n, 'ingresso', 'ingressos')} para ${evento?.titulo ?? 'o evento'}. O QR de cada um está em Meus ingressos.`,
        link: '/app/ingressos',
        tipo: 'ingresso',
      });
    });

  if (d.preferencias.beneficios) {
    const parceiros = new Map(d.parceiros.filter((p) => p.status === 'aprovado').map((p) => [p.id, p.nome]));
    d.beneficios
      .filter((b) => b.status === 'aprovado' && b.aprovadoEm && parceiros.has(b.parceiroId) && differenceInCalendarDays(agora, parseDate(b.aprovadoEm)) <= 30 && b.aprovadoEm <= hoje)
      .forEach((b) =>
        lista.push({
          id: `beneficio-${b.id}`,
          em: quando(b.aprovadoEm!, '10:00:00'),
          titulo: 'Benefício novo',
          texto: `${b.titulo} na ${parceiros.get(b.parceiroId)}.`,
          link: '/app/beneficios',
          tipo: 'beneficio',
        }),
      );
  }

  if (d.preferencias.carteirinha && d.carteirinha.liberada && d.carteirinha.validaAte) {
    const dias = differenceInCalendarDays(parseDate(d.carteirinha.validaAte), agora);
    if (dias >= 0 && dias <= 30) {
      lista.push({
        id: `vence-${d.carteirinha.validaAte}`,
        em: quando(isoDay(addDays(parseDate(d.carteirinha.validaAte), -30)), '09:00:00'),
        titulo: `Sua carteirinha vence em ${dias} ${plural(dias, 'dia', 'dias')}`,
        texto: 'Participe de uma ação até lá: cada check-in renova a validade por mais 6 meses.',
        link: '/app/oportunidades',
        tipo: 'carteirinha',
      });
    }
  }

  for (const a of d.avisos ?? []) lista.push({ ...a, tipo: 'espera' });

  return lista.sort((a, b) => b.em.localeCompare(a.em));
}

/** Quantas são novas desde a última vez que a pessoa abriu a lista. */
export const naoVistas = (lista: Notificacao[], vistasEm?: string) => lista.filter((n) => !vistasEm || n.em > vistasEm).length;
