// "Adicionar à agenda" (.ics) e "Compartilhar no WhatsApp" para oportunidades, eventos e campanhas.
import { addDays, addHours } from 'date-fns';
import type { Campanha, Evento, Oportunidade, Turno } from '../types/domain';
import { parseDate } from './carteirinha';
import { formatDateShort } from './format';

export interface EventoAgenda {
  uid: string;
  titulo: string;
  descricao: string;
  local: string;
  inicio: Date;
  fim: Date;
  /** Dia inteiro (prazo de campanha). */
  diaInteiro?: boolean;
  url?: string;
}

const INICIO_DO_TURNO: Record<Turno, number> = { Manhã: 8, Tarde: 14, Noite: 19 };

export function agendaDaOportunidade(o: Oportunidade & { entidadeNome?: string }, url?: string): EventoAgenda {
  const inicio = parseDate(o.data);
  inicio.setHours(INICIO_DO_TURNO[o.turno], 0, 0, 0);
  return {
    uid: `oportunidade-${o.id}@gera`,
    titulo: `Voluntariado: ${o.titulo}`,
    descricao: `${o.descricao}${o.entidadeNome ? ` Organização: ${o.entidadeNome}.` : ''} Leve o código de presença da carteirinha GERA.`,
    local: o.local,
    inicio,
    fim: addHours(inicio, o.horas),
    url,
  };
}

/** "19h30" → 19:30; sem horário legível, 19h. Eventos ficam com 3 horas na agenda. */
export function agendaDoEvento(e: Evento & { entidadeNome?: string }, url?: string): EventoAgenda {
  const m = e.horario.match(/(\d{1,2})\s*h\s*(\d{2})?/i) ?? e.horario.match(/(\d{1,2}):(\d{2})/);
  const inicio = parseDate(e.data);
  inicio.setHours(m ? Number(m[1]) : 19, m?.[2] ? Number(m[2]) : 0, 0, 0);
  return {
    uid: `evento-${e.id}@gera`,
    titulo: e.titulo,
    descricao: `${e.descricao}${e.entidadeNome ? ` Organização: ${e.entidadeNome}.` : ''}`,
    local: e.local,
    inicio,
    fim: addHours(inicio, 3),
    url,
  };
}

/** A campanha entra na agenda como lembrete no último dia para apoiar. */
export function agendaDaCampanha(c: Campanha & { entidadeNome?: string }, url?: string): EventoAgenda {
  const inicio = parseDate(c.terminaEm);
  inicio.setHours(0, 0, 0, 0);
  return {
    uid: `campanha-${c.id}@gera`,
    titulo: `Último dia para apoiar: ${c.titulo}`,
    descricao: `${c.historia}${c.entidadeNome ? ` ${c.entidadeNome}.` : ''}`,
    local: 'Jaraguá do Sul',
    inicio,
    fim: addDays(inicio, 1),
    diaInteiro: true,
    url,
  };
}

const dois = (n: number) => String(n).padStart(2, '0');
const utc = (d: Date) =>
  `${d.getUTCFullYear()}${dois(d.getUTCMonth() + 1)}${dois(d.getUTCDate())}T${dois(d.getUTCHours())}${dois(d.getUTCMinutes())}00Z`;
const dia = (d: Date) => `${d.getFullYear()}${dois(d.getMonth() + 1)}${dois(d.getDate())}`;
/** Texto no padrão iCalendar: escapa vírgula, ponto e vírgula, barra e quebra de linha. */
const escapar = (t: string) => t.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Arquivo .ics (RFC 5545) com um evento. Quebra de linha CRLF, como pede a norma. */
export function gerarIcs(e: EventoAgenda, agora = new Date()): string {
  const linhas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Comite Social ACIJS//GERA//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${e.uid}`,
    `DTSTAMP:${utc(agora)}`,
    ...(e.diaInteiro ? [`DTSTART;VALUE=DATE:${dia(e.inicio)}`, `DTEND;VALUE=DATE:${dia(e.fim)}`] : [`DTSTART:${utc(e.inicio)}`, `DTEND:${utc(e.fim)}`]),
    `SUMMARY:${escapar(e.titulo)}`,
    `DESCRIPTION:${escapar(e.descricao + (e.url ? ` ${e.url}` : ''))}`,
    `LOCATION:${escapar(e.local)}`,
    ...(e.url ? [`URL:${e.url}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `${linhas.join('\r\n')}\r\n`;
}

/** Link do WhatsApp com o texto pronto (a pessoa escolhe para quem mandar). */
export const linkWhatsApp = (texto: string, telefone?: string) =>
  `https://wa.me/${telefone ? `55${telefone.replace(/\D/g, '')}` : ''}?text=${encodeURIComponent(texto)}`;

export const textoCompartilharOportunidade = (o: Oportunidade & { entidadeNome?: string }, url: string) =>
  `Bora ser voluntário comigo? ${o.titulo}${o.entidadeNome ? ` com a ${o.entidadeNome}` : ''}, ${formatDateShort(o.data)} (${o.turno.toLowerCase()}). Inscrição na GERA: ${url}`;
export const textoCompartilharEvento = (e: Evento & { entidadeNome?: string }, url: string) =>
  `${e.titulo}${e.entidadeNome ? `, da ${e.entidadeNome}` : ''}: ${formatDateShort(e.data)}, ${e.horario}, ${e.local}. Ingressos na GERA: ${url}`;
export const textoCompartilharCampanha = (c: Campanha & { entidadeNome?: string }, url: string) =>
  `Ajude a ${c.entidadeNome ?? 'entidade'} na campanha "${c.titulo}". Cada real empurra a meta: ${url}`;
