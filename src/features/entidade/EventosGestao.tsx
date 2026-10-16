import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, CircleAlert, CircleCheck, MapPin, Pencil, Plus, ScanLine, Trash2, X } from 'lucide-react';
import { Button, KpiCard, formatNumber } from '@gera/design-system';
import { Chips } from '../../components/shared/Chips';
import { CodeReader } from '../../components/shared/CodeReader';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { EmptyState } from '../../components/shared/EmptyState';
import { IconButton } from '../../components/shared/IconButton';
import { PageHeader } from '../../components/shared/PageHeader';
import { ErrorState, InlineError, Skeleton, SkeletonList } from '../../components/shared/States';
import { useToast } from '../../components/shared/Toast';
import { VoltarLink } from '../../components/shared/VoltarLink';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { cardClass } from '../../components/ui/card';
import { Campo } from '../../components/ui/Campo';
import { inputClass } from '../../components/ui/form';
import { useSession } from '../../lib/auth';
import { isoDay } from '../../lib/carteirinha';
import { formatDateShort, formatDateTime, formatMoeda } from '../../lib/format';
import { checkInIngresso, excluirEvento, salvarEvento, type CheckInIngresso, type EventoGestao } from '../../services/gestao';
import { mensagemDeErro, useEventoGestao, useEventosGestao, useGeraMutation, useIngressosDoEvento } from '../../services/hooks';
import { TIPOS_INGRESSO, type TipoIngresso } from '../../types/domain';

