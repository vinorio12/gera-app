// Relatórios de prestação de contas e de voluntariado corporativo, por entidade ou consolidados.
// Devolvem o Documento pronto: a mesma estrutura vira prévia, PDF e planilha.
import { delay, getDb } from '../mocks/db';
import { statusDoVoluntario } from '../lib/carteirinha';
import type { Documento } from '../lib/documento';
import { formatDate, formatDateTime, formatMoeda } from '../lib/format';
import { CATEGORIAS_DESPESA } from '../types/domain';
import { FONTES, type Periodo } from './indicadores';

const dentro = (data: string, p: Periodo) => data.slice(0, 10) >= p.inicio && data.slice(0, 10) <= p.fim;
const centavos = (v: number) => Math.round(v * 100) / 100;
const soma = (l: Array<{ valor: number }>) => centavos(l.reduce((s, x) => s + x.valor, 0));

export type TipoRelatorio = 'prestacao' | 'corporativo';

export const RELATORIOS: Array<{ id: TipoRelatorio; titulo: string; descricao: string }> = [
  { id: 'prestacao', titulo: 'Prestação de contas', descricao: 'Entradas por fonte, despesas por categoria, saldo, horas, eventos, campanhas e patrocínios.' },
  { id: 'corporativo', titulo: 'Voluntariado corporativo', descricao: 'Horas de voluntariado por empresa, a partir do campo empresa do cadastro.' },
];

function cabecalho(entidadeId: string | undefined, p: Periodo) {
  const nome = entidadeId ? getDb().entidades.find((e) => e.id === entidadeId)?.nome ?? '' : 'Todas as entidades';
  return { nome, subtitulo: `${nome} · ${formatDate(p.inicio)} a ${formatDate(p.fim)}`, geradoEm: formatDateTime(new Date().toISOString()) };
}

export async function gerarRelatorio(input: { tipo: TipoRelatorio; periodo: Periodo; entidadeId?: string }): Promise<Documento> {
  await delay(300);
  return input.tipo === 'prestacao' ? prestacaoDeContas(input.periodo, input.entidadeId) : voluntariadoCorporativo(input.periodo, input.entidadeId);
}

