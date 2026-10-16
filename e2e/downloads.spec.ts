import { expect, test, type FrameLocator, type Page } from '@playwright/test';
import { preparar, type Perfil } from './ajuda';

// A página publicada no claude.ai roda dentro de um iframe, onde o <a download> e o window.print() não funcionam.
// Aqui o app abre num iframe do mesmo servidor, com (ou sem) um window.claude simulado.

type Salvo = { filename: string; texto: string | null; bytes: number };

async function abrirNoQuadro(page: Page, caminho: string, { comDownloads = true, perfil }: { comDownloads?: boolean; perfil?: Perfil } = {}): Promise<FrameLocator> {
  await preparar(page, { perfil });
  await page.addInitScript((ativo) => {
    if (window.self === window.top) return;
    const topo = window.top as unknown as { __saves: unknown[] };
    topo.__saves = [];
    if (!ativo) return;
    (window as unknown as { claude: unknown }).claude = {
      use: async (nome: string) =>
        nome === 'downloads'
          ? {
              save: async (arquivo: { filename: string; data: Blob | string }) => {
                const texto = typeof arquivo.data === 'string';
                topo.__saves.push({ filename: arquivo.filename, texto: texto ? arquivo.data : null, bytes: texto ? (arquivo.data as string).length : (arquivo.data as Blob).size });
                return { status: 'saved' };
              },
            }
          : null,
    };
  }, comDownloads);
  await page.route('**/__quadro', (rota) =>
    rota.fulfill({ contentType: 'text/html', body: `<!doctype html><title>quadro</title><iframe id="app" title="app" src="${caminho}" style="width:1100px;height:900px;border:0"></iframe>` }),
  );
  await page.setViewportSize({ width: 1120, height: 940 });
  await page.goto('/__quadro');
  return page.frameLocator('#app');
}

const salvos = (page: Page) => page.evaluate(() => (window as unknown as { __saves: Salvo[] }).__saves);

async function esperarSalvo(page: Page, nome: RegExp): Promise<Salvo> {
  await expect.poll(async () => (await salvos(page)).some((s) => nome.test(s.filename))).toBe(true);
  return (await salvos(page)).find((s) => nome.test(s.filename))!;
}

test.describe('downloads dentro de um iframe com a capacidade "downloads"', () => {
  test('relatório do admin: PDF e CSV chamam save, sem abrir a prévia', async ({ page }) => {
    const app = await abrirNoQuadro(page, '/admin/relatorios', { perfil: 'admin' });
    await app.getByRole('button', { name: 'Baixar PDF' }).click();
    const pdf = await esperarSalvo(page, /^prestacao.*\.pdf$/);
    expect(pdf.bytes).toBeGreaterThan(1000);
    await app.getByRole('button', { name: 'Baixar planilha (CSV)' }).click();
    const csv = await esperarSalvo(page, /^prestacao.*\.csv$/);
    expect(csv.texto).toContain(';');
    await expect(app.getByRole('dialog')).toHaveCount(0);
    // Sem impressão num quadro.
    await expect(app.getByRole('button', { name: 'Ver para imprimir' })).toHaveCount(0);
  });

  test('relatório da entidade', async ({ page }) => {
    const app = await abrirNoQuadro(page, '/entidade/relatorios', { perfil: 'entidade' });
    await app.getByRole('button', { name: 'Baixar PDF' }).click();
    await esperarSalvo(page, /\.pdf$/);
    await app.getByRole('button', { name: 'Baixar planilha (CSV)' }).click();
    await esperarSalvo(page, /\.csv$/);
    await expect(app.getByRole('dialog')).toHaveCount(0);
  });

  test('certificado em PDF', async ({ page }) => {
    const app = await abrirNoQuadro(page, '/app/certificados', { perfil: 'voluntario' });
    await app.getByRole('button', { name: /Baixar PDF/ }).first().click();
    const certificado = await esperarSalvo(page, /^certificado-.*\.pdf$/);
    expect(certificado.bytes).toBeGreaterThan(1000);
    await expect(app.getByRole('dialog')).toHaveCount(0);
  });

  test('comprovante em PDF (minhas doações)', async ({ page }) => {
    const app = await abrirNoQuadro(page, '/app/doacoes', { perfil: 'voluntario' });
    await app.getByRole('button', { name: /Baixar (recibo|comprovante) \(PDF\)/ }).first().click();
    const arquivo = await esperarSalvo(page, /^(recibo|comprovante)-.*\.pdf$/);
    expect(arquivo.bytes).toBeGreaterThan(1000);
    await expect(app.getByRole('dialog')).toHaveCount(0);
  });

  test('"Baixar meus dados" salva o JSON', async ({ page }) => {
    const app = await abrirNoQuadro(page, '/app/perfil', { perfil: 'voluntario' });
    await app.getByRole('button', { name: 'Baixar meus dados' }).click();
    const dados = await esperarSalvo(page, /^meus-dados-gera-.*\.json$/);
    expect(JSON.parse(dados.texto!)).toBeTruthy();
    await expect(app.getByRole('dialog')).toHaveCount(0);
  });

  test('agenda: no quadro o .ics vira o link do Google Agenda', async ({ page }) => {
    const app = await abrirNoQuadro(page, '/eventos/jantar-beneficente-da-ama');
    const link = app.getByRole('link', { name: /Adicionar ao Google Agenda/ });
    await expect(link).toBeVisible();
    const href = (await link.getAttribute('href'))!;
    expect(href).toMatch(/^https:\/\/calendar\.google\.com\/calendar\/render\?action=TEMPLATE&text=/);
    expect(new URL(href).searchParams.get('dates')).toMatch(/^\d{8}T\d{6}Z\/\d{8}T\d{6}Z$/);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(app.getByRole('button', { name: /Adicionar à agenda/ })).toHaveCount(0);
  });
});

