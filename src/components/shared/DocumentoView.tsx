import { cx } from '@gera/design-system';
import { formatarCelula, type Documento } from '../../lib/documento';

/** Prévia na tela de um documento exportável: os mesmos dados do PDF e da planilha. */
export function DocumentoView({ doc, className }: { doc: Documento; className?: string }) {
  return (
    <article className={cx('flex flex-col gap-6 text-ink', className)}>
      <header>
        <h2 className="text-2xl font-bold">{doc.titulo}</h2>
        <p className="text-sm text-ink-muted">
          {doc.subtitulo} · gerado em {doc.geradoEm}
        </p>
      </header>
      {doc.destaques && doc.destaques.length > 0 && (
        <dl className="grid gap-3 sm:grid-cols-3">
          {doc.destaques.map((d) => (
            <div key={d.rotulo} className="rounded-md bg-bg-subtle px-4 py-3">
              <dt className="text-xs font-semibold text-ink-muted">{d.rotulo}</dt>
              <dd className="text-lg font-bold tabular-nums">{d.valor}</dd>
            </div>
          ))}
        </dl>
      )}
      {doc.secoes.map((s) => (
        <section key={s.titulo} className="flex flex-col gap-2">
          <h3 className="text-lg font-bold">{s.titulo}</h3>
          {s.descricao && <p className="text-sm text-ink-muted">{s.descricao}</p>}
          <div className="relative overflow-x-auto" tabIndex={0} role="region" aria-label={`Tabela: ${s.titulo}`}>
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead className="bg-bg-subtle text-ink-muted">
                <tr>
                  {s.colunas.map((c) => (
                    <th key={c.titulo} scope="col" className={cx('px-3 py-2 font-semibold', c.tipo && c.tipo !== 'texto' && c.tipo !== 'data' && 'text-right')}>
                      {c.titulo}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {s.linhas.length === 0 && (
                  <tr>
                    <td colSpan={s.colunas.length} className="px-3 py-3 text-ink-muted">
                      {s.vazio ?? 'Nada no período.'}
                    </td>
                  </tr>
                )}
                {s.linhas.map((l, i) => (
                  <tr key={i}>
                    {l.map((v, j) => (
                      <td key={j} className={cx('px-3 py-2', s.colunas[j]?.tipo && s.colunas[j]!.tipo !== 'texto' && s.colunas[j]!.tipo !== 'data' && 'text-right tabular-nums')}>
                        {formatarCelula(v, s.colunas[j]?.tipo)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              {s.total && (
                <tfoot className="border-t-2 border-border-strong font-bold">
                  <tr>
                    {s.total.map((v, j) => (
                      <td key={j} className={cx('px-3 py-2', s.colunas[j]?.tipo && s.colunas[j]!.tipo !== 'texto' && s.colunas[j]!.tipo !== 'data' && 'text-right tabular-nums')}>
                        {formatarCelula(v, s.colunas[j]?.tipo)}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>
      ))}
      {doc.rodape && <p className="text-xs text-ink-muted">{doc.rodape}</p>}
    </article>
  );
}