function prestacaoDeContas(p: Periodo, entidadeId?: string): Documento {
  const db = getDb();
  const doRecorte = <T extends { entidadeId: string }>(l: T[]) => (entidadeId ? l.filter((x) => x.entidadeId === entidadeId) : l);
  const entradas = doRecorte(db.entradas).filter((e) => dentro(e.data, p));
  const despesas = doRecorte(db.despesas).filter((d) => dentro(d.data, p));
  const horas = doRecorte(db.horas).filter((h) => dentro(h.data, p));
  const eventos = doRecorte(db.eventos).filter((e) => dentro(e.data, p));
  const voluntarios = entidadeId ? db.voluntarios.filter((v) => v.entidadeIds.includes(entidadeId)) : db.voluntarios;
  const ativos = voluntarios.filter((v) => statusDoVoluntario(v, db.horas.filter((h) => h.voluntarioId === v.id)) === 'ativo').length;
  const totalEntradas = soma(entradas);
  const totalDespesas = soma(despesas);
  const totalHoras = horas.reduce((s, h) => s + h.horas, 0);
  const { subtitulo, geradoEm } = cabecalho(entidadeId, p);

  const porProjeto = new Map<string, { acoes: number; horas: number }>();
  horas.forEach((h) => {
    const atual = porProjeto.get(h.projeto) ?? { acoes: 0, horas: 0 };
    porProjeto.set(h.projeto, { acoes: atual.acoes + 1, horas: atual.horas + h.horas });
  });
  const campanhas = doRecorte(db.campanhas).filter((c) => c.terminaEm >= p.inicio);
  const patrocinios = doRecorte(db.patrocinadores).filter((x) => x.inicio <= p.fim && x.fim >= p.inicio);
  const nomeEntidade = (id: string) => db.entidades.find((e) => e.id === id)?.nome ?? '';

  return {
    titulo: 'Prestação de contas',
    subtitulo,
    geradoEm,
    destaques: [
      { rotulo: 'Entradas', valor: formatMoeda(totalEntradas) },
      { rotulo: 'Despesas', valor: formatMoeda(totalDespesas) },
      { rotulo: 'Saldo do período', valor: formatMoeda(centavos(totalEntradas - totalDespesas)) },
      { rotulo: 'Horas voluntárias', valor: `${totalHoras.toLocaleString('pt-BR')} h` },
      { rotulo: 'Voluntários ativos hoje', valor: ativos.toLocaleString('pt-BR') },
      { rotulo: 'Eventos no período', valor: eventos.length.toLocaleString('pt-BR') },
    ],
    secoes: [
      {
        titulo: 'Entradas por fonte',
        descricao: 'Pagamentos aprovados (ingressos, loja, campanhas, doações) e cotas de patrocínio.',
        colunas: [{ titulo: 'Fonte' }, { titulo: 'Lançamentos', tipo: 'numero' }, { titulo: 'Valor', tipo: 'moeda' }],
        linhas: FONTES.map((f) => {
          const l = entradas.filter((e) => e.fonte === f);
          return [f, l.length, soma(l)];
        }),
        total: ['Total', entradas.length, totalEntradas],
      },
      {
        titulo: 'Despesas por categoria',
        descricao: 'Lançadas à mão pela entidade, com registro no histórico de auditoria.',
        colunas: [{ titulo: 'Categoria' }, { titulo: 'Lançamentos', tipo: 'numero' }, { titulo: 'Valor', tipo: 'moeda' }],
        linhas: CATEGORIAS_DESPESA.map((c) => {
          const l = despesas.filter((d) => d.categoria === c);
          return [c, l.length, soma(l)] as Array<string | number>;
        }).filter((l) => (l[1] as number) > 0),
        total: ['Total', despesas.length, totalDespesas],
        vazio: 'Nenhuma despesa no período.',
      },
      ...(entidadeId
        ? []
        : [
            {
              titulo: 'Por entidade',
              colunas: [{ titulo: 'Entidade' }, { titulo: 'Entradas', tipo: 'moeda' as const }, { titulo: 'Despesas', tipo: 'moeda' as const }, { titulo: 'Saldo', tipo: 'moeda' as const }, { titulo: 'Horas', tipo: 'horas' as const }],
              linhas: db.entidades.map((e) => {
                const en = soma(entradas.filter((x) => x.entidadeId === e.id));
                const de = soma(despesas.filter((x) => x.entidadeId === e.id));
                return [e.nome, en, de, centavos(en - de), horas.filter((h) => h.entidadeId === e.id).reduce((s, h) => s + h.horas, 0)];
              }),
            },
          ]),
      {
        titulo: 'Horas por projeto',
        colunas: [{ titulo: 'Projeto' }, { titulo: 'Ações', tipo: 'numero' }, { titulo: 'Horas', tipo: 'horas' }],
        linhas: [...porProjeto.entries()].sort((a, b) => b[1].horas - a[1].horas).map(([projeto, v]) => [projeto, v.acoes, v.horas]),
        total: ['Total', horas.length, totalHoras],
        vazio: 'Nenhuma hora registrada no período.',
      },
      {
        titulo: 'Eventos',
        colunas: [...(entidadeId ? [] : [{ titulo: 'Entidade' }]), { titulo: 'Evento' }, { titulo: 'Data', tipo: 'data' }, { titulo: 'Ingressos vendidos', tipo: 'numero' }],
        linhas: eventos
          .sort((a, b) => a.data.localeCompare(b.data))
          .map((e) => [...(entidadeId ? [] : [nomeEntidade(e.entidadeId)]), e.titulo, e.data, e.ingressos.reduce((s, i) => s + i.vendidos, 0)]),
        vazio: 'Nenhum evento no período.',
      },
      {
        titulo: 'Campanhas',
        colunas: [{ titulo: 'Campanha' }, { titulo: 'Meta', tipo: 'moeda' }, { titulo: 'No período', tipo: 'moeda' }, { titulo: 'Total arrecadado', tipo: 'moeda' }],
        linhas: campanhas.map((c) => [c.titulo, c.meta, soma(entradas.filter((e) => e.campanhaId === c.id)), c.arrecadado]),
        vazio: 'Nenhuma campanha no ar no período.',
      },
      {
        titulo: 'Patrocínios vigentes no período',
        colunas: [{ titulo: 'Empresa' }, { titulo: 'Cota' }, { titulo: 'Vigência' }, { titulo: 'Valor', tipo: 'moeda' }],
        linhas: patrocinios.map((x) => [x.nome, x.cota, `${formatDate(x.inicio)} a ${formatDate(x.fim)}`, x.valor]),
        vazio: 'Nenhum patrocínio no período.',
      },
    ],
    rodape: 'Valores de pagamentos simulados no protótipo. Plataforma GERA · Comitê Social ACIJS.',
  };
}

