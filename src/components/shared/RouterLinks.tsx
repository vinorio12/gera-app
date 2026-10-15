import type { MouseEvent, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Alguns componentes do design system (ex.: EventCard) renderizam <a href> comum. Este invólucro
 * faz esses links internos navegarem pelo React Router, sem recarregar a página (e funcionando
 * também na prévia publicada, que não tem URLs próprias).
 */
export function RouterLinks({ children, className }: { children: ReactNode; className?: string }) {
  const navigate = useNavigate();
  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as HTMLElement).closest('a');
    const href = a?.getAttribute('href');
    if (!a || !href || !href.startsWith('/') || href.startsWith('//') || a.target === '_blank') return;
    e.preventDefault();
    navigate(href);
  };
  return (
    // Só delega o clique do link de dentro (que continua focável e acionável pelo teclado).
    <div onClick={onClick} className={className}>
      {children}
    </div>
  );
}
