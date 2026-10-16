import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { preparar, type Perfil } from './ajuda';

// Todas as rotas de todos os perfis, no tema claro, no escuro e em 360 px.
// Falha com qualquer violação séria ou crítica do axe (WCAG 2.1 A e AA).
const ROTAS: Array<{ perfil?: Perfil; rotas: string[] }> = [
  {
    rotas: [
      '/', '/entrar', '/oportunidades', '/oportunidades/o-ama-jaragua-0', '/oportunidades/o-ama-jaragua-1', '/eventos', '/eventos/jantar-beneficente-da-ama',
      '/eventos/jantar-beneficente-da-ama/ingressos', '/campanhas', '/campanhas/reforma-da-sede', '/loja', '/loja/camiseta-gera', '/carrinho',
      '/entidades', '/entidades/ama-jaragua', '/entidades/instituto-itapocu', '/parceiros', '/cadastro', '/validar', '/validar/JS-2026-004812', '/validar/certificado',
      '/checkout?campanha=reforma-da-sede&valor=50', '/rota-que-nao-existe',
    ],
  },
  {
    perfil: 'admin',
    rotas: ['/admin', '/admin/entidades', '/admin/entidades/nova', '/admin/voluntarios', '/admin/eventos', '/admin/campanhas', '/admin/financeiro', '/admin/parceiros', '/admin/relatorios', '/admin/configuracoes'],
  },
  {
    perfil: 'entidade',
    rotas: [
      '/entidade', '/entidade/voluntarios', '/entidade/voluntarios/v-alex', '/entidade/horas', '/entidade/oportunidades', '/entidade/oportunidades/nova',
      '/entidade/eventos', '/entidade/eventos/novo', '/entidade/eventos/e-0/checkin', '/entidade/loja', '/entidade/loja/novo', '/entidade/campanhas',
      '/entidade/campanhas/c-0', '/entidade/campanhas/nova', '/entidade/patrocinadores', '/entidade/patrocinadores/novo', '/entidade/financeiro',
      '/entidade/certificados', '/entidade/certificados/emitir', '/entidade/relatorios', '/entidade/configuracoes',
    ],
  },
  {
    perfil: 'voluntario',
    rotas: ['/app', '/app/oportunidades', '/app/carteirinha', '/app/acoes', '/app/mais', '/app/beneficios', '/app/perfil', '/app/certificados', '/app/ingressos', '/app/doacoes', '/app/notificacoes'],
  },
  { perfil: 'voluntario-novo', rotas: ['/app/carteirinha', '/app/beneficios'] },
  { perfil: 'parceiro', rotas: ['/parceiro', '/parceiro/painel', '/parceiro/beneficios', '/parceiro/beneficios/novo', '/parceiro/resgates', '/parceiro/empresa'] },
];

const VARIANTES = [
  { nome: 'claro', tema: 'light' as const, largura: 1280 },
  { nome: 'escuro', tema: 'dark' as const, largura: 1280 },
  { nome: '360 px', tema: 'light' as const, largura: 360 },
];

for (const { perfil, rotas } of ROTAS) {
  for (const v of VARIANTES) {
    test(`axe · ${perfil ?? 'visitante'} · ${v.nome}`, async ({ page }) => {
      test.setTimeout(180_000);
      await page.setViewportSize({ width: v.largura, height: 900 });
      await preparar(page, { perfil, tema: v.tema });
      const problemas: string[] = [];
      for (const rota of rotas) {
        await page.goto(rota);
        await page.waitForLoadState('networkidle');
        // Espera os dados simulados chegarem (o "Carregando" some).
        await page.waitForTimeout(600);
        const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
        for (const viol of r.violations.filter((x) => x.impact === 'serious' || x.impact === 'critical')) {
          problemas.push(`${rota} · ${viol.id} (${viol.impact}): ${viol.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
        }
      }
      expect(problemas, problemas.join('\n')).toEqual([]);
    });
  }
}