export function EventosGestaoPage() {
  const { orgId, orgName } = useSession();
  const lista = useEventosGestao(orgId!);
  const [aba, setAba] = useState<'proximos' | 'realizados'>('proximos');
  const hoje = isoDay(new Date());
  const proximos = lista.data?.filter((e) => e.data >= hoje) ?? [];
  const realizados = (lista.data?.filter((e) => e.data < hoje) ?? []).reverse();
  const visiveis = aba === 'proximos' ? proximos : realizados;

  return (
    <>
      <PageHeader
        title="Eventos e ingressos"
        eyebrow={orgName}
        description="Crie eventos com vários tipos de ingresso e faça o check-in no dia pela câmera."
        actions={
          <ButtonLink to="novo">
            <Plus size={18} aria-hidden /> Novo evento
          </ButtonLink>
        }
      />
      {lista.isPending ? (
        <SkeletonList rows={3} />
      ) : lista.isError ? (
        <ErrorState error={lista.error} onRetry={() => lista.refetch()} />
      ) : (
        <div className="flex flex-col gap-4">
          <Chips
            label="Quando"
            valor={aba}
            onChange={setAba}
            opcoes={[
              { id: 'proximos', label: `Próximos · ${proximos.length}` },
              { id: 'realizados', label: `Realizados · ${realizados.length}` },
            ]}
          />
          {visiveis.length === 0 ? (
            <EmptyState
              title={aba === 'proximos' ? 'Nenhum evento marcado' : 'Nenhum evento realizado ainda'}
              description={aba === 'proximos' ? 'Crie um evento: ele vai para a agenda do site com a venda de ingressos.' : undefined}
              action={aba === 'proximos' ? <ButtonLink to="novo">Novo evento</ButtonLink> : undefined}
            />
          ) : (
            <ul className="grid gap-4 lg:grid-cols-2">
              {visiveis.map((e) => (
                <ItemEvento key={e.id} e={e} />
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}

function ItemEvento({ e }: { e: EventoGestao }) {
  const { orgId } = useSession();
  const toast = useToast();
  const [excluindo, setExcluindo] = useState(false);
  const excluir = useGeraMutation(() => excluirEvento(e.id, orgId!));
  return (
    <li className={`${cardClass} flex flex-col gap-3`}>
      <div>
        <h2 className="break-words text-lg font-bold text-ink">{e.titulo}</h2>
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
          <span className="flex items-center gap-1"><CalendarDays size={16} aria-hidden /> {formatDateShort(e.data)} · {e.horario}</span>
          <span className="flex items-center gap-1"><MapPin size={16} aria-hidden /> {e.local}</span>
        </p>
      </div>
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Ingressos de {e.titulo}</caption>
        <thead className="text-ink-muted">
          <tr>
            <th scope="col" className="py-1 font-semibold">Tipo</th>
            <th scope="col" className="py-1 text-right font-semibold">Preço</th>
            <th scope="col" className="py-1 text-right font-semibold">Vendidos</th>
          </tr>
        </thead>
        <tbody>
          {e.ingressos.map((i) => (
            <tr key={i.tipo} className="border-t border-border">
              <td className="py-1.5 text-ink">{i.tipo}</td>
              <td className="py-1.5 text-right tabular-nums text-ink">{i.preco === 0 ? 'Gratuito' : formatMoeda(i.preco)}</td>
              <td className="py-1.5 text-right tabular-nums text-ink">
                {formatNumber(i.vendidos)}/{formatNumber(i.total)}
                {i.vendidos >= i.total && <span className="ml-1 text-xs font-bold text-ink-muted">esgotado</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-sm text-ink-muted">
        {formatNumber(e.vendidos)} de {formatNumber(e.total)} ingressos vendidos
        {e.emitidos > 0 && ` · ${formatNumber(e.checkIns)} de ${formatNumber(e.emitidos)} com QR já entraram`}
      </p>
      <div className="mt-auto flex flex-wrap gap-2">
        <ButtonLink to={`${e.id}/checkin`}>
          <ScanLine size={16} aria-hidden /> Check-in
        </ButtonLink>
        <ButtonLink to={`${e.id}/editar`} variant="secondary" aria-label={`Editar ${e.titulo}`}>
          <Pencil size={16} aria-hidden /> Editar
        </ButtonLink>
        {e.vendidos === 0 && (
          <Button variant="ghost" onClick={() => setExcluindo(true)} aria-label={`Excluir ${e.titulo}`}>
            <Trash2 size={16} aria-hidden /> Excluir
          </Button>
        )}
      </div>
      <ConfirmDialog
        open={excluindo}
        title="Excluir evento?"
        confirmLabel="Excluir"
        variant="danger"
        busy={excluir.isPending}
        error={excluir.isError ? mensagemDeErro(excluir.error) : null}
        onClose={() => setExcluindo(false)}
        onConfirm={() => excluir.mutate(undefined, { onSuccess: () => (setExcluindo(false), toast.show(`${e.titulo} foi excluído.`)) })}
      >
        <p>{e.titulo} sai da agenda do site. Não dá para desfazer.</p>
      </ConfirmDialog>
    </li>
  );
}

// ---------- Criar e editar ----------

interface LinhaIngresso {
  chave: number;
  tipo: TipoIngresso;
  preco: string;
  total: string;
  vendidos: number;
}

export function EventoFormPage() {
  const { id } = useParams();
  const { orgId } = useSession();
  const existente = useEventoGestao(id, orgId!);
  if (id && existente.isPending) return <Skeleton className="h-96 border border-border" />;
  if (id && existente.isError) return <ErrorState error={existente.error} />;
  return <EventoForm key={existente.data?.id ?? 'novo'} evento={existente.data} />;
}

function EventoForm({ evento }: { evento?: EventoGestao }) {
  const { orgId, orgName } = useSession();
  const navigate = useNavigate();
  const toast = useToast();
  const salvar = useGeraMutation(salvarEvento);
  const [dados, setDados] = useState({
    titulo: evento?.titulo ?? '',
    descricao: evento?.descricao ?? '',
    data: evento?.data ?? '',
    horario: evento?.horario ?? '',
    local: evento?.local ?? '',
  });
  const [linhas, setLinhas] = useState<LinhaIngresso[]>(
    evento?.ingressos.map((i, n) => ({ chave: n, tipo: i.tipo, preco: String(i.preco).replace('.', ','), total: String(i.total), vendidos: i.vendidos })) ?? [
      { chave: 0, tipo: 'Gratuito', preco: '0', total: '100', vendidos: 0 },
    ],
  );
  const set = (k: keyof typeof dados) => (e: { target: { value: string } }) => setDados((d) => ({ ...d, [k]: e.target.value }));
  const setLinha = (chave: number, patch: Partial<LinhaIngresso>) => setLinhas((ls) => ls.map((l) => (l.chave === chave ? { ...l, ...patch } : l)));
  const livres = TIPOS_INGRESSO.filter((t) => !linhas.some((l) => l.tipo === t));
  const numero = (v: string) => Number(v.replace(/\./g, '').replace(',', '.'));

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    salvar.mutate(
      {
        ...dados,
        entidadeId: orgId!,
        id: evento?.id,
        ingressos: linhas.map((l) => ({ tipo: l.tipo, preco: l.tipo === 'Gratuito' ? 0 : numero(l.preco), total: numero(l.total) })),
      },
      {
        onSuccess: (ev) => {
          toast.show(evento ? `${ev.titulo} atualizado.` : `${ev.titulo} está na agenda, com a venda de ingressos aberta.`);
          navigate('/entidade/eventos');
        },
      },
    );
  };

  return (
    <div className="max-w-3xl">
      <VoltarLink to="/entidade/eventos">Eventos e ingressos</VoltarLink>
      <PageHeader title={evento ? 'Editar evento' : 'Novo evento'} eyebrow={orgName} />
      <form onSubmit={enviar} noValidate className="flex flex-col gap-6">
        <fieldset className={`${cardClass} grid gap-4 sm:grid-cols-2`} aria-label="Dados do evento">
          <Campo id="titulo" label="Nome do evento" className="sm:col-span-2">
            <input value={dados.titulo} onChange={set('titulo')} className={inputClass} required />
          </Campo>
          <Campo id="descricao" label="Descrição" className="sm:col-span-2">
            <textarea value={dados.descricao} onChange={set('descricao')} rows={3} className={`${inputClass} py-2`} />
          </Campo>
          <Campo id="data" label="Data">
            <input type="date" value={dados.data} onChange={set('data')} min={evento ? undefined : isoDay(new Date())} className={inputClass} required />
          </Campo>
          <Campo id="horario" label="Horário" dica="Ex.: 19h30">
            <input value={dados.horario} onChange={set('horario')} className={inputClass} required />
          </Campo>
          <Campo id="local" label="Local" className="sm:col-span-2">
            <input value={dados.local} onChange={set('local')} className={inputClass} required />
          </Campo>
        </fieldset>

        <fieldset className={`${cardClass} flex flex-col gap-3`} aria-labelledby="tipos-ingresso">
          <h2 id="tipos-ingresso" className="text-lg font-bold text-ink">
            Tipos de ingresso
          </h2>
          <p className="text-sm text-ink-muted">Cada tipo tem preço e quantidade. Tipos com ingressos vendidos não podem sair.</p>
          <ul className="flex flex-col gap-3">
            {linhas.map((l) => (
              <li key={l.chave} className="grid grid-cols-2 items-end gap-3 rounded-md border border-border p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <Campo id={`tipo-${l.chave}`} label="Tipo">
                  <select
                    value={l.tipo}
                    disabled={l.vendidos > 0}
                    onChange={(e) => setLinha(l.chave, { tipo: e.target.value as TipoIngresso, ...(e.target.value === 'Gratuito' ? { preco: '0' } : {}) })}
                    className={inputClass}
                  >
                    {[l.tipo, ...livres].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </Campo>
                <Campo id={`preco-${l.chave}`} label="Preço (R$)">
                  <input
                    inputMode="decimal"
                    value={l.tipo === 'Gratuito' ? '0' : l.preco}
                    disabled={l.tipo === 'Gratuito'}
                    onChange={(e) => setLinha(l.chave, { preco: e.target.value })}
                    className={inputClass}
                  />
                </Campo>
                <Campo id={`total-${l.chave}`} label="Quantidade" dica={l.vendidos ? `${l.vendidos} vendidos` : undefined}>
                  <input inputMode="numeric" value={l.total} onChange={(e) => setLinha(l.chave, { total: e.target.value })} className={inputClass} />
                </Campo>
                <IconButton
                  icon={X}
                  label={`Remover ingresso ${l.tipo}`}
                  disabled={l.vendidos > 0 || linhas.length === 1}
                  onClick={() => setLinhas((ls) => ls.filter((x) => x.chave !== l.chave))}
                  className="disabled:opacity-40"
                />
              </li>
            ))}
          </ul>
          {livres.length > 0 && (
            <Button
              variant="secondary"
              className="self-start"
              onClick={() => setLinhas((ls) => [...ls, { chave: Math.max(...ls.map((x) => x.chave)) + 1, tipo: livres[0]!, preco: livres[0] === 'Gratuito' ? '0' : '', total: '', vendidos: 0 }])}
            >
              <Plus size={16} aria-hidden /> Adicionar tipo de ingresso
            </Button>
          )}
        </fieldset>

        <InlineError>{salvar.isError ? mensagemDeErro(salvar.error) : null}</InlineError>
        <Button type="submit" disabled={salvar.isPending} className="self-start">
          {salvar.isPending ? 'Salvando…' : evento ? 'Salvar alterações' : 'Criar evento'}
        </Button>
      </form>
    </div>
  );
}

// ---------- Check-in no dia ----------

export function EventoCheckInPage() {
  const { id = '' } = useParams();
  const { orgId, orgName } = useSession();
  const evento = useEventoGestao(id, orgId!);
  const ingressos = useIngressosDoEvento(id, orgId!);
  const checkIn = useGeraMutation(checkInIngresso);
  const [ultimo, setUltimo] = useState<CheckInIngresso | null>(null);

  const ler = (codigo: string) => {
    setUltimo(null);
    checkIn.mutate({ entidadeId: orgId!, eventoId: id, codigo }, { onSuccess: setUltimo });
  };

  if (evento.isPending) return <Skeleton className="h-96 border border-border" />;
  if (evento.isError) return <ErrorState error={evento.error} />;
  const e = evento.data;
  const entraram = ingressos.data?.filter((i) => i.usadoEm).length ?? 0;

  return (
    <>
      <VoltarLink to="/entidade/eventos">Eventos e ingressos</VoltarLink>
      <PageHeader title="Check-in" eyebrow={orgName} description={`${e.titulo} · ${formatDateShort(e.data)} · ${e.horario}`} />
      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="leitura" className="flex flex-col gap-4">
          <h2 id="leitura" className="sr-only">
            Ler ingresso
          </h2>
          <CodeReader
            onCode={ler}
            busy={checkIn.isPending}
            submitLabel="Validar ingresso"
            inputLabel="Ou digite o código do ingresso"
            placeholder="GERA-INGRESSO:ing-1"
            cameraHint="Aponte a câmera para o QR do ingresso."
          />
          <div aria-live="assertive">
            {checkIn.isError && (
              <p role="alert" className="flex items-start gap-2 rounded-md bg-accent-soft px-4 py-4 text-lg font-bold text-on-accent-soft">
                <CircleAlert size={24} aria-hidden className="mt-0.5 shrink-0" />
                {mensagemDeErro(checkIn.error)}
              </p>
            )}
            {ultimo && (
              <p className="flex items-start gap-2 rounded-md bg-primary-soft px-4 py-4 text-lg font-bold text-on-primary-soft">
                <CircleCheck size={24} aria-hidden className="mt-0.5 shrink-0" />
                Pode entrar: {ultimo.participante} ({ultimo.tipo}).
              </p>
            )}
          </div>
        </section>
        <section aria-labelledby="lista" className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-4">
            <KpiCard label="Entraram" value={`${formatNumber(entraram)} de ${formatNumber(ingressos.data?.length ?? 0)}`} source="ingressos com QR emitidos pela GERA" />
          </div>
          <h2 id="lista" className="text-lg font-bold text-ink">
            Ingressos emitidos
          </h2>
          {ingressos.isPending ? (
            <SkeletonList rows={4} />
          ) : ingressos.isError ? (
            <ErrorState error={ingressos.error} onRetry={() => ingressos.refetch()} />
          ) : ingressos.data.length === 0 ? (
            <EmptyState title="Nenhum ingresso emitido pela GERA ainda" description="Os ingressos comprados pelo site aparecem aqui, cada um com seu QR." />
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border bg-bg-card shadow-card">
              {ingressos.data.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{i.participante}</p>
                    <p className="text-sm text-ink-muted">
                      {i.tipo} · <span className="font-mono text-xs">{i.codigo}</span>
                    </p>
                  </div>
                  {i.usadoEm ? (
                    <span className="shrink-0 rounded-sm bg-primary-soft px-2 py-1 text-xs font-bold text-on-primary-soft">
                      Entrou {formatDateTime(i.usadoEm).split(' às ')[1]}
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs font-semibold text-ink-muted">Aguardando</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
