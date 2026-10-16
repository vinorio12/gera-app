import { useState } from 'react';
import { CircleAlert, MapPin } from 'lucide-react';
import { Chips } from '../../components/shared/Chips';
import { EmptyState } from '../../components/shared/EmptyState';
import { Avatar } from '../../components/shared/Imagens';
import { PageHeader } from '../../components/shared/PageHeader';
import { ErrorState, SkeletonList } from '../../components/shared/States';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { useSession } from '../../lib/auth';
import { useBeneficiosParaVoluntario } from '../../services/hooks';
import { CATEGORIAS_BENEFICIO, type CategoriaBeneficio } from '../../types/domain';

const km = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

export function BeneficiosPage() {
  const { userId } = useSession();
  const [categoria, setCategoria] = useState<CategoriaBeneficio | 'todas'>('todas');
  const lista = useBeneficiosParaVoluntario(userId!, categoria === 'todas' ? undefined : categoria);
  return (
    <>
      <PageHeader title="Benefícios" description="Descontos das empresas parceiras para quem tem a carteirinha ativa. Mostre o QR da carteirinha no caixa." />
      {lista.data && !lista.data.carteirinhaAtiva && (
        <div role="status" className="mb-4 flex flex-col gap-3 rounded-lg border border-highlight bg-highlight-soft p-4 text-on-highlight-soft">
          <p className="flex items-start gap-2 font-semibold">
            <CircleAlert size={20} aria-hidden className="mt-0.5 shrink-0" />
            {lista.data.motivo}
          </p>
          <ButtonLink to="/app/carteirinha" variant="secondary" className="self-start">
            Ver minha carteirinha
          </ButtonLink>
        </div>
      )}
      <Chips
        label="Categoria"
        className="mb-4"
        valor={categoria}
        onChange={setCategoria}
        opcoes={[{ id: 'todas' as const, label: 'Todas' }, ...CATEGORIAS_BENEFICIO.map((c) => ({ id: c, label: c }))]}
      />
      {lista.isPending ? (
        <SkeletonList rows={4} />
      ) : lista.isError ? (
        <ErrorState error={lista.error} onRetry={() => lista.refetch()} />
      ) : lista.data.beneficios.length === 0 ? (
        <EmptyState title="Nenhum benefício nessa categoria" description="Novos parceiros entram todo mês." />
      ) : (
        <ul className={lista.isPlaceholderData ? 'flex flex-col gap-3 opacity-60' : 'flex flex-col gap-3'}>
          {lista.data.beneficios.map((b) => (
            <li key={b.id} className="flex flex-col gap-1 rounded-lg border border-border bg-bg-card p-4 shadow-card">
              <p className="font-display text-base uppercase leading-5 tracking-[0.08em] text-ink-muted">{b.categoria}</p>
              <h2 className="text-lg font-bold leading-6 text-ink">{b.titulo}</h2>
              <div className="flex items-center gap-2">
                {b.logoUrl && <Avatar src={b.logoUrl} nome={b.parceiro} tamanho={32} />}
                <p className="font-semibold text-ink">{b.parceiro}</p>
              </div>
              <p className="flex items-start gap-1 text-sm text-ink-muted">
                <MapPin size={16} aria-hidden className="mt-0.5 shrink-0" />
                <span>
                  {b.endereco} · a {km.format(b.distanciaKm)} km
                </span>
              </p>
              <p className="mt-1 rounded-md bg-bg-subtle px-3 py-2 text-sm text-ink">
                <strong>Como usar:</strong> {b.regra}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