test.describe('quando nada baixa', () => {
  test('iframe sem a capacidade: abre a prévia, sem "Imprimir" nem "Copiar texto"', async ({ page }) => {
    const app = await abrirNoQuadro(page, '/entidade/relatorios', { perfil: 'entidade', comDownloads: false });
    await app.getByRole('button', { name: 'Baixar planilha (CSV)' }).click();
    const previa = app.getByRole('dialog');
    await expect(previa).toBeVisible();
    await expect(previa.getByRole('button', { name: 'Imprimir' })).toHaveCount(0);
    await expect(previa.getByRole('button', { name: /Copiar/ })).toHaveCount(0);
    await expect(previa.getByText(/Selecione o texto abaixo/)).toBeVisible();
    await previa.getByRole('button', { name: 'Fechar visualização' }).click();
    await expect(app.getByRole('dialog')).toHaveCount(0);
  });

  test('a pessoa recusa o salvamento: nada aparece', async ({ page }) => {
    await preparar(page, { perfil: 'entidade' });
    await page.addInitScript(() => {
      (window as unknown as { claude: unknown }).claude = {
        use: async () => ({ save: async () => Promise.reject({ code: 'declined' }) }),
      };
    });
    await page.goto('/entidade/relatorios');
    await page.getByRole('button', { name: 'Baixar planilha (CSV)' }).click();
    await page.waitForTimeout(500);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('limite de downloads: pede para tentar de novo', async ({ page }) => {
    await preparar(page, { perfil: 'entidade' });
    await page.addInitScript(() => {
      (window as unknown as { claude: unknown }).claude = {
        use: async () => ({ save: async () => Promise.reject({ code: 'rate_limited' }) }),
      };
    });
    await page.goto('/entidade/relatorios');
    await page.getByRole('button', { name: 'Baixar planilha (CSV)' }).click();
    await expect(page.getByText(/Tente de novo em instantes/)).toBeVisible();
  });
});

test.describe('fora de um quadro', () => {
  test('baixa o CSV pelo link de download e a prévia chama window.print()', async ({ page }) => {
    await preparar(page, { perfil: 'entidade' });
    await page.addInitScript(() => {
      const w = window as unknown as { __impressoes: number };
      w.__impressoes = 0;
      window.print = () => {
        w.__impressoes += 1;
      };
    });
    await page.goto('/entidade/relatorios');
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Baixar planilha (CSV)' }).click()]);
    expect(download.suggestedFilename()).toMatch(/\.csv$/);

    await page.getByRole('button', { name: 'Ver para imprimir' }).click();
    const previa = page.getByRole('dialog');
    await expect(previa.getByRole('button', { name: /Copiar/ })).toHaveCount(0);
    await previa.getByRole('button', { name: 'Imprimir' }).click();
    expect(await page.evaluate(() => (window as unknown as { __impressoes: number }).__impressoes)).toBe(1);
  });

  test('a agenda continua baixando o .ics', async ({ page }) => {
    await preparar(page);
    await page.goto('/eventos/jantar-beneficente-da-ama');
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Adicionar à agenda/ }).click()]);
    expect(download.suggestedFilename()).toMatch(/\.ics$/);
  });
});
