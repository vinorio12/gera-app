import { useId, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock, MapPin, Users } from 'lucide-react';
import { Button, cx, formatHours } from '@gera/design-system';
import { EmptyState } from '../../components/shared/EmptyState';
import { PageHeader } from '../../components/shared/PageHeader';
import { ErrorState, InlineError, Skeleton, SkeletonList } from '../../components/shared/States';
import { useToast } from '../../components/shared/Toast';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { inputClass, labelClass } from '../../components/ui/form';
import { useAuth } from '../../lib/auth';
import { formatDateShort } from '../../lib/format';
import { mensagemDeErro, useEntidades, useGeraMutation, useOportunidade, useOportunidades } from '../../services/hooks';
import { entrarNaFila, inscrever, sairDaFila } from '../../services/oportunidades';
import { AgendaCompartilhar, urlPublica } from '../../components/shared/AgendaCompartilhar';
import { agendaDaOportunidade, textoCompartilharOportunidade } from '../../lib/agenda';
import { posicaoNaFila } from '../../lib/listaEspera';
import { AREAS, type Area, type Turno } from '../../types/domain';
import { OportunidadeCard } from './cards';

export function OportunidadesPage() {
  const [area, setArea] = useState<Area | undefined>();
  const [entidadeId, setEntidadeId] = useState('');
  const [turno, setTurno] = useState<Turno | ''>('');
  const [usaFormacao, setUsaFormacao] = useState(false);
  const lista = useOportunidades({ area, entidadeId: entidadeId || undefined, turno: turno || undefined, usaFormacao });
  const entidades = useEntidades();
  const ids = { entidade: useId(), turno: useId(), formacao: useId() };
  const limpar = () => {
    setArea(undefined);
    setEntidadeId('');
    setTurno('');
    setUsaFormacao(false);
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10">
      <PageHeader title="Oportunidades" description="Escolha uma ação, participe e gere horas no seu banco. A primeira ação validada libera sua carteirinha." />

      <div className="mb-6 flex flex-col gap-4">
        <div className="-mx-4 overflow-x-auto px-4">
          <div role="group" aria-label="Área de interesse" className="flex w-max gap-2">
            {[undefined, ...AREAS].map((a) => (
              <button
                key={a ?? 'todas'}
                type="button"
                aria-pressed={area === a}
                onClick={() => setArea(a)}
                className={cx(
                  'min-h-11 rounded-pill border px-4 text-sm font-semibold',
                  area === a ? 'border-primary bg-primary-soft text-on-primary-soft' : 'border-border-strong bg-bg-card text-ink-muted',
                )}
              >
                {a ?? 'Todas as áreas'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex min-w-[200px] flex-col gap-1">
            <label htmlFor={ids.entidade} className={labelClass}>Entidade</label>
            <select id={ids.entidade} value={entidadeId} onChange={(e) => setEntidadeId(e.target.value)} className={inputClass}>
              <option value="">Todas</option>
              {entidades.data?.map((e) => (
                <option key={e.id} value={e.id}>{e.nome}</option>
              ))}
            </select>
          </div>
          <div className="flex min-w-[160px] flex-col gap-1">
            <label htmlFor={ids.turno} className={labelClass}>Turno</label>
            <select id={ids.turno} value={turno} onChange={(e) => setTurno(e.target.value as Turno | '')} className={inputClass}>
              <option value="">Qualquer turno</option>
              <option>Manhã</option>
              <option>Tarde</option>
              <option>Noite</option>
            </select>
          </div>
          <label htmlFor={ids.formacao} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-ink">
            <input id={ids.formacao} type="checkbox" checked={usaFormacao} onChange={(e) => setUsaFormacao(e.target.checked)} className="h-5 w-5 accent-primary" />
            Usa minha formação
          </label>
        </div>
      </div>

      {lista.isError ? (
        <ErrorState error={lista.error} onRetry={() => lista.refetch()} />
      ) : !lista.data ? (
        <SkeletonList rows={3} />
      ) : lista.data.length === 0 ? (
        <EmptyState
          title="Nenhuma oportunidade com esses filtros"
          description="Tente outra área ou turno. Novas ações entram toda semana."
          action={<Button variant="secondary" onClick={limpar}>Limpar filtros</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lista.data.map((o) => (
            <OportunidadeCard key={o.id} oportunidade={o} />
          ))}
        </div>
      )}
    </div>
  );
}

export function OportunidadeDetalhePage() {
  const { id = '' } = useParams();
  const op = useOportunidade(id);
  const { session } = useAuth();
  const toast = useToast();
  const participar = useGeraMutation(() => inscrever(id, session!.userId!));
  const fila = useGeraMutation(() => entrarNaFila(id, session!.userId!));
  const sair = useGeraMutation(() => sairDaFila(id, session!.userId!));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/oportunidades" className="mb-4 inline-flex min-h-11 items-center gap-2 font-semibold text-link hover:underline">
        <ArrowLeft size={18} aria-hidden /> Oportunidades
      </Link>
      {op.isPending ? (
        <Skeleton className="h-80 border border-border" />
      ) : op.isError ? (
        <ErrorState error={op.error} />
      ) : (
        (() => {
          const o = op.data;
          const restantes = o.vagas - o.inscritos.length;
          const inscrito = !!session?.userId && o.inscritos.includes(session.userId);
          const posicao = session?.userId ? posicaoNaFila(o, session.userId) : 0;
          return (
            <>
              <PageHeader eyebrow={o.area} title={o.titulo} />
              <div className="flex flex-col gap-6 rounded-lg border border-border bg-bg-card p-6 shadow-card">
                <p className="text-ink">{o.descricao}</p>
                <ul className="grid gap-3 text-ink sm:grid-cols-2">
                  <li className="flex items-start gap-2"><CalendarDays size={20} aria-hidden className="mt-0.5 shrink-0 text-link" /> {formatDateShort(o.data)} · {o.turno}</li>
                  <li className="flex items-start gap-2"><Clock size={20} aria-hidden className="mt-0.5 shrink-0 text-link" /> {formatHours(o.horas)} no seu banco de horas</li>
                  <li className="flex items-start gap-2"><MapPin size={20} aria-hidden className="mt-0.5 shrink-0 text-link" /> {o.local}</li>
                  <li className="flex items-start gap-2">
                    <Users size={20} aria-hidden className="mt-0.5 shrink-0 text-link" />
                    {restantes > 0
                      ? `${restantes} de ${o.vagas} vagas restantes`
                      : `Vagas esgotadas${o.espera.length ? ` · ${o.espera.length} na lista de espera` : ''}`}
                  </li>
                </ul>
                <p className="text-sm text-ink-muted">
                  Organização:{' '}
                  <Link to={`/entidades/${o.entidadeSlug}`} className="font-semibold text-link hover:underline">
                    {o.entidadeNome}
                  </Link>
                </p>
                <InlineError>{participar.isError ? mensagemDeErro(participar.error) : fila.isError ? mensagemDeErro(fila.error) : null}</InlineError>
                {inscrito ? (
                  <p role="status" className="rounded-md bg-primary-soft px-4 py-3 font-semibold text-on-primary-soft">
                    Você está inscrito. No dia, mostre seu código de presença no check-in.
                  </p>
                ) : session?.role === 'voluntario' && posicao > 0 ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <p role="status" className="rounded-md bg-info-soft px-4 py-3 font-semibold text-on-info-soft">
                      Você é o {posicao}º da lista de espera. Se alguém cancelar, a vaga é sua e você recebe um aviso.
                    </p>
                    <Button variant="ghost" disabled={sair.isPending} onClick={() => sair.mutate(undefined, { onSuccess: () => toast.show('Você saiu da lista de espera.') })}>
                      Sair da lista
                    </Button>
                  </div>
                ) : session?.role === 'voluntario' && restantes <= 0 ? (
                  <Button
                    className="self-start"
                    disabled={fila.isPending}
                    onClick={() => fila.mutate(undefined, { onSuccess: (n) => toast.show(`Você entrou na lista de espera de ${o.titulo}, na posição ${n}.`) })}
                  >
                    {fila.isPending ? 'Entrando…' : 'Entrar na lista de espera'}
                  </Button>
                ) : session?.role === 'voluntario' ? (
                  <Button
                    className="self-start"
                    disabled={participar.isPending}
                    onClick={() => participar.mutate(undefined, { onSuccess: () => toast.show(`Inscrição feita em ${o.titulo}. A gente se vê ${formatDateShort(o.data)}!`) })}
                  >
                    {participar.isPending ? 'Inscrevendo…' : 'Quero participar'}
                  </Button>
                ) : session ? (
                  <p className="text-sm text-ink-muted">Para participar, entre com um perfil de voluntário.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <ButtonLink to={`/entrar?next=${encodeURIComponent(`/oportunidades/${o.id}`)}`}>{restantes > 0 ? 'Quero participar' : 'Entrar na lista de espera'}</ButtonLink>
                    <ButtonLink to="/cadastro" variant="secondary">Ainda não tenho cadastro</ButtonLink>
                  </div>
                )}
                <AgendaCompartilhar
                  className="border-t border-border pt-4"
                  agenda={agendaDaOportunidade(o, urlPublica(`/oportunidades/${o.id}`))}
                  textoWhatsApp={textoCompartilharOportunidade(o, urlPublica(`/oportunidades/${o.id}`))}
                />
              </div>
            </>
          );
        })()
      )}
    </div>
  );
}
