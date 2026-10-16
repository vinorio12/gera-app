// Entidades do domínio da GERA. Datas em ISO (yyyy-MM-dd ou ISO completo), valores em reais.

export const AREAS = ['Educação', 'Meio ambiente', 'Esporte', 'Cultura', 'Saúde', 'Assistência social'] as const;
export type Area = (typeof AREAS)[number];

export type Turno = 'Manhã' | 'Tarde' | 'Noite';

/** Cor de destaque da entidade: sempre um dos tokens de portal, nunca um hex. */
export const CORES_DESTAQUE = ['portal-engajar', 'portal-impulsionar', 'portal-conectar', 'portal-ampliar'] as const;
export type CorDestaque = (typeof CORES_DESTAQUE)[number];

export interface MembroEquipe {
  id: string;
  nome: string;
  email: string;
  papel: 'Administrador' | 'Equipe';
  desde: string;
  /** Convite enviado e ainda não aceito. */
  convitePendente: boolean;
}

export interface Entidade {
  id: string;
  slug: string;
  nome: string;
  causa: string;
  areas: Area[];
  bairro: string;
  ativa: boolean;
  /** null enquanto a entidade espera a aprovação do comitê. */
  aprovadaEm: string | null;
  cnpj: string;
  email: string;
  telefone: string;
  responsavel: string;
  corDestaque: CorDestaque;
  equipe: MembroEquipe[];
}

/** Dados do Comitê Social ACIJS, termo de voluntariado e administradores. */
export interface Comite {
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  termo: { versao: string; texto: string; publicadoEm: string; historico: Array<{ versao: string; publicadoEm: string }> };
  admins: Array<{ id: string; nome: string; email: string; desde: string }>;
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
  /** Foto pequena (data URL) enviada no fim do cadastro. */
  fotoUrl?: string;
  endereco?: { cep: string; rua: string; numero: string; complemento: string; bairro: string; cidade: string; uf: string };
  profissao?: string;
  empresa?: string;
  /** Ex.: "Sábado · Manhã". */
  disponibilidade?: string[];
  usaFormacao?: boolean;
  /** Versão do termo de voluntariado aceita no cadastro. */
  termoVersao?: string;
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
  /** Encerrada pela entidade: sai do site e não aceita mais inscrições. */
  encerradaEm: string | null;
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

export const TIPOS_INGRESSO: TipoIngresso[] = ['Gratuito', 'Pago', 'VIP', 'Mesa', 'Patrocinador', 'Combo'];

export const TIPOS_PRODUTO = ['Camiseta', 'Caneca', 'Livro', 'Rifa', 'Artesanato', 'Produto de campanha'] as const;

export interface Produto {
  id: string;
  slug: string;
  entidadeId: string;
  nome: string;
  tipo: (typeof TIPOS_PRODUTO)[number];
  preco: number;
  estoque: number;
  variacoes: string[];
}

/** Entrada ou saída de estoque, com motivo. As vendas da loja geram saídas automáticas. */
export interface MovimentoEstoque {
  id: string;
  produtoId: string;
  entidadeId: string;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  motivo: string;
  em: string;
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

export type FonteReceita = 'Ingressos' | 'Loja' | 'Campanhas' | 'Doações' | 'Patrocínios';

export const COTAS = ['Ouro', 'Prata', 'Bronze', 'Apoio'] as const;
export type Cota = (typeof COTAS)[number];

/** Patrocinador de uma entidade: o valor entra no financeiro como "Patrocínios". */
export interface Patrocinador {
  id: string;
  entidadeId: string;
  nome: string;
  cota: Cota;
  valor: number;
  inicio: string;
  fim: string;
  contato: string;
  contrapartidas: Array<{ id: string; texto: string; entregue: boolean }>;
}

/** Uma entrada de dinheiro: venda de ingresso ou produto, apoio a campanha ou doação. */
export interface Entrada {
  id: string;
  entidadeId: string;
  fonte: FonteReceita;
  valor: number;
  data: string;
  /** Ingressos ou produtos no pedido (vendas). */
  quantidade?: number;
  /** Apoio a uma campanha. */
  campanhaId?: string;
  /** Valor de um patrocinador. */
  patrocinadorId?: string;
  /** Quem pagou ou o que foi, para o extrato. */
  descricao?: string;
  pedidoId?: string;
}

export type MetodoPagamento = 'pix' | 'cartao' | 'boleto';

/** Uma compra ou doação. O pagamento é confirmado pelo PaymentProvider. */
export interface Pedido {
  id: string;
  tipo: 'loja' | 'ingressos' | 'doacao';
  entidadeId: string;
  descricao: string;
  valor: number;
  comprador: { nome: string; email: string };
  /** Quando quem comprou é um voluntário logado: aparece em "Meus ingressos" / "Minhas doações". */
  voluntarioId: string | null;
  metodo: MetodoPagamento | 'gratuito';
  status: 'aguardando' | 'pago' | 'recusado';
  criadoEm: string;
  cobrancaId: string | null;
  /** Loja: itens e entrega. */
  itens?: Array<{ produtoId: string; nome: string; variacao: string | null; quantidade: number; preco: number }>;
  entrega?: 'retirada' | 'entrega';
  /** Ingressos: evento e tipos comprados. */
  eventoId?: string;
  ingressos?: Array<{ tipo: string; quantidade: number; preco: number }>;
  /** Doação: campanha (ou doação direta à entidade) e se é mensal. */
  campanhaId?: string | null;
  mensal?: boolean;
}

/** Ingresso emitido: um por participante, com QR próprio. */
export interface IngressoEmitido {
  id: string;
  pedidoId: string;
  eventoId: string;
  tipo: string;
  participante: string;
  codigo: string;
  /** Check-in no dia do evento: o mesmo ingresso não entra duas vezes. */
  usadoEm: string | null;
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
  entradas: Entrada[];
  pedidos: Pedido[];
  ingressosEmitidos: IngressoEmitido[];
  movimentosEstoque: MovimentoEstoque[];
  patrocinadores: Patrocinador[];
  despesas: Despesa[];
  certificados: Certificado[];
  auditoria: RegistroAuditoria[];
  comite: Comite;
}

export const CATEGORIAS_DESPESA = ['Materiais', 'Alimentação', 'Transporte', 'Eventos', 'Manutenção', 'Serviços', 'Outros'] as const;
export type CategoriaDespesa = (typeof CATEGORIAS_DESPESA)[number];

/** Saída de dinheiro lançada à mão pela entidade (entra no histórico de auditoria). */
export interface Despesa {
  id: string;
  entidadeId: string;
  categoria: CategoriaDespesa;
  descricao: string;
  valor: number;
  data: string;
  lancadaPor: string;
}

/** Certificado de horas: o código permite a qualquer pessoa conferir em /validar/certificado. */
export interface Certificado {
  id: string;
  codigo: string;
  voluntarioId: string;
  entidadeId: string;
  horas: number;
  inicio: string;
  fim: string;
  emitidoEm: string;
  emitidoPor: string;
}

export type AcaoAuditada =
  | 'Aprovou cadastro'
  | 'Desligou voluntário'
  | 'Reativou voluntário'
  | 'Lançou horas à mão'
  | 'Lançou despesa'
  | 'Emitiu certificados';

/** Quem fez o quê e quando: aparece nas configurações do comitê. */
export interface RegistroAuditoria {
  id: string;
  em: string;
  autor: string;
  acao: AcaoAuditada | string;
  entidadeId: string | null;
  /** Sobre quem ou o quê, ex.: o nome do voluntário. */
  alvo: string;
  detalhe?: string;
}
