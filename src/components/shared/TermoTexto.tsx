/** Texto do termo de voluntariado: parágrafos, e linhas que começam com "- " viram itens numerados. */
export function TermoTexto({ texto }: { texto: string }) {
  const blocos: Array<{ tipo: 'p'; texto: string } | { tipo: 'ol'; itens: string[] }> = [];
  for (const linha of texto.split('\n').map((l) => l.trim()).filter(Boolean)) {
    if (linha.startsWith('- ')) {
      const ultimo = blocos[blocos.length - 1];
      if (ultimo?.tipo === 'ol') ultimo.itens.push(linha.slice(2));
      else blocos.push({ tipo: 'ol', itens: [linha.slice(2)] });
    } else blocos.push({ tipo: 'p', texto: linha });
  }
  return (
    <>
      {blocos.map((b, i) =>
        b.tipo === 'p' ? (
          <p key={i} className="mb-2">{b.texto}</p>
        ) : (
          <ol key={i} className="mb-2 list-decimal space-y-2 pl-5">
            {b.itens.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
        ),
      )}
    </>
  );
}
