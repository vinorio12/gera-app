// Dados de exemplo do protótipo, gerados de forma determinística (mesma semente = mesmos dados).
// Nenhum nome de pessoa ou empresa real além dos que estão no documento de requisitos.
import { addDays, addMonths, format, subMonths } from 'date-fns';
import { cpfFromBase } from '../lib/cpf';
import type {
  Area,
  Beneficio,
  Campanha,
  Entidade,
  Evento,
  MockDb,
  Oportunidade,
  Parceiro,
  Produto,
  RegistroHoras,
  Resgate,
  Voluntario,
} from '../types/domain';

export const DB_VERSION = 1;

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

const ENTIDADES: Array<Entidade & { projetos: string[] }> = [
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
  const sample = <T,>(list: readonly T[], n: number): T[] => [...list].sort(() => rand() - 0.5).slice(0, n);
  const cpf = () => cpfFromBase(Array.from({ length: 9 }, () => int(0, 9)));
  const telefone = () => `(47) 9${int(8000, 9999)}-${String(int(0, 9999)).padStart(4, '0')}`;
  const email = (nome: string) =>
    `${nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, '.')}@exemplo.com.br`;
  const dataNoMes = (mesesAtras: number) => {
    const inicio = subMonths(new Date(SEED_TODAY.getFullYear(), SEED_TODAY.getMonth(), 1), mesesAtras);
    const ultimoDia = mesesAtras === 0 ? SEED_TODAY.getDate() : new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0).getDate();
    return iso(new Date(inicio.getFullYear(), inicio.getMonth(), int(1, ultimoDia)));
  };

  const entidades: Entidade[] = ENTIDADES.map(({ projetos: _projetos, ...e }) => e);
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
    id: `h-alex-${i}`, voluntarioId: 'v-alex', entidadeId: 'ama-jaragua', oportunidadeId: null, data, projeto, horas: h, origem: 'qr',
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
      local: 'Sede da AMA Jaraguá, Vila Nova', vagas: 20, inscritos: ['v-alex', 'v-bruna'], usaFormacao: false,
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
        usaFormacao: pi === 0 && ['Saúde', 'Educação'].includes(e.areas[0]!),
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
  const parceiros: Parceiro[] = parceirosBase.map(([id, nome, categoria, endereco, distanciaKm]) => ({ id, nome, categoria, endereco, distanciaKm }));
  const beneficios: Beneficio[] = parceirosBase.flatMap(([parceiroId, , categoria, , , lista]) =>
    lista.map(([titulo, regra], i) => ({ id: `${parceiroId}-b${i}`, parceiroId, titulo, regra, categoria })),
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

  return { versao: DB_VERSION, entidades, voluntarios, horas, oportunidades, parceiros, beneficios, resgates, eventos, produtos, campanhas };
}
