import { useEffect, type ReactNode } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Circle } from 'lucide-react';
import { Carteirinha, cx } from '@gera/design-system';
import { PageHeader } from '../../components/shared/PageHeader';
import { ErrorState, Skeleton } from '../../components/shared/States';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { useSession } from '../../lib/auth';
import { QR_JANELA_MS, tokenCarteirinha, type EtapaCarteirinha } from '../../lib/carteirinha';
import { formatDate, formatDateTime } from '../../lib/format';
import { useNow } from '../../lib/useNow';
import { useMeuPainel } from '../../services/hooks';
import { lerPainelSalvo, salvarPainel, useOnline } from '../../lib/carteirinhaOffline';
import { WifiOff } from 'lucide-react';

/** O QR é um token temporário que se renova a cada minuto. */
function useTokenRenovavel(registro: string) {
  const now = useNow(1000);
  const restante = Math.ceil((QR_JANELA_MS - (now % QR_JANELA_MS)) / 1000);
  return { token: tokenCarteirinha(registro, now), restante };
}

export function CarteirinhaPage() {
  const { userId } = useSession();
  const painel = useMeuPainel(userId!);
  const online = useOnline();
  // Guarda o último painel sincronizado; offline, a carteirinha abre com ele.
  useEffect(() => {
    if (painel.data && online) salvarPainel(userId!, painel.data, new Date(painel.dataUpdatedAt));
  }, [painel.data, painel.dataUpdatedAt, online, userId]);
  const salvo = online ? null : lerPainelSalvo(userId!);

  if (salvo) return <CarteirinhaOffline salvo={salvo} />;

  if (painel.isPending) {
    return (
      <>
        <PageHeader title="Carteirinha" />
        <Skeleton className="aspect-[85.6/54] w-full max-w-[340px] rounded-xl" />
      </>
    );
  }
  if (painel.isError) return <ErrorState error={painel.error} onRetry={() => painel.refetch()} />;

  const { voluntario: v, carteirinha: c, entidades } = painel.data;
  // Hora em que os dados chegaram: com o app offline, é o último status sincronizado.
  const sync = `Status sincronizado em ${formatDateTime(new Date(painel.dataUpdatedAt).toISOString())}.`;

  if (!c.liberada) {
    return (
      <>
        <PageHeader title="Carteirinha" description="Ela é liberada depois da sua primeira ação validada. Falta pouco:" />
        <div className="flex flex-col gap-4">
          <Checklist etapas={c.etapas} />
          {!v.desligamento && <CodigoDePresenca registro={v.registro} />}
          <ButtonLink to="/app/oportunidades" className="justify-center">
            Ver oportunidades
          </ButtonLink>
          <p className="text-xs text-ink-muted">{sync}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Carteirinha" />
      <div className="flex flex-col items-center gap-4">
        <QrDaCarteirinha registro={v.registro}>
          {(token) => (
            <Carteirinha
              className="w-full max-w-[340px]"
              name={v.nome}
              photoUrl={v.fotoUrl}
              organizations={entidades.map((e) => e.nome)}
              registration={v.registro}
              hours={c.totalHoras}
              issuedAt={formatDate(c.emitidaEm!)}
              validUntil={formatDate(c.validaAte!)}
              status={c.status}
              qr={<QRCodeSVG value={token} size={72} level="M" title="QR de validação da carteirinha" />}
            />
          )}
        </QrDaCarteirinha>
        {c.status !== 'ativo' && (
          <p className="w-full max-w-[340px] rounded-md bg-bg-subtle px-4 py-3 text-sm font-semibold text-ink">
            Sua carteirinha está inativa. Participe de uma ação para reativar.
          </p>
        )}
        <p className="w-full max-w-[340px] text-xs text-ink-muted">
          Mostre o QR no caixa do parceiro. {sync}
        </p>
      </div>
    </>
  );
}

function QrDaCarteirinha({ registro, children }: { registro: string; children: (token: string) => ReactNode }) {
  const { token, restante } = useTokenRenovavel(registro);
  return (
    <>
      {children(token)}
      <p className="text-sm text-ink-muted" aria-live="off">
        O QR se renova em <span className="font-semibold tabular-nums text-ink">{restante}s</span>
      </p>
    </>
  );
}

function Checklist({ etapas }: { etapas: EtapaCarteirinha[] }) {
  return (
    <ol className="flex flex-col gap-2 rounded-lg border border-border bg-bg-card p-4 shadow-card">
      {etapas.map((e) => (
        <li key={e.id} className="flex items-start gap-3">
          <span
            className={cx(
              'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
              e.feito ? 'bg-primary text-on-primary' : 'border-2 border-border-strong text-ink-muted',
            )}
          >
            {e.feito ? <Check size={16} aria-hidden /> : <Circle size={8} aria-hidden />}
          </span>
          <div>
            <p className="font-semibold text-ink">
              {e.titulo}
              <span className="sr-only">{e.feito ? ': feito' : ': falta'}</span>
            </p>
            {!e.feito && <p className="text-sm text-ink-muted">{e.pendente}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Antes da carteirinha, o voluntário usa este código para o check-in na entidade. */
function CodigoDePresenca({ registro }: { registro: string }) {
  const { token, restante } = useTokenRenovavel(registro);
  return (
    <section className="flex flex-col items-center gap-3 rounded-lg border border-border bg-bg-card p-4 text-center shadow-card">
      <h2 className="text-lg font-bold text-ink">Seu código de presença</h2>
      <p className="text-sm text-ink-muted">Mostre na entrada da ação para a entidade fazer seu check-in.</p>
      <div className="rounded-md bg-papel p-3">
        <QRCodeSVG value={token} size={180} level="M" title="QR de presença" />
      </div>
      <p className="font-display text-2xl tracking-[0.06em] tabular-nums text-ink">{registro}</p>
      <p className="text-xs text-ink-muted">O QR se renova em {restante}s</p>
    </section>
  );
}

/** Sem rede: a última carteirinha sincronizada, com o QR gerado aqui mesmo. */
function CarteirinhaOffline({ salvo }: { salvo: NonNullable<ReturnType<typeof lerPainelSalvo>> }) {
  const { voluntario: v, carteirinha: c, entidades } = salvo.painel;
  const aviso = `Offline · status sincronizado em ${formatDateTime(salvo.em)}`;
  return (
    <>
      <PageHeader title="Carteirinha" />
      <div className="flex flex-col items-center gap-4">
        <p role="status" className="flex w-full max-w-[340px] items-center gap-2 rounded-md bg-info-soft px-4 py-3 text-sm font-semibold text-on-info-soft">
          <WifiOff size={18} aria-hidden className="shrink-0" /> {aviso}
        </p>
        {c.liberada ? (
          <QrDaCarteirinha registro={v.registro}>
            {(token) => (
              <Carteirinha
                className="w-full max-w-[340px]"
                name={v.nome}
                photoUrl={v.fotoUrl}
                organizations={entidades.map((e) => e.nome)}
                registration={v.registro}
                hours={c.totalHoras}
                issuedAt={formatDate(c.emitidaEm!)}
                validUntil={formatDate(c.validaAte!)}
                status={c.status}
                qr={<QRCodeSVG value={token} size={72} level="M" title="QR de validação da carteirinha" />}
              />
            )}
          </QrDaCarteirinha>
        ) : (
          <>
            <Checklist etapas={c.etapas} />
            {!v.desligamento && <CodigoDePresenca registro={v.registro} />}
          </>
        )}
      </div>
    </>
  );
}
