import { expect, test } from '@playwright/test';
import { entrarComo, preparar, vigiarErros } from './ajuda';

// A jornada completa do documento: a Bruna se cadastra, a entidade aprova e faz o check-in,
// a carteirinha libera, o parceiro valida e registra o uso, e o certificado é emitido e validado.
test('jornada da carteirinha ao certificado', async ({ page }) => {
  test.setTimeout(120_000);
  const erros = vigiarErros(page);
  await preparar(page, { perfil: 'voluntario-novo' });
  await page.setViewportSize({ width: 390, height: 844 });

  // Bruna: carteirinha ainda bloqueada, com o código de presença.
  await page.goto('/app/carteirinha');
  await expect(page.getByText('Aprovado pela entidade')).toBeVisible();
  await expect(page.getByText('JS-2026-004913')).toBeVisible();

  // Entidade aprova e faz o check-in.
  await entrarComo(page, 'entidade');
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/entidade/voluntarios');
  const pendente = page.locator('li').filter({ hasText: 'Bruna Costa' });
  await pendente.getByRole('button', { name: 'Aprovar cadastro' }).click();
  await expect(page.getByText(/Bruna Costa aprovado/)).toBeVisible();
  await page.goto('/entidade/horas');
  await page.getByLabel('Ou digite o número da carteirinha').fill('JS-2026-004913');
  await page.getByRole('button', { name: 'Confirmar presença' }).click();
  await expect(page.getByText(/Presença confirmada: Bruna Costa/)).toBeVisible();

  // Bruna: carteirinha liberada.
  await entrarComo(page, 'voluntario-novo');
  await page.goto('/app/carteirinha');
  await expect(page.getByRole('img', { name: 'QR de validação da carteirinha' })).toBeVisible();

  // Parceiro valida e registra o uso.
  await entrarComo(page, 'parceiro');
  await page.goto('/parceiro');
  await page.getByLabel('Ou digite o número da carteirinha').fill('JS-2026-004913');
  await page.getByRole('button', { name: /Validar/ }).first().click();
  await expect(page.getByText(/Elegível/i).first()).toBeVisible();
  await page.getByText('10% em qualquer pedido').click();
  await page.getByRole('button', { name: /Registrar uso/ }).click();
  await expect(page.getByText(/Uso registrado/)).toBeVisible();

  // Entidade emite o certificado da Bruna.
  await entrarComo(page, 'entidade');
  await page.goto('/entidade/certificados/emitir');
  await page.getByRole('button', { name: 'Um a um' }).click();
  await page.getByLabel('Voluntário').selectOption('v-bruna');
  await page.getByRole('button', { name: 'Emitir certificado' }).click();
  await expect(page.getByRole('heading', { name: 'Certificado emitido' })).toBeVisible();
  const codigo = (await page.locator('a[href^="/validar/certificado/"]').first().textContent())!.trim();

  // Qualquer pessoa valida o certificado.
  await page.goto(`/validar/certificado/${codigo}`);
  await expect(page.getByText('Certificado válido')).toBeVisible();
  await expect(page.getByText('Bruna Costa')).toBeVisible();
  expect(erros).toEqual([]);
});
