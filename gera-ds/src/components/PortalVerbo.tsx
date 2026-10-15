import { cx } from './cx';

export type Portal = 'voluntario' | 'entidade' | 'parceiro' | 'admin';

export const PORTAL_VERB: Record<Portal, { verb: string; who: string; mod: string }> = {
  voluntario: { verb: 'ENGAJAR', who: 'App do Voluntário', mod: 'engajar' },
  entidade: { verb: 'IMPULSIONAR', who: 'Portal da Entidade', mod: 'impulsionar' },
  parceiro: { verb: 'CONECTAR', who: 'App do Parceiro', mod: 'conectar' },
  admin: { verb: 'AMPLIAR', who: 'Administrador ACIJS', mod: 'ampliar' },
};

/** Cabeçalho-assinatura de cada portal: o verbo em Bebas Neue sobre o verde da Prefeitura. */
export function PortalVerbo({ portal, subtitle, className }: { portal: Portal; subtitle?: string; className?: string }) {
  const p = PORTAL_VERB[portal];
  return (
    <div className={cx('gr-portal', `gr-portal--${p.mod}`, className)}>
      <div className="gr-portal__bar" />
      <div className="gr-portal__verb">{p.verb}</div>
      <div className="gr-portal__who">{subtitle ?? p.who}</div>
    </div>
  );
}
