import { StatusBadge, type VolunteerStatus } from './StatusBadge';
import { cx, formatHours } from './cx';

export interface ValidationResultProps {
  eligible: boolean;
  /** Para não elegível, passe só o primeiro nome (LGPD). */
  name: string;
  organization?: string;
  status: VolunteerStatus;
  hours?: number;
  validUntil?: string;
  reason?: string;
  className?: string;
}

/** Resultado da leitura do QR da carteirinha no app do Parceiro. */
export function ValidationResult({ eligible, name, organization, status, hours, validUntil, reason, className }: ValidationResultProps) {
  return (
    <div className={cx('gr-validate', className)} role="status" aria-live="polite">
      <div className={cx('gr-validate__head', !eligible && 'gr-validate__head--no')}>
        <span className="gr-validate__icon" aria-hidden>{eligible ? '✓' : '!'}</span>
        {eligible ? 'ELEGÍVEL' : 'NÃO ELEGÍVEL'}
      </div>
      <dl>
        <dt>Voluntário</dt><dd>{name}</dd>
        {organization && (<><dt>Entidade</dt><dd>{organization}</dd></>)}
        <dt>Status</dt><dd><StatusBadge status={status} /></dd>
        {eligible && hours != null && (<><dt>Horas acumuladas</dt><dd>{formatHours(hours)}</dd></>)}
        {eligible && validUntil && (<><dt>Validade</dt><dd>{validUntil}</dd></>)}
        {!eligible && reason && (<><dt>Motivo</dt><dd>{reason}</dd></>)}
      </dl>
    </div>
  );
}
