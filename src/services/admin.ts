// Visão do Comitê Social ACIJS: todas as entidades, voluntários, eventos e campanhas, configurações e auditoria.
import { format } from 'date-fns';
import type { VolunteerStatus } from '@gera/design-system';
import { commit, delay, getDb, newId } from '../mocks/db';
import { isoDay, statusDoVoluntario, ultimaAcao } from '../lib/carteirinha';
import { slugUnico } from '../lib/slug';
import type { Area, Campanha, Comite, Entidade, Evento, RegistroAuditoria, Voluntario } from '../types/domain';
import type { Periodo } from './indicadores';
import { auditar } from './sessao';
import { ServiceError } from './voluntarios';

const dentro = (data: string, p: Periodo) => data.slice(0, 10) >= p.inicio && data.slice(0, 10) <= p.fim;
const centavos = (v: number) => Math.round(v * 100) / 100;

// ---------- Entidades ----------

export interface EntidadeAdmin extends Entidade {
  status: 'ativa' | 'pendente' | 'inativa';
  voluntariosAtivos: number;
  horasNoMes: number;
  arrecadadoNoMes: number;
  arrecadado12m: number;
}

export async function listarEntidadesAdmin(): Promise<EntidadeAdmin[]> {
  await delay();
  const db = getDb();
  const mes = format(new Date(), 'yyyy-MM');
  const desde = isoDay(new Date(new Date().setFullYear(new Date().getFullYear() - 1)));
  return db.entidades
    .map((e) => ({
      ...e,
      status: (!e.aprovadaEm ? 'pendente' : e.ativa ? 'ativa' : 'inativa') as EntidadeAdmin['status'],
      voluntariosAtivos: db.voluntarios.filter(
        (v) => v.entidadeIds.includes(e.id) && statusDoVoluntario(v, db.horas.filter((h) => h.voluntarioId === v.id)) === 'ativo',
      ).length,
      horasNoMes: db.horas.filter((h) => h.entidadeId === e.id && h.data.startsWith(mes)).reduce((s, h) => s + h.horas, 0),
      arrecadadoNoMes: centavos(db.entradas.filter((x) => x.entidadeId === e.id && x.data.startsWith(mes)).reduce((s, x) => s + x.valor, 0)),
      arrecadado12m: centavos(db.entradas.filter((x) => x.entidadeId === e.id && x.data >= desde).reduce((s, x) => s + x.valor, 0)),
    }))
    // Pendentes primeiro: é o que pede ação do comitê.
    .sort((a, b) => Number(b.status === 'pendente') - Number(a.status === 'pendente') || a.nome.localeCompare(b.nome, 'pt-BR'));
}

export interface NovaEntidade {
  nome: string;
  causa: string;
  areas: Area[];
  bairro: string;
  cnpj: string;
  email: string;
  telefone: string;
  responsavel: string;
}

