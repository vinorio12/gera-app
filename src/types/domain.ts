// Entidades do domínio da GERA. Datas em ISO (yyyy-MM-dd ou ISO completo), valores em reais.

export const AREAS = ['Educação', 'Meio ambiente', 'Esporte', 'Cultura', 'Saúde', 'Assistência social'] as const;
export type Area = (typeof AREAS)[number];

export type Turno = 'Manhã' | 'Tarde' | 'Noite';

export interface Entidade {
  id: string;
  slug: string;
  nome: string;
  causa: string;
  areas: Area[];
  bairro: string;
  ativa: boolean;
}

export interface Voluntario {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  nascimento: string;
  formacao: string;
  areas: Area[];
  entidadeIds: string[];
  /** Data do cadastro. */
  cadastroEm: string;
  termoAceitoEm: string | null;
  aprovadoEm: string | null;
  desligamento: { em: string; motivo: string } | null;
  /** Número da carteirinha, ex.: JS-2026-004812. */
  registro: string;
}

/** Um registro no banco de horas: cada ação validada gera um. */
export interface RegistroHoras {
  id: string;
  voluntarioId: string;
  entidadeId: string;
  oportunidadeId: string | null;
  data: string;
  projeto: string;
  horas: number;
  origem: 'qr' | 'manual';
  justificativa?: string;
}

export interface Oportunidade {
  id: string;
  entidadeId: string;
  titulo: string;
  descricao: string;
  area: Area;
  data: string;
  turno: Turno;
  horas: number;
  local: string;
  vagas: number;
  inscritos: string[];
  usaFormacao: boolean;
}

export type CategoriaBeneficio = 'Alimentação' | 'Saúde' | 'Educação';

export interface Beneficio {
  id: string;
  parceiroId: string;
  titulo: string;
  regra: string;
  categoria: CategoriaBeneficio;
}

export interface Parceiro {
  id: string;
  nome: string;
  categoria: CategoriaBeneficio;
  endereco: string;
  distanciaKm: number;
}

/** Uso de um benefício registrado pelo parceiro depois de validar a carteirinha. */
export interface Resgate {
  id: string;
  parceiroId: string;
  beneficioId: string;
  voluntarioId: string;
  em: string;
}

export type TipoIngresso = 'Gratuito' | 'Pago' | 'VIP' | 'Mesa' | 'Patrocinador' | 'Combo';

export interface Evento {
  id: string;
  slug: string;
  entidadeId: string;
  titulo: string;
  descricao: string;
  data: string;
  horario: string;
  local: string;
  ingressos: Array<{ tipo: TipoIngresso; preco: number; total: number; vendidos: number }>;
}

export interface Produto {
  id: string;
  slug: string;
  entidadeId: string;
  nome: string;
  tipo: 'Camiseta' | 'Caneca' | 'Livro' | 'Rifa' | 'Artesanato' | 'Produto de campanha';
  preco: number;
  estoque: number;
  variacoes: string[];
}

export interface Campanha {
  id: string;
  slug: string;
  entidadeId: string;
  titulo: string;
  historia: string;
  meta: number;
  arrecadado: number;
  apoiadores: number;
  terminaEm: string;
}

/** Tudo o que o protótipo guarda; amanhã vem da API. */
export interface MockDb {
  versao: number;
  entidades: Entidade[];
  voluntarios: Voluntario[];
  horas: RegistroHoras[];
  oportunidades: Oportunidade[];
  parceiros: Parceiro[];
  beneficios: Beneficio[];
  resgates: Resgate[];
  eventos: Evento[];
  produtos: Produto[];
  campanhas: Campanha[];
}
