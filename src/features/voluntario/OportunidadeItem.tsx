import { CalendarDays, Clock, MapPin } from 'lucide-react';
import { Button } from '@gera/design-system';
import { InlineError } from '../../components/shared/States';
import { useToast } from '../../components/shared/Toast';
import { formatDateShort } from '../../lib/format';
import { mensagemDeErro, useGeraMutation } from '../../services/hooks';
import { cancelarInscricao, inscrever } from '../../services/oportunidades';
import type { Oportunidade } from '../../types/domain';

interface OportunidadeItemProps {
  oportunidade: Oportunidade & { entidadeNome?: string };
  inscrito: boolean;
  voluntarioId: string;
}

export function OportunidadeItem({ oportunidade: o, inscrito, voluntarioId }: OportunidadeItemProps) {
  const toast = useToast();
  const entrar = useGeraMutation(() => inscrever(o.id, voluntarioId));
  const sair = useGeraMutation(() => cancelarInscricao(o.id, voluntarioId));
  const restantes = o.vagas - o.inscritos.length;

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-border bg-bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-base uppercase leading-5 tracking-[0.08em] text-ink-muted">{o.area}</p>
          <h3 className="text-lg font-bold leading-6 text-ink">{o.titulo}</h3>
          {o.entidadeNome && <p className="text-sm text-ink-muted">{o.entidadeNome}</p>}
        </div>
        <span className="shrink-0 rounded-sm bg-primary-soft px-2 py-1 text-xs font-bold text-on-primary-soft">
          {restantes > 0 ? `${restantes} ${restantes === 1 ? 'vaga' : 'vagas'}` : 'Lotada'}
        </span>
      </div>
      <ul className="flex flex-col gap-1 text-sm text-ink-muted">
        <li className="flex items-center gap-2">
          <CalendarDays size={16} aria-hidden /> {formatDateShort(o.data)} · {o.turno}
        </li>
        <li className="flex items-center gap-2">
          <Clock size={16} aria-hidden /> {o.horas} horas
        </li>
        <li className="flex items-center gap-2">
          <MapPin size={16} aria-hidden /> {o.local}
        </li>
      </ul>
      <InlineError>{entrar.isError ? mensagemDeErro(entrar.error) : null}</InlineError>
      {inscrito ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-semibold text-link">Você está inscrito. No dia, mostre seu código no check-in.</span>
          <Button variant="ghost" disabled={sair.isPending} onClick={() => sair.mutate(undefined)}>
            Cancelar inscrição
          </Button>
        </div>
      ) : (
        <Button
          className="justify-center"
          disabled={entrar.isPending || restantes <= 0}
          onClick={() =>
            entrar.mutate(undefined, {
              onSuccess: () => toast.show(`Inscrição feita em ${o.titulo}. A gente se vê ${formatDateShort(o.data)}!`),
            })
          }
        >
          {entrar.isPending ? 'Inscrevendo…' : 'Quero participar'}
        </Button>
      )}
    </article>
  );
}
