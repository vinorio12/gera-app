import { cx } from './cx';

export interface EventCardProps {
  title: string;
  /** ISO, ex. '2026-10-24'. */
  date: string;
  place: string;
  time: string;
  capacity?: number;
  /** Menor preço em reais; 0 ou undefined = gratuito. */
  priceFrom?: number;
  soldOut?: boolean;
  bannerUrl?: string;
  href?: string;
  className?: string;
}

const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

export function EventCard({ title, date, place, time, capacity, priceFrom, soldOut, bannerUrl, href = '#', className }: EventCardProps) {
  const day = Number(date.slice(8, 10));
  const mon = MONTHS.at(Number(date.slice(5, 7)) - 1);
  const free = !priceFrom;
  return (
    <article className={cx('gr-event', className)}>
      <div className="gr-event__banner" style={bannerUrl ? { background: `center / cover url(${bannerUrl})` } : undefined}>
        <div className="gr-event__date"><div className="gr-event__day">{day}</div><div className="gr-event__mon">{mon}</div></div>
      </div>
      <div className="gr-event__body">
        <h3 className="gr-event__title">{title}</h3>
        <p className="gr-event__meta">{[place, time, capacity ? `${capacity} lugares` : null].filter(Boolean).join(' · ')}</p>
        <div className="gr-event__foot">
          <span className="gr-event__price">
            {free ? 'Gratuito' : <>a partir de<br />{priceFrom!.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</>}
          </span>
          {soldOut ? (
            <a className="gr-btn gr-btn--secondary" href={href}>Lista de espera</a>
          ) : (
            <a className={cx('gr-btn', free ? 'gr-btn--primary' : 'gr-btn--highlight')} href={href}>{free ? 'Garantir vaga' : 'Comprar ingresso'}</a>
          )}
        </div>
      </div>
    </article>
  );
}
