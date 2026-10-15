// Cadastro público do voluntário e busca de endereço por CEP.
import { commit, delay, getDb, newId } from '../mocks/db';
import { isoDay } from '../lib/carteirinha';
import { isValidCpf } from '../lib/cpf';
import type { Area, Voluntario } from '../types/domain';
import { ServiceError } from './voluntarios';

export interface Endereco {
  rua: string;
  bairro: string;
  cidade: string;
  uf: string;
}

/** CEPs de Jaraguá do Sul para quando a consulta online não está disponível (ex.: na prévia publicada). */
const CEPS_LOCAIS: Record<string, Endereco> = {
  '89251000': { rua: 'Rua Reinoldo Rau', bairro: 'Centro', cidade: 'Jaraguá do Sul', uf: 'SC' },
  '89251300': { rua: 'Avenida Marechal Deodoro da Fonseca', bairro: 'Centro', cidade: 'Jaraguá do Sul', uf: 'SC' },
  '89252000': { rua: 'Rua Joinville', bairro: 'Vila Lalau', cidade: 'Jaraguá do Sul', uf: 'SC' },
  '89254000': { rua: 'Rua Walter Marquardt', bairro: 'Barra do Rio Molha', cidade: 'Jaraguá do Sul', uf: 'SC' },
  '89256000': { rua: 'Rua Ângelo Rubini', bairro: 'Barra do Rio Cerro', cidade: 'Jaraguá do Sul', uf: 'SC' },
};

/**
 * Preenche o endereço pelo CEP (ViaCEP). Se a consulta falhar, usa a lista local; se o CEP não estiver
 * nela, devolve null e a pessoa digita o endereço.
 */
export async function buscarCep(cepTexto: string): Promise<Endereco | null> {
  const cep = cepTexto.replace(/\D/g, '');
  if (cep.length !== 8) throw new ServiceError('O CEP tem 8 números.');
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: ctrl.signal });
    clearTimeout(timer);
    const d = (await res.json()) as { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string };
    if (!d.erro && d.localidade) return { rua: d.logradouro ?? '', bairro: d.bairro ?? '', cidade: d.localidade, uf: d.uf ?? '' };
  } catch {
    // sem rede ou bloqueado: tenta a lista local
  }
  if (CEPS_LOCAIS[cep]) return CEPS_LOCAIS[cep]!;
  if (cep.startsWith('8925') || cep.startsWith('8926')) return { rua: '', bairro: '', cidade: 'Jaraguá do Sul', uf: 'SC' };
  return null;
}

export interface NovoVoluntario {
  nome: string;
  cpf: string;
  nascimento: string;
  telefone: string;
  email: string;
  endereco: NonNullable<Voluntario['endereco']>;
  entidadeId: string;
  formacao: string;
  profissao: string;
  empresa: string;
  disponibilidade: string[];
  usaFormacao: boolean;
  areas: Area[];
  termoAceito: boolean;
}

export async function cadastrarVoluntario(d: NovoVoluntario): Promise<{ id: string; registro: string; entidade: string }> {
  await delay(500);
  const db = getDb();
  if (!isValidCpf(d.cpf)) throw new ServiceError('Confira o CPF.');
  if (!d.termoAceito) throw new ServiceError('Para seguir, aceite o termo de voluntariado.');
  const cpf = d.cpf.replace(/\D/g, '');
  if (db.voluntarios.some((v) => v.cpf.replace(/\D/g, '') === cpf)) {
    throw new ServiceError('Já existe um cadastro com esse CPF. Entre com a sua conta ou fale com a entidade.');
  }
  const entidade = db.entidades.find((e) => e.id === d.entidadeId);
  if (!entidade) throw new ServiceError('Escolha a entidade que você quer apoiar.');
  const hoje = isoDay(new Date());
  const ano = hoje.slice(0, 4);
  const seq = db.voluntarios.filter((v) => v.registro.startsWith(`JS-${ano}-`)).length + 5000;
  const v: Voluntario = {
    id: newId('v'),
    nome: d.nome.trim(),
    cpf: `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`,
    email: d.email.trim(),
    telefone: d.telefone,
    nascimento: d.nascimento,
    formacao: d.formacao.trim(),
    areas: d.areas,
    entidadeIds: [d.entidadeId],
    cadastroEm: hoje,
    termoAceitoEm: hoje,
    aprovadoEm: null,
    desligamento: null,
    registro: `JS-${ano}-${String(seq).padStart(6, '0')}`,
    endereco: d.endereco,
    profissao: d.profissao.trim(),
    empresa: d.empresa.trim(),
    disponibilidade: d.disponibilidade,
    usaFormacao: d.usaFormacao,
  };
  commit((db2) => db2.voluntarios.push(v));
  return { id: v.id, registro: v.registro, entidade: entidade.nome };
}

/** Guarda a foto do perfil já reduzida (data URL pequena). */
export async function salvarFoto(voluntarioId: string, dataUrl: string) {
  await delay(200);
  if (dataUrl.length > 60_000) throw new ServiceError('A foto ficou grande demais. Tente outra.');
  commit((db) => {
    const v = db.voluntarios.find((x) => x.id === voluntarioId);
    if (v) v.fotoUrl = dataUrl;
  });
}
