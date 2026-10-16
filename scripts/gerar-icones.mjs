// Gera os ícones do PWA (public/icons) a partir do ícone de app do design system.
// Rodar só quando o ícone do pacote mudar: node scripts/gerar-icones.mjs (precisa do Chromium do Playwright).
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const origem = `${raiz}packages/gera-ds/src/assets/gera-app-icon.svg`;
const destino = `${raiz}public/icons`;
mkdirSync(destino, { recursive: true });
copyFileSync(origem, `${destino}/gera-app-icon.svg`);

const svg = readFileSync(origem, 'utf8');
const tokens = JSON.parse(readFileSync(`${raiz}packages/gera-ds/src/tokens/tokens.json`, 'utf8'));
const verde900 = tokens.color.tokens.find((t) => t.name === 'verde-900').value;
const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

const browser = await chromium.launch();
const page = await browser.newPage();
const renderizar = async (tamanho, arquivo, mascaravel = false) => {
  await page.setViewportSize({ width: tamanho, height: tamanho });
  // Mascarável: fundo de marca até a borda e o ícone dentro da área segura (80%).
  const estilo = mascaravel ? `width:80%;margin:10%` : `width:100%`;
  await page.setContent(`<body style="margin:0;background:${mascaravel ? verde900 : 'transparent'}"><img src="${dataUrl}" style="display:block;${estilo}"></body>`);
  await page.screenshot({ path: `${destino}/${arquivo}`, omitBackground: !mascaravel });
};
await renderizar(192, 'icon-192.png');
await renderizar(512, 'icon-512.png');
await renderizar(512, 'icon-maskable-512.png', true);
await renderizar(180, 'apple-touch-icon.png', true);
await browser.close();
console.log('Ícones gerados em public/icons.');
