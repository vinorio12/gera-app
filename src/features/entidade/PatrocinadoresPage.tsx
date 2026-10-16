import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CalendarRange, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button, KpiCard, cx, formatBRL, formatNumber } from '@gera/design-system';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
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
import { excluirPatrocinador, marcarContrapartida, salvarPatrocinador } from '../../services/gestao';
import { mensagemDeErro, useGeraMutation, usePatrocinador, usePatrocinadores } from '../../services/hooks';
import { COTAS, type Cota, type Patrocinador } from '../../types/domain';

/** Estilo do selo de cada cota: nunca amarelo (o amarelo é do dinheiro), só verdes e neutros. */
const SELO: Record<Cota, string> = {
  Ouro: 'bg-brand-deep text-on-brand-deep',
  Prata: 'bg-primary-soft text-on-primary-soft',
  Bronze: 'bg-secondary-soft text-on-secondary-soft',
  Apoio: 'bg-bg-subtle text-ink-muted',
};

export function PatrocinadoresPage() {
  const { orgId, orgName } = useSession();
  const lista = usePatrocinadores(orgId!);
  const hoje = isoDay(new Date());
  const vigentes = lista.data?.filter((p) => p.inicio <= hoje && p.fim >= hoje) ?? [];
  const pendentes = lista.data?.reduce((s, p) => s + p.contrapartidas.filter((c) => !c.entregue).length, 0) ?? 0;

  return (
    <>
      <PageHeader
        title="Patrocinadores"
        eyebrow={orgName}
        description="Empresas que apoiam a entidade, com cota, vigência e as contrapartidas combinadas. O valor entra no financeiro como Patrocínios."
        actions={
          <ButtonLink to="novo">
            <Plus size={18} aria-hidden /> Novo patrocinador
          </ButtonLink>
        }
      />
      {lista.isPending ? (
        <SkeletonList rows={3} />
      ) : lista.isError ? (
        <ErrorState error={lista.error} onRetry={() => lista.refetch()} />
      ) : lista.data.length === 0 ? (
        <EmptyState title="Nenhum patrocinador ainda" description="Cadastre a primeira empresa apoiadora e acompanhe as contrapartidas." action={<ButtonLink to="novo">Novo patrocinador</ButtonLink>} />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard className="min-w-0" label="Em patrocínios vigentes" value={formatBRL(vigentes.reduce((s, p) => s + p.valor, 0))} source="cotas cadastradas pela entidade" />
            <KpiCard className="min-w-0" label="Patrocinadores vigentes" value={formatNumber(vigentes.length)} source="cotas com vigência hoje" />
            <KpiCard className="min-w-0" label="Contrapartidas pendentes" value={formatNumber(pendentes)} source="checklist de cada patrocinador" />
          </div>
          <ul className="grid gap-4 lg:grid-cols-2">
            {lista.data.map((p) => (
              <ItemPatrocinador key={p.id} p={p} vigente={p.inicio <= hoje && p.fim >= hoje} />
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function ItemPatrocinador({ p, vigente }: { p: Patrocinador; vigente: boolean }) {
  const { orgId } = useSession();
  const toast = useToast();
  const marcar = useGeraMutation(marcarContrapartida);
  const excluir = useGeraMutation(() => excluirPatrocinador(p.id, orgId!));
  const [excluindo, setExcluindo] = useState(false);
  const [otimista, setOtimista] = useState<Record<string, boolean>>({});
  const entregues = p.contrapartidas.filter((c) => otimista[c.id] ?? c.entregue).length;
  return (
    <li className={`${cardClass} flex flex-col gap-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="break-words text-lg font-bold text-ink">{p.nome}</h2>
          <p className="flex items-center gap-1 text-sm text-ink-muted">
            <CalendarRange size={16} aria-hidden /> {formatDate(p.inicio)} a {formatDate(p.fim)}
            {!vigente && ' · fora da vigência'}
          </p>
          {p.contato && <p className="text-sm text-ink-muted">{p.contato}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={cx('rounded-sm px-2 py-1 text-xs font-bold uppercase tracking-wide', SELO[p.cota])}>Cota {p.cota}</span>
          <span className="font-bold tabular-nums text-ink">{formatMoeda(p.valor)}</span>
        </div>
      </div>
      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 text-sm font-semibold text-ink">
          Contrapartidas · {entregues} de {p.contrapartidas.length} entregues
        </legend>
        {p.contrapartidas.length === 0 && <p className="text-sm text-ink-muted">Nenhuma contrapartida combinada.</p>}
        {p.contrapartidas.map((c) => {
          // Marcação otimista: a caixa responde na hora e volta se o serviço recusar.
          const entregue = otimista[c.id] ?? c.entregue;
          return (
            <label key={c.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-1 text-sm text-ink hover:bg-bg-subtle">
              <input
                type="checkbox"
                checked={entregue}
                onChange={(e) => {
                  const valor = e.target.checked;
                  setOtimista((o) => ({ ...o, [c.id]: valor }));
                  marcar.mutate(
                    { entidadeId: orgId!, patrocinadorId: p.id, contrapartidaId: c.id, entregue: valor },
                    { onError: () => setOtimista((o) => ({ ...o, [c.id]: !valor })) },
                  );
                }}
                className="h-5 w-5 shrink-0 accent-primary"
              />
              <span className={entregue ? 'text-ink-muted line-through' : ''}>{c.texto}</span>
              <span className="ml-auto shrink-0 text-xs font-semibold text-ink-muted">{entregue ? 'Entregue' : 'Pendente'}</span>
            </label>
          );
        })}
      </fieldset>
      <div className="mt-auto flex flex-wrap gap-2">
        <ButtonLink to={`${p.id}/editar`} variant="secondary" aria-label={`Editar ${p.nome}`}>
          <Pencil size={16} aria-hidden /> Editar
        </ButtonLink>
        <Button variant="ghost" onClick={() => setExcluindo(true)} aria-label={`Excluir ${p.nome}`}>
          <Trash2 size={16} aria-hidden /> Excluir
        </Button>
      </div>
      <ConfirmDialog
        open={excluindo}
        title="Excluir patrocinador?"
        confirmLabel="Excluir"
        variant="danger"
        busy={excluir.isPending}
        error={excluir.isError ? mensagemDeErro(excluir.error) : null}
        onClose={() => setExcluindo(false)}
        onConfirm={() => excluir.mutate(undefined, { onSuccess: () => (setExcluindo(false), toast.show(`${p.nome} foi excluído, junto com a entrada no financeiro.`)) })}
      >
        <p>{p.nome} e o valor de {formatMoeda(p.valor)} saem do financeiro. Não dá para desfazer.</p>
      </ConfirmDialog>
    </li>
  );
}

const VALOR_SUGERIDO: Record<Cota, number> = { Ouro: 12000, Prata: 6000, Bronze: 3000, Apoio: 1000 };
const CONTRAPARTIDAS_SUGERIDAS: Record<Cota, string[]> = {
  Ouro: ['Logo no banner principal dos eventos', 'Menção nas redes sociais (4 posts)', 'Mesa VIP no evento anual', 'Relatório de impacto no fim da cota'],
  Prata: ['Logo no banner dos eventos', 'Menção nas redes sociais (2 posts)', 'Relatório de impacto no fim da cota'],
  Bronze: ['Logo no site da entidade', 'Menção nas redes sociais (1 post)'],
  Apoio: ['Agradecimento no site da entidade'],
};

export function PatrocinadorFormPage() {
  const { id } = useParams();
  const { orgId } = useSession();
  const existente = usePatrocinador(id, orgId!);
  if (id && existente.isPending) return <Skeleton className="h-96 border border-border" />;
  if (id && existente.isError) return <ErrorState error={existente.error} />;
  return <PatrocinadorForm key={existente.data?.id ?? 'novo'} p={existente.data} />;
}

function PatrocinadorForm({ p }: { p?: Patrocinador }) {
  const { orgId, orgName } = useSession();
  const navigate = useNavigate();
  const toast = useToast();
  const salvar = useGeraMutation(salvarPatrocinador);
  const hoje = isoDay(new Date());
  const umAno = isoDay(new Date(new Date().setFullYear(new Date().getFullYear() + 1)));
  const [d, setD] = useState({
    nome: p?.nome ?? '',
    cota: (p?.cota ?? 'Prata') as Cota,
    valor: p ? String(p.valor) : String(VALOR_SUGERIDO.Prata),
    inicio: p?.inicio ?? hoje,
    fim: p?.fim ?? umAno,
    contato: p?.contato ?? '',
    contrapartidas: p ? p.contrapartidas.map((c) => c.texto).join('\n') : CONTRAPARTIDAS_SUGERIDAS.Prata.join('\n'),
  });
  const set = (k: keyof typeof d) => (e: { target: { value: string } }) => setD((x) => ({ ...x, [k]: e.target.value }));
  const trocarCota = (cota: Cota) =>
    setD((x) => ({
      ...x,
      cota,
      // Só sugere valor e contrapartidas enquanto a pessoa não mexeu neles.
      valor: x.valor === String(VALOR_SUGERIDO[x.cota]) ? String(VALOR_SUGERIDO[cota]) : x.valor,
      contrapartidas: x.contrapartidas === CONTRAPARTIDAS_SUGERIDAS[x.cota].join('\n') ? CONTRAPARTIDAS_SUGERIDAS[cota].join('\n') : x.contrapartidas,
    }));

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    salvar.mutate(
      {
        entidadeId: orgId!,
        id: p?.id,
        ...d,
        valor: Number(d.valor.replace(/\./g, '').replace(',', '.')),
        contrapartidas: d.contrapartidas.split('\n'),
      },
      {
        onSuccess: (r) => {
          toast.show(p ? `${r.nome} atualizado.` : `${r.nome} cadastrado. ${formatMoeda(r.valor)} entrou no financeiro como Patrocínios.`);
          navigate('/entidade/patrocinadores');
        },
      },
    );
  };

  return (
    <div className="max-w-2xl">
      <VoltarLink to="/entidade/patrocinadores">Patrocinadores</VoltarLink>
      <PageHeader title={p ? 'Editar patrocinador' : 'Novo patrocinador'} eyebrow={orgName} />
      <form onSubmit={enviar} noValidate className={`${cardClass} grid gap-4 sm:grid-cols-2`}>
        <Campo id="nome" label="Empresa" className="sm:col-span-2">
          <input value={d.nome} onChange={set('nome')} className={inputClass} />
        </Campo>
        <Campo id="cota" label="Cota">
          <select value={d.cota} onChange={(e) => trocarCota(e.target.value as Cota)} className={inputClass}>
            {COTAS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Campo>
        <Campo id="valor" label="Valor (R$)">
          <input inputMode="decimal" value={d.valor} onChange={set('valor')} className={inputClass} />
        </Campo>
        <Campo id="inicio" label="Início da vigência">
          <input type="date" value={d.inicio} onChange={set('inicio')} className={inputClass} />
        </Campo>
        <Campo id="fim" label="Fim da vigência">
          <input type="date" value={d.fim} min={d.inicio} onChange={set('fim')} className={inputClass} />
        </Campo>
        <Campo id="contato" label="Contato" dica="Quem cuida do patrocínio na empresa." className="sm:col-span-2">
          <input value={d.contato} onChange={set('contato')} className={inputClass} />
        </Campo>
        <Campo id="contrapartidas" label="Contrapartidas" dica="Uma por linha. Cada uma vira um item do checklist." className="sm:col-span-2">
          <textarea value={d.contrapartidas} onChange={set('contrapartidas')} rows={5} className={`${inputClass} py-2`} />
        </Campo>
        <div className="flex flex-col gap-3 sm:col-span-2">
          <InlineError>{salvar.isError ? mensagemDeErro(salvar.error) : null}</InlineError>
          <Button type="submit" disabled={salvar.isPending} className="self-start">
            {salvar.isPending ? 'Salvando…' : p ? 'Salvar alterações' : 'Cadastrar patrocinador'}
          </Button>
        </div>
      </form>
    </div>
  );
}
