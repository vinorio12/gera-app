// Ciclo dos benefícios: o parceiro cria as ofertas, o comitê aprova ou recusa (com motivo),
// o voluntário vê só as aprovadas e o parceiro acompanha o impacto no painel ESG.
import { format } from 'date-fns';
import { commit, delay, getDb, newId } from '../mocks/db';
import { dadosCarteirinha, isoDay } from '../lib/carteirinha';
import type { Beneficio, CategoriaBeneficio, Parceiro } from '../types/domain';
import { CATEGORIAS_BENEFICIO } from '../types/domain';
import { gravarImagem } from './imagens';
import { auditar } from './sessao';
import { ServiceError } from './voluntarios';

const centavos = (v: number) => Math.round(v * 100) / 100;
const moeda = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

function doParceiro(parceiroId: string): Parceiro {
  const p = getDb().parceiros.find((x) => x.id === parceiroId);
  if (!p) throw new ServiceError('Empresa parceira não encontrada.');
  return p;
}

// ---------- Parceiro: ofertas ----------

/** Só as ofertas aprovadas, para registrar o uso depois de validar a carteirinha. */
export async function listarBeneficiosAtivos(parceiroId: string): Promise<Beneficio[]> {
  await delay();
  return getDb().beneficios.filter((b) => b.parceiroId === parceiroId && b.status === 'aprovado');
}

export interface DadosBeneficio {
  titulo: string;
  regra: string;
  economiaEstimada: number;
}

/** Criar ou editar: em ambos os casos a oferta volta para "aguardando aprovação do comitê". */
export async function salvarBeneficio(input: DadosBeneficio & { parceiroId: string; id?: string }): Promise<Beneficio> {
  await delay();
  const db = getDb();
  const parceiro = doParceiro(input.parceiroId);
  if (input.titulo.trim().length < 5) throw new ServiceError('Escreva a oferta, ex.: 10% em qualquer pedido.');
  if (input.regra.trim().length < 5) throw new ServiceError('Explique a regra de uso, ex.: uma vez por dia.');
  if (!(input.economiaEstimada >= 0)) throw new ServiceError('Informe a economia estimada por uso (pode ser zero).');
  const dados = { titulo: input.titulo.trim(), regra: input.regra.trim(), economiaEstimada: centavos(input.economiaEstimada) };
  if (input.id) {
    const b = db.beneficios.find((x) => x.id === input.id && x.parceiroId === input.parceiroId);
    if (!b) throw new ServiceError('Benefício não encontrado.');
    commit(() => {
      Object.assign(b, dados, { status: 'pendente' as const });
      delete b.motivoRecusa;
    });
    return { ...b };
  }
  const novo: Beneficio = { id: newId('b'), parceiroId: input.parceiroId, categoria: parceiro.categoria, status: 'pendente', ...dados };
  commit((d) => d.beneficios.push(novo));
  return novo;
}

export async function excluirBeneficio(parceiroId: string, id: string) {
  await delay();
  const db = getDb();
  const b = db.beneficios.find((x) => x.id === id && x.parceiroId === parceiroId);
  if (!b) throw new ServiceError('Benefício não encontrado.');
  if (db.resgates.some((r) => r.beneficioId === id)) throw new ServiceError('Esse benefício já tem usos registrados e fica no histórico.');
  commit((d) => (d.beneficios = d.beneficios.filter((x) => x.id !== id)));
}

// ---------- Parceiro: empresa ----------

export async function obterEmpresa(parceiroId: string): Promise<Parceiro> {
  await delay();
  return { ...doParceiro(parceiroId) };
}

export type DadosEmpresa = Pick<Parceiro, 'nome' | 'cnpj' | 'endereco' | 'telefone' | 'email' | 'contato' | 'categoria'>;

