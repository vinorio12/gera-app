import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CircleAlert, Clock, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button, KpiCard, PortalVerbo, cx, formatBRL, formatNumber } from '@gera/design-system';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { CopyField } from '../../components/shared/CopyField';
import { EmptyState } from '../../components/shared/EmptyState';
import { Avatar, UploadImagem } from '../../components/shared/Imagens';
import { PageHeader } from '../../components/shared/PageHeader';
import { ErrorState, InlineError, Skeleton, SkeletonList } from '../../components/shared/States';
import { useToast } from '../../components/shared/Toast';
import { VoltarLink } from '../../components/shared/VoltarLink';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { cardClass } from '../../components/ui/card';
import { Campo } from '../../components/ui/Campo';
import { inputClass } from '../../components/ui/form';
import { useSession } from '../../lib/auth';
import { formatMoeda } from '../../lib/format';
import { excluirBeneficio, salvarBeneficio, salvarEmpresa, salvarImagemEmpresa } from '../../services/beneficios';
import { mensagemDeErro, useBeneficiosDoParceiro, useEmpresa, useGeraMutation, usePainelEsg } from '../../services/hooks';
import { CATEGORIAS_BENEFICIO, type Beneficio, type CategoriaBeneficio, type Parceiro, type StatusAprovacao } from '../../types/domain';

export const SELO_APROVACAO: Record<StatusAprovacao, { texto: string; classe: string }> = {
  aprovado: { texto: 'No ar', classe: 'bg-primary-soft text-on-primary-soft' },
  pendente: { texto: 'Aguardando aprovação do comitê', classe: 'bg-info-soft text-on-info-soft' },
  recusado: { texto: 'Recusado pelo comitê', classe: 'bg-accent-soft text-on-accent-soft' },
};

// ---------- Painel ESG ----------

