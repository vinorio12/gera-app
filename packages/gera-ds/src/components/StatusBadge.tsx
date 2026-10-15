import { cx } from './cx';

export type VolunteerStatus = 'novo' | 'ativo' | 'inativo' | 'desligado';

const LABEL: Record<VolunteerStatus, string> = { novo: 'Novo', ativo: 'Ativo', inativo: 'Inativo', desligado: 'Desligado' };

export function StatusBadge({ status, className }: { status: VolunteerStatus; className?: string }) {
  return <span className={cx('gr-badge', `gr-badge--${status}`, className)}>{LABEL[status]}</span>;
}

const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 182;

/**
 * Regra de negócio do status, calculada (nunca digitada):
 * Novo = cadastro há menos de 6 meses e sem voluntariado; Ativo = voluntariado nos últimos 6 meses;
 * Inativo = 6 meses sem voluntariado; Desligado = removido pela entidade ou comitê.
 */
export function volunteerStatus(input: { signupDate: Date; lastActionDate?: Date | null; dismissed?: boolean }, now = new Date()): VolunteerStatus {
  if (input.dismissed) return 'desligado';
  if (input.lastActionDate) return now.getTime() - input.lastActionDate.getTime() <= SIX_MONTHS_MS ? 'ativo' : 'inativo';
  return now.getTime() - input.signupDate.getTime() < SIX_MONTHS_MS ? 'novo' : 'inativo';
}
