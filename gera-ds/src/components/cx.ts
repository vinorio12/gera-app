/** Junta classes ignorando valores falsos. */
export const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const num = new Intl.NumberFormat('pt-BR');
export const formatBRL = (v: number) => brl.format(v);
export const formatNumber = (v: number) => num.format(v);
export const formatHours = (h: number) => `${num.format(h)} h`;
