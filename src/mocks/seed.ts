// Dados de exemplo do protótipo, gerados de forma determinística (mesma semente = mesmos dados).
// Nenhum nome de pessoa ou empresa real além dos que estão no documento de requisitos.
import { addDays, addMonths, format, subMonths } from 'date-fns';
import { cpfFromBase } from '../lib/cpf';
import type {
  Area,
  Beneficio,
  Campanha,
  Certificado,
  Despesa,
  Entidade,
  Entrada,
  Evento,
  IngressoEmitido,
  MockDb,
  MovimentoEstoque,
  Oportunidade,
  Parceiro,
  Patrocinador,
  Pedido,
  Produto,
  RegistroHoras,
  RegistroAuditoria,
  Resgate,
  Voluntario,
} from '../types/domain';

export const DB_VERSION = 9;

/** Data de referência dos dados: o "hoje" em que o banco de horas termina. */
export const SEED_TODAY = new Date(2026, 9, 15);

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const iso = (d: Date) => format(d, 'yyyy-MM-dd');

type EntidadeBase = Pick<Entidade, 'id' | 'slug' | 'nome' | 'causa' | 'areas' | 'bairro' | 'ativa'> & { projetos: string[] };

const ENTIDADES: EntidadeBase[] = [
  { id: 'ama-jaragua', slug: 'ama-jaragua', nome: 'AMA Jaraguá', causa: 'Apoio a pessoas com autismo e às suas famílias.', areas: ['Saúde', 'Assistência social', 'Educação'], bairro: 'Vila Nova', ativa: true, projetos: ['Oficina de integração sensorial', 'Apoio às famílias', 'Campanha do Agasalho', 'Evento Beneficente'] },
  { id: 'casa-recanto', slug: 'casa-recanto', nome: 'Casa Lar Recanto', causa: 'Acolhimento de crianças e adolescentes.', areas: ['Assistência social', 'Educação'], bairro: 'Czerniewicz', ativa: true, projetos: ['Reforço escolar', 'Tarde de leitura', 'Mutirão de manutenção'] },
  { id: 'instituto-itapocu', slug: 'instituto-itapocu', nome: 'Instituto Rio Itapocu', causa: 'Cuidado com o rio Itapocu e educação ambiental.', areas: ['Meio ambiente', 'Educação'], bairro: 'Centro', ativa: true, projetos: ['Limpeza das margens do Itapocu', 'Plantio de mudas nativas', 'Educação ambiental nas escolas'] },
  { id: 'bola-na-rede', slug: 'bola-na-rede', nome: 'Projeto Bola na Rede', causa: 'Esporte no contraturno para crianças de 7 a 14 anos.', areas: ['Esporte', 'Educação'], bairro: 'Barra do Rio Cerro', ativa: true, projetos: ['Treino de sábado', 'Torneio de inverno', 'Arbitragem voluntária'] },
  { id: 'maos-que-tecem', slug: 'maos-que-tecem', nome: 'Associação Mãos que Tecem', causa: 'Artesanato e geração de renda para mulheres.', areas: ['Cultura', 'Assistência social'], bairro: 'Jaraguá Esquerdo', ativa: true, projetos: ['Oficina de crochê', 'Feira de artesanato', 'Bazar solidário'] },
  { id: 'banco-alimentos', slug: 'banco-alimentos', nome: 'Banco de Alimentos Jaraguá', causa: 'Coleta e distribuição de alimentos para famílias.', areas: ['Assistência social', 'Saúde'], bairro: 'Água Verde', ativa: true, projetos: ['Triagem de doações', 'Entrega de cestas', 'Coleta no supermercado'] },
];

const NOMES = ['Ana', 'Bruno', 'Carla', 'Daniel', 'Eduarda', 'Felipe', 'Gabriela', 'Henrique', 'Isabela', 'João', 'Karina', 'Lucas', 'Mariana', 'Nicolas', 'Olívia', 'Paulo', 'Rafaela', 'Samuel', 'Tatiane', 'Vinícius', 'Yasmin', 'Leonardo', 'Camila', 'Gustavo', 'Letícia', 'Matheus', 'Juliana', 'Rodrigo', 'Beatriz', 'Diego', 'Fernanda', 'Thiago', 'Larissa', 'André', 'Patrícia', 'Marcelo', 'Renata', 'César', 'Helena', 'Otávio'];
const SOBRENOMES = ['Souza', 'Oliveira', 'Pereira', 'Lima', 'Ferreira', 'Rodrigues', 'Almeida', 'Nascimento', 'Carvalho', 'Gomes', 'Martins', 'Rocha', 'Ribeiro', 'Schmitt', 'Kruger', 'Vieira', 'Barbosa', 'Moraes', 'Klein', 'Machado', 'Fernandes', 'Hoffmann', 'Teixeira', 'Correia', 'Weber', 'Mendes', 'Pinto', 'Campos', 'Cardoso', 'Ramos'];
const FORMACOES = ['Pedagogia', 'Engenharia elétrica', 'Administração', 'Enfermagem', 'Psicologia', 'Educação física', 'Direito', 'Ensino médio', 'Design', 'Ciências contábeis', 'Biologia', 'Engenharia mecânica'];

/** Histórico do Alex Silva: 125 h na AMA Jaraguá, terminando nas duas ações do documento. */
const ALEX_HORAS: Array<[string, string, number]> = [
  ['2025-06-14', 'Campanha do Agasalho', 6],
  ['2025-11-08', 'Oficina de integração sensorial', 4],
  ['2025-11-22', 'Apoio às famílias', 6],
  ['2025-12-13', 'Evento Beneficente', 8],
  ['2026-01-17', 'Oficina de integração sensorial', 4],
  ['2026-02-07', 'Apoio às famílias', 5],
  ['2026-02-28', 'Oficina de integração sensorial', 4],
  ['2026-03-14', 'Oficina de integração sensorial', 4],
  ['2026-03-28', 'Apoio às famílias', 6],
  ['2026-04-11', 'Oficina de integração sensorial', 4],
  ['2026-04-25', 'Apoio às famílias', 6],
  ['2026-05-16', 'Campanha do Agasalho', 6],
  ['2026-05-30', 'Campanha do Agasalho', 8],
  ['2026-06-13', 'Campanha do Agasalho', 8],
  ['2026-06-27', 'Oficina de integração sensorial', 4],
  ['2026-07-11', 'Apoio às famílias', 6],
  ['2026-07-25', 'Oficina de integração sensorial', 4],
  ['2026-08-08', 'Evento Beneficente', 8],
  ['2026-08-22', 'Oficina de integração sensorial', 4],
  ['2026-09-05', 'Apoio às famílias', 6],
  ['2026-09-19', 'Oficina de integração sensorial', 4],
  ['2026-10-10', 'Campanha do Agasalho', 4],
  ['2026-10-15', 'Evento Beneficente', 6],
];

