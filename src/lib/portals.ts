import {
  Award,
  Building2,
  Clock,
  Ellipsis,
  FileText,
  Gift,
  Handshake,
  HeartHandshake,
  History,
  House,
  IdCard,
  LayoutDashboard,
  Megaphone,
  Receipt,
  ScanLine,
  Search,
  Settings,
  Store,
  Ticket,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  /** Relativo à raiz do portal; '' é a tela inicial. */
  path: string;
  label: string;
  /** Rótulo curto para as abas inferiores, que têm ~72px de largura em 360px. */
  short?: string;
  icon: LucideIcon;
  /** O que a tela vai ter, usado enquanto ela não está pronta. */
  summary: string;
}

export const ADMIN_NAV: NavItem[] = [
  { path: '', label: 'Visão geral', icon: LayoutDashboard, summary: 'KPIs consolidados de todas as entidades (entidades ativas, voluntários, eventos, arrecadação, vendas e horas), com filtro de período e de entidade, horas por mês, arrecadação por fonte e rankings.' },
  { path: 'entidades', label: 'Entidades', icon: Building2, summary: 'Entidades com status, voluntários ativos, horas no mês e arrecadação; cadastro e aprovação de novas entidades e o modo “ver como entidade”.' },
  { path: 'voluntarios', label: 'Voluntários', icon: Users, summary: 'Voluntários de todas as entidades num lugar só, com filtros e exportação.' },
  { path: 'eventos', label: 'Eventos', icon: Ticket, summary: 'Eventos de todas as entidades, com ingressos vendidos e check-ins.' },
  { path: 'campanhas', label: 'Campanhas', icon: Megaphone, summary: 'Campanhas de captação de todas as entidades, com meta, arrecadado e prazo.' },
  { path: 'financeiro', label: 'Vendas e financeiro', icon: Wallet, summary: 'Ingressos, loja, campanhas e doações de todas as entidades, com o financeiro consolidado.' },
  { path: 'parceiros', label: 'Parceiros e benefícios', icon: Handshake, summary: 'Aprovação de parceiros e de benefícios antes de irem ao ar.' },
  { path: 'relatorios', label: 'Relatórios', icon: FileText, summary: 'Prestação de contas por entidade e período, com prévia e exportação em PDF e planilha.' },
  { path: 'configuracoes', label: 'Configurações', icon: Settings, summary: 'Dados do comitê, termo de voluntariado e usuários administradores.' },
];

export const ENTIDADE_NAV: NavItem[] = [
  { path: '', label: 'Painel', icon: LayoutDashboard, summary: 'KPIs da entidade, atalhos (certificado, evento, patrocinador, produto, oportunidade) e pendências: cadastros a aprovar, check-ins a validar e estoque baixo.' },
  { path: 'voluntarios', label: 'Voluntários', icon: Users, summary: 'Voluntários com status calculado pela regra dos 6 meses, horas, última ação e áreas de interesse; aprovação, desligamento com motivo e reativação.' },
  { path: 'horas', label: 'Banco de horas', icon: Clock, summary: 'Banco de horas e check-in do dia: escolha a ação e leia o QR do voluntário para confirmar presença e horas.' },
  { path: 'oportunidades', label: 'Oportunidades', icon: HeartHandshake, summary: 'Oportunidades de voluntariado criadas por etapas, com prévia da página pública.' },
  { path: 'eventos', label: 'Eventos e ingressos', icon: Ticket, summary: 'Eventos com ingressos por tipo e check-in pela câmera no dia.' },
  { path: 'loja', label: 'Loja e estoque', icon: Store, summary: 'Produtos com variações, entradas e saídas de estoque e alerta de estoque baixo.' },
  { path: 'campanhas', label: 'Campanhas', icon: Megaphone, summary: 'Campanhas com meta, prazo e história, e o acompanhamento das doações.' },
  { path: 'patrocinadores', label: 'Patrocinadores', icon: Handshake, summary: 'Apoiadores com cota, valor e contrapartidas.' },
  { path: 'financeiro', label: 'Financeiro', icon: Wallet, summary: 'Entradas automáticas (ingressos, loja, campanhas, doações), despesas lançadas à mão, saldo e extrato.' },
  { path: 'certificados', label: 'Certificados', icon: Award, summary: 'Certificados em lote ou individuais, com horas, período e código de verificação.' },
  { path: 'relatorios', label: 'Relatórios', icon: FileText, summary: 'Relatórios de prestação de contas da entidade.' },
  { path: 'configuracoes', label: 'Configurações', icon: Settings, summary: 'Dados, marca e equipe da entidade.' },
];

