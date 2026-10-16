import { useEffect, useId, useState, type FormEvent } from 'react';
import { CircleCheck } from 'lucide-react';
import { Button, KpiCard, formatHours } from '@gera/design-system';
import { CodeReader } from '../../components/shared/CodeReader';
import { EmptyState } from '../../components/shared/EmptyState';
import { HoursTimeline } from '../../components/shared/HoursTimeline';
import { PageHeader } from '../../components/shared/PageHeader';
import { ErrorState, InlineError, SkeletonList } from '../../components/shared/States';
import { useToast } from '../../components/shared/Toast';
import { inputClass, labelClass } from '../../components/ui/form';
import { useSession } from '../../lib/auth';
import { isoDay } from '../../lib/carteirinha';
import { formatDateShort } from '../../lib/format';
import { fazerCheckIn, registrarHorasManual, type CheckInFeito } from '../../services/horas';
import { mensagemDeErro, useBancoDeHoras, useGeraMutation, useOportunidadesDaEntidade, useVoluntariosDaEntidade } from '../../services/hooks';

export function HorasPage() {
  const { orgId, orgName } = useSession();
  const banco = useBancoDeHoras(orgId!);

  return (
    <>
      <PageHeader title="Banco de horas" eyebrow={orgName} />
      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap gap-4">
          <KpiCard
            label="Horas no mês"
            value={banco.data ? formatHours(banco.data.doMes) : '…'}
            source="banco de horas (check-ins e registros manuais)"
          />
          <KpiCard
            label="Horas no ano"
            value={banco.data ? formatHours(banco.data.doAno) : '…'}
            source="banco de horas (check-ins e registros manuais)"
          />
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <CheckInDoDia />
          <section aria-labelledby="recentes">
            <h2 id="recentes" className="mb-3 text-2xl font-bold text-ink">
              Registros recentes
            </h2>
            {banco.isPending ? (
              <SkeletonList />
            ) : banco.isError ? (
              <ErrorState error={banco.error} onRetry={() => banco.refetch()} />
            ) : banco.data.recentes.length ? (
              <HoursTimeline
                registros={banco.data.recentes}
                nomeDoVoluntario={(id) => banco.data.recentes.find((r) => r.voluntarioId === id)?.nome ?? ''}
              />
            ) : (
              <EmptyState title="Nenhum registro ainda" description="Os check-ins do dia aparecem aqui." />
            )}
          </section>
        </div>
        <RegistroManual />
      </div>
    </>
  );
}

function CheckInDoDia() {
  const { orgId } = useSession();
  const oportunidades = useOportunidadesDaEntidade(orgId!);
  const [acaoId, setAcaoId] = useState('');
  const [feito, setFeito] = useState<CheckInFeito | null>(null);
  const checkIn = useGeraMutation(fazerCheckIn);
  const toast = useToast();
  const selectId = useId();

  // Começa na ação de hoje (ou na próxima).
  useEffect(() => {
    if (acaoId || !oportunidades.data?.length) return;
    const hoje = isoDay(new Date());
    setAcaoId((oportunidades.data.find((o) => o.data >= hoje) ?? oportunidades.data[oportunidades.data.length - 1]!).id);
  }, [acaoId, oportunidades.data]);

  const ler = (codigo: string) => {
    setFeito(null);
    checkIn.mutate(
      { entidadeId: orgId!, oportunidadeId: acaoId, codigo },
      {
        onSuccess: (r) => {
          setFeito(r);
          toast.show(`Valeu, ${r.nome.split(' ')[0]}! Mais ${formatHours(r.horas)} geradas em ${r.projeto}.`);
        },
      },
    );
  };

  return (
    <section aria-labelledby="checkin" className="flex flex-col gap-4">
      <h2 id="checkin" className="text-2xl font-bold text-ink">
        Check-in do dia
      </h2>
      {oportunidades.isError ? (
        <ErrorState error={oportunidades.error} onRetry={() => oportunidades.refetch()} />
      ) : (
        <div className="flex flex-col gap-2">
          <label htmlFor={selectId} className={labelClass}>
            Ação
          </label>
          <select id={selectId} value={acaoId} onChange={(e) => setAcaoId(e.target.value)} className={inputClass} disabled={!oportunidades.data}>
            {oportunidades.data?.map((o) => (
              <option key={o.id} value={o.id}>
                {formatDateShort(o.data)} · {o.titulo} ({o.horas} h)
              </option>
            ))}
          </select>
        </div>
      )}
      <CodeReader onCode={ler} busy={checkIn.isPending || !acaoId} submitLabel="Confirmar presença" />
      <InlineError>{checkIn.isError ? mensagemDeErro(checkIn.error) : null}</InlineError>
      {feito && (
        <p role="status" className="flex items-start gap-2 rounded-md bg-primary-soft px-3 py-3 font-semibold text-on-primary-soft">
          <CircleCheck size={20} aria-hidden className="mt-0.5 shrink-0" />
          Presença confirmada: {feito.nome}, +{formatHours(feito.horas)} em {feito.projeto}.
        </p>
      )}
    </section>
  );
}

