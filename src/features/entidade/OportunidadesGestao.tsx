import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarDays, Clock, MapPin, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { Button, cx, formatHours } from '@gera/design-system';
import { Chips } from '../../components/shared/Chips';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { EmptyState } from '../../components/shared/EmptyState';
import { PageHeader } from '../../components/shared/PageHeader';
import { ErrorState, InlineError, Skeleton, SkeletonList } from '../../components/shared/States';
import { Stepper } from '../../components/shared/Stepper';
import { useToast } from '../../components/shared/Toast';
import { VoltarLink } from '../../components/shared/VoltarLink';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { Campo } from '../../components/ui/Campo';
import { inputClass } from '../../components/ui/form';
import { useSession } from '../../lib/auth';
import { isoDay } from '../../lib/carteirinha';
import { formatDate, formatDateShort } from '../../lib/format';
import { encerrarOportunidade, excluirOportunidade, reabrirOportunidade, salvarOportunidade, type OportunidadeGestao } from '../../services/gestao';
import { mensagemDeErro, useGeraMutation, useOportunidadeGestao, useOportunidadesGestao } from '../../services/hooks';
import { AREAS } from '../../types/domain';
import { OportunidadeCard } from '../publico/cards';

type Aba = 'proximas' | 'passadas';

export function OportunidadesGestaoPage() {
  const { orgId, orgName } = useSession();
  const lista = useOportunidadesGestao(orgId!);
  const [aba, setAba] = useState<Aba>('proximas');
  const hoje = isoDay(new Date());
  const proximas = lista.data?.filter((o) => o.data >= hoje) ?? [];
  const passadas = (lista.data?.filter((o) => o.data < hoje) ?? []).reverse();
  const visiveis = aba === 'proximas' ? proximas : passadas;

  return (
    <>
      <PageHeader
        title="Oportunidades"
        eyebrow={orgName}
        description="Ações de voluntariado da entidade. As próximas aparecem no site e no app do voluntário."
        actions={
          <ButtonLink to="nova">
            <Plus size={18} aria-hidden /> Nova oportunidade
          </ButtonLink>
        }
      />
      {lista.isPending ? (
        <SkeletonList rows={4} />
      ) : lista.isError ? (
        <ErrorState error={lista.error} onRetry={() => lista.refetch()} />
      ) : (
        <div className="flex flex-col gap-4">
          <Chips
            label="Quando"
            valor={aba}
            onChange={setAba}
            opcoes={[
              { id: 'proximas', label: `Próximas · ${proximas.length}` },
              { id: 'passadas', label: `Passadas · ${passadas.length}` },
            ]}
          />
          {visiveis.length === 0 ? (
            <EmptyState
              title={aba === 'proximas' ? 'Nenhuma ação marcada' : 'Nenhuma ação passada ainda'}
              description={aba === 'proximas' ? 'Crie uma oportunidade e ela aparece para os voluntários na hora.' : 'As ações que já aconteceram ficam aqui, com quem foi.'}
              action={aba === 'proximas' ? <ButtonLink to="nova">Nova oportunidade</ButtonLink> : undefined}
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {visiveis.map((o) => (
                <ItemOportunidade key={o.id} o={o} passada={aba === 'passadas'} />
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}

function ItemOportunidade({ o, passada }: { o: OportunidadeGestao; passada: boolean }) {
  const { orgId } = useSession();
  const toast = useToast();
  const [confirmar, setConfirmar] = useState<'encerrar' | 'excluir' | null>(null);
  const encerrar = useGeraMutation(() => encerrarOportunidade(o.id, orgId!));
  const reabrir = useGeraMutation(() => reabrirOportunidade(o.id, orgId!));
  const excluir = useGeraMutation(() => excluirOportunidade(o.id, orgId!));
  const lotada = o.inscritos.length >= o.vagas;

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border bg-bg-card p-4 shadow-card sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="break-words text-lg font-bold text-ink">{o.titulo}</h2>
          {o.encerradaEm && <span className="rounded-sm bg-bg-subtle px-2 py-0.5 text-xs font-bold text-ink-muted">Encerrada</span>}
          {!o.encerradaEm && lotada && !passada && (
            <span className="rounded-sm bg-info-soft px-2 py-0.5 text-xs font-bold text-on-info-soft">Lotada</span>
          )}
        </div>
        <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
          <li className="flex items-center gap-1">
            <CalendarDays size={16} aria-hidden /> {formatDateShort(o.data)} · {o.turno}
          </li>
          <li className="flex items-center gap-1">
            <Clock size={16} aria-hidden /> {formatHours(o.horas)}
          </li>
          <li className="flex items-center gap-1">
            <MapPin size={16} aria-hidden /> {o.local}
          </li>
          <li>{o.area}</li>
        </ul>
        <p className="mt-2 flex items-center gap-1 text-sm font-semibold text-ink">
          <Users size={16} aria-hidden className="text-link" />
          {passada
            ? `${o.presentes} de ${o.inscritos.length} inscritos fizeram check-in`
            : `${o.inscritos.length} de ${o.vagas} vagas preenchidas${o.espera.length ? ` · ${o.espera.length} na lista de espera` : ''}`}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {!passada && (
          <ButtonLink to={`${o.id}/editar`} variant="secondary" aria-label={`Editar ${o.titulo}`}>
            <Pencil size={16} aria-hidden /> Editar
          </ButtonLink>
        )}
        {!passada &&
          (o.encerradaEm ? (
            <Button
              variant="secondary"
              disabled={reabrir.isPending}
              onClick={() => reabrir.mutate(undefined, { onSuccess: () => toast.show(`${o.titulo} voltou a aceitar inscrições.`) })}
            >
              Reabrir
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => setConfirmar('encerrar')}>
              Encerrar
            </Button>
          ))}
        <Button variant="ghost" onClick={() => setConfirmar('excluir')} aria-label={`Excluir ${o.titulo}`}>
          <Trash2 size={16} aria-hidden /> Excluir
        </Button>
      </div>
      <InlineError>{reabrir.isError ? mensagemDeErro(reabrir.error) : null}</InlineError>

      <ConfirmDialog
        open={confirmar === 'encerrar'}
        title="Encerrar inscrições?"
        confirmLabel="Encerrar"
        busy={encerrar.isPending}
        error={encerrar.isError ? mensagemDeErro(encerrar.error) : null}
        onClose={() => setConfirmar(null)}
        onConfirm={() =>
          encerrar.mutate(undefined, {
            onSuccess: () => {
              setConfirmar(null);
              toast.show(`${o.titulo} saiu do site. Os ${o.inscritos.length} inscritos continuam confirmados.`);
            },
          })
        }
      >
        <p>A ação sai do site e do app e não aceita mais inscrições. Quem já se inscreveu continua confirmado.</p>
      </ConfirmDialog>
      <ConfirmDialog
        open={confirmar === 'excluir'}
        title="Excluir oportunidade?"
        confirmLabel="Excluir"
        variant="danger"
        busy={excluir.isPending}
        error={excluir.isError ? mensagemDeErro(excluir.error) : null}
        onClose={() => {
          setConfirmar(null);
          excluir.reset();
        }}
        onConfirm={() =>
          excluir.mutate(undefined, {
            onSuccess: () => {
              setConfirmar(null);
              toast.show(`${o.titulo} foi excluída.`);
            },
          })
        }
      >
        <p>
          {o.titulo}, {formatDate(o.data)}. Não dá para desfazer. Se a ação já tem horas registradas, encerre em vez de excluir.
        </p>
      </ConfirmDialog>
    </li>
  );
}

// ---------- Criar e editar, em etapas ----------

const schema = z.object({
  titulo: z.string().trim().min(3, 'Dê um título à oportunidade.'),
  descricao: z.string().trim().min(10, 'Conte em uma ou duas frases o que a pessoa vai fazer.'),
  data: z.string().min(1, 'Escolha a data.'),
  turno: z.enum(['Manhã', 'Tarde', 'Noite']),
  horas: z.coerce.number({ invalid_type_error: 'Informe as horas.' }).min(1, 'Pelo menos 1 hora.').max(12, 'No máximo 12 horas.'),
  vagas: z.coerce.number({ invalid_type_error: 'Informe as vagas.' }).int('Use um número inteiro.').min(1, 'Ofereça ao menos 1 vaga.'),
  local: z.string().trim().min(3, 'Informe o local.'),
  area: z.enum(AREAS),
  usaFormacao: z.boolean(),
});
type Dados = z.infer<typeof schema>;

const PASSOS: Array<{ titulo: string; campos: Array<FieldPath<Dados>> }> = [
  { titulo: 'Dados', campos: ['titulo', 'descricao'] },
  { titulo: 'Quando', campos: ['data', 'turno', 'horas', 'vagas', 'local'] },
  { titulo: 'Área', campos: ['area', 'usaFormacao'] },
  { titulo: 'Prévia', campos: [] },
];

export function OportunidadeFormPage() {
  const { id } = useParams();
  const { orgId, orgName } = useSession();
  const existente = useOportunidadeGestao(id, orgId!);
  if (id && existente.isPending) return <Skeleton className="h-96 border border-border" />;
  if (id && existente.isError) return <ErrorState error={existente.error} />;
  const o = existente.data;
  return (
    <OportunidadeForm
      key={o?.id ?? 'nova'}
      id={id}
      orgName={orgName ?? ''}
      inscritos={o?.inscritos.length ?? 0}
      inicial={
        o
          ? { titulo: o.titulo, descricao: o.descricao, data: o.data, turno: o.turno, horas: o.horas, vagas: o.vagas, local: o.local, area: o.area, usaFormacao: o.usaFormacao }
          : { titulo: '', descricao: '', data: '', turno: 'Manhã', horas: 4, vagas: 10, local: '', area: AREAS[0], usaFormacao: false }
      }
    />
  );
}

function OportunidadeForm({ id, inicial, orgName, inscritos }: { id?: string; inicial: Dados; orgName: string; inscritos: number }) {
  const { orgId } = useSession();
  const navigate = useNavigate();
  const toast = useToast();
  const [passo, setPasso] = useState(0);
  const salvar = useGeraMutation(salvarOportunidade);
  const form = useForm<Dados>({ resolver: zodResolver(schema), mode: 'onTouched', defaultValues: inicial });
  const { register, formState: { errors }, watch, trigger, handleSubmit } = form;

  useEffect(() => {
    const sub = watch((_, { name }) => {
      if (name && form.getFieldState(name).invalid) void trigger(name);
    });
    return () => sub.unsubscribe();
  }, [watch, trigger, form]);

  const avancar = async () => {
    if (await trigger(PASSOS[passo]!.campos, { shouldFocus: true })) setPasso((p) => p + 1);
  };
  const enviar = handleSubmit((d) =>
    salvar.mutate(
      { ...d, entidadeId: orgId!, id },
      {
        onSuccess: (o) => {
          toast.show(id ? `${o.titulo} atualizada.` : `${o.titulo} publicada. Ela já aparece no site e no app.`);
          navigate('/entidade/oportunidades');
        },
      },
    ),
  );
  const v = watch();

  return (
    <div className="max-w-2xl">
      <VoltarLink to="/entidade/oportunidades">Oportunidades</VoltarLink>
      <PageHeader title={id ? 'Editar oportunidade' : 'Nova oportunidade'} eyebrow={orgName} />
      <Stepper passos={PASSOS.map((p) => p.titulo)} atual={passo} />
      <form
        noValidate
        onSubmit={(e) => (passo === PASSOS.length - 1 ? enviar(e) : (e.preventDefault(), void avancar()))}
        className="flex flex-col gap-4 rounded-lg border border-border bg-bg-card p-5 shadow-card"
      >
        {passo === 0 && (
          <>
            <Campo id="titulo" label="Título" erro={errors.titulo?.message} dica="Curto e direto, ex.: Oficina de integração sensorial.">
              <input {...register('titulo')} className={inputClass} autoComplete="off" />
            </Campo>
            <Campo id="descricao" label="O que a pessoa vai fazer" erro={errors.descricao?.message}>
              <textarea {...register('descricao')} rows={4} className={`${inputClass} py-2`} />
            </Campo>
          </>
        )}
        {passo === 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="data" label="Data" erro={errors.data?.message}>
              <input type="date" {...register('data')} min={id ? undefined : isoDay(new Date())} className={inputClass} />
            </Campo>
            <Campo id="turno" label="Turno" erro={errors.turno?.message}>
              <select {...register('turno')} className={inputClass}>
                <option>Manhã</option>
                <option>Tarde</option>
                <option>Noite</option>
              </select>
            </Campo>
            <Campo id="horas" label="Horas que a ação vale" erro={errors.horas?.message} dica="Entram no banco de horas no check-in.">
              <input type="number" inputMode="numeric" min={1} max={12} {...register('horas')} className={inputClass} />
            </Campo>
            <Campo id="vagas" label="Vagas" erro={errors.vagas?.message} dica={inscritos ? `Já há ${inscritos} inscritos.` : undefined}>
              <input type="number" inputMode="numeric" min={Math.max(1, inscritos)} {...register('vagas')} className={inputClass} />
            </Campo>
            <Campo id="local" label="Local" erro={errors.local?.message} className="sm:col-span-2">
              <input {...register('local')} className={inputClass} placeholder="Sede da entidade, bairro" />
            </Campo>
          </div>
        )}
        {passo === 2 && (
          <>
            <Campo id="area" label="Área" erro={errors.area?.message} dica="O voluntário vê primeiro as ações das áreas de interesse dele.">
              <select {...register('area')} className={inputClass}>
                {AREAS.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </Campo>
            <label className="flex min-h-11 cursor-pointer items-start gap-3 text-ink">
              <input type="checkbox" {...register('usaFormacao')} className="mt-1 h-5 w-5 shrink-0 accent-primary" />
              <span>
                <span className="font-semibold">Usa a formação do voluntário</span>
                <span className="block text-sm text-ink-muted">Ex.: psicologia, pedagogia, enfermagem. Aparece no filtro "Usa minha formação".</span>
              </span>
            </label>
          </>
        )}
        {passo === 3 && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-ink-muted">É assim que a oportunidade aparece no site público e no app:</p>
            <div className="max-w-sm rounded-lg bg-bg-page p-3">
              <OportunidadeCard
                previa
                oportunidade={{
                  id: id ?? 'previa',
                  entidadeId: orgId!,
                  entidadeNome: orgName,
                  entidadeSlug: '',
                  titulo: v.titulo,
                  descricao: v.descricao,
                  area: v.area,
                  data: v.data,
                  turno: v.turno,
                  horas: Number(v.horas),
                  local: v.local,
                  vagas: Number(v.vagas),
                  inscritos: Array.from({ length: inscritos }, (_, i) => String(i)),
                  usaFormacao: v.usaFormacao,
                  encerradaEm: null,
                  espera: [],
                }}
              />
            </div>
            <p className="text-sm text-ink">{v.descricao}</p>
          </div>
        )}
        <InlineError>{salvar.isError ? mensagemDeErro(salvar.error) : null}</InlineError>
        <div className={cx('flex flex-wrap gap-2', passo > 0 ? 'justify-between' : 'justify-end')}>
          {passo > 0 && (
            <Button variant="ghost" onClick={() => setPasso((p) => p - 1)}>
              Voltar
            </Button>
          )}
          <Button type="submit" disabled={salvar.isPending}>
            {passo < PASSOS.length - 1 ? 'Continuar' : salvar.isPending ? 'Salvando…' : id ? 'Salvar alterações' : 'Publicar oportunidade'}
          </Button>
        </div>
      </form>
    </div>
  );
}