export async function cadastrarEntidade(d: NovaEntidade): Promise<Entidade> {
  await delay();
  const db = getDb();
  if (d.nome.trim().length < 3) throw new ServiceError('Informe o nome da entidade.');
  if (d.causa.trim().length < 10) throw new ServiceError('Descreva a causa em uma frase.');
  if (d.areas.length === 0) throw new ServiceError('Escolha ao menos uma área.');
  if (d.cnpj.replace(/\D/g, '').length !== 14) throw new ServiceError('O CNPJ tem 14 números.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) throw new ServiceError('Confira o e-mail.');
  if (d.responsavel.trim().length < 3) throw new ServiceError('Informe quem responde pela entidade.');
  if (db.entidades.some((e) => e.cnpj.replace(/\D/g, '') === d.cnpj.replace(/\D/g, ''))) throw new ServiceError('Já existe uma entidade com esse CNPJ.');
  const hoje = isoDay(new Date());
  const slug = slugUnico(d.nome, db.entidades.map((e) => e.slug));
  const e: Entidade = {
    id: slug,
    slug,
    nome: d.nome.trim(),
    causa: d.causa.trim(),
    areas: d.areas,
    bairro: d.bairro.trim(),
    // Cadastrada pelo comitê: já entra aprovada.
    ativa: true,
    aprovadaEm: hoje,
    cnpj: d.cnpj.trim(),
    email: d.email.trim(),
    telefone: d.telefone.trim(),
    responsavel: d.responsavel.trim(),
    corDestaque: 'portal-impulsionar',
    equipe: [{ id: newId('m'), nome: d.responsavel.trim(), email: d.email.trim(), papel: 'Administrador', desde: hoje, convitePendente: true }],
  };
  commit((x) => x.entidades.push(e));
  auditar({ acao: 'Cadastrou entidade', entidadeId: e.id, alvo: e.nome });
  return e;
}

export async function aprovarEntidade(id: string) {
  await delay();
  const e = getDb().entidades.find((x) => x.id === id);
  if (!e) throw new ServiceError('Entidade não encontrada.');
  commit(() => {
    e.ativa = true;
    e.aprovadaEm = isoDay(new Date());
  });
  auditar({ acao: 'Aprovou entidade', entidadeId: id, alvo: e.nome });
}

// ---------- Voluntários de todas as entidades ----------

export interface VoluntarioAdmin {
  voluntario: Voluntario;
  status: VolunteerStatus;
  entidades: string[];
  totalHoras: number;
  ultimaAcao: string | null;
}

export async function listarTodosVoluntarios(): Promise<VoluntarioAdmin[]> {
  await delay();
  const db = getDb();
  const nomes = new Map(db.entidades.map((e) => [e.id, e.nome]));
  return db.voluntarios
    .map((v) => {
      const regs = db.horas.filter((h) => h.voluntarioId === v.id);
      return {
        voluntario: v,
        status: statusDoVoluntario(v, regs),
        entidades: v.entidadeIds.map((id) => nomes.get(id) ?? ''),
        totalHoras: regs.reduce((s, h) => s + h.horas, 0),
        ultimaAcao: ultimaAcao(regs),
      };
    })
    .sort((a, b) => a.voluntario.nome.localeCompare(b.voluntario.nome, 'pt-BR'));
}

/** CPF só com os 6 dígitos do meio (LGPD), ex.: ***.456.789-**. */
export const mascararCpf = (cpf: string) => {
  const d = cpf.replace(/\D/g, '');
  return d.length === 11 ? `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**` : '***';
};

// ---------- Eventos e campanhas consolidados ----------

export interface EventoAdmin extends Evento {
  entidadeNome: string;
  vendidos: number;
  total: number;
  checkIns: number;
  receita: number;
}

export async function listarEventosAdmin(f: { entidadeId?: string } = {}): Promise<EventoAdmin[]> {
  await delay();
  const db = getDb();
  const nomes = new Map(db.entidades.map((e) => [e.id, e.nome]));
  return db.eventos
    .filter((e) => !f.entidadeId || e.entidadeId === f.entidadeId)
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((e) => ({
      ...e,
      entidadeNome: nomes.get(e.entidadeId) ?? '',
      vendidos: e.ingressos.reduce((s, i) => s + i.vendidos, 0),
      total: e.ingressos.reduce((s, i) => s + i.total, 0),
      checkIns: db.ingressosEmitidos.filter((i) => i.eventoId === e.id && i.usadoEm).length,
      receita: centavos(e.ingressos.reduce((s, i) => s + i.vendidos * i.preco, 0)),
    }));
}

export interface CampanhaAdmin extends Campanha {
  entidadeNome: string;
  noPeriodo: number;
  encerrada: boolean;
}

export async function listarCampanhasAdmin(f: { entidadeId?: string; periodo: Periodo }): Promise<CampanhaAdmin[]> {
  await delay();
  const db = getDb();
  const nomes = new Map(db.entidades.map((e) => [e.id, e.nome]));
  const hoje = isoDay(new Date());
  return db.campanhas
    .filter((c) => !f.entidadeId || c.entidadeId === f.entidadeId)
    .map((c) => ({
      ...c,
      entidadeNome: nomes.get(c.entidadeId) ?? '',
      noPeriodo: centavos(db.entradas.filter((e) => e.campanhaId === c.id && dentro(e.data, f.periodo)).reduce((s, e) => s + e.valor, 0)),
      encerrada: c.terminaEm < hoje,
    }))
    .sort((a, b) => Number(a.encerrada) - Number(b.encerrada) || a.terminaEm.localeCompare(b.terminaEm));
}

// ---------- Comitê, termo e administradores ----------

export async function obterComite(): Promise<Comite> {
  await delay();
  return structuredClone(getDb().comite);
}

/** O termo vigente, para o cadastro e o perfil do voluntário. */
export async function obterTermoVigente(): Promise<Comite['termo']> {
  await delay(120);
  return structuredClone(getDb().comite.termo);
}

export async function salvarDadosComite(d: Pick<Comite, 'nome' | 'cnpj' | 'email' | 'telefone' | 'endereco'>) {
  await delay();
  if (d.nome.trim().length < 3) throw new ServiceError('Informe o nome do comitê.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) throw new ServiceError('Confira o e-mail.');
  commit((db) => Object.assign(db.comite, { nome: d.nome.trim(), cnpj: d.cnpj.trim(), email: d.email.trim(), telefone: d.telefone.trim(), endereco: d.endereco.trim() }));
  auditar({ acao: 'Atualizou dados do comitê', entidadeId: null, alvo: d.nome.trim() });
}

export async function publicarTermo(input: { versao: string; texto: string }) {
  await delay();
  const termo = getDb().comite.termo;
  const versao = input.versao.trim();
  if (!/^\d+(\.\d+)?$/.test(versao)) throw new ServiceError('Use números na versão, por exemplo 2.1.');
  if (termo.historico.some((h) => h.versao === versao)) throw new ServiceError(`A versão ${versao} já existe. Use um número novo.`);
  if (input.texto.trim().length < 50) throw new ServiceError('O texto do termo está curto demais.');
  const hoje = isoDay(new Date());
  commit(() => Object.assign(termo, { versao, texto: input.texto.trim(), publicadoEm: hoje, historico: [...termo.historico, { versao, publicadoEm: hoje }] }));
  auditar({ acao: 'Publicou termo de voluntariado', entidadeId: null, alvo: `Versão ${versao}` });
}

export async function adicionarAdmin(input: { nome: string; email: string }) {
  await delay();
  const db = getDb();
  if (input.nome.trim().length < 3) throw new ServiceError('Informe o nome.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) throw new ServiceError('Confira o e-mail.');
  if (db.comite.admins.some((a) => a.email.toLowerCase() === input.email.trim().toLowerCase())) throw new ServiceError('Esse e-mail já é administrador.');
  commit((x) => x.comite.admins.push({ id: newId('adm'), nome: input.nome.trim(), email: input.email.trim(), desde: isoDay(new Date()) }));
  auditar({ acao: 'Adicionou administrador', entidadeId: null, alvo: input.nome.trim() });
}

export async function removerAdmin(id: string) {
  await delay();
  const db = getDb();
  const a = db.comite.admins.find((x) => x.id === id);
  if (!a) throw new ServiceError('Administrador não encontrado.');
  if (db.comite.admins.length === 1) throw new ServiceError('O comitê precisa de ao menos um administrador.');
  commit((x) => (x.comite.admins = x.comite.admins.filter((y) => y.id !== id)));
  auditar({ acao: 'Removeu administrador', entidadeId: null, alvo: a.nome });
}

// ---------- Auditoria ----------

export interface RegistroAuditoriaDetalhado extends RegistroAuditoria {
  entidadeNome: string;
}

export async function listarAuditoria(): Promise<RegistroAuditoriaDetalhado[]> {
  await delay();
  const db = getDb();
  const nomes = new Map(db.entidades.map((e) => [e.id, e.nome]));
  return [...db.auditoria]
    .sort((a, b) => b.em.localeCompare(a.em))
    .map((r) => ({ ...r, entidadeNome: r.entidadeId ? nomes.get(r.entidadeId) ?? '' : 'Comitê' }));
}
