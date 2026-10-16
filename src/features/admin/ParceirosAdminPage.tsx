import { useState } from 'react';
import { Button, cx, formatNumber } from '@gera/design-system';
import { Chips } from '../../components/shared/Chips';
import { Dialog } from '../../components/shared/Dialog';
import { EmptyState } from '../../components/shared/EmptyState';
import { PageHeader } from '../../components/shared/PageHeader';
import { ErrorState, InlineError, SkeletonList } from '../../components/shared/States';
import { useToast } from '../../components/shared/Toast';
import { cardClass } from '../../components/ui/card';
import { Campo } from '../../components/ui/Campo';
import { inputClass } from '../../components/ui/form';
import { formatMoeda } from '../../lib/format';
import { decidirBeneficio, decidirParceiro, type ParceiroAdmin } from '../../services/beneficios';
import { mensagemDeErro, useGeraMutation, useParceirosAdmin } from '../../services/hooks';
import type { Beneficio } from '../../types/domain';
import { SELO_APROVACAO } from '../parceiro/ParceiroPages';

type Recusa = { tipo: 'parceiro'; id: string; nome: string } | { tipo: 'beneficio'; id: string; nome: string };

export function ParceirosAdminPage() {
  const lista = useParceirosAdmin();
  const toast = useToast();
  const [aba, setAba] = useState<'pendencias' | 'todos'>('pendencias');
  const [recusa, setRecusa] = useState<Recusa | null>(null);
  const parceiro = useGeraMutation(decidirParceiro);
  const beneficio = useGeraMutation(decidirBeneficio);

  const parceirosPendentes = lista.data?.filter((p) => p.status === 'pendente') ?? [];
  const beneficiosPendentes = lista.data?.flatMap((p) => p.beneficios.filter((b) => b.status === 'pendente').map((b) => ({ ...b, parceiro: p }))) ?? [];
  const pendencias = parceirosPendentes.length + beneficiosPendentes.length;

  return (
    <>
      <PageHeader title="Parceiros e benefícios" eyebrow="Administrador ACIJS" description="Empresas parceiras e ofertas só vão ao ar depois da aprovação do comitê." />
      {lista.isPending ? (
        <SkeletonList rows={4} />
      ) : lista.isError ? (
        <ErrorState error={lista.error} onRetry={() => lista.refetch()} />
      ) : (
        <div className="flex flex-col gap-4">
          <Chips
            label="Mostrar"
            valor={aba}
            onChange={setAba}
            opcoes={[
              { id: 'pendencias', label: `Para aprovar · ${pendencias}` },
              { id: 'todos', label: `Todos os parceiros · ${lista.data.length}` },
            ]}
          />
          <InlineError>{parceiro.isError ? mensagemDeErro(parceiro.error) : beneficio.isError ? mensagemDeErro(beneficio.error) : null}</InlineError>
          {aba === 'pendencias' ? (
            pendencias === 0 ? (
              <EmptyState title="Nada para aprovar" description="Quando uma empresa se cadastrar ou mandar uma oferta nova, ela aparece aqui." />
            ) : (
              <div className="flex flex-col gap-6">
                {parceirosPendentes.length > 0 && (
                  <section aria-labelledby="novos-parceiros" className="flex flex-col gap-3">
                    <h2 id="novos-parceiros" className="text-lg font-bold text-ink">Empresas novas</h2>
                    {parceirosPendentes.map((p) => (
                      <article key={p.id} className={`${cardClass} flex flex-col gap-2`}>
                        <h3 className="font-bold text-ink">{p.nome}</h3>
                        <p className="text-sm text-ink-muted">
                          {p.categoria} · {p.endereco} · CNPJ {p.cnpj} · {p.contato}, {p.telefone}, {p.email}
                        </p>
                        {p.beneficios.length > 0 && <p className="text-sm text-ink">Ofertas: {p.beneficios.map((b) => b.titulo).join('; ')}</p>}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            disabled={parceiro.isPending}
                            onClick={() => parceiro.mutate({ id: p.id, aprovar: true }, { onSuccess: () => toast.show(`${p.nome} aprovada como parceira. Aprove também as ofertas dela.`) })}
                          >
                            Aprovar empresa
                          </Button>
                          <Button variant="secondary" onClick={() => setRecusa({ tipo: 'parceiro', id: p.id, nome: p.nome })}>
                            Recusar
                          </Button>
                        </div>
                      </article>
                    ))}
                  </section>
                )}
                {beneficiosPendentes.length > 0 && (
                  <section aria-labelledby="novas-ofertas" className="flex flex-col gap-3">
                    <h2 id="novas-ofertas" className="text-lg font-bold text-ink">Ofertas para aprovar</h2>
                    {beneficiosPendentes.map((b) => (
                      <article key={b.id} className={`${cardClass} flex flex-col gap-2`}>
                        <h3 className="font-bold text-ink">{b.titulo}</h3>
                        <p className="text-sm text-ink-muted">
                          {b.parceiro.nome} · {b.categoria} · economia estimada {formatMoeda(b.economiaEstimada)} por uso
                        </p>
                        <p className="text-sm text-ink">Regra: {b.regra}</p>
                        {b.parceiro.status !== 'aprovado' && <p className="text-sm text-on-info-soft">A empresa ainda não foi aprovada: a oferta só aparece depois das duas aprovações.</p>}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            disabled={beneficio.isPending}
                            onClick={() => beneficio.mutate({ id: b.id, aprovar: true }, { onSuccess: () => toast.show(`${b.titulo} aprovado. Os voluntários já veem a oferta.`) })}
                          >
                            Aprovar oferta
                          </Button>
                          <Button variant="secondary" onClick={() => setRecusa({ tipo: 'beneficio', id: b.id, nome: b.titulo })}>
                            Recusar
                          </Button>
                        </div>
                      </article>
                    ))}
                  </section>
                )}
              </div>
            )
          ) : (
            <ul className="grid gap-4 lg:grid-cols-2">
              {lista.data.map((p) => (
                <ItemParceiro key={p.id} p={p} />
              ))}
            </ul>
          )}
        </div>
      )}
      {recusa && (
        <RecusaDialog
          recusa={recusa}
          busy={parceiro.isPending || beneficio.isPending}
          onClose={() => setRecusa(null)}
          onConfirm={(motivo) => {
            const mut = recusa.tipo === 'parceiro' ? parceiro : beneficio;
            mut.mutate(
              { id: recusa.id, aprovar: false, motivo },
              {
                onSuccess: () => {
                  toast.show(`${recusa.nome} recusado. O motivo foi enviado ao parceiro.`);
                  setRecusa(null);
                },
              },
            );
          }}
        />
      )}
    </>
  );
}

