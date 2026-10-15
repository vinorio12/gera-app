import type { ReactNode } from 'react';
import { GeraLogo } from './GeraLogo';
import type { VolunteerStatus } from './StatusBadge';
import { cx, formatHours } from './cx';

export interface CarteirinhaProps {
  name: string;
  photoUrl?: string;
  organizations: string[];
  registration: string;
  hours: number;
  issuedAt: string;
  validUntil: string;
  status: VolunteerStatus;
  /** Passe o QR já renderizado, ex.: <QRCodeSVG value={token} /> do qrcode.react. Token temporário. */
  qr: ReactNode;
  className?: string;
}

const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('');

/** Carteirinha digital do voluntário. Esmaecida quando não está Ativa. */
export function Carteirinha({ name, photoUrl, organizations, registration, hours, issuedAt, validUntil, status, qr, className }: CarteirinhaProps) {
  const active = status === 'ativo';
  return (
    <div
      className={cx('gr-card-id', className)}
      role="group"
      aria-label={`Carteirinha digital de voluntário GERA de ${name}`}
      style={active ? undefined : { filter: 'grayscale(.85)', opacity: 0.7 }}
    >
      <div className="gr-card-id__brand">
        <GeraLogo variant="negative" tagline={false} height={30} />
      </div>
      <span className="gr-card-id__status">{status.toUpperCase()}</span>
      <div className="gr-card-id__person">
        <div className="gr-card-id__photo">
          {photoUrl ? <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} /> : initials(name)}
        </div>
        <div>
          <div className="gr-card-id__name">{name.toUpperCase()}</div>
          <div className="gr-card-id__orgs">{organizations.join(' · ')}</div>
        </div>
      </div>
      <div className="gr-card-id__qr">{qr}</div>
      <div className="gr-card-id__meta">
        Nº {registration} · {formatHours(hours)}
        <br />
        Emitida {issuedAt} · válida até {validUntil}
      </div>
    </div>
  );
}
