import { Button } from './Button';
import { cx, formatBRL } from './cx';

export interface CampaignProgressProps {
  title: string;
  organization: string;
  raised: number;
  goal: number;
  daysLeft?: number;
  ctaLabel?: string;
  onSupport?: () => void;
  className?: string;
}

/** Campanha de captação: barra em cremalheira com a engrenagem amarela na ponta. */
export function CampaignProgress({ title, organization, raised, goal, daysLeft, ctaLabel = 'Apoiar esta campanha', onSupport, className }: CampaignProgressProps) {
  const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
  return (
    <article className={cx('gr-campaign', className)}>
      <h3 className="gr-campaign__title">{title}</h3>
      <p className="gr-campaign__org">
        {organization}
        {daysLeft != null && ` · termina em ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}`}
      </p>
      <div className="gr-progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${pct}% da meta`}>
        <div className="gr-progress__fill" style={{ width: `${pct}%` }}>
          <span className="gr-progress__gear"><span className="gr-progress__gear-inner gr-spin" /></span>
        </div>
      </div>
      <div className="gr-campaign__nums">
        <div>
          <div className="gr-campaign__raised">{formatBRL(raised)}</div>
          <div className="gr-campaign__goal">de {formatBRL(goal)}</div>
        </div>
        <span className="gr-campaign__pct">{pct}%</span>
      </div>
      <Button variant="highlight" onClick={onSupport}>{ctaLabel}</Button>
    </article>
  );
}
