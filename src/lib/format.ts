import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDate } from './carteirinha';

/** 15/10/2026 */
export const formatDate = (isoDate: string) => format(parseDate(isoDate), 'dd/MM/yyyy');
/** sáb., 17 de out. */
export const formatDateShort = (isoDate: string) => format(parseDate(isoDate), "EEE, d 'de' MMM", { locale: ptBR });
/** 15/10/2026 às 14:32 */
export const formatDateTime = (isoDate: string) => format(parseDate(isoDate), "dd/MM/yyyy 'às' HH:mm");
/** outubro de 2026 */
export const formatMonth = (isoDate: string) => format(parseDate(isoDate), "MMMM 'de' yyyy", { locale: ptBR });

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
/** R$ 49,90. Para preços e valores a pagar; o formatBRL do design system arredonda (é para indicadores). */
export const formatMoeda = (valor: number) => moeda.format(valor);
