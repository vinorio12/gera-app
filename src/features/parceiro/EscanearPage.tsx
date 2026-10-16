import { useId, useState } from 'react';
import { Button, PortalVerbo, ValidationResult, cx } from '@gera/design-system';
import { CodeReader } from '../../components/shared/CodeReader';
import { ErrorState, InlineError } from '../../components/shared/States';
import { useToast } from '../../components/shared/Toast';
import { useSession } from '../../lib/auth';
import { formatDate } from '../../lib/format';
import { mensagemDeErro, useBeneficiosAtivos, useGeraMutation } from '../../services/hooks';
import { registrarUso, validarCarteirinha, type ResultadoValidacao } from '../../services/parceiros';

/** Tela inicial do Parceiro: lê a carteirinha, mostra se é elegível e registra o benefício usado. */
export function EscanearPage() {
  const { orgId, orgName } = useSession();
  const validar = useGeraMutation(validarCarteirinha);
  const [resultado, setResultado] = useState<ResultadoValidacao | null>(null);

  const ler = (codigo: string) =>
    validar.mutate(codigo, { onSuccess: setResultado, onError: () => setResultado(null) });

  return (
    <div className="flex flex-col gap-4">
      <PortalVerbo portal="parceiro" subtitle={orgName} />
      {resultado ? (
        <Resultado resultado={resultado} parceiroId={orgId!} onNovo={() => { setResultado(null); validar.reset(); }} />
      ) : (
        <>
          <h1 className="text-2xl font-bold text-ink">Validar carteirinha</h1>
          <CodeReader onCode={ler} busy={validar.isPending} submitLabel="Validar" />
          <InlineError>{validar.isError ? mensagemDeErro(validar.error) : null}</InlineError>
        </>
      )}
    </div>
  );
}

function Resultado({ resultado: r, parceiroId, onNovo }: { resultado: ResultadoValidacao; parceiroId: string; onNovo: () => void }) {
  const beneficios = useBeneficiosAtivos(parceiroId);
  const [escolhido, setEscolhido] = useState('');
  const registrar = useGeraMutation(registrarUso);
  const toast = useToast();
  const groupId = useId();

  return (
    <div className="flex flex-col gap-4">
      <ValidationResult
        className="w-full"
        eligible={r.elegivel}
        name={r.nome}
        organization={r.entidade}
        status={r.status}
        hours={r.horas}
        validUntil={r.validaAte ? formatDate(r.validaAte) : undefined}
        reason={r.motivo}
      />

      {r.elegivel &&
        (beneficios.isError ? (
          <ErrorState error={beneficios.error} onRetry={() => beneficios.refetch()} />
        ) : (
          <fieldset className="flex flex-col gap-2 rounded-lg border border-border bg-bg-card p-4 shadow-card">
            <legend id={groupId} className="px-1 text-lg font-bold text-ink">
              Qual benefício foi usado?
            </legend>
            {beneficios.data?.map((b) => (
              <label
                key={b.id}
                className={cx(
                  'flex min-h-11 cursor-pointer items-start gap-3 rounded-md border px-3 py-3',
                  escolhido === b.id ? 'border-primary bg-primary-soft' : 'border-border',
                )}
              >
                <input
                  type="radio"
                  name="beneficio"
                  value={b.id}
                  checked={escolhido === b.id}
                  onChange={() => setEscolhido(b.id)}
                  className="mt-1 h-4 w-4 accent-primary"
                />
                <span>
                  <span className="block font-semibold text-ink">{b.titulo}</span>
                  <span className="block text-sm text-ink-muted">{b.regra}</span>
                </span>
              </label>
            ))}
            <InlineError>{registrar.isError ? mensagemDeErro(registrar.error) : null}</InlineError>
            <Button
              className="mt-2 justify-center"
              disabled={!escolhido || registrar.isPending}
              onClick={() =>
                registrar.mutate(
                  { parceiroId, beneficioId: escolhido, voluntarioId: r.voluntarioId },
                  {
                    onSuccess: () => {
                      const titulo = beneficios.data?.find((b) => b.id === escolhido)?.titulo ?? 'benefício';
                      toast.show(`Uso registrado: ${titulo}. Valeu por apoiar quem gera impacto em Jaraguá!`);
                      onNovo();
                    },
                  },
                )
              }
            >
              {registrar.isPending ? 'Registrando…' : 'Registrar uso'}
            </Button>
          </fieldset>
        ))}

      <Button variant={r.elegivel ? 'ghost' : 'primary'} className="justify-center" onClick={onNovo}>
        Ler outra carteirinha
      </Button>
    </div>
  );
}
