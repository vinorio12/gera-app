import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/** Link de volta para a lista, acima do título. */
export function VoltarLink({ to, children }: { to: string; children: string }) {
  return (
    <Link to={to} className="mb-4 inline-flex min-h-11 items-center gap-2 font-semibold text-link hover:underline">
      <ArrowLeft size={18} aria-hidden /> {children}
    </Link>
  );
}