function RegistroManual() {
  const { orgId } = useSession();
  const voluntarios = useVoluntariosDaEntidade(orgId!);
  const registrar = useGeraMutation(registrarHorasManual);
  const toast = useToast();
  const ids = { voluntario: useId(), data: useId(), projeto: useId(), horas: useId(), justificativa: useId() };
  const [form, setForm] = useState({ voluntarioId: '', data: isoDay(new Date()), projeto: '', horas: '4', justificativa: '' });
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    registrar.mutate(
      { entidadeId: orgId!, ...form, horas: Number(form.horas) },
      {
        onSuccess: () => {
          toast.show(`${form.horas} h registradas à mão. A justificativa fica no histórico.`);
          setForm((f) => ({ ...f, projeto: '', justificativa: '' }));
        },
      },
    );
  };

  const aptos = voluntarios.data?.filter((r) => r.voluntario.aprovadoEm && !r.voluntario.desligamento) ?? [];

  return (
    <details className="rounded-lg border border-border bg-bg-card shadow-card">
      <summary className="cursor-pointer px-5 py-4 text-lg font-bold text-ink">Registrar horas manualmente</summary>
      <form onSubmit={submit} noValidate className="grid gap-4 border-t border-border p-5 sm:grid-cols-2">
        <p className="text-sm text-ink-muted sm:col-span-2">
          Use só quando o check-in por QR não deu certo. Todo registro manual precisa de justificativa.
        </p>
        <div className="flex flex-col gap-2">
          <label htmlFor={ids.voluntario} className={labelClass}>Voluntário</label>
          <select id={ids.voluntario} required value={form.voluntarioId} onChange={set('voluntarioId')} className={inputClass}>
            <option value="">Escolha…</option>
            {aptos.map((r) => (
              <option key={r.voluntario.id} value={r.voluntario.id}>{r.voluntario.nome}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor={ids.data} className={labelClass}>Data</label>
          <input id={ids.data} type="date" required max={isoDay(new Date())} value={form.data} onChange={set('data')} className={inputClass} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor={ids.projeto} className={labelClass}>Projeto</label>
          <input id={ids.projeto} value={form.projeto} onChange={set('projeto')} placeholder="Campanha do Agasalho" className={inputClass} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor={ids.horas} className={labelClass}>Horas</label>
          <input id={ids.horas} type="number" min={1} max={12} required value={form.horas} onChange={set('horas')} className={inputClass} />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label htmlFor={ids.justificativa} className={labelClass}>Justificativa (obrigatória)</label>
          <textarea id={ids.justificativa} required rows={2} value={form.justificativa} onChange={set('justificativa')} className={`${inputClass} py-2`} />
        </div>
        <div className="flex flex-col gap-3 sm:col-span-2">
          <InlineError>{registrar.isError ? mensagemDeErro(registrar.error) : null}</InlineError>
          <Button type="submit" disabled={registrar.isPending} className="self-start">
            {registrar.isPending ? 'Registrando…' : 'Registrar horas'}
          </Button>
        </div>
      </form>
    </details>
  );
}
