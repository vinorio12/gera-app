import { Button, cx } from '@gera/design-system';
import { CircleAlert } from 'lucide-react';
import { mensagemDeErro } from '../../services/hooks';

/** Bloco cinza com a forma do conteúdo, enquanto carrega. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cx('animate-pulse rounded-md bg-bg-subtle motion-reduce:animate-none', className)} />;
}

/** Lista de cartões carregando. */
export function SkeletonList({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cx('flex flex-col gap-3', className)} role="status" aria-label="Carregando">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-16 border border-border" />
      ))}
    </div>
  );
}

/** Erro: o que aconteceu e o botão para tentar de novo. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-lg border border-accent bg-accent-soft p-5 text-on-accent-soft">
      <p className="flex items-start gap-2 font-semibold">
        <CircleAlert size={20} aria-hidden className="mt-0.5 shrink-0" />
        {mensagemDeErro(error)}
      </p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Tentar de novo
        </Button>
      )}
    </div>
  );
}

/** Mensagem de erro curta junto de um formulário. */
export function InlineError({ children }: { children: string | null | undefined }) {
  if (!children) return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-md bg-accent-soft px-3 py-2 text-sm font-semibold text-on-accent-soft">
      <CircleAlert size={18} aria-hidden className="mt-0.5 shrink-0" />
      {children}
    </p>
  );
}
