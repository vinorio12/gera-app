import { GeraSymbol } from '@gera/design-system';

/** Carregamento: o símbolo GERA girando devagar, nunca um spinner genérico. */
export function PageLoader({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <div
      className={fullScreen ? 'grid min-h-screen place-items-center bg-bg-page' : 'grid min-h-[50vh] place-items-center'}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3">
        <GeraSymbol size={56} spinning title="Carregando" />
        <span className="text-sm font-semibold text-ink-muted">Carregando…</span>
      </div>
    </div>
  );
}
