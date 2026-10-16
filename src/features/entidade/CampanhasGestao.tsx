import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Pencil, Plus } from 'lucide-react';
import { Button, CampaignProgress, KpiCard, formatBRL, formatNumber } from '@gera/design-system';
import { Chips } from '../../components/shared/Chips';
import { EmptyState } from '../../components/shared/EmptyState';
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
import { formatDate, formatMoeda } from '../../lib/format';
import { salvarCampanha, type CampanhaGestao } from '../../services/gestao';
import { mensagemDeErro, useCampanhasGestao, useDoacoesDaCampanha, useGeraMutation } from '../../services/hooks';

export function CampanhasGestaoPage() {
  const { orgId, orgName } = useSession();
  const lista = useCampanhasGestao(orgId!);
  const navigate = useNavigate();
  const [aba, setAba] = useState<'ativas' | 'encerradas'>('ativas');
  const ativas = lista.data?.filter((c) => !c.encerrada) ?? [];
  const encerradas = lista.data?.filter((c) => c.encerrada) ?? [];
  const visiveis = aba === 'ativas' ? ativas : encerradas;

  return (
    <>
      <PageHeader
        title="Campanhas"
        eyebrow={orgName}
        description="Campanhas de captação com meta e prazo. As doações entram sozinhas, pelo pagamento do site."
        actions={
          <ButtonLink to="nova">
            <Plus size={18} aria-hidden /> Nova campanha
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
            label="Situação"
            valor={aba}
            onChange={setAba}
            opcoes={[
              { id: 'ativas', label: `No ar · ${ativas.length}` },
              { id: 'encerradas', label: `Encerradas · ${encerradas.length}` },
            ]}
          />
          {visiveis.length === 0 ? (
            <EmptyState
              title={aba === 'ativas' ? 'Nenhuma campanha no ar' : 'Nenhuma campanha encerrada'}
              description={aba === 'ativas' ? 'Conte uma história, defina a meta e o prazo, e a campanha vai para o site.' : undefined}
              action={aba === 'ativas' ? <ButtonLink to="nova">Nova campanha</ButtonLink> : undefined}
            />
          ) : (
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visiveis.map((c) => (
                <li key={c.id} className="flex flex-col gap-2">
                  <CampaignProgress
                    className="max-w-none flex-1"
                    title={c.titulo}
                    organization={c.encerrada ? `Encerrada em ${formatDate(c.terminaEm)}` : `${formatNumber(c.apoiadores)} apoiadores`}
                    raised={c.arrecadado}
                    goal={c.meta}
                    daysLeft={c.encerrada ? undefined : c.diasRestantes}
                    ctaLabel="Ver doações"
                    onSupport={() => navigate(c.id)}
                  />
                  <ButtonLink to={`${c.id}/editar`} variant="ghost" className="self-start" aria-label={`Editar campanha: ${c.titulo}`}>
                    <Pencil size={16} aria-hidden /> Editar campanha
                  </ButtonLink>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}

export function CampanhaDoacoesPage() {
  const { id } = useParams();
  const { orgId, orgName } = useSession();
  const dados = useDoacoesDaCampanha(id, orgId!);
  const navigate = useNavigate();
  if (dados.isPending) return <Skeleton className="h-96 border border-border" />;
  if (dados.isError) return <ErrorState error={dados.error} />;
  const { campanha: c, doacoes, total } = dados.data;
  return (
    <>
      <VoltarLink to="/entidade/campanhas">Campanhas</VoltarLink>
      <PageHeader
        title={c.titulo}
        eyebrow={orgName}
        description={c.historia}
        actions={
          <ButtonLink to="editar" variant="secondary">
            <Pencil size={16} aria-hidden /> Editar
          </ButtonLink>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="flex flex-col gap-4">
          <CampaignProgress
            className="max-w-none"
            title="Progresso da meta"
            organization={c.encerrada ? `Encerrada em ${formatDate(c.terminaEm)}` : `Termina em ${formatDate(c.terminaEm)}`}
            raised={c.arrecadado}
            goal={c.meta}
            daysLeft={c.encerrada ? undefined : c.diasRestantes}
            ctaLabel="Ver no site"
            onSupport={() => navigate(`/campanhas/${c.slug}`)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <KpiCard className="min-w-0" label="Total das doações" value={formatBRL(total)} source="pagamentos aprovados (simulados)" />
            <KpiCard className="min-w-0" label="Doações" value={formatNumber(doacoes.length)} source="pagamentos aprovados (simulados)" />
          </div>
        </div>
        <section aria-labelledby="doacoes" className={cardClass}>
          <h2 id="doacoes" className="mb-3 text-lg font-bold text-ink">
            Doações recebidas
          </h2>
          {doacoes.length === 0 ? (
            <EmptyState title="Nenhuma doação ainda" description="Compartilhe a página da campanha: as doações aparecem aqui assim que o pagamento é aprovado." className="shadow-none" />
          ) : (
            <div className="max-h-[560px] overflow-y-auto" tabIndex={0} role="region" aria-label="Lista de doações">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-bg-card text-ink-muted">
                  <tr>
                    <th scope="col" className="py-2 font-semibold">Data</th>
                    <th scope="col" className="py-2 font-semibold">Quem doou</th>
                    <th scope="col" className="py-2 text-right font-semibold">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {doacoes.map((d) => (
                    <tr key={d.id}>
                      <td className="py-2 tabular-nums text-ink-muted">{formatDate(d.data)}</td>
                      <td className="py-2 text-ink">{d.descricao ?? 'Doação pelo site'}</td>
                      <td className="py-2 text-right font-semibold tabular-nums text-ink">{formatMoeda(d.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

export function CampanhaFormPage() {
  const { id } = useParams();
  const { orgId } = useSession();
  const existente = useDoacoesDaCampanha(id, orgId!);
  if (id && existente.isPending) return <Skeleton className="h-96 border border-border" />;
  if (id && existente.isError) return <ErrorState error={existente.error} />;
  return <CampanhaForm key={id ?? 'nova'} campanha={existente.data?.campanha} />;
}

function CampanhaForm({ campanha }: { campanha?: CampanhaGestao }) {
  const { orgId, orgName } = useSession();
  const navigate = useNavigate();
  const toast = useToast();
  const salvar = useGeraMutation(salvarCampanha);
  const [d, setD] = useState({
    titulo: campanha?.titulo ?? '',
    historia: campanha?.historia ?? '',
    meta: campanha ? String(campanha.meta) : '',
    terminaEm: campanha?.terminaEm ?? '',
  });
  const set = (k: keyof typeof d) => (e: { target: { value: string } }) => setD((x) => ({ ...x, [k]: e.target.value }));
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    salvar.mutate(
      { entidadeId: orgId!, id: campanha?.id, titulo: d.titulo, historia: d.historia, meta: Number(d.meta.replace(/\./g, '').replace(',', '.')), terminaEm: d.terminaEm },
      {
        onSuccess: (c) => {
          toast.show(campanha ? `${c.titulo} atualizada.` : `${c.titulo} está no ar. Compartilhe a página!`);
          navigate(campanha ? `/entidade/campanhas/${c.id}` : '/entidade/campanhas');
        },
      },
    );
  };
  return (
    <div className="max-w-2xl">
      <VoltarLink to={campanha ? `/entidade/campanhas/${campanha.id}` : '/entidade/campanhas'}>{campanha ? campanha.titulo : 'Campanhas'}</VoltarLink>
      <PageHeader title={campanha ? 'Editar campanha' : 'Nova campanha'} eyebrow={orgName} />
      <form onSubmit={enviar} noValidate className={`${cardClass} grid gap-4 sm:grid-cols-2`}>
        <Campo id="titulo" label="Nome da campanha" className="sm:col-span-2">
          <input value={d.titulo} onChange={set('titulo')} className={inputClass} />
        </Campo>
        <Campo id="historia" label="História" dica="Por que a campanha existe e o que muda com cada doação." className="sm:col-span-2">
          <textarea value={d.historia} onChange={set('historia')} rows={5} className={`${inputClass} py-2`} />
        </Campo>
        <Campo id="meta" label="Meta (R$)" dica={campanha ? `Já arrecadado: ${formatMoeda(campanha.arrecadado)}` : undefined}>
          <input inputMode="decimal" value={d.meta} onChange={set('meta')} placeholder="15000" className={inputClass} />
        </Campo>
        <Campo id="prazo" label="No ar até">
          <input type="date" value={d.terminaEm} min={isoDay(new Date())} onChange={set('terminaEm')} className={inputClass} />
        </Campo>
        <div className="flex flex-col gap-3 sm:col-span-2">
          <InlineError>{salvar.isError ? mensagemDeErro(salvar.error) : null}</InlineError>
          <Button type="submit" disabled={salvar.isPending} className="self-start">
            {salvar.isPending ? 'Salvando…' : campanha ? 'Salvar alterações' : 'Publicar campanha'}
          </Button>
        </div>
      </form>
    </div>
  );
}
