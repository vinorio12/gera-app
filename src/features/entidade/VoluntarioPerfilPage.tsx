import { useId, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button, StatusBadge, formatHours } from '@gera/design-system';
import { Dialog } from '../../components/shared/Dialog';
import { EmptyState } from '../../components/shared/EmptyState';
import { Avatar } from '../../components/shared/Imagens';
import { HoursTimeline } from '../../components/shared/HoursTimeline';
import { PageHeader } from '../../components/shared/PageHeader';
import { ErrorState, InlineError, SkeletonList } from '../../components/shared/States';
import { useToast } from '../../components/shared/Toast';
import { inputClass, labelClass } from '../../components/ui/form';
import { useSession } from '../../lib/auth';
import { formatDate } from '../../lib/format';
import { mensagemDeErro, useGeraMutation, useVoluntarioDaEntidade } from '../../services/hooks';
import { aprovarVoluntario, desligarVoluntario, reativarVoluntario } from '../../services/voluntarios';

export function VoluntarioPerfilPage() {
  const { id = '' } = useParams();
  const { orgId, orgName } = useSession();
  const perfil = useVoluntarioDaEntidade(id, orgId!);
  const toast = useToast();
  const aprovar = useGeraMutation(() => aprovarVoluntario(id, orgId!));
  const reativar = useGeraMutation(() => reativarVoluntario(id, orgId!));
  const desligar = useGeraMutation((motivo: string) => desligarVoluntario(id, orgId!, motivo));
  const [dialogo, setDialogo] = useState(false);
  const [motivo, setMotivo] = useState('');
  const motivoId = useId();

  const voltar = (
    <Link to="/entidade/voluntarios" className="mb-4 inline-flex min-h-11 items-center gap-2 font-semibold text-link hover:underline">
      <ArrowLeft size={18} aria-hidden /> Voluntários
    </Link>
  );

  if (perfil.isPending) return <>{voltar}<SkeletonList rows={5} /></>;
  if (perfil.isError) return <>{voltar}<ErrorState error={perfil.error} onRetry={() => perfil.refetch()} /></>;

  const { voluntario: v, status, totalHoras, registros, carteirinha } = perfil.data;
  const dados: Array<[string, string]> = [
    ['CPF', v.cpf],
    ['E-mail', v.email],
    ['Telefone', v.telefone],
    ['Nascimento', formatDate(v.nascimento)],
    ['Formação', v.formacao],
    ['Áreas de interesse', v.areas.join(', ')],
    ['Cadastro', formatDate(v.cadastroEm)],
    ['Termo aceito em', v.termoAceitoEm ? `${formatDate(v.termoAceitoEm)}${v.termoVersao ? ` (versão ${v.termoVersao})` : ''}` : 'Ainda não'],
    ['Número da carteirinha', v.registro],
  ];

  return (
    <>
      {voltar}
      <PageHeader
        title={v.nome}
        eyebrow={orgName}
        actions={
          <>
            {!v.aprovadoEm && !v.desligamento && (
              <Button
                disabled={aprovar.isPending}
                onClick={() => aprovar.mutate(undefined, { onSuccess: () => toast.show(`${v.nome} aprovado(a).`) })}
              >
                Aprovar cadastro
              </Button>
            )}
            {v.desligamento ? (
              <Button
                variant="secondary"
                disabled={reativar.isPending}
                onClick={() => reativar.mutate(undefined, { onSuccess: () => toast.show(`${v.nome} está de volta. Bom te ver de novo!`) })}
              >
                Reativar
              </Button>
            ) : (
              <Button variant="danger" onClick={() => setDialogo(true)}>
                Desligar
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="flex flex-col gap-4">
          <section className="flex flex-col gap-3 rounded-lg border border-border bg-bg-card p-5 shadow-card">
            <div className="flex flex-wrap items-center gap-3">
              <Avatar src={v.fotoUrl} nome={v.nome} tipo="foto" tamanho={64} />
              <StatusBadge status={status} />
              <span className="font-display text-3xl leading-none tabular-nums text-ink">{formatHours(totalHoras).toUpperCase()}</span>
              <span className="text-sm text-ink-muted">na {orgName}</span>
            </div>
            {v.desligamento && (
              <p className="rounded-md bg-accent-soft px-3 py-2 text-sm text-on-accent-soft">
                Desligado(a) em {formatDate(v.desligamento.em)}. Motivo: {v.desligamento.motivo}
              </p>
            )}
            <p className="text-sm text-ink-muted">
              Carteirinha:{' '}
              <strong className="text-ink">
                {carteirinha.liberada ? `liberada, válida até ${formatDate(carteirinha.validaAte!)}` : 'ainda não liberada'}
              </strong>
            </p>
          </section>
          <section className="rounded-lg border border-border bg-bg-card p-5 shadow-card" aria-labelledby="dados">
            <h2 id="dados" className="mb-3 text-lg font-bold text-ink">
              Dados cadastrais
            </h2>
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
              {dados.map(([k, val]) => (
                <div key={k} className="contents">
                  <dt className="text-ink-muted">{k}</dt>
                  <dd className="break-words font-semibold text-ink">{val}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <section aria-labelledby="historico">
          <h2 id="historico" className="mb-3 text-lg font-bold text-ink">
            Banco de horas
          </h2>
          {registros.length ? (
            <HoursTimeline registros={registros} />
          ) : (
            <EmptyState
              title="Nenhuma ação ainda"
              description="O primeiro check-in libera a carteirinha. Faça pelo Banco de horas no dia da ação."
            />
          )}
        </section>
      </div>

      <Dialog
        open={dialogo}
        onClose={() => setDialogo(false)}
        title={`Desligar ${v.nome}?`}
        actions={
          <>
            <Button variant="ghost" onClick={() => setDialogo(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              disabled={desligar.isPending || !motivo.trim()}
              onClick={() =>
                desligar.mutate(motivo, {
                  onSuccess: () => {
                    setDialogo(false);
                    setMotivo('');
                    toast.show(`${v.nome} foi desligado(a). A carteirinha deixa de valer agora.`);
                  },
                })
              }
            >
              Desligar
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <p>A carteirinha deixa de valer na hora. Dá para reativar depois.</p>
          <label htmlFor={motivoId} className={labelClass}>
            Motivo (obrigatório)
          </label>
          <textarea
            id={motivoId}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={3}
            className={`${inputClass} py-2`}
          />
          <InlineError>{desligar.isError ? mensagemDeErro(desligar.error) : null}</InlineError>
        </div>
      </Dialog>
    </>
  );
}
