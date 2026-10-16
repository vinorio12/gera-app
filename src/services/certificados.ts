// Certificados de horas: emissão pela entidade (em lote ou um a um), lista do voluntário e validação pública.
import { commit, delay, getDb, newId } from '../mocks/db';
import { isoDay } from '../lib/carteirinha';
import type { Certificado } from '../types/domain';
import type { Periodo } from './indicadores';
import { atorAtual, auditar } from './sessao';
import { ServiceError } from './voluntarios';

const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Código curto, sem letras que confundem (I, O, 0, 1), ex.: GERA-7K2M-4QXA. */
export function gerarCodigoCertificado(aleatorio: () => number = Math.random) {
  const bloco = () => Array.from({ length: 4 }, () => LETRAS[Math.floor(aleatorio() * LETRAS.length)]).join('');
  return `GERA-${bloco()}-${bloco()}`;
}

/** Aceita o código com ou sem hífens e em minúsculas. */
export function normalizarCodigoCertificado(texto: string): string | null {
  const limpo = texto.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const m = limpo.match(/^GERA([A-Z0-9]{4})([A-Z0-9]{4})$/);
  return m ? `GERA-${m[1]}-${m[2]}` : null;
}

/** Soma as horas de um voluntário numa entidade dentro do período. */
export function horasNoPeriodo(registros: Array<{ voluntarioId: string; entidadeId: string; data: string; horas: number }>, voluntarioId: string, entidadeId: string, p: Periodo) {
  return registros.filter((r) => r.voluntarioId === voluntarioId && r.entidadeId === entidadeId && r.data >= p.inicio && r.data <= p.fim).reduce((s, r) => s + r.horas, 0);
}

export interface Elegivel {
  voluntarioId: string;
  nome: string;
  horas: number;
  acoes: number;
  /** Já tem certificado com exatamente esse período. */
  jaEmitido: boolean;
}

export async function listarElegiveis(input: { entidadeId: string; periodo: Periodo }): Promise<Elegivel[]> {
  await delay();
  const db = getDb();
  const doPeriodo = db.horas.filter((h) => h.entidadeId === input.entidadeId && h.data >= input.periodo.inicio && h.data <= input.periodo.fim);
  const ids = [...new Set(doPeriodo.map((h) => h.voluntarioId))];
  return ids
    .map((id) => {
      const v = db.voluntarios.find((x) => x.id === id)!;
      const regs = doPeriodo.filter((h) => h.voluntarioId === id);
      return {
        voluntarioId: id,
        nome: v.nome,
        horas: regs.reduce((s, h) => s + h.horas, 0),
        acoes: regs.length,
        jaEmitido: db.certificados.some(
          (c) => c.voluntarioId === id && c.entidadeId === input.entidadeId && c.inicio === input.periodo.inicio && c.fim === input.periodo.fim,
        ),
      };
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

export interface CertificadoDetalhado extends Certificado {
  nome: string;
  entidadeNome: string;
}

const detalhar = (c: Certificado): CertificadoDetalhado => {
  const db = getDb();
  return {
    ...c,
    nome: db.voluntarios.find((v) => v.id === c.voluntarioId)?.nome ?? '',
    entidadeNome: db.entidades.find((e) => e.id === c.entidadeId)?.nome ?? '',
  };
};

export async function emitirCertificados(input: { entidadeId: string; periodo: Periodo; voluntarioIds: string[] }): Promise<CertificadoDetalhado[]> {
  await delay(400);
  const db = getDb();
  const { inicio, fim } = input.periodo;
  if (!inicio || !fim || fim < inicio) throw new ServiceError('Escolha um período válido.');
  if (fim > isoDay(new Date())) throw new ServiceError('O período não pode terminar no futuro.');
  if (input.voluntarioIds.length === 0) throw new ServiceError('Escolha ao menos um voluntário.');
  const usados = new Set(db.certificados.map((c) => c.codigo));
  const novos: Certificado[] = [];
  for (const voluntarioId of input.voluntarioIds) {
    const v = db.voluntarios.find((x) => x.id === voluntarioId && x.entidadeIds.includes(input.entidadeId));
    if (!v) throw new ServiceError('Um dos voluntários não é desta entidade.');
    const horas = horasNoPeriodo(db.horas, voluntarioId, input.entidadeId, input.periodo);
    if (horas <= 0) throw new ServiceError(`${v.nome} não tem horas nesse período.`);
    let codigo = gerarCodigoCertificado();
    while (usados.has(codigo)) codigo = gerarCodigoCertificado();
    usados.add(codigo);
    novos.push({ id: newId('cert'), codigo, voluntarioId, entidadeId: input.entidadeId, horas, inicio, fim, emitidoEm: isoDay(new Date()), emitidoPor: atorAtual() });
  }
  commit((d) => d.certificados.push(...novos));
  auditar({
    acao: 'Emitiu certificados',
    entidadeId: input.entidadeId,
    alvo: novos.length === 1 ? detalhar(novos[0]!).nome : `${novos.length} voluntários`,
    detalhe: `Período de ${inicio} a ${fim}`,
  });
  return novos.map(detalhar);
}

export async function listarCertificadosDaEntidade(entidadeId: string): Promise<CertificadoDetalhado[]> {
  await delay();
  return getDb()
    .certificados.filter((c) => c.entidadeId === entidadeId)
    .sort((a, b) => b.emitidoEm.localeCompare(a.emitidoEm) || b.id.localeCompare(a.id))
    .map(detalhar);
}

export async function listarMeusCertificados(voluntarioId: string): Promise<CertificadoDetalhado[]> {
  await delay();
  return getDb()
    .certificados.filter((c) => c.voluntarioId === voluntarioId)
    .sort((a, b) => b.fim.localeCompare(a.fim))
    .map(detalhar);
}

/** Validação pública: mostra só nome, entidade, horas, período e emissão. */
export async function validarCertificado(texto: string): Promise<CertificadoDetalhado> {
  await delay();
  const codigo = normalizarCodigoCertificado(texto);
  if (!codigo) throw new ServiceError('O código tem o formato GERA-XXXX-XXXX. Confira e tente de novo.');
  const c = getDb().certificados.find((x) => x.codigo === codigo);
  if (!c) throw new ServiceError('Não existe certificado com esse código. Ele pode ter sido digitado errado.');
  return detalhar(c);
}
