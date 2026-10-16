import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { entrarComo, preparar, vigiarErros } from './ajuda';

/** Gera uma imagem no próprio teste (gradiente com ruído, para não comprimir demais) e devolve o arquivo para setInputFiles. */
async function imagem(page: Page, largura: number, altura: number, mimeType = 'image/png') {
  const base64 = await page.evaluate(
    ([w, h, tipo]) => {
      const c = document.createElement('canvas');
      c.width = w as number;
      c.height = h as number;
      const ctx = c.getContext('2d')!;
      const g = ctx.createLinearGradient(0, 0, w as number, h as number);
      g.addColorStop(0, 'rgb(20,120,80)');
      g.addColorStop(1, 'rgb(240,200,60)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w as number, h as number);
      for (let i = 0; i < 400; i++) {
        ctx.fillStyle = `rgb(${(i * 37) % 255},${(i * 91) % 255},${(i * 53) % 255})`;
        ctx.fillRect(((i * 97) % (w as number)) | 0, ((i * 61) % (h as number)) | 0, 60, 40);
      }
      return c.toDataURL(tipo as string).split(',')[1]!;
    },
    [largura, altura, mimeType],
  );
  return { name: mimeType === 'image/png' ? 'foto.png' : 'foto.jpg', mimeType, buffer: Buffer.from(base64, 'base64') };
}

const bytesDe = (src: string) => Math.floor(((src.length - src.indexOf(',') - 1) * 3) / 4);

test.describe('marca da entidade', () => {
  test('cor livre: prévia ao vivo com o texto calculado e aviso quando não há contraste', async ({ page }) => {
    const erros = vigiarErros(page);
    await preparar(page, { perfil: 'entidade' });
    await page.goto('/entidade/configuracoes');
    const hex = page.getByLabel('Código da cor (hex)');
    const previa = page.getByTestId('previa-marca');

    await hex.fill('#f5d75a');
    await expect(previa).toHaveAttribute('data-texto', 'tinta');
    await expect(page.getByText(/Texto escuro sobre a cor/)).toBeVisible();

    await hex.fill('#0b3d24');
    await expect(previa).toHaveAttribute('data-texto', 'papel');
    await expect(page.getByText(/Texto claro sobre a cor/)).toBeVisible();

    await hex.fill('#808080');
    await expect(previa).toHaveAttribute('data-texto', 'nenhum');
    await expect(page.getByText(/não tem contraste suficiente/)).toBeVisible();
    await expect(previa.getByText('Exemplo de texto')).toHaveCount(0);

    await hex.fill('cor errada');
    await expect(page.getByText(/Use o formato #RRGGBB/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Salvar cor' })).toBeDisabled();

    // Salvar e ver na página pública.
    await hex.fill('#0b3d24');
    await page.getByRole('button', { name: 'Salvar cor' }).click();
    await expect(page.getByText('Cor da entidade: #0B3D24.')).toBeVisible();
    await page.goto('/entidades/ama-jaragua');
    const faixa = page.locator('[style*="--cor-entidade"]').first();
    expect(await faixa.evaluate((el) => (el as HTMLElement).style.getPropertyValue('--cor-entidade'))).toBe('#0b3d24');

    // Um atalho da GERA volta a valer e apaga a cor livre.
    await page.goto('/entidade/configuracoes');
    await expect(hex).toHaveValue('#0b3d24');
    await page.getByText('Verde Engajar').click();
    await expect(page.getByText('Cor de destaque: Verde Engajar.')).toBeVisible();
    await expect(page.getByRole('radio', { name: /Verde Engajar/ })).toBeChecked();
    expect(erros).toEqual([]);
  });

  test('foto de perfil e banner: enviar, trocar e remover; aparecem no site, no cartão e no menu', async ({ page }) => {
    const erros = vigiarErros(page);
    await preparar(page, { perfil: 'entidade' });
    await page.goto('/entidade/configuracoes');
    const arquivos = page.locator('input[type=file]');

    // Remove as imagens de exemplo e confere que sumiram.
    await page.getByRole('button', { name: 'Remover: Foto de perfil da entidade' }).click();
    await page.getByRole('button', { name: 'Remover: Banner da entidade' }).click();
    await expect(page.getByText('Sem imagem')).toHaveCount(2);
    await page.goto('/entidades/ama-jaragua');
    await expect(page.getByRole('img', { name: 'Banner: AMA Jaraguá' })).toHaveCount(0);

    // Envia de novo, com imagens geradas aqui (foto larga e banner quase quadrado).
    await page.goto('/entidade/configuracoes');
    await arquivos.nth(0).setInputFiles(await imagem(page, 900, 600));
    const logo = page.getByRole('img', { name: 'Logo: AMA Jaraguá' }).first();
    await expect(logo).toBeVisible();
    await arquivos.nth(1).setInputFiles(await imagem(page, 1200, 1000, 'image/jpeg'));
    const banner = page.getByRole('img', { name: 'Banner: AMA Jaraguá' }).first();
    await expect(banner).toBeVisible();

    const srcLogo = (await logo.getAttribute('src'))!;
    const srcBanner = (await banner.getAttribute('src'))!;
    expect(srcLogo).toMatch(/^data:image\/(webp|jpeg);base64,/);
    expect(bytesDe(srcLogo)).toBeLessThanOrEqual(60_000);
    expect(bytesDe(srcBanner)).toBeLessThanOrEqual(250_000);
    expect(await logo.evaluate((i: HTMLImageElement) => [i.naturalWidth, i.naturalHeight])).toEqual([320, 320]);
    expect(await banner.evaluate((i: HTMLImageElement) => [i.naturalWidth, i.naturalHeight])).toEqual([1600, 500]);

    // Menu lateral (portal da entidade).
    await expect(page.locator('aside').getByRole('img', { name: 'Logo: AMA Jaraguá' })).toBeVisible();
    // Página pública: o banner entra no lugar da faixa e a foto vai sobre ele.
    await page.goto('/entidades/ama-jaragua');
    await expect(page.getByRole('img', { name: 'Banner: AMA Jaraguá' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Logo: AMA Jaraguá' })).toBeVisible();
    // Cartão na lista.
    await page.goto('/entidades');
    await expect(page.getByRole('img', { name: 'Logo: AMA Jaraguá' })).toBeVisible();
    expect(erros).toEqual([]);
  });

  test('mensagens de erro em português e aviso quando o navegador está cheio', async ({ page }) => {
    await preparar(page, { perfil: 'entidade' });
    await page.goto('/entidade/configuracoes');
    const arquivos = page.locator('input[type=file]');

    await arquivos.nth(0).setInputFiles({ name: 'quebrada.png', mimeType: 'image/png', buffer: Buffer.from('isto não é uma imagem') });
    await expect(page.getByText(/Não conseguimos abrir essa imagem/)).toBeVisible();

    // O seletor aceita só JPG, PNG e WebP, mas o teste força um formato fora da lista.
    await arquivos.nth(0).setInputFiles({ name: 'anim.gif', mimeType: 'image/gif', buffer: Buffer.from('GIF89a') });
    await expect(page.getByText(/Use uma imagem JPG, PNG ou WebP/)).toBeVisible();

    // localStorage cheio: avisa e mantém a imagem que já estava.
    const antes = await page.getByRole('img', { name: 'Logo: AMA Jaraguá' }).first().getAttribute('src');
    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (chave: string, valor: string) {
        if (chave === 'gera.dados') throw new DOMException('cheio', 'QuotaExceededError');
        return original.call(this, chave, valor);
      };
    });
    await arquivos.nth(0).setInputFiles(await imagem(page, 500, 500));
    await expect(page.getByText('Não coube no navegador: tente uma imagem menor.')).toBeVisible();
    expect(await page.getByRole('img', { name: 'Logo: AMA Jaraguá' }).first().getAttribute('src')).toBe(antes);
  });

  for (const variante of [
    { nome: 'claro', tema: 'light' as const, largura: 1280 },
    { nome: 'escuro', tema: 'dark' as const, largura: 1280 },
    { nome: '360 px', tema: 'light' as const, largura: 360 },
  ]) {
    test(`axe com cor livre sem contraste e imagens · ${variante.nome}`, async ({ page }) => {
      await page.setViewportSize({ width: variante.largura, height: 900 });
      await preparar(page, { perfil: 'entidade', tema: variante.tema });
      await page.goto('/entidade/configuracoes');
      await page.getByLabel('Código da cor (hex)').fill('#808080');
      await page.getByRole('button', { name: 'Salvar cor' }).click();
      await expect(page.getByText('Cor da entidade: #808080.')).toBeVisible();
      const problemas: string[] = [];
      for (const rota of ['/entidade/configuracoes', '/entidades', '/entidades/ama-jaragua', '/entidades/instituto-itapocu']) {
        await page.goto(rota);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(600);
        const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
        for (const v of r.violations.filter((x) => x.impact === 'serious' || x.impact === 'critical')) {
          problemas.push(`${rota} · ${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
        }
      }
      expect(problemas, problemas.join('\n')).toEqual([]);
    });
  }
});

test.describe('empresa parceira', () => {
  test('logo e banner: enviar e remover; aparecem em /parceiros, nos benefícios e no painel', async ({ page }) => {
    const erros = vigiarErros(page);
    await preparar(page, { perfil: 'parceiro' });
    await page.goto('/parceiro/empresa');
    await page.getByRole('button', { name: 'Remover: Foto de perfil da empresa' }).click();
    await page.getByRole('button', { name: 'Remover: Banner da empresa' }).click();
    await expect(page.getByText('Sem imagem')).toHaveCount(2);

    const arquivos = page.locator('input[type=file]');
    await arquivos.nth(0).setInputFiles(await imagem(page, 700, 500));
    await expect(page.getByRole('img', { name: 'Logo: Café Exemplo' }).first()).toBeVisible();
    await arquivos.nth(1).setInputFiles(await imagem(page, 1000, 800));
    await expect(page.getByRole('img', { name: 'Banner: Café Exemplo' }).first()).toBeVisible();

    await page.goto('/parceiro/painel');
    await expect(page.getByRole('img', { name: 'Logo: Café Exemplo' })).toBeVisible();

    await page.goto('/parceiros');
    await expect(page.getByRole('img', { name: 'Banner: Café Exemplo' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Logo: Café Exemplo' })).toBeVisible();

    await entrarComo(page, 'voluntario');
    await page.goto('/app/beneficios');
    await expect(page.getByRole('img', { name: 'Logo: Café Exemplo' }).first()).toBeVisible();
    expect(erros).toEqual([]);
  });
});

test.describe('foto do voluntário', () => {
  test('troca e remove no Perfil e aparece para a entidade', async ({ page }) => {
    const erros = vigiarErros(page);
    await preparar(page, { perfil: 'voluntario' });
    await page.goto('/app/perfil');
    // O Alex já tem uma foto de exemplo: remove para testar o envio.
    await page.getByRole('button', { name: 'Remover: Foto de perfil' }).click();
    await expect(page.getByText('Sem imagem')).toBeVisible();
    await page.locator('input[type=file]').setInputFiles(await imagem(page, 600, 900));
    const foto = page.getByRole('img', { name: 'Foto de Alex Silva' });
    await expect(foto).toBeVisible();
    expect(await foto.evaluate((i: HTMLImageElement) => [i.naturalWidth, i.naturalHeight])).toEqual([320, 320]);

    await entrarComo(page, 'entidade');
    await page.goto('/entidade/voluntarios');
    await expect(page.getByRole('img', { name: 'Foto de Alex Silva' }).first()).toBeVisible();
    await page.goto('/entidade/voluntarios/v-alex');
    await expect(page.getByRole('img', { name: 'Foto de Alex Silva' })).toBeVisible();

    await entrarComo(page, 'voluntario');
    await page.goto('/app/perfil');
    await page.getByRole('button', { name: 'Remover: Foto de perfil' }).click();
    await expect(page.getByText('Sem imagem')).toBeVisible();
    await expect(page.getByRole('img', { name: 'Foto de Alex Silva' })).toHaveCount(0);
    expect(erros).toEqual([]);
  });
});