export async function salvarEmpresa(parceiroId: string, d: DadosEmpresa) {
  await delay();
  const p = doParceiro(parceiroId);
  if (d.nome.trim().length < 2) throw new ServiceError('Informe o nome da empresa.');
  if (d.cnpj.replace(/\D/g, '').length !== 14) throw new ServiceError('O CNPJ tem 14 números.');
  if (d.endereco.trim().length < 5) throw new ServiceError('Informe o endereço, com número e bairro.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) throw new ServiceError('Confira o e-mail.');
  if (!CATEGORIAS_BENEFICIO.includes(d.categoria)) throw new ServiceError('Escolha a categoria.');
  commit(() =>
    Object.assign(p, {
      nome: d.nome.trim(),
      cnpj: d.cnpj.trim(),
      endereco: d.endereco.trim(),
      telefone: d.telefone.trim(),
      email: d.email.trim(),
      contato: d.contato.trim(),
      categoria: d.categoria,
    }),
  );
}

/** Foto de perfil (logo) ou banner da empresa; null remove. */
export async function salvarImagemEmpresa(parceiroId: string, qual: 'logo' | 'banner', dataUrl: string | null) {
  await delay(200);
  const p = doParceiro(parceiroId);
  gravarImagem(p, qual === 'logo' ? 'logoUrl' : 'bannerUrl', dataUrl, qual === 'logo' ? 'foto' : 'banner');
}

// ---------- Parceiro: painel ESG ----------

export interface PainelEsg {
  parceiro: string;
  logoUrl?: string;
  resgates: number;
  resgatesNoMes: number;
  voluntariosImpactados: number;
  economiaTotal: number;
  porBeneficio: Array<{ beneficio: string; resgates: number; economiaPorUso: number; economia: number }>;
  textoEsg: string;
}

export async function obterPainelEsg(parceiroId: string): Promise<PainelEsg> {
  await delay();
  const db = getDb();
  const p = doParceiro(parceiroId);
  const resgates = db.resgates.filter((r) => r.parceiroId === parceiroId);
  const mes = format(new Date(), 'yyyy-MM');
  const porBeneficio = db.beneficios
    .filter((b) => b.parceiroId === parceiroId && (b.status === 'aprovado' || resgates.some((r) => r.beneficioId === b.id)))
    .map((b) => {
      const n = resgates.filter((r) => r.beneficioId === b.id).length;
      return { beneficio: b.titulo, resgates: n, economiaPorUso: b.economiaEstimada, economia: centavos(n * b.economiaEstimada) };
    })
    .sort((a, b) => b.resgates - a.resgates);
  const economiaTotal = centavos(porBeneficio.reduce((s, b) => s + b.economia, 0));
  const impactados = new Set(resgates.map((r) => r.voluntarioId)).size;
  const entidades = new Set(resgates.flatMap((r) => db.voluntarios.find((v) => v.id === r.voluntarioId)?.entidadeIds ?? [])).size;
  const textoEsg =
    `Em ${new Date().getFullYear()}, a ${p.nome} participou da rede de benefícios da plataforma GERA, do Comitê Social ACIJS, ` +
    `oferecendo vantagens a voluntários com carteirinha ativa. Foram ${resgates.length} usos de benefícios por ${impactados} ` +
    `voluntários de ${entidades} ${entidades === 1 ? 'entidade social' : 'entidades sociais'} de Jaraguá do Sul, com uma economia estimada de ` +
    `${moeda(economiaTotal)} para quem doa o próprio tempo à comunidade. A iniciativa reconhece o trabalho voluntário e ` +
    `fortalece o vínculo da empresa com as causas sociais locais (ODS 17: parcerias e meios de implementação).`;
  return {
    parceiro: p.nome,
    logoUrl: p.logoUrl,
    resgates: resgates.length,
    resgatesNoMes: resgates.filter((r) => r.em.startsWith(mes)).length,
    voluntariosImpactados: impactados,
    economiaTotal,
    porBeneficio,
    textoEsg,
  };
}

// ---------- Comitê: aprovação ----------

export interface ParceiroAdmin extends Parceiro {
  beneficios: Beneficio[];
  resgates: number;
}

export async function listarParceirosAdmin(): Promise<ParceiroAdmin[]> {
  await delay();
  const db = getDb();
  return db.parceiros
    .map((p) => ({ ...p, beneficios: db.beneficios.filter((b) => b.parceiroId === p.id), resgates: db.resgates.filter((r) => r.parceiroId === p.id).length }))
    .sort((a, b) => Number(b.status === 'pendente') - Number(a.status === 'pendente') || a.nome.localeCompare(b.nome, 'pt-BR'));
}

export async function decidirParceiro(input: { id: string; aprovar: boolean; motivo?: string }) {
  await delay();
  const p = doParceiro(input.id);
  if (!input.aprovar && !input.motivo?.trim()) throw new ServiceError('Escreva o motivo da recusa: ele vai para a empresa.');
  commit(() => {
    p.status = input.aprovar ? 'aprovado' : 'recusado';
    if (input.aprovar) delete p.motivoRecusa;
    else p.motivoRecusa = input.motivo!.trim();
  });
  auditar({ acao: input.aprovar ? 'Aprovou parceiro' : 'Recusou parceiro', entidadeId: null, alvo: p.nome, detalhe: input.motivo?.trim() || undefined });
}

export async function decidirBeneficio(input: { id: string; aprovar: boolean; motivo?: string }) {
  await delay();
  const db = getDb();
  const b = db.beneficios.find((x) => x.id === input.id);
  if (!b) throw new ServiceError('Benefício não encontrado.');
  if (!input.aprovar && !input.motivo?.trim()) throw new ServiceError('Escreva o motivo da recusa: ele volta para o parceiro.');
  commit(() => {
    b.status = input.aprovar ? 'aprovado' : 'recusado';
    if (input.aprovar) {
      b.aprovadoEm = isoDay(new Date());
      delete b.motivoRecusa;
    } else b.motivoRecusa = input.motivo!.trim();
  });
  const parceiro = db.parceiros.find((p) => p.id === b.parceiroId)?.nome ?? '';
  auditar({ acao: input.aprovar ? 'Aprovou benefício' : 'Recusou benefício', entidadeId: null, alvo: `${b.titulo} (${parceiro})`, detalhe: input.motivo?.trim() || undefined });
}

// ---------- Voluntário ----------

export interface BeneficioParaVoluntario extends Beneficio {
  parceiro: string;
  logoUrl?: string;
  endereco: string;
  distanciaKm: number;
}

export interface BeneficiosDoVoluntario {
  carteirinhaAtiva: boolean;
  motivo: string | null;
  beneficios: BeneficioParaVoluntario[];
}

export async function listarBeneficiosParaVoluntario(voluntarioId: string, categoria?: CategoriaBeneficio): Promise<BeneficiosDoVoluntario> {
  await delay();
  const db = getDb();
  const v = db.voluntarios.find((x) => x.id === voluntarioId);
  if (!v) throw new ServiceError('Não encontramos seu cadastro.');
  const dados = dadosCarteirinha(v, db.horas.filter((h) => h.voluntarioId === v.id));
  const ativa = dados.liberada && dados.status === 'ativo';
  const parceiros = new Map(db.parceiros.filter((p) => p.status === 'aprovado').map((p) => [p.id, p]));
  return {
    carteirinhaAtiva: ativa,
    motivo: ativa
      ? null
      : !dados.liberada
        ? 'Sua carteirinha ainda não foi liberada. Os parceiros dão o benefício só com a carteirinha ativa.'
        : 'Sua carteirinha está inativa: não há ação validada nos últimos 6 meses. Participe de uma ação para voltar a usar os benefícios.',
    beneficios: db.beneficios
      .filter((b) => b.status === 'aprovado' && parceiros.has(b.parceiroId) && (!categoria || b.categoria === categoria))
      .map((b) => {
        const p = parceiros.get(b.parceiroId)!;
        return { ...b, parceiro: p.nome, logoUrl: p.logoUrl, endereco: p.endereco, distanciaKm: p.distanciaKm };
      })
      .sort((a, b) => a.distanciaKm - b.distanciaKm),
  };
}
