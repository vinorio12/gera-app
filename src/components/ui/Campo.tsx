import { cloneElement, useId, type ReactElement, type ReactNode } from 'react';
import { cx } from '@gera/design-system';
import { labelClass } from './form';

interface CampoProps {
  /** Sufixo do id do campo (o nome registrado no formulário). */
  id: string;
  label: string;
  erro?: string;
  dica?: string;
  className?: string;
  children: ReactNode;
}

/** Rótulo, campo e mensagem (erro ou dica) ligados por id e aria-describedby. */
export function Campo({ id, label, erro, dica, className, children }: CampoProps) {
  const uid = useId();
  const campoId = `${uid}-${id}`;
  const descId = `${campoId}-desc`;
  return (
    <div className={cx('flex flex-col gap-1', className)}>
      <label htmlFor={campoId} className={labelClass}>{label}</label>
      <CampoComId id={campoId} descId={erro || dica ? descId : undefined} invalido={!!erro}>
        {children}
      </CampoComId>
      {erro ? (
        <p id={descId} className="text-sm font-semibold text-on-accent-soft">{erro}</p>
      ) : (
        dica && <p id={descId} className="text-sm text-ink-muted" aria-live="polite">{dica}</p>
      )}
    </div>
  );
}

function CampoComId({ id, descId, invalido, children }: { id: string; descId?: string; invalido: boolean; children: ReactNode }) {
  // cloneElement mantém a ref do register (o React Hook Form lê o valor por ela).
  return cloneElement(children as ReactElement<Record<string, unknown>>, { id, 'aria-describedby': descId, 'aria-invalid': invalido || undefined });
}
