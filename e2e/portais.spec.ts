import { expect, test } from '@playwright/test';
import { entrarComo, preparar, vigiarErros } from './ajuda';

test.describe('voluntário', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('início, oportunidades, ações com marcos, benefícios, perfil e notificações', async ({ page }) => {
    const erros = vigiarErros(page);
    await preparar(page, { perfil: 'voluntario' });
    await page.goto('/app');
    await expect(page.getByText('Olá, Alex!')).toBeVisible();
    await page.goto('/app/acoes');
    await expect(page.getByRole('heading', { name: 'Marcos de horas' })).toBeVisible();
    await page.goto('/app/beneficios');
    await page.getByRole('button', { name: 'Educação' }).click();
    await expect(page.getByRole('heading', { name: '10% em livros' })).toBeVisible();
    await page.goto('/app/perfil');
    await expect(page.getByText(/Você aceitou a versão/)).toBeVisible();
    await page.getByRole('link', { name: /Notificações/ }).click();
    await expect(page.getByText('Cadastro aprovado')).toBeVisible();
    expect(erros).toEqual([]);
  });

  test('lista de espera numa ação lotada', async ({ page }) => {
    await preparar(page, { perfil: 'voluntario' });
    await page.goto('/oportunidades/o-ama-jaragua-1');
    await page.getByRole('button', { name: 'Entrar na lista de espera' }).click();
    await expect(page.getByText(/º da lista de espera/)).toBeVisible();
  });
});

test.describe('entidade', () => {
  test('nova oportunidade em etapas e check-in de ingresso', async ({ page }) => {
    const erros = vigiarErros(page);
    await preparar(page, { perfil: 'entidade' });
    await page.goto('/entidade');
    await page.getByRole('link', { name: 'Nova oportunidade' }).click();
    await page.getByLabel('Título').fill('Ação de teste E2E');
    await page.getByLabel('O que a pessoa vai fazer').fill('Ajudar na organização do bazar.');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByLabel('Data').fill('2027-03-10');
    await page.getByLabel('Local').fill('Sede da AMA');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('button', { name: 'Publicar oportunidade' }).click();
    await expect(page.getByRole('heading', { name: 'Ação de teste E2E' })).toBeVisible();

    await page.goto('/entidade/eventos/e-0/checkin');
    await page.getByLabel('Ou digite o código do ingresso').fill('GERA-INGRESSO:ing-1');
    await page.getByRole('button', { name: 'Validar ingresso' }).click();
    await expect(page.getByText('Pode entrar: Alex Silva')).toBeVisible();
    await page.getByLabel('Ou digite o código do ingresso').fill('GERA-INGRESSO:ing-1');
    await page.getByRole('button', { name: 'Validar ingresso' }).click();
    await expect(page.getByText(/Ingresso já usado/)).toBeVisible();
    expect(erros).toEqual([]);
  });

  test('despesa vai para o extrato e para a auditoria do comitê', async ({ page }) => {
    await preparar(page, { perfil: 'entidade' });
    await page.goto('/entidade/financeiro');
    await page.getByRole('button', { name: 'Lançar despesa' }).first().click();
    const dlg = page.getByRole('dialog');
    await dlg.getByLabel('Descrição').fill('Despesa de teste E2E');
    await dlg.getByLabel('Valor (R$)').fill('99,90');
    await dlg.getByRole('button', { name: 'Lançar despesa' }).click();
    await page.getByRole('button', { name: 'Despesas', exact: true }).click();
    await expect(page.getByText('Despesa de teste E2E')).toBeVisible();
    await entrarComo(page, 'admin');
    await page.goto('/admin/configuracoes');
    await expect(page.getByRole('cell', { name: 'Despesa de teste E2E' })).toBeVisible();
  });
});

test.describe('admin', () => {
  test('aprova entidade e vê como entidade', async ({ page }) => {
    const erros = vigiarErros(page);
    await preparar(page, { perfil: 'admin' });
    await page.goto('/admin/entidades');
    const coral = page.locator('li').filter({ has: page.getByRole('heading', { name: 'Coral Vozes do Vale' }) });
    await coral.getByRole('button', { name: 'Aprovar entidade' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Aprovar' }).click();
    await expect(coral.getByText('Ativa', { exact: true })).toBeVisible();
    const ama = page.locator('li').filter({ has: page.getByRole('heading', { name: 'AMA Jaraguá' }) });
    await ama.getByRole('button', { name: 'Ver como entidade: AMA Jaraguá' }).click();
    await expect(page.getByText('Você está vendo como AMA Jaraguá')).toBeVisible();
    await page.getByRole('button', { name: 'Voltar ao admin' }).click();
    await expect(page).toHaveURL(/\/admin\/entidades/);
    expect(erros).toEqual([]);
  });
});

test.describe('parceiro', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('painel ESG e oferta nova aguardando aprovação', async ({ page }) => {
    await preparar(page, { perfil: 'parceiro' });
    await page.goto('/parceiro/painel');
    await expect(page.getByText('Texto para o relatório ESG')).toBeVisible();
    await page.goto('/parceiro/beneficios/novo');
    await page.getByLabel('Oferta', { exact: true }).fill('Oferta de teste E2E');
    await page.getByLabel('Regra de uso').fill('Uma vez por semana.');
    await page.getByLabel('Economia estimada por uso (R$)').fill('5');
    await page.getByRole('button', { name: 'Enviar para aprovação' }).click();
    const item = page.locator('li').filter({ has: page.getByRole('heading', { name: 'Oferta de teste E2E' }) });
    await expect(item.getByText('Aguardando aprovação do comitê')).toBeVisible();
  });
});
