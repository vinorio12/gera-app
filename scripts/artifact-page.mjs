// Gera dist-static/preview.html: o corpo da página para publicar a prévia como Artifact no claude.ai,
// que embrulha o arquivo no próprio <html>/<head>/<body>. Os arquivos de assets/ vão junto.
import { readFileSync, writeFileSync } from 'node:fs';

const dir = new URL('../dist-static/', import.meta.url);
const html = readFileSync(new URL('index.html', dir), 'utf8');
const tags = html.match(/<link rel="stylesheet"[^>]*>|<script type="module"[^>]*><\/script>/g) ?? [];
if (tags.length < 2) throw new Error('index.html sem o CSS ou o JS do build');

writeFileSync(
  new URL('preview.html', dir),
  `<title>Protótipo GERA</title>\n${tags.filter((t) => t.startsWith('<link')).join('\n')}\n<div id="root"></div>\n${tags.filter((t) => t.startsWith('<script')).join('\n')}\n`,
);
console.log('dist-static/preview.html pronto.');
