import { useState } from 'react';
import { cx } from '@gera/design-system';
import { Chips } from '../../components/shared/Chips';
import { DocumentoView } from '../../components/shared/DocumentoView';
import { Exportar } from '../../components/shared/Exportar';
import { FiltroPeriodo, usePeriodo } from '../../components/shared/FiltroPeriodo';
import { PageHeader } from '../../components/shared/PageHeader';
import { ErrorState, Skeleton } from '../../components/shared/States';
import { cardClass } from '../../components/ui/card';
import { Campo } from '../../components/ui/Campo';
import { inputClass } from '../../components/ui/form';
import { useSession } from '../../lib/auth';
import { useEntidades, useRelatorio } from '../../services/hooks';
import { RELATORIOS, type TipoRelatorio } from '../../services/relatorios';

export function RelatoriosPage() {
  const { orgId, orgName } = useSession();
  return (
    <>
      <PageHeader title="Relatórios" eyebrow={orgName} description="Prestação de contas e voluntariado corporativo, com prévia aqui e exportação em PDF e planilha." />
      <PainelRelatorios entidadeId={orgId} />
    </>
  );
}

/** Escolha do relatório e do período, prévia e exportação. Sem entidade fixa, o comitê escolhe uma ou consolida todas. */
export function PainelRelatorios({ entidadeId: fixa }: { entidadeId?: string }) {
  const [tipo, setTipo] = useState<TipoRelatorio>('prestacao');
  const [escolhida, setEscolhida] = useState('');
  const filtro = usePeriodo('trimestre');
  const entidades = useEntidades();
  const entidadeId = fixa ?? (escolhida || undefined);
  const relatorio = useRelatorio(tipo, filtro.periodo, entidadeId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Chips label="Relatório" valor={tipo} onChange={setTipo} opcoes={RELATORIOS.map((r) => ({ id: r.id, label: r.titulo }))} />
        <p className="text-sm text-ink-muted">{RELATORIOS.find((r) => r.id === tipo)?.descricao}</p>
        <div className="flex flex-wrap items-start gap-4">
          <FiltroPeriodo {...filtro} />
          {!fixa && (
            <Campo id="entidade" label="Entidade" className="min-w-[220px]">
              <select value={escolhida} onChange={(e) => setEscolhida(e.target.value)} className={inputClass}>
                <option value="">Todas (consolidado)</option>
                {entidades.data?.map((e) => (
                  <option key={e.id} value={e.id}>{e.nome}</option>
                ))}
              </select>
            </Campo>
          )}
        </div>
      </div>
      {relatorio.isError ? (
        <ErrorState error={relatorio.error} onRetry={() => relatorio.refetch()} />
      ) : !relatorio.data ? (
        <Skeleton className="h-96 border border-border" />
      ) : (
        <>
          <Exportar doc={relatorio.data} />
          <section aria-label="Prévia do relatório" className={cx(cardClass, relatorio.isPlaceholderData && 'opacity-60')} aria-busy={relatorio.isFetching}>
            <DocumentoView doc={relatorio.data} />
          </section>
        </>
      )}
    </div>
  );
}