function voluntariadoCorporativo(p: Periodo, entidadeId?: string): Documento {
  const db = getDb();
  const horas = db.horas.filter((h) => dentro(h.data, p) && (!entidadeId || h.entidadeId === entidadeId));
  const porEmpresa = new Map<string, { voluntarios: Set<string>; acoes: number; horas: number }>();
  horas.forEach((h) => {
    const empresa = db.voluntarios.find((v) => v.id === h.voluntarioId)?.empresa?.trim() || 'Sem empresa informada';
    const atual = porEmpresa.get(empresa) ?? { voluntarios: new Set<string>(), acoes: 0, horas: 0 };
    atual.voluntarios.add(h.voluntarioId);
    atual.acoes += 1;
    atual.horas += h.horas;
    porEmpresa.set(empresa, atual);
  });
  const linhas = [...porEmpresa.entries()]
    // "Sem empresa" vai para o fim, as empresas por horas.
    .sort((a, b) => Number(a[0] === 'Sem empresa informada') - Number(b[0] === 'Sem empresa informada') || b[1].horas - a[1].horas)
    .map(([empresa, v]) => [empresa, v.voluntarios.size, v.acoes, v.horas] as Array<string | number>);
  const comEmpresa = linhas.filter((l) => l[0] !== 'Sem empresa informada');
  const { subtitulo, geradoEm } = cabecalho(entidadeId, p);
  const total = horas.reduce((s, h) => s + h.horas, 0);
  const horasEmpresas = comEmpresa.reduce((s, l) => s + (l[3] as number), 0);
  return {
    titulo: 'Voluntariado corporativo',
    subtitulo,
    geradoEm,
    destaques: [
      { rotulo: 'Empresas com voluntários', valor: comEmpresa.length.toLocaleString('pt-BR') },
      { rotulo: 'Horas de colaboradores', valor: `${horasEmpresas.toLocaleString('pt-BR')} h` },
      { rotulo: 'Parte do total de horas', valor: total ? `${Math.round((horasEmpresas / total) * 100)}%` : '0%' },
    ],
    secoes: [
      {
        titulo: 'Horas por empresa',
        descricao: 'Empresa informada pelo voluntário no cadastro. Serve para o relatório ESG das empresas.',
        colunas: [{ titulo: 'Empresa' }, { titulo: 'Voluntários', tipo: 'numero' }, { titulo: 'Ações', tipo: 'numero' }, { titulo: 'Horas', tipo: 'horas' }],
        linhas,
        total: ['Total', new Set(horas.map((h) => h.voluntarioId)).size, horas.length, total],
        vazio: 'Nenhuma hora registrada no período.',
      },
    ],
    rodape: 'Plataforma GERA · Comitê Social ACIJS.',
  };
}
