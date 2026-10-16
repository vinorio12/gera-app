import { expect, test } from '@playwright/test';
import { preparar, vigiarErros } from './ajuda';

test.describe('site público', () => {
  test('home, oportunidades, eventos, campanhas, loja e validação', async ({ page }) => {
    const erros = vigiarErros(page);
    await preparar(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.goto('/oportunidades');
    await page.getByRole('button', { name: 'Educação' }).click();
    await expect(page.getByRole('link', { name: /Quero participar|Entrar na lista de espera/ }).first()).toBeVisible();

    await page.goto('/eventos/jantar-beneficente-da-ama');
    await expect(page.getByRole('heading', { name: 'Jantar Beneficente da AMA' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Adicionar à agenda/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Compartilhar no WhatsApp/ })).toHaveAttribute('href', /^https:\/\/wa\.me\/\?text=/);

    await page.goto('/campanhas/reforma-da-sede');
    await expect(page.getByRole('heading', { name: 'Reforma da sede' })).toBeVisible();

    await page.goto('/loja');
    await page.getByRole('link', { name: /Comprar/ }).first().click();
    await expect(page).toHaveURL(/\/loja\//);

    await page.goto('/validar');
    await page.getByLabel('Ou digite o número da carteirinha').fill('JS-2026-004812');
    await page.getByRole('button', { name: 'Validar' }).click();
    await expect(page.getByText('Alex Silva')).toBeVisible();
    expect(erros).toEqual([]);
  });

  test('doação com Pix chega à confirmação com recibo', async ({ page }) => {
    await preparar(page);
    await page.goto('/campanhas/reforma-da-sede');
    await page.getByRole('link', { name: /Doar R\$/ }).click();
    await page.getByLabel(/Nome/).first().fill('Pessoa Teste');
    await page.getByLabel(/E-mail/).first().fill('pessoa@exemplo.com.br');
    await page.getByRole('button', { name: /Pagar|Gerar|Doar|Confirmar/ }).first().click();
    await expect(page.getByText(/Sua doação já está empurrando a meta/)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('button', { name: /Baixar recibo \(PDF\)/ })).toBeVisible();
  });
});
