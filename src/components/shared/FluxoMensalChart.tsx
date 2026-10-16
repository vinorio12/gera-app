import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from 'recharts';
import { formatBRL } from '@gera/design-system';
import { parseDate } from '../../lib/carteirinha';
import { formatMoeda, formatMonth } from '../../lib/format';
import { useTokenColors } from '../../lib/useTokenColors';

const CORES = ['highlight', 'ink-muted', 'border', 'bg-subtle'] as const;
const mesCurto = (mes: string) => format(parseDate(`${mes}-01`), 'MMM', { locale: ptBR });
const compacto = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });

/**
 * Entradas e despesas por mês. Entradas em amarelo (dinheiro que chega), despesas em cinza;
 * a legenda e os valores ficam em texto, e a tabela traz os números exatos.
 */
export function FluxoMensalChart({ dados }: { dados: Array<{ mes: string; entradas: number; despesas: number }> }) {
  const c = useTokenColors(CORES);
  const totalE = dados.reduce((s, d) => s + d.entradas, 0);
  const totalD = dados.reduce((s, d) => s + d.despesas, 0);
  return (
    <figure className="flex flex-col gap-3">
      <ul className="flex flex-wrap gap-4 text-sm text-ink" aria-hidden>
        <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-highlight" /> Entradas</li>
        <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-ink-muted" /> Despesas</li>
      </ul>
      <div
        className="h-64 w-full"
        role="img"
        aria-label={`Entradas e despesas por mês: ${formatBRL(totalE)} de entradas e ${formatBRL(totalD)} de despesas no período.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dados} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barCategoryGap="24%" barGap={2}>
            <CartesianGrid vertical={false} stroke={c.border} />
            <XAxis dataKey="mes" tickFormatter={mesCurto} tick={{ fill: c['ink-muted'], fontSize: 12 }} tickLine={false} axisLine={{ stroke: c.border }} interval="preserveStartEnd" />
            <YAxis width={48} tickFormatter={(v: number) => compacto.format(v)} tick={{ fill: c['ink-muted'], fontSize: 12 }} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: c['bg-subtle'] }} content={<TooltipFluxo />} />
            <Bar dataKey="entradas" name="Entradas" fill={c.highlight} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
            <Bar dataKey="despesas" name="Despesas" fill={c['ink-muted']} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer font-semibold text-link">Ver como tabela</summary>
        <div className="relative overflow-x-auto">
          <table className="mt-2 w-full min-w-[320px] max-w-lg text-left">
            <thead className="text-ink-muted">
              <tr>
                <th scope="col" className="py-1 font-semibold">Mês</th>
                <th scope="col" className="py-1 text-right font-semibold">Entradas</th>
                <th scope="col" className="py-1 text-right font-semibold">Despesas</th>
                <th scope="col" className="py-1 text-right font-semibold">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {dados.map((d) => (
                <tr key={d.mes} className="border-t border-border">
                  <td className="py-1 capitalize text-ink">{formatMonth(`${d.mes}-01`)}</td>
                  <td className="py-1 text-right tabular-nums text-ink">{formatMoeda(d.entradas)}</td>
                  <td className="py-1 text-right tabular-nums text-ink">{formatMoeda(d.despesas)}</td>
                  <td className="py-1 text-right tabular-nums text-ink">{formatMoeda(d.entradas - d.despesas)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

function TooltipFluxo({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-bg-card px-3 py-2 text-sm shadow-raised">
      <p className="capitalize text-ink-muted">{formatMonth(`${label}-01`)}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-semibold tabular-nums text-ink">
          {p.name}: {formatMoeda(Number(p.value))}
        </p>
      ))}
    </div>
  );
}