export function PainelEsgPage() {
  const { orgId, orgName } = useSession();
  const painel = usePainelEsg(orgId!);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        {painel.data?.logoUrl && <Avatar src={painel.data.logoUrl} nome={orgName ?? 'Empresa parceira'} tamanho={48} />}
        <PortalVerbo portal="parceiro" subtitle={orgName} />
      </div>
      <PageHeader title="Painel" description="O impacto dos seus benefícios, pronto para o relatório ESG da empresa." />
      {painel.isPending ? (
        <SkeletonList rows={3} />
      ) : painel.isError ? (
        <ErrorState error={painel.error} onRetry={() => painel.refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <KpiCard className="min-w-0 p-4" label="Resgates" value={formatNumber(painel.data.resgates)} source={`${formatNumber(painel.data.resgatesNoMes)} neste mês`} />
            <KpiCard className="min-w-0 p-4" label="Voluntários" value={formatNumber(painel.data.voluntariosImpactados)} source="pessoas que usaram" />
            <KpiCard className="col-span-2 min-w-0 p-4" label="Economia estimada" value={formatBRL(painel.data.economiaTotal)} source="usos × economia por uso informada" />
          </div>
          <section aria-labelledby="por-beneficio" className={cardClass}>
            <h2 id="por-beneficio" className="mb-2 text-lg font-bold text-ink">Por benefício</h2>
            {painel.data.porBeneficio.length === 0 ? (
              <p className="text-sm text-ink-muted">Nenhum benefício no ar ainda.</p>
            ) : (
              <ul className="divide-y divide-border">
                {painel.data.porBeneficio.map((b) => (
                  <li key={b.beneficio} className="flex items-start justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{b.beneficio}</p>
                      <p className="text-sm text-ink-muted">
                        {formatNumber(b.resgates)} {b.resgates === 1 ? 'uso' : 'usos'} × {formatMoeda(b.economiaPorUso)}
                      </p>
                    </div>
                    <span className="shrink-0 font-bold tabular-nums text-ink">{formatMoeda(b.economia)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section aria-labelledby="esg" className={cardClass}>
            <h2 id="esg" className="mb-1 text-lg font-bold text-ink">Texto para o relatório ESG</h2>
            <p className="mb-3 text-sm text-ink-muted">Copie e cole no relatório de sustentabilidade da empresa.</p>
            <CopyField label="Texto pronto" value={painel.data.textoEsg} />
          </section>
        </>
      )}
    </div>
  );
}

// ---------- Benefícios ----------

export function BeneficiosParceiroPage() {
  const { orgId, orgName } = useSession();
  const lista = useBeneficiosDoParceiro(orgId!);
  return (
    <>
      <PageHeader
        title="Benefícios"
        eyebrow={orgName}
        description="Suas ofertas para os voluntários. Toda oferta nova ou editada passa pelo comitê antes de ir ao ar."
      />
      <ButtonLink to="novo" className="mb-4 w-full justify-center sm:w-auto">
        <Plus size={18} aria-hidden /> Nova oferta
      </ButtonLink>
      {lista.isPending ? (
        <SkeletonList rows={3} />
      ) : lista.isError ? (
        <ErrorState error={lista.error} onRetry={() => lista.refetch()} />
      ) : lista.data.length === 0 ? (
        <EmptyState title="Nenhuma oferta ainda" description="Crie a primeira: um desconto, um brinde ou uma vantagem para quem é voluntário." />
      ) : (
        <ul className="flex flex-col gap-3">
          {lista.data.map((b) => (
            <ItemBeneficio key={b.id} b={b} />
          ))}
        </ul>
      )}
    </>
  );
}

function ItemBeneficio({ b }: { b: Beneficio }) {
  const { orgId } = useSession();
  const toast = useToast();
  const [excluindo, setExcluindo] = useState(false);
  const excluir = useGeraMutation(() => excluirBeneficio(orgId!, b.id));
  return (
    <li className={`${cardClass} flex flex-col gap-2 p-4`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="min-w-0 break-words font-bold text-ink">{b.titulo}</h2>
        <span className={cx('shrink-0 rounded-sm px-2 py-1 text-xs font-bold', SELO_APROVACAO[b.status].classe)}>{SELO_APROVACAO[b.status].texto}</span>
      </div>
      <p className="text-sm text-ink-muted">{b.regra}</p>
      <p className="text-sm text-ink-muted">Economia estimada por uso: {formatMoeda(b.economiaEstimada)}</p>
      {b.status === 'recusado' && b.motivoRecusa && (
        <p className="flex items-start gap-2 rounded-md bg-accent-soft px-3 py-2 text-sm text-on-accent-soft">
          <CircleAlert size={18} aria-hidden className="mt-0.5 shrink-0" />
          <span>
            <strong>Motivo da recusa:</strong> {b.motivoRecusa} Ajuste a oferta e envie de novo.
          </span>
        </p>
      )}
      {b.status === 'pendente' && (
        <p className="flex items-center gap-2 text-sm text-ink-muted">
          <Clock size={16} aria-hidden /> O comitê costuma responder em até 2 dias úteis.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <ButtonLink to={`${b.id}/editar`} variant="secondary" aria-label={`${b.status === 'recusado' ? 'Ajustar e reenviar' : 'Editar'}: ${b.titulo}`}>
          <Pencil size={16} aria-hidden /> {b.status === 'recusado' ? 'Ajustar e reenviar' : 'Editar'}
        </ButtonLink>
        <Button variant="ghost" onClick={() => setExcluindo(true)} aria-label={`Excluir ${b.titulo}`}>
          <Trash2 size={16} aria-hidden /> Excluir
        </Button>
      </div>
      <ConfirmDialog
        open={excluindo}
        title="Excluir oferta?"
        confirmLabel="Excluir"
        variant="danger"
        busy={excluir.isPending}
        error={excluir.isError ? mensagemDeErro(excluir.error) : null}
        onClose={() => {
          setExcluindo(false);
          excluir.reset();
        }}
        onConfirm={() => excluir.mutate(undefined, { onSuccess: () => (setExcluindo(false), toast.show('Oferta excluída.')) })}
      >
        <p>{b.titulo} sai da lista de benefícios dos voluntários.</p>
      </ConfirmDialog>
    </li>
  );
}

export function BeneficioFormPage() {
  const { id } = useParams();
  const { orgId } = useSession();
  const lista = useBeneficiosDoParceiro(orgId!);
  if (id && lista.isPending) return <Skeleton className="h-80 border border-border" />;
  if (lista.isError) return <ErrorState error={lista.error} />;
  const b = id ? lista.data?.find((x) => x.id === id) : undefined;
  if (id && !b) return <ErrorState error={new Error('Oferta não encontrada.')} />;
  return <BeneficioForm key={b?.id ?? 'novo'} b={b} />;
}

function BeneficioForm({ b }: { b?: Beneficio }) {
  const { orgId, orgName } = useSession();
  const navigate = useNavigate();
  const toast = useToast();
  const salvar = useGeraMutation(salvarBeneficio);
  const [d, setD] = useState({ titulo: b?.titulo ?? '', regra: b?.regra ?? '', economia: b ? String(b.economiaEstimada).replace('.', ',') : '' });
  const set = (k: keyof typeof d) => (e: { target: { value: string } }) => setD((x) => ({ ...x, [k]: e.target.value }));
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    salvar.mutate(
      { parceiroId: orgId!, id: b?.id, titulo: d.titulo, regra: d.regra, economiaEstimada: Number(d.economia.replace(/\./g, '').replace(',', '.') || 'NaN') },
      {
        onSuccess: () => {
          toast.show('Oferta enviada. Ela fica aguardando a aprovação do comitê.');
          navigate('/parceiro/beneficios');
        },
      },
    );
  };
  return (
    <>
      <VoltarLink to="/parceiro/beneficios">Benefícios</VoltarLink>
      <PageHeader title={b ? 'Editar oferta' : 'Nova oferta'} eyebrow={orgName} />
      {b?.status === 'aprovado' && (
        <p className="mb-4 rounded-md bg-info-soft px-3 py-2 text-sm text-on-info-soft">
          Ao salvar, a oferta sai do ar até o comitê aprovar a nova versão.
        </p>
      )}
      <form onSubmit={enviar} noValidate className={`${cardClass} flex flex-col gap-4 p-4`}>
        <Campo id="titulo" label="Oferta" dica="Ex.: 10% em qualquer pedido.">
          <input value={d.titulo} onChange={set('titulo')} className={inputClass} />
        </Campo>
        <Campo id="regra" label="Regra de uso" dica="Quando vale, quantas vezes, o que não entra.">
          <textarea value={d.regra} onChange={set('regra')} rows={3} className={`${inputClass} py-2`} />
        </Campo>
        <Campo id="economia" label="Economia estimada por uso (R$)" dica="Uma média, para o painel ESG. Ex.: 3,50.">
          <input inputMode="decimal" value={d.economia} onChange={set('economia')} className={inputClass} />
        </Campo>
        <InlineError>{salvar.isError ? mensagemDeErro(salvar.error) : null}</InlineError>
        <Button type="submit" disabled={salvar.isPending} className="justify-center">
          {salvar.isPending ? 'Enviando…' : 'Enviar para aprovação'}
        </Button>
      </form>
    </>
  );
}

// ---------- Empresa ----------

export function EmpresaPage() {
  const { orgId, orgName } = useSession();
  const empresa = useEmpresa(orgId!);
  return (
    <>
      <PageHeader title="Empresa" eyebrow={orgName} description="Dados que aparecem para os voluntários e para o comitê." />
      {empresa.isPending ? (
        <Skeleton className="h-96 border border-border" />
      ) : empresa.isError ? (
        <ErrorState error={empresa.error} onRetry={() => empresa.refetch()} />
      ) : (
        <div className="flex flex-col gap-4">
          <ImagensEmpresa p={empresa.data} />
          <EmpresaForm p={empresa.data} />
        </div>
      )}
    </>
  );
}

function ImagensEmpresa({ p }: { p: Parceiro }) {
  const salvarLogo = useGeraMutation((d: string | null) => salvarImagemEmpresa(p.id, 'logo', d));
  const salvarBanner = useGeraMutation((d: string | null) => salvarImagemEmpresa(p.id, 'banner', d));
  return (
    <section aria-labelledby="imagens-empresa" className={`${cardClass} flex flex-col gap-5 p-4`}>
      <h2 id="imagens-empresa" className="text-lg font-bold text-ink">Logo e banner</h2>
      <UploadImagem
        tipo="foto"
        titulo="Foto de perfil da empresa"
        alt={`Logo: ${p.nome}`}
        valor={p.logoUrl}
        dica="Aparece nos benefícios dos voluntários, na página de parceiros e no painel. JPG, PNG ou WebP, cortada em quadrado."
        onSalvar={(d) => salvarLogo.mutateAsync(d)}
      />
      <UploadImagem
        tipo="banner"
        titulo="Banner da empresa"
        alt={`Banner: ${p.nome}`}
        valor={p.bannerUrl}
        dica="Aparece no cartão da empresa na página de parceiros. JPG, PNG ou WebP, cortada em 16:5 (1600 × 500)."
        onSalvar={(d) => salvarBanner.mutateAsync(d)}
      />
    </section>
  );
}

function EmpresaForm({ p }: { p: Parceiro }) {
  const toast = useToast();
  const salvar = useGeraMutation((d: Parameters<typeof salvarEmpresa>[1]) => salvarEmpresa(p.id, d));
  const [d, setD] = useState({ nome: p.nome, cnpj: p.cnpj, endereco: p.endereco, telefone: p.telefone, email: p.email, contato: p.contato, categoria: p.categoria });
  const set = (k: keyof typeof d) => (e: { target: { value: string } }) => setD((x) => ({ ...x, [k]: e.target.value }));
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    salvar.mutate({ ...d, categoria: d.categoria as CategoriaBeneficio }, { onSuccess: () => toast.show('Dados da empresa salvos.') });
  };
  return (
    <form onSubmit={enviar} noValidate className={`${cardClass} flex flex-col gap-4 p-4`}>
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-lg font-bold text-ink">Dados</legend>
        <Campo id="nome" label="Nome">
          <input value={d.nome} onChange={set('nome')} className={inputClass} />
        </Campo>
        <Campo id="cnpj" label="CNPJ">
          <input value={d.cnpj} onChange={set('cnpj')} inputMode="numeric" className={inputClass} />
        </Campo>
        <Campo id="categoria" label="Categoria">
          <select value={d.categoria} onChange={set('categoria')} className={inputClass}>
            {CATEGORIAS_BENEFICIO.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Campo>
      </fieldset>
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-lg font-bold text-ink">Endereço</legend>
        <Campo id="endereco" label="Endereço" dica="Rua, número e bairro. A distância até o voluntário sai daqui.">
          <input value={d.endereco} onChange={set('endereco')} className={inputClass} />
        </Campo>
      </fieldset>
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-lg font-bold text-ink">Contato</legend>
        <Campo id="contato" label="Pessoa de contato">
          <input value={d.contato} onChange={set('contato')} className={inputClass} />
        </Campo>
        <Campo id="telefone" label="Telefone">
          <input value={d.telefone} onChange={set('telefone')} inputMode="tel" className={inputClass} />
        </Campo>
        <Campo id="email" label="E-mail">
          <input type="email" value={d.email} onChange={set('email')} className={inputClass} />
        </Campo>
      </fieldset>
      <InlineError>{salvar.isError ? mensagemDeErro(salvar.error) : null}</InlineError>
      <Button type="submit" disabled={salvar.isPending} className="justify-center">
        {salvar.isPending ? 'Salvando…' : 'Salvar dados'}
      </Button>
    </form>
  );
}
