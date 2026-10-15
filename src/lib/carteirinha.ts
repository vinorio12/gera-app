// Regras da carteirinha digital. Funções puras: recebem os dados e o "agora".
import { addDays, format } from 'date-fns';
import { volunteerStatus, type VolunteerStatus } from '@gera/design-system';
import type { RegistroHoras, Voluntario } from '../types/domain';

/** Mesmo prazo da regra de status do design system (6 meses). */
const VALIDADE_DIAS = 182;

export const parseDate = (isoDate: string) => new Date(isoDate.length === 10 ? `${isoDate}T12:00:00` : isoDate);
export const isoDay = (d: Date) => format(d, 'yyyy-MM-dd');

export function ultimaAcao(registros: RegistroHoras[]): string | null {
  return registros.reduce<string | null>((max, r) => (!max || r.data > max ? r.data : max), null);
}

export function statusDoVoluntario(v: Voluntario, registros: RegistroHoras[], now = new Date()): VolunteerStatus {
  const ultima = ultimaAcao(registros);
  return volunteerStatus(
    { signupDate: parseDate(v.cadastroEm), lastActionDate: ultima ? parseDate(ultima) : null, dismissed: !!v.desligamento },
    now,
  );
}

export interface EtapaCarteirinha {
  id: 'cadastro' | 'termo' | 'aprovacao' | 'checkin';
  titulo: string;
  feito: boolean;
  pendente: string;
}

/** Os 4 passos para a carteirinha ficar ativa. Ela é consequência de uma ação validada, nunca só do cadastro. */
export function etapasCarteirinha(v: Voluntario, registros: RegistroHoras[]): EtapaCarteirinha[] {
  return [
    { id: 'cadastro', titulo: 'Cadastro concluído', feito: true, pendente: 'Complete seus dados no perfil.' },
    { id: 'termo', titulo: 'Termo de voluntariado aceito', feito: !!v.termoAceitoEm, pendente: 'Aceite o termo no seu perfil.' },
    { id: 'aprovacao', titulo: 'Aprovado pela entidade', feito: !!v.aprovadoEm, pendente: 'A entidade está analisando seu cadastro.' },
    { id: 'checkin', titulo: 'Primeiro check-in validado', feito: registros.length > 0, pendente: 'Participe de uma ação e mostre seu código no check-in.' },
  ];
}

export interface DadosCarteirinha {
  liberada: boolean;
  status: VolunteerStatus;
  etapas: EtapaCarteirinha[];
  /** Emitida na última ação validada e válida por 6 meses depois dela. */
  emitidaEm: string | null;
  validaAte: string | null;
  totalHoras: number;
}

export function dadosCarteirinha(v: Voluntario, registros: RegistroHoras[], now = new Date()): DadosCarteirinha {
  const etapas = etapasCarteirinha(v, registros);
  const ultima = ultimaAcao(registros);
  return {
    liberada: etapas.every((e) => e.feito) && !v.desligamento,
    status: statusDoVoluntario(v, registros, now),
    etapas,
    emitidaEm: ultima,
    validaAte: ultima ? isoDay(addDays(parseDate(ultima), VALIDADE_DIAS)) : null,
    totalHoras: registros.reduce((sum, r) => sum + r.horas, 0),
  };
}

export type Elegibilidade = { elegivel: true } | { elegivel: false; motivo: string };

/** O que o parceiro vê ao ler a carteirinha. */
export function elegibilidade(v: Voluntario, dados: DadosCarteirinha): Elegibilidade {
  if (v.desligamento) return { elegivel: false, motivo: 'Voluntário desligado da entidade.' };
  const falta = dados.etapas.find((e) => !e.feito);
  if (falta) return { elegivel: false, motivo: `Carteirinha ainda não liberada: falta "${falta.titulo.toLowerCase()}".` };
  if (dados.status !== 'ativo') return { elegivel: false, motivo: 'Sem ações validadas nos últimos 6 meses.' };
  return { elegivel: true };
}

// ---------- QR temporário ----------
// No protótipo o código muda a cada minuto e leva um verificador simples. Na versão real o token
// vem assinado pelo servidor; a leitura continua aceitando o número digitado como alternativa.

export const QR_JANELA_MS = 60_000;
const TOLERANCIA_JANELAS = 2;

function verificador(texto: string) {
  let h = 0x811c9dc5;
  for (const ch of texto) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193);
  return (h >>> 0).toString(36).slice(0, 5);
}

export function tokenCarteirinha(registro: string, now = Date.now()) {
  const janela = Math.floor(now / QR_JANELA_MS);
  return `GERA:${registro}:${janela}:${verificador(`${registro}:${janela}`)}`;
}

export function normalizarRegistro(texto: string): string | null {
  const m = texto.toUpperCase().replace(/\s/g, '').match(/^JS-?(\d{4})-?(\d{6})$/);
  return m ? `JS-${m[1]}-${m[2]}` : null;
}

/** Lê o que veio da câmera ou do teclado: um QR da carteirinha ou o número digitado. */
export function lerCodigo(entrada: string, now = Date.now()): { registro: string } | { erro: string } {
  const texto = entrada.trim();
  if (texto.startsWith('GERA:')) {
    const [, registro = '', janelaTxt = '', chk = ''] = texto.split(':');
    const janela = Number(janelaTxt);
    if (verificador(`${registro}:${janela}`) !== chk) return { erro: 'Esse QR não é de uma carteirinha GERA.' };
    if (Math.abs(Math.floor(now / QR_JANELA_MS) - janela) > TOLERANCIA_JANELAS) {
      return { erro: 'Esse QR expirou. Peça para a pessoa abrir a carteirinha de novo.' };
    }
    return { registro };
  }
  const registro = normalizarRegistro(texto);
  return registro ? { registro } : { erro: 'Digite o número como aparece na carteirinha, por exemplo JS-2026-004812.' };
}
