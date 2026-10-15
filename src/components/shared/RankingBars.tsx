interface RankingBarsProps {
  itens: Array<{ rotulo: string; valor: number }>;
  formatar: (valor: number) => string;
  /** Destaca uma linha (ex.: a entidade filtrada). */
  destaque?: string;
}

/**
 * Comparação de magnitude em barras horizontais de HTML: rótulo e valor em texto (nunca só a cor),
 * barra fina em uma cor só, com a ponta arredondada.
 */
export function RankingBars({ itens, formatar, destaque }: RankingBarsProps) {
  const max = Math.max(1, ...itens.map((i) => i.valor));
  return (
    <ol className="flex flex-col gap-3">
      {itens.map((i) => (
        <li key={i.rotulo} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className={i.rotulo === destaque ? 'font-bold text-ink' : 'text-ink'}>{i.rotulo}</span>
            <span className="shrink-0 font-semibold tabular-nums text-ink">{formatar(i.valor)}</span>
          </div>
          <div className="h-2 rounded-r-sm bg-bg-subtle" aria-hidden>
            <div
              className={i.rotulo === destaque || !destaque ? 'h-full rounded-r-sm bg-primary' : 'h-full rounded-r-sm bg-border-strong'}
              style={{ width: `${(i.valor / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
