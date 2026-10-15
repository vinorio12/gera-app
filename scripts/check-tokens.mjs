// Garante a regra "nenhuma cor fora dos tokens" no código do app (src/ e index.html).
// Falha se encontrar hex, rgb()/hsl() ou classes da paleta padrão do Tailwind.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const PALETTE = 'white|black|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const RULES = [
  { name: 'cor hex', re: /#[0-9a-fA-F]{3,8}\b/g },
  { name: 'rgb()/hsl()', re: /\b(?:rgba?|hsla?)\(/g },
  { name: 'paleta padrão do Tailwind', re: new RegExp(`\\b(?:bg|text|border|ring|fill|stroke|from|via|to|outline|divide|decoration|shadow|accent|caret|placeholder)-(?:${PALETTE})\\b`, 'g') },
];

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (/\.(tsx?|css|html)$/.test(name)) yield path;
  }
}

const problems = [];
for (const file of [...walk(join(root, 'src')), join(root, 'index.html')]) {
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    for (const { name, re } of RULES) {
      for (const match of line.matchAll(re)) {
        problems.push(`${relative(root, file)}:${i + 1}  ${name}: ${match[0]}`);
      }
    }
  });
}

if (problems.length) {
  console.error(`Cores fora dos tokens (use as classes do preset ou var(--token)):\n${problems.join('\n')}`);
  process.exit(1);
}
console.log('check-tokens: nenhuma cor fora dos tokens.');