type Perfil = 'ativo' | 'inativo' | 'novo' | 'desligado';

export function createSeed(): MockDb {
  const rand = mulberry32(2026);
  const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
  const pick = <T,>(list: readonly T[]): T => list[Math.floor(rand() * list.length)]!;
  // Fisher-Yates com a semente: sort() com comparação aleatória muda de um motor JS para outro.
  const sample = <T,>(list: readonly T[], n: number): T[] => {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [copy[i], copy[j]] = [copy[j]!, copy[i]!];
    }
    return copy.slice(0, n);
  };
  const cpf = () => cpfFromBase(Array.from({ length: 9 }, () => int(0, 9)));
  const telefone = () => `(47) 9${int(8000, 9999)}-${String(int(0, 9999)).padStart(4, '0')}`;
  const email = (nome: string) =>
    `${nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, '.')}@exemplo.com.br`;
  const dataNoMes = (mesesAtras: number) => {
    const inicio = subMonths(new Date(SEED_TODAY.getFullYear(), SEED_TODAY.getMonth(), 1), mesesAtras);
    const ultimoDia = mesesAtras === 0 ? SEED_TODAY.getDate() : new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0).getDate();
    return iso(new Date(inicio.getFullYear(), inicio.getMonth(), int(1, ultimoDia)));
  };

  // Dados de contato, marca e equipe de cada entidade (fictícios).
  const CORES: Entidade['corDestaque'][] = ['portal-impulsionar', 'portal-engajar', 'portal-conectar', 'portal-ampliar'];
  const entidades: Entidade[] = ENTIDADES.map(({ projetos: _projetos, ...e }, i) => ({
    ...e,
    aprovadaEm: '2025-03-10',
    cnpj: `${String(11 + i).padStart(2, '0')}.${String(222 + i * 7).padStart(3, '0')}.333/0001-${String(40 + i).padStart(2, '0')}`,
    email: `contato@${e.slug}.org.br`,
    telefone: `(47) 3370-${String(1100 + i * 37).padStart(4, '0')}`,
    responsavel: ['Marta Hoffmann', 'Sérgio Lima', 'Paula Weber', 'Roberto Klein', 'Lúcia Mendes', 'Carlos Ramos'][i]!,
    corDestaque: CORES[i % CORES.length]!,
    equipe: [
      { id: `${e.id}-m1`, nome: ['Marta Hoffmann', 'Sérgio Lima', 'Paula Weber', 'Roberto Klein', 'Lúcia Mendes', 'Carlos Ramos'][i]!, email: `coordenacao@${e.slug}.org.br`, papel: 'Administrador' as const, desde: '2025-03-10', convitePendente: false },
      { id: `${e.id}-m2`, nome: `Equipe ${e.nome}`, email: `equipe@${e.slug}.org.br`, papel: 'Equipe' as const, desde: '2025-04-02', convitePendente: false },
    ],
  }));
  const projetosDe = (entidadeId: string) => ENTIDADES.find((e) => e.id === entidadeId)!.projetos;

  // ---------- Voluntários: Alex e Bruna fixos, mais 118 com os quatro status ----------
  const voluntarios: Voluntario[] = [
    {
      id: 'v-alex', nome: 'Alex Silva', cpf: cpfFromBase([1, 2, 3, 4, 5, 6, 7, 8, 9]), email: 'alex.silva@exemplo.com.br',
      telefone: '(47) 99123-4567', nascimento: '1994-03-21', formacao: 'Engenharia elétrica', areas: ['Saúde', 'Educação'],
      entidadeIds: ['ama-jaragua'], cadastroEm: '2025-05-02', termoAceitoEm: '2025-05-02', aprovadoEm: '2025-05-06',
      desligamento: null, registro: 'JS-2026-004812',
    },
    {
      id: 'v-bruna', nome: 'Bruna Costa', cpf: cpfFromBase([9, 8, 7, 6, 5, 4, 3, 2, 1]), email: 'bruna.costa@exemplo.com.br',
      telefone: '(47) 99876-5432', nascimento: '2001-08-09', formacao: 'Psicologia', areas: ['Saúde', 'Assistência social'],
      entidadeIds: ['ama-jaragua'], cadastroEm: '2026-10-08', termoAceitoEm: '2026-10-08', aprovadoEm: null,
      desligamento: null, registro: 'JS-2026-004913',
    },
  ];
  const perfis = new Map<string, Perfil>([['v-alex', 'ativo'], ['v-bruna', 'novo']]);
  const plano: Perfil[] = [
    ...Array<Perfil>(70).fill('ativo'),
    ...Array<Perfil>(22).fill('inativo'),
    ...Array<Perfil>(16).fill('novo'),
    ...Array<Perfil>(10).fill('desligado'),
  ];
  const usados = new Set(['Alex Silva', 'Bruna Costa']);
  plano.forEach((perfil, i) => {
    let nome = '';
    do nome = `${pick(NOMES)} ${pick(SOBRENOMES)}`;
    while (usados.has(nome));
    usados.add(nome);
    const entidade = pick(ENTIDADES);
    const outras = rand() < 0.2 ? [pick(ENTIDADES).id] : [];
    const cadastro =
      perfil === 'novo' ? subMonths(SEED_TODAY, int(0, 4)) : subMonths(SEED_TODAY, perfil === 'ativo' ? int(4, 30) : int(9, 30));
    const cadastroEm = iso(addDays(cadastro, -int(0, 25)));
    const pendente = perfil === 'novo' && i % 2 === 0;
    const id = `v-${String(i + 1).padStart(3, '0')}`;
    perfis.set(id, perfil);
    voluntarios.push({
      id,
      nome,
      cpf: cpf(),
      email: email(nome),
      telefone: telefone(),
      nascimento: iso(new Date(int(1960, 2006), int(0, 11), int(1, 28))),
      formacao: pick(FORMACOES),
      areas: sample(entidade.areas.length > 1 ? entidade.areas : (['Educação', 'Cultura'] as Area[]), int(1, 2)),
      entidadeIds: [...new Set([entidade.id, ...outras])],
      cadastroEm,
      termoAceitoEm: cadastroEm,
      aprovadoEm: pendente ? null : iso(addDays(new Date(cadastroEm), int(1, 6))),
      desligamento:
        perfil === 'desligado'
          ? { em: iso(subMonths(SEED_TODAY, int(1, 5))), motivo: pick(['Pediu para sair', 'Mudou de cidade', 'Descumpriu o termo de voluntariado']) }
          : null,
      registro: `JS-${cadastroEm.slice(0, 4)}-${String(4100 + i).padStart(6, '0')}`,
    });
  });

  // ---------- Banco de horas: 40 registros por mês nos últimos 12 meses ----------
  const horas: RegistroHoras[] = ALEX_HORAS.map(([data, projeto, h], i) => ({
    id: `h-alex-${i}`, voluntarioId: 'v-alex', entidadeId: 'ama-jaragua',
    // O check-in de hoje do Alex já foi feito na ação do Evento Beneficente.
    oportunidadeId: data === iso(SEED_TODAY) ? 'o-evento-beneficente' : null,
    data, projeto, horas: h, origem: 'qr',
  }));
  let seq = 0;
  const registrar = (v: Voluntario, data: string) => {
    const entidadeId = pick(v.entidadeIds);
    horas.push({
      id: `h-${++seq}`, voluntarioId: v.id, entidadeId, oportunidadeId: null, data,
      projeto: pick(projetosDe(entidadeId)), horas: pick([2, 3, 4, 4, 5, 6, 8]), origem: rand() < 0.9 ? 'qr' : 'manual',
      ...(rand() < 0.1 ? { justificativa: 'Leitor de QR indisponível no dia' } : {}),
    });
  };
  const outros = voluntarios.filter((v) => v.id !== 'v-alex' && v.id !== 'v-bruna');
  const ativos = outros.filter((v) => perfis.get(v.id) === 'ativo');
  const antigos = outros.filter((v) => ['inativo', 'desligado'].includes(perfis.get(v.id)!) && rand() < 0.75);
  // Todo ativo tem ao menos uma ação nos últimos 6 meses.
  const garantidos = new Map<number, Voluntario[]>();
  ativos.forEach((v) => {
    const mes = int(0, 5);
    garantidos.set(mes, [...(garantidos.get(mes) ?? []), v]);
  });
  for (let mes = 0; mes < 12; mes++) {
    const alvo = 40 - ALEX_HORAS.filter(([d]) => d.startsWith(format(subMonths(SEED_TODAY, mes), 'yyyy-MM'))).length;
    const base = garantidos.get(mes) ?? [];
    base.forEach((v) => registrar(v, dataNoMes(mes)));
    // Inativos e desligados só têm ações com mais de 6 meses.
    const pool = mes >= 7 ? [...ativos, ...antigos] : ativos;
    for (let n = base.length; n < alvo; n++) registrar(pick(pool), dataNoMes(mes));
  }

  // ---------- Oportunidades: a de hoje (para o check-in) e as próximas ----------
  const oportunidades: Oportunidade[] = [
    {
      id: 'o-evento-beneficente', entidadeId: 'ama-jaragua', titulo: 'Evento Beneficente', area: 'Assistência social',
      descricao: 'Recepção, oficinas e apoio na cozinha do evento anual da AMA.', data: iso(SEED_TODAY), turno: 'Tarde', horas: 6,
      local: 'Sede da AMA Jaraguá, Vila Nova', vagas: 20, inscritos: ['v-alex', 'v-bruna'], usaFormacao: false, encerradaEm: null, espera: [],
    },
  ];
  const turnos = ['Manhã', 'Tarde', 'Noite'] as const;
  ENTIDADES.forEach((e, ei) => {
    e.projetos.slice(0, 3).forEach((projeto, pi) => {
      const data = iso(addDays(SEED_TODAY, 2 + ei * 3 + pi * 9));
      oportunidades.push({
        id: `o-${e.id}-${pi}`, entidadeId: e.id, titulo: projeto, area: e.areas[pi % e.areas.length]!,
        descricao: `${projeto} com a equipe da ${e.nome}. Não precisa de experiência: a gente explica tudo no dia.`,
        data, turno: turnos[(ei + pi) % 3]!, horas: pick([3, 4, 4, 6]), local: `${e.nome}, ${e.bairro}`,
        vagas: int(6, 25), inscritos: sample(ativos.filter((v) => v.entidadeIds.includes(e.id)).map((v) => v.id), int(1, 5)),
        usaFormacao: pi === 0 && ['Saúde', 'Educação'].includes(e.areas[0]!), encerradaEm: null, espera: [],
      });
    });
  });

  // ---------- Parceiros e benefícios (três categorias) ----------
  const parceirosBase: Array<[string, string, Parceiro['categoria'], string, number, Array<[string, string]>]> = [
    ['p-cafe', 'Café Exemplo', 'Alimentação', 'Rua Reinoldo Rau, 410, Centro', 0.6, [['10% em qualquer pedido', 'Uma vez por dia, mostrando a carteirinha ativa.'], ['Café coado grátis no aniversário', 'No mês do aniversário, uma vez.']]],
    ['p-padaria', 'Padaria Pão da Serra', 'Alimentação', 'Rua Joinville, 1220, Vila Lalau', 1.8, [['15% em pães e salgados', 'De segunda a sexta, até as 10h.']]],
    ['p-restaurante', 'Restaurante Sabor do Vale', 'Alimentação', 'Av. Mal. Deodoro, 85, Centro', 1.1, [['Sobremesa grátis no almoço', 'No buffet do almoço, de segunda a sábado.']]],
    ['p-farmacia', 'Farmácia Bem Viver', 'Saúde', 'Rua Exp. Antônio Carlos Ferreira, 300, Nova Brasília', 2.3, [['12% em medicamentos genéricos', 'Não acumula com outras promoções.']]],
    ['p-otica', 'Ótica Visão Clara', 'Saúde', 'Rua Pres. Epitácio Pessoa, 520, Centro', 0.9, [['20% em armações', 'Uma vez por ano.']]],
    ['p-academia', 'Academia Movimento', 'Saúde', 'Rua Bernardo Dornbusch, 1500, Baependi', 3.4, [['Matrícula grátis', 'Para planos a partir de 3 meses.'], ['Aula experimental grátis', 'Uma por voluntário.']]],
    ['p-idiomas', 'Escola de Idiomas Fala Mais', 'Educação', 'Rua Walter Marquardt, 900, Barra do Rio Molha', 4.2, [['25% na mensalidade', 'Enquanto a carteirinha estiver ativa.']]],
    ['p-livraria', 'Livraria Página Nova', 'Educação', 'Rua Cel. Procópio Gomes, 60, Centro', 0.7, [['10% em livros', 'Exceto lançamentos do mês.']]],
    ['p-cursinho', 'Curso Rumo Certo', 'Educação', 'Rua Max Wilhelm, 210, Baependi', 2.9, [['Bolsa de 30% no pré-vestibular', 'Sujeita a vagas.']]],
    ['p-mercado', 'Mercado Bom Preço', 'Alimentação', 'Rua Ângelo Rubini, 1010, Barra do Rio Cerro', 5.1, [['5% nas compras acima de R$ 100', 'Uma vez por semana.']]],
  ];
  const parceiros: Parceiro[] = parceirosBase.map(([id, nome, categoria, endereco, distanciaKm], i) => ({
    id, nome, categoria, endereco, distanciaKm, status: 'aprovado',
    cnpj: `${String(30 + i)}.${String(410 + i * 3)}.555/0001-${String(10 + i)}`,
    telefone: `(47) 3371-${String(2000 + i * 111).padStart(4, '0')}`,
    email: `contato@${id.slice(2)}.exemplo.com.br`,
    contato: 'Gerência da loja',
  }));
  // Economia estimada por uso (em reais), informada pelo parceiro para o relatório ESG.
  const ECONOMIA: Record<string, number> = {
    '10% em qualquer pedido': 3, 'Café coado grátis no aniversário': 6, '15% em pães e salgados': 2.5, 'Sobremesa grátis no almoço': 9,
    '12% em medicamentos genéricos': 8, '20% em armações': 60, 'Matrícula grátis': 90, 'Aula experimental grátis': 35,
    '25% na mensalidade': 75, '10% em livros': 6, 'Bolsa de 30% no pré-vestibular': 180, '5% nas compras acima de R$ 100': 7,
  };
  const beneficios: Beneficio[] = parceirosBase.flatMap(([parceiroId, , categoria, , , lista]) =>
    lista.map(([titulo, regra], i) => ({
      id: `${parceiroId}-b${i}`, parceiroId, titulo, regra, categoria, status: 'aprovado' as const,
      economiaEstimada: ECONOMIA[titulo] ?? 5, aprovadoEm: '2025-04-01',
    })),
  );
  const resgates: Resgate[] = Array.from({ length: 14 }, (_, i) => {
    const b = pick(beneficios.filter((x) => x.parceiroId === 'p-cafe' || rand() < 0.3));
    const em = addDays(SEED_TODAY, -int(1, 40));
    em.setHours(int(8, 18), int(0, 59));
    return { id: `r-${i}`, parceiroId: b.parceiroId, beneficioId: b.id, voluntarioId: pick(ativos).id, em: em.toISOString() };
  });

  // ---------- Eventos, produtos e campanhas (usados nas próximas etapas) ----------
  const eventos: Evento[] = [
    ['Jantar Beneficente da AMA', 'ama-jaragua', 9, '19h30', 'Salão Comunitário da Vila Nova', [['Pago', 90, 200, 152], ['VIP', 180, 30, 21], ['Mesa', 600, 15, 9]]],
    ['Corrida Rio Limpo', 'instituto-itapocu', 16, '7h', 'Parque das Águas', [['Gratuito', 0, 300, 214], ['Combo', 75, 100, 48]]],
    ['Torneio de Inverno Bola na Rede', 'bola-na-rede', 23, '8h', 'Ginásio Municipal', [['Gratuito', 0, 500, 120], ['Patrocinador', 1500, 6, 4]]],
    ['Feira de Artesanato de Primavera', 'maos-que-tecem', 30, '9h', 'Praça Ângelo Piazera', [['Gratuito', 0, 800, 0]]],
    ['Noite de Talentos da Casa Recanto', 'casa-recanto', 37, '19h', 'Teatro Municipal', [['Pago', 40, 350, 210], ['VIP', 100, 40, 12]]],
    ['Festa Junina Solidária', 'banco-alimentos', 44, '17h', 'Pavilhão de eventos', [['Pago', 25, 600, 330], ['Combo', 60, 150, 70]]],
    ['Palestra: autismo na escola', 'ama-jaragua', 51, '19h', 'Auditório da Católica SC', [['Gratuito', 0, 180, 180]]],
    ['Bazar de Natal', 'maos-que-tecem', 58, '10h', 'Sede da Mãos que Tecem', [['Gratuito', 0, 400, 35], ['Patrocinador', 800, 5, 1]]],
  ].map(([titulo, entidadeId, dias, horario, local, ingressos], i) => ({
    id: `e-${i}`,
    slug: String(titulo).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    entidadeId: entidadeId as string,
    titulo: titulo as string,
    descricao: `${titulo}: toda a renda vai para os projetos da entidade.`,
    data: iso(addDays(SEED_TODAY, dias as number)),
    horario: horario as string,
    local: local as string,
    ingressos: (ingressos as Array<[Evento['ingressos'][number]['tipo'], number, number, number]>).map(([tipo, preco, total, vendidos]) => ({ tipo, preco, total, vendidos })),
  }));

  const produtos: Produto[] = (
    [
      ['Camiseta GERA', 'ama-jaragua', 'Camiseta', 49.9, 32, ['P', 'M', 'G', 'GG']],
      ['Caneca Rio Limpo', 'instituto-itapocu', 'Caneca', 35, 18, []],
      ['Livro "Histórias do Recanto"', 'casa-recanto', 'Livro', 40, 25, []],
      ['Rifa da bicicleta', 'bola-na-rede', 'Rifa', 10, 300, []],
      ['Bolsa de crochê', 'maos-que-tecem', 'Artesanato', 85, 3, ['Verde', 'Amarela']],
      ['Toalhinha bordada', 'maos-que-tecem', 'Artesanato', 30, 14, []],
      ['Kit cesta solidária', 'banco-alimentos', 'Produto de campanha', 60, 40, []],
      ['Camiseta Bola na Rede', 'bola-na-rede', 'Camiseta', 45, 22, ['PP', 'P', 'M', 'G']],
      ['Caneca AMA Jaraguá', 'ama-jaragua', 'Caneca', 35, 2, []],
      ['Ecobag Itapocu', 'instituto-itapocu', 'Produto de campanha', 25, 60, []],
      ['Livro de receitas do Banco', 'banco-alimentos', 'Livro', 38, 12, []],
      ['Chaveiro quebra-cabeça', 'ama-jaragua', 'Artesanato', 15, 50, []],
    ] as Array<[string, string, Produto['tipo'], number, number, string[]]>
  ).map(([nome, entidadeId, tipo, preco, estoque, variacoes], i) => ({
    id: `pr-${i}`,
    slug: nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    entidadeId, nome, tipo, preco, estoque, variacoes,
  }));

  const campanhas: Campanha[] = [
    { id: 'c-0', slug: 'reforma-da-sede', entidadeId: 'ama-jaragua', titulo: 'Reforma da sede', historia: 'A sede da AMA precisa de salas adaptadas para as oficinas sensoriais.', meta: 50000, arrecadado: 32500, apoiadores: 214, terminaEm: iso(addDays(SEED_TODAY, 18)) },
    { id: 'c-1', slug: 'agasalho-2026', entidadeId: 'banco-alimentos', titulo: 'Inverno sem frio', historia: 'Cobertores e agasalhos para 300 famílias atendidas pelo Banco.', meta: 15000, arrecadado: 11200, apoiadores: 167, terminaEm: iso(addDays(SEED_TODAY, 9)) },
    { id: 'c-2', slug: 'chuteiras', entidadeId: 'bola-na-rede', titulo: 'Uma chuteira para cada criança', historia: 'São 80 crianças treinando de tênis velho.', meta: 12000, arrecadado: 3900, apoiadores: 58, terminaEm: iso(addDays(SEED_TODAY, 40)) },
    { id: 'c-3', slug: 'mudas', entidadeId: 'instituto-itapocu', titulo: 'Mil mudas para o Itapocu', historia: 'Mudas nativas para recuperar 2 km de margem.', meta: 8000, arrecadado: 6100, apoiadores: 122, terminaEm: iso(addMonths(SEED_TODAY, 2)) },
  ];

  // ---------- Eventos já realizados nos últimos 12 meses ----------
  const realizados: Evento[] = (
    [
      ['Bingo Beneficente do Recanto', 'casa-recanto', 11, 20, 140],
      ['Mutirão de Natal', 'banco-alimentos', 10, 0, 150],
      ['Festival de Verão Bola na Rede', 'bola-na-rede', 9, 15, 220],
      ['Oficina aberta de crochê', 'maos-que-tecem', 8, 0, 60],
      ['Almoço de Páscoa da AMA', 'ama-jaragua', 6, 45, 160],
      ['Plantio coletivo no Itapocu', 'instituto-itapocu', 6, 0, 90],
      ['Brechó do Recanto', 'casa-recanto', 4, 10, 90],
      ['Festa Julina do Banco', 'banco-alimentos', 3, 25, 310],
      ['Campeonato de Férias', 'bola-na-rede', 2, 10, 180],
      ['Café com Histórias da AMA', 'ama-jaragua', 1, 30, 120],
    ] as Array<[string, string, number, number, number]>
  ).map(([titulo, entidadeId, mesesAtras, preco, vendidos], i) => ({
    id: `e-r${i}`,
    slug: titulo.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    entidadeId,
    titulo,
    descricao: `${titulo}: toda a renda foi para os projetos da entidade.`,
    data: dataNoMes(mesesAtras),
    horario: '19h',
    local: 'Sede da entidade',
    ingressos: [{ tipo: preco > 0 ? 'Pago' : 'Gratuito', preco, total: vendidos + 20, vendidos }],
  }));

  // ---------- Entradas de dinheiro, com data, para os indicadores por período ----------
  const entradas: Entrada[] = [];
  const entrada = (e: Omit<Entrada, 'id'>) => entradas.push({ id: `en-${entradas.length + 1}`, ...e });
  // Ingressos pagos: pedidos de 1 a 4 ingressos nas semanas antes do evento (nunca depois de hoje).
  [...realizados, ...eventos].forEach((ev) => {
    const ultimoDia = new Date(Math.min(addDays(new Date(`${ev.data}T12:00:00`), -1).getTime(), SEED_TODAY.getTime()));
    ev.ingressos
      .filter((i) => i.preco > 0)
      .forEach((i) => {
        for (let restantes = i.vendidos; restantes > 0; ) {
          const q = Math.min(restantes, int(1, 4));
          restantes -= q;
          entrada({ entidadeId: ev.entidadeId, fonte: 'Ingressos', valor: q * i.preco, quantidade: q, data: iso(addDays(ultimoDia, -int(0, 40))) });
        }
      });
  });
  // Loja: cerca de 18 pedidos por mês.
  for (let mes = 0; mes < 12; mes++) {
    for (let n = 0; n < 18; n++) {
      const produto = pick(produtos);
      const q = int(1, 3);
      entrada({ entidadeId: produto.entidadeId, fonte: 'Loja', valor: q * produto.preco, quantidade: q, data: dataNoMes(mes) });
    }
  }
  // Campanhas: os apoios somam exatamente o arrecadado de cada campanha.
  campanhas.forEach((c) => {
    const media = c.arrecadado / c.apoiadores;
    let soma = 0;
    for (let n = 0; n < c.apoiadores; n++) {
      const valor = n === c.apoiadores - 1 ? c.arrecadado - soma : Math.max(5, Math.round((media * (0.4 + rand() * 1.2)) / 5) * 5);
      if (valor <= 0) break;
      soma += valor;
      entrada({ entidadeId: c.entidadeId, fonte: 'Campanhas', valor, data: iso(addDays(SEED_TODAY, -int(0, 60))), campanhaId: c.id });
    }
  });
  // Doações avulsas e recorrentes.
  for (let mes = 0; mes < 12; mes++) {
    for (let n = 0; n < 10; n++) {
      entrada({ entidadeId: pick(ENTIDADES).id, fonte: 'Doações', valor: pick([20, 30, 50, 50, 100, 150, 200, 300]), data: dataNoMes(mes) });
    }
  }

  // ---------- Etapa 6 em diante: outra semente, para não mudar os dados gerados acima ----------
  const r2 = mulberry32(6);
  const int2 = (min: number, max: number) => min + Math.floor(r2() * (max - min + 1));
  const pick2 = <T,>(list: readonly T[]): T => list[Math.floor(r2() * list.length)]!;

  // Quem apoiou cada campanha: primeiro nome e inicial (é o que aparece para a entidade).
  entradas
    .filter((e) => e.fonte === 'Campanhas')
    .forEach((e) => {
      e.descricao = r2() < 0.25 ? 'Doação anônima' : `${pick2(NOMES)} ${pick2(SOBRENOMES).charAt(0)}.`;
    });

  // Oportunidades que já aconteceram, com os inscritos que foram.
  ENTIDADES.forEach((e) => {
    e.projetos.slice(0, 2).forEach((projeto, pi) => {
      const daEntidade = ativos.filter((v) => v.entidadeIds.includes(e.id)).map((v) => v.id);
      const vagas = int2(8, 20);
      oportunidades.push({
        id: `o-${e.id}-p${pi}`, entidadeId: e.id, titulo: projeto, area: e.areas[pi % e.areas.length]!,
        descricao: `${projeto} com a equipe da ${e.nome}.`,
        data: iso(addDays(SEED_TODAY, -(12 + pi * 23))), turno: turnos[pi % 3]!, horas: pick2([3, 4, 6]),
        local: `${e.nome}, ${e.bairro}`, vagas,
        inscritos: daEntidade.filter(() => r2() < 0.5).slice(0, vagas),
        usaFormacao: false, encerradaEm: iso(addDays(SEED_TODAY, -(11 + pi * 23))), espera: [],
      });
    });
  });

  // Ingressos já emitidos: os do Alex (para "Meus ingressos") e alguns do Jantar, para o check-in.
  const jantar = eventos.find((e) => e.titulo === 'Jantar Beneficente da AMA')!;
  const palestra = eventos.find((e) => e.titulo === 'Palestra: autismo na escola')!;
  const pedidos: Pedido[] = [];
  const ingressosEmitidos: IngressoEmitido[] = [];
  const emitir = (pedidoId: string, eventoId: string, tipo: string, participante: string) => {
    const id = `ing-${ingressosEmitidos.length + 1}`;
    ingressosEmitidos.push({ id, pedidoId, eventoId, tipo, participante, codigo: `GERA-INGRESSO:${id}`, usadoEm: null });
  };
  pedidos.push({
    id: 'ped-1', tipo: 'ingressos', entidadeId: 'ama-jaragua', descricao: `2 ingressos · ${jantar.titulo}`, valor: 180,
    comprador: { nome: 'Alex Silva', email: 'alex.silva@exemplo.com.br' }, voluntarioId: 'v-alex', metodo: 'pix', status: 'pago',
    criadoEm: '2026-10-02T19:12:00.000Z', cobrancaId: null, eventoId: jantar.id, ingressos: [{ tipo: 'Pago', quantidade: 2, preco: 90 }],
  });
  emitir('ped-1', jantar.id, 'Pago', 'Alex Silva');
  emitir('ped-1', jantar.id, 'Pago', 'Marina Silva');
  pedidos.push({
    id: 'ped-2', tipo: 'ingressos', entidadeId: 'ama-jaragua', descricao: `1 ingresso · ${palestra.titulo}`, valor: 0,
    comprador: { nome: 'Alex Silva', email: 'alex.silva@exemplo.com.br' }, voluntarioId: 'v-alex', metodo: 'gratuito', status: 'pago',
    criadoEm: '2026-10-05T10:40:00.000Z', cobrancaId: null, eventoId: palestra.id, ingressos: [{ tipo: 'Gratuito', quantidade: 1, preco: 0 }],
  });
  emitir('ped-2', palestra.id, 'Gratuito', 'Alex Silva');
  for (let n = 0; n < 4; n++) {
    const nome = `${pick2(NOMES)} ${pick2(SOBRENOMES)}`;
    const tipo = n === 3 ? 'VIP' : 'Pago';
    const preco = tipo === 'VIP' ? 180 : 90;
    pedidos.push({
      id: `ped-${pedidos.length + 1}`, tipo: 'ingressos', entidadeId: 'ama-jaragua', descricao: `1 ingresso · ${jantar.titulo}`, valor: preco,
      comprador: { nome, email: email(nome) }, voluntarioId: null, metodo: 'cartao', status: 'pago',
      criadoEm: `2026-10-0${n + 3}T15:00:00.000Z`, cobrancaId: null, eventoId: jantar.id, ingressos: [{ tipo, quantidade: 1, preco }],
    });
    emitir(pedidos[pedidos.length - 1]!.id, jantar.id, tipo, nome);
  }
  // A doação do Alex na Reforma da sede (já somada no arrecadado da campanha).
  const reforma = campanhas.find((c) => c.slug === 'reforma-da-sede')!;
  const apoioAlex = entradas.find((e) => e.campanhaId === reforma.id)!;
  apoioAlex.valor = 100;
  apoioAlex.descricao = 'Alex Silva';
  apoioAlex.data = '2026-09-20';
  const ajuste = entradas.filter((e) => e.campanhaId === reforma.id);
  // Mantém a soma igual ao arrecadado depois de fixar o apoio do Alex em R$ 100.
  ajuste[ajuste.length - 1]!.valor = reforma.arrecadado - ajuste.slice(0, -1).reduce((s, e) => s + e.valor, 0);
  apoioAlex.pedidoId = `ped-${pedidos.length + 1}`;
  pedidos.push({
    id: apoioAlex.pedidoId, tipo: 'doacao', entidadeId: reforma.entidadeId, descricao: `Doação · ${reforma.titulo}`, valor: 100,
    comprador: { nome: 'Alex Silva', email: 'alex.silva@exemplo.com.br' }, voluntarioId: 'v-alex', metodo: 'pix', status: 'pago',
    criadoEm: '2026-09-20T12:00:00.000Z', cobrancaId: null, campanhaId: reforma.id, mensal: false,
  });

  // Estoque: entrada inicial, algumas vendas e um brinde, terminando no estoque atual.
  const movimentosEstoque: MovimentoEstoque[] = [];
  produtos.forEach((p) => {
    const vendas = Array.from({ length: int2(1, 3) }, () => int2(1, 4));
    const brinde = r2() < 0.3 ? int2(1, 2) : 0;
    const inicial = p.estoque + vendas.reduce((s, q) => s + q, 0) + brinde;
    const mov = (tipo: MovimentoEstoque['tipo'], quantidade: number, motivo: string, dias: number) =>
      movimentosEstoque.push({ id: `me-${movimentosEstoque.length + 1}`, produtoId: p.id, entidadeId: p.entidadeId, tipo, quantidade, motivo, em: `${iso(addDays(SEED_TODAY, -dias))}T10:00:00.000Z` });
    mov('entrada', inicial, 'Estoque inicial', 90);
    vendas.forEach((q, i) => mov('saida', q, 'Venda na loja', 60 - i * 15));
    if (brinde) mov('saida', brinde, 'Brinde em evento', 10);
  });

  // Patrocinadores (empresas fictícias), com o valor lançado no financeiro.
  const EMPRESAS = ['Metalúrgica Vale do Itapocu', 'Têxtil Jaraguá Exemplo', 'Transportadora Rota Norte', 'Construtora Pedra Firme', 'Contabilidade Soma', 'Auto Peças Serra', 'Clínica Sorriso Exemplo', 'Agropecuária Campo Bom'];
  const VALOR_COTA = { Ouro: 12000, Prata: 6000, Bronze: 3000, Apoio: 1000 } as const;
  const CONTRAPARTIDAS = {
    Ouro: ['Logo no banner principal dos eventos', 'Menção nas redes sociais (4 posts)', 'Mesa VIP no evento anual', 'Relatório de impacto no fim da cota'],
    Prata: ['Logo no banner dos eventos', 'Menção nas redes sociais (2 posts)', 'Relatório de impacto no fim da cota'],
    Bronze: ['Logo no site da entidade', 'Menção nas redes sociais (1 post)'],
    Apoio: ['Agradecimento no site da entidade'],
  } as const;
  const patrocinadores: Patrocinador[] = [];
  ENTIDADES.forEach((e, ei) => {
    const quantos = ei === 0 ? 3 : int2(1, 2);
    for (let n = 0; n < quantos; n++) {
      const cota = (['Ouro', 'Prata', 'Bronze', 'Apoio'] as const)[(ei + n) % 4]!;
      const inicio = iso(addDays(SEED_TODAY, -int2(20, 200)));
      const id = `pat-${patrocinadores.length + 1}`;
      patrocinadores.push({
        id, entidadeId: e.id, nome: EMPRESAS[(ei * 2 + n) % EMPRESAS.length]!, cota, valor: VALOR_COTA[cota], inicio,
        fim: iso(addMonths(new Date(`${inicio}T12:00:00`), 12)), contato: 'Responsável de marketing · (47) 3370-0000',
        contrapartidas: CONTRAPARTIDAS[cota].map((texto, k) => ({ id: `${id}-c${k}`, texto, entregue: r2() < 0.5 })),
      });
      entrada({ entidadeId: e.id, fonte: 'Patrocínios', valor: VALOR_COTA[cota], data: inicio, patrocinadorId: id, descricao: `Cota ${cota} · ${EMPRESAS[(ei * 2 + n) % EMPRESAS.length]}` });
    }
  });

  // ---------- Etapa 7: empresa dos voluntários, despesas, certificados e auditoria ----------
  const r3 = mulberry32(7);
  const int3 = (min: number, max: number) => min + Math.floor(r3() * (max - min + 1));
  const pick3 = <T,>(list: readonly T[]): T => list[Math.floor(r3() * list.length)]!;
  const EMPREGADORES = [...EMPRESAS.slice(0, 6), 'Indústria de Motores Exemplo', 'Malharia Fio Bom', 'Cooperativa Agrícola Vale', 'Escritório Contábil Exato'];
  voluntarios.forEach((v) => {
    if (v.id === 'v-alex') v.empresa = 'Indústria de Motores Exemplo';
    else if (v.id !== 'v-bruna' && r3() < 0.55) v.empresa = pick3(EMPREGADORES);
  });

  const DESPESAS: Record<Despesa['categoria'], Array<[string, number, number]>> = {
    Materiais: [['Material de oficina', 80, 450], ['Material de limpeza', 60, 220]],
    Alimentação: [['Lanche dos voluntários', 90, 380], ['Compra de alimentos', 200, 1200]],
    Transporte: [['Combustível da van', 120, 400], ['Frete de doações', 80, 300]],
    Eventos: [['Aluguel de som e luz', 400, 1500], ['Decoração do evento', 150, 600]],
    Manutenção: [['Conserto na sede', 150, 900], ['Pintura e reparos', 300, 1400]],
    Serviços: [['Conta de luz da sede', 180, 420], ['Internet e telefone', 120, 180], ['Contabilidade', 350, 600]],
    Outros: [['Taxas bancárias', 20, 60]],
  };
  const despesas: Despesa[] = [];
  ENTIDADES.forEach((e) => {
    for (let mes = 0; mes < 12; mes++) {
      for (let n = int3(2, 4); n > 0; n--) {
        const categoria = pick3(Object.keys(DESPESAS) as Array<Despesa['categoria']>);
        const [descricao, min, max] = pick3(DESPESAS[categoria]);
        despesas.push({
          id: `d-${despesas.length + 1}`, entidadeId: e.id, categoria, descricao, valor: int3(min / 5, max / 5) * 5,
          data: dataNoMes(mes), lancadaPor: `Equipe ${e.nome}`,
        });
      }
    }
  });

  const codigo = () => {
    const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bloco = () => Array.from({ length: 4 }, () => letras[int3(0, letras.length - 1)]).join('');
    return `GERA-${bloco()}-${bloco()}`;
  };
  const certificados: Certificado[] = [];
  const certificar = (voluntarioId: string, entidadeId: string, inicio: string, fim: string, emitidoEm: string) => {
    const h = horas.filter((x) => x.voluntarioId === voluntarioId && x.entidadeId === entidadeId && x.data >= inicio && x.data <= fim).reduce((s, x) => s + x.horas, 0);
    if (h > 0) {
      certificados.push({ id: `cert-${certificados.length + 1}`, codigo: codigo(), voluntarioId, entidadeId, horas: h, inicio, fim, emitidoEm, emitidoPor: `Equipe ${ENTIDADES.find((e) => e.id === entidadeId)!.nome}` });
    }
  };
  certificar('v-alex', 'ama-jaragua', '2025-05-01', '2025-12-31', '2026-01-10');
  certificar('v-alex', 'ama-jaragua', '2026-01-01', '2026-06-30', '2026-07-05');
  ativos.slice(0, 12).forEach((v) => certificar(v.id, v.entidadeIds[0]!, '2026-01-01', '2026-06-30', '2026-07-05'));

  const auditoria: RegistroAuditoria[] = [];
  const auditado = (em: string, autor: string, acao: string, entidadeId: string | null, alvo: string, detalhe?: string) =>
    auditoria.push({ id: `aud-${auditoria.length + 1}`, em, autor, acao, entidadeId, alvo, ...(detalhe ? { detalhe } : {}) });
  voluntarios
    .filter((v) => v.aprovadoEm && v.aprovadoEm >= '2026-07-01')
    .slice(0, 8)
    .forEach((v) => auditado(`${v.aprovadoEm}T14:00:00.000Z`, `Equipe ${ENTIDADES.find((e) => e.id === v.entidadeIds[0])!.nome}`, 'Aprovou cadastro', v.entidadeIds[0]!, v.nome));
  voluntarios
    .filter((v) => v.desligamento)
    .slice(0, 4)
    .forEach((v) => auditado(`${v.desligamento!.em}T16:30:00.000Z`, `Equipe ${ENTIDADES.find((e) => e.id === v.entidadeIds[0])!.nome}`, 'Desligou voluntário', v.entidadeIds[0]!, v.nome, v.desligamento!.motivo));
  horas
    .filter((h) => h.origem === 'manual' && h.data >= '2026-08-01')
    .slice(0, 5)
    .forEach((h) => auditado(`${h.data}T18:00:00.000Z`, `Equipe ${ENTIDADES.find((e) => e.id === h.entidadeId)!.nome}`, 'Lançou horas à mão', h.entidadeId, voluntarios.find((v) => v.id === h.voluntarioId)!.nome, `${h.horas} h: ${h.justificativa ?? 'Leitor de QR indisponível no dia'}`));
  despesas
    .filter((d) => d.data >= '2026-09-15')
    .slice(0, 6)
    .forEach((d) => auditado(`${d.data}T11:00:00.000Z`, d.lancadaPor, 'Lançou despesa', d.entidadeId, d.descricao, `${d.categoria} · R$ ${d.valor}`));
  auditoria.sort((a, b) => a.em.localeCompare(b.em));

  // ---------- Etapa 8: comitê, termo com versão e uma entidade aguardando aprovação ----------
  const comite: MockDb['comite'] = {
    nome: 'Comitê Social ACIJS',
    cnpj: '83.786.004/0001-62',
    email: 'comitesocial@acijs.com.br',
    telefone: '(47) 3275-7000',
    endereco: 'Rua Octaviano Lombardi, 100, Czerniewicz, Jaraguá do Sul/SC',
    termo: {
      versao: '2.0',
      publicadoEm: '2026-03-01',
      texto: [
        'Este termo segue a Lei nº 9.608/1998, que trata do serviço voluntário. Ao aceitar, você declara que:',
        '- presta serviço voluntário, sem vínculo de emprego e sem remuneração, à entidade escolhida;',
        '- vai seguir as orientações da entidade e respeitar as pessoas atendidas, com sigilo sobre o que souber delas;',
        '- pode deixar o voluntariado quando quiser, avisando a entidade;',
        '- autoriza o uso dos seus dados para cadastro, banco de horas, certificados e carteirinha, conforme a LGPD, e pode pedir a exclusão a qualquer momento;',
        '- entende que a carteirinha e os benefícios dos parceiros valem enquanto houver ação validada nos últimos 6 meses.',
      ].join('\n'),
      historico: [
        { versao: '1.0', publicadoEm: '2025-01-15' },
        { versao: '2.0', publicadoEm: '2026-03-01' },
      ],
    },
    admins: [
      { id: 'adm-1', nome: 'Coordenação do Comitê Social', email: 'comitesocial@acijs.com.br', desde: '2025-01-15' },
      { id: 'adm-2', nome: 'Secretaria executiva ACIJS', email: 'secretaria@acijs.com.br', desde: '2025-02-01' },
    ],
  };
  voluntarios.forEach((v) => {
    if (v.termoAceitoEm) v.termoVersao = v.termoAceitoEm >= '2026-03-01' ? '2.0' : '1.0';
  });
  entidades.push({
    id: 'coral-vozes', slug: 'coral-vozes', nome: 'Coral Vozes do Vale', causa: 'Música e canto coral para crianças e idosos.',
    areas: ['Cultura', 'Educação'], bairro: 'Rau', ativa: false, aprovadaEm: null, cnpj: '19.876.543/0001-21',
    email: 'contato@coralvozes.org.br', telefone: '(47) 3371-4455', responsavel: 'Helena Kruger', corDestaque: 'portal-engajar',
    equipe: [{ id: 'coral-vozes-m1', nome: 'Helena Kruger', email: 'helena@coralvozes.org.br', papel: 'Administrador', desde: '2026-10-12', convitePendente: false }],
  });

  // ---------- Etapa 9: aprovação de parceiros e benefícios, preferências e notificações ----------
  // Um parceiro novo esperando o comitê, com um benefício também pendente.
  parceiros.push({
    id: 'p-odonto', nome: 'Clínica Odonto Sorriso', categoria: 'Saúde', endereco: 'Rua Barão do Rio Branco, 740, Centro', distanciaKm: 1.4,
    status: 'pendente', cnpj: '41.222.333/0001-55', telefone: '(47) 3372-8800', email: 'contato@odontosorriso.exemplo.com.br', contato: 'Dra. Renata Campos',
  });
  beneficios.push(
    { id: 'p-odonto-b0', parceiroId: 'p-odonto', titulo: 'Limpeza com 40% de desconto', regra: 'Uma vez a cada 6 meses, com agendamento.', categoria: 'Saúde', status: 'pendente', economiaEstimada: 80 },
    // No Café Exemplo: um benefício novo esperando aprovação e um recusado, com o motivo que volta ao parceiro.
    { id: 'p-cafe-b2', parceiroId: 'p-cafe', titulo: 'Combo café + pão de queijo por R$ 9', regra: 'De segunda a sexta, das 14h às 17h.', categoria: 'Alimentação', status: 'pendente', economiaEstimada: 4 },
    { id: 'p-cafe-b3', parceiroId: 'p-cafe', titulo: '50% em tudo, todos os dias', regra: 'Sem limite de uso.', categoria: 'Alimentação', status: 'recusado', economiaEstimada: 15, motivoRecusa: 'Desconto alto demais para manter no tempo. O comitê sugere até 20% ou um limite de usos por semana.' },
  );
  // Um benefício aprovado há poucos dias (aparece como "benefício novo").
  const livraria = beneficios.find((b) => b.id === 'p-livraria-b0')!;
  livraria.aprovadoEm = iso(addDays(SEED_TODAY, -5));
  // O Alex está inscrito na próxima ação da AMA (lembrete "sua ação é amanhã").
  const proximaAma = oportunidades.find((o) => o.id === 'o-ama-jaragua-0')!;
  if (!proximaAma.inscritos.includes('v-alex')) proximaAma.inscritos.push('v-alex');
  voluntarios.forEach((v) => {
    v.preferencias = { canais: ['app', 'email'], oportunidades: true, lembretes: true, beneficios: true, carteirinha: true };
  });
  Object.assign(voluntarios.find((v) => v.id === 'v-alex')!, {
    disponibilidade: ['Sábado · Manhã', 'Sábado · Tarde', 'Quarta · Noite'], profissao: 'Engenheiro eletricista', usaFormacao: false,
  });
  Object.assign(voluntarios.find((v) => v.id === 'v-bruna')!, { disponibilidade: ['Sábado · Manhã', 'Domingo · Tarde'], profissao: 'Psicóloga' });

  // ---------- Etapa 10: uma ação lotada da AMA, com lista de espera ----------
  const lotada = oportunidades.find((o) => o.id === 'o-ama-jaragua-1')!;
  const daAma = ativos.filter((v) => v.entidadeIds.includes('ama-jaragua')).map((v) => v.id);
  lotada.vagas = Math.max(3, lotada.inscritos.length);
  lotada.inscritos = [...new Set([...lotada.inscritos, ...daAma])].filter((id) => id !== 'v-alex').slice(0, lotada.vagas);
  lotada.vagas = lotada.inscritos.length;
  lotada.espera = daAma.filter((id) => !lotada.inscritos.includes(id)).slice(0, 1);

  // Três voluntários da AMA ainda ativos, mas sem ação há uns 5 meses (lista "Para reengajar").
  daAma
    .filter((id) => !lotada.inscritos.includes(id) && !lotada.espera.includes(id) && !certificados.some((c) => c.voluntarioId === id))
    .slice(-3)
    .forEach((id, i) => {
      const limite = iso(subMonths(SEED_TODAY, 5));
      for (let k = horas.length - 1; k >= 0; k--) if (horas[k]!.voluntarioId === id && horas[k]!.data > limite) horas.splice(k, 1);
      horas.push({ id: `h-reengajar-${i}`, voluntarioId: id, entidadeId: 'ama-jaragua', oportunidadeId: null, data: iso(addDays(SEED_TODAY, -(158 + i * 6))), projeto: 'Apoio às famílias', horas: 4, origem: 'qr' });
      oportunidades.forEach((o) => {
        if (o.data >= iso(SEED_TODAY)) o.inscritos = o.inscritos.filter((x) => x !== id);
      });
    });

  return {
    versao: DB_VERSION, entidades, voluntarios, horas, oportunidades, parceiros, beneficios, resgates,
    eventos: [...realizados, ...eventos], produtos, campanhas, entradas, pedidos, ingressosEmitidos, movimentosEstoque, patrocinadores,
    despesas, certificados, auditoria, comite, pedidosExclusao: [], avisos: [],
  };
}