/** Abas inferiores do app do Voluntário. */
export const VOLUNTARIO_TABS: NavItem[] = [
  { path: '', label: 'Início', icon: House, summary: 'Seu status, horas no mês e no ano, a próxima ação e oportunidades pelas suas áreas de interesse.' },
  { path: 'oportunidades', label: 'Oportunidades', short: 'Vagas', icon: Search, summary: 'Oportunidades filtradas pelas suas áreas de interesse, disponibilidade e formação.' },
  { path: 'carteirinha', label: 'Carteirinha', icon: IdCard, summary: 'Sua carteirinha digital com QR temporário. Ela fica ativa depois do cadastro, do termo, da aprovação da entidade e do primeiro check-in.' },
  { path: 'acoes', label: 'Minhas ações', short: 'Ações', icon: Clock, summary: 'Cada voluntariado como um dente da cremalheira, com totais do mês e do ano e certificados.' },
  { path: 'mais', label: 'Mais', icon: Ellipsis, summary: '' },
];

/** Telas do Voluntário que ficam dentro de "Mais". */
export const VOLUNTARIO_MORE: NavItem[] = [
  { path: 'beneficios', label: 'Benefícios', icon: Gift, summary: 'Descontos das empresas parceiras por categoria, com distância e regra de uso.' },
  { path: 'perfil', label: 'Perfil', icon: UserRound, summary: 'Dados cadastrais, disponibilidade, áreas de interesse, notificações e termo aceito.' },
  { path: 'certificados', label: 'Certificados', icon: Award, summary: 'Certificados das suas horas, prontos para baixar.' },
  { path: 'ingressos', label: 'Meus ingressos', icon: Ticket, summary: 'Seus ingressos, com QR individual por participante.' },
  { path: 'doacoes', label: 'Minhas doações', icon: Receipt, summary: 'Suas doações e apoios recorrentes.' },
];

/** Abas inferiores do app do Parceiro. */
export const PARCEIRO_TABS: NavItem[] = [
  { path: '', label: 'Escanear', icon: ScanLine, summary: 'Câmera em tela cheia para ler o QR da carteirinha, com lanterna e a opção de digitar o número.' },
  { path: 'painel', label: 'Painel', icon: LayoutDashboard, summary: 'Resgates, voluntários impactados, economia gerada e o texto pronto para o relatório ESG.' },
  { path: 'beneficios', label: 'Benefícios', icon: Gift, summary: 'Suas ofertas, que passam pela aprovação do comitê antes de irem ao ar.' },
  { path: 'resgates', label: 'Resgates', icon: History, summary: 'Histórico de usos dos seus benefícios.' },
  { path: 'empresa', label: 'Empresa', icon: Building2, summary: 'Dados da empresa, endereço e contato.' },
];

/** Links do cabeçalho do site público. */
export const PUBLIC_NAV = [
  { to: '/oportunidades', label: 'Oportunidades' },
  { to: '/eventos', label: 'Eventos' },
  { to: '/campanhas', label: 'Campanhas' },
  { to: '/loja', label: 'Loja' },
  { to: '/entidades', label: 'Entidades' },
  { to: '/parceiros', label: 'Parceiros' },
];