function ItemParceiro({ p }: { p: ParceiroAdmin }) {
  return (
    <li className={`${cardClass} flex flex-col gap-2`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="font-bold text-ink">{p.nome}</h2>
        <span className={cx('rounded-sm px-2 py-1 text-xs font-bold', SELO_APROVACAO[p.status].classe)}>{SELO_APROVACAO[p.status].texto}</span>
      </div>
      <p className="text-sm text-ink-muted">
        {p.categoria} · {p.endereco} · {formatNumber(p.resgates)} usos registrados
      </p>
      {p.motivoRecusa && <p className="text-sm text-on-accent-soft">Motivo da recusa: {p.motivoRecusa}</p>}
      <ul className="divide-y divide-border text-sm">
        {p.beneficios.map((b: Beneficio) => (
          <li key={b.id} className="flex items-start justify-between gap-2 py-1.5">
            <span className="text-ink">{b.titulo}</span>
            <span className={cx('shrink-0 rounded-sm px-1.5 py-0.5 text-xs font-bold', SELO_APROVACAO[b.status].classe)}>{SELO_APROVACAO[b.status].texto}</span>
          </li>
        ))}
      </ul>
    </li>
  );
}

function RecusaDialog({ recusa, busy, onClose, onConfirm }: { recusa: Recusa; busy: boolean; onClose: () => void; onConfirm: (motivo: string) => void }) {
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  return (
    <Dialog
      open
      onClose={onClose}
      title={`Recusar ${recusa.nome}?`}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            variant="danger"
            disabled={busy}
            onClick={() => (motivo.trim() ? onConfirm(motivo) : setErro('Escreva o motivo: ele volta para o parceiro.'))}
          >
            Recusar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3 text-ink">
        <p className="text-ink-muted">O parceiro recebe o motivo e pode ajustar e enviar de novo.</p>
        <Campo id="motivo" label="Motivo da recusa">
          <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} className={`${inputClass} py-2`} />
        </Campo>
        <InlineError>{erro}</InlineError>
      </div>
    </Dialog>
  );
}
