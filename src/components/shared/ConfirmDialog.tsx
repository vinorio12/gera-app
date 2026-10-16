import type { ReactNode } from 'react';
import { Button } from '@gera/design-system';
import { Dialog } from './Dialog';
import { InlineError } from './States';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  /** "danger" para excluir, desligar, recusar. */
  variant?: 'primary' | 'danger';
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

/** Confirmação antes de uma ação que não dá para desfazer. */
export function ConfirmDialog({ open, title, children, confirmLabel, variant = 'primary', busy, error, onConfirm, onClose }: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant={variant} disabled={busy} onClick={onConfirm}>
            {busy ? 'Aguarde…' : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {children}
        <InlineError>{error}</InlineError>
      </div>
    </Dialog>
  );
}
