import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Plus } from 'lucide-react';
import { Button, cx, formatBRL, formatHours, formatNumber } from '@gera/design-system';
import { Chips } from '../../components/shared/Chips';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { EmptyState } from '../../components/shared/EmptyState';
import { PageHeader } from '../../components/shared/PageHeader';
import { ErrorState, InlineError, SkeletonList } from '../../components/shared/States';
import { useToast } from '../../components/shared/Toast';
import { VoltarLink } from '../../components/shared/VoltarLink';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { cardClass } from '../../components/ui/card';
import { Campo } from '../../components/ui/Campo';
import { inputClass } from '../../components/ui/form';
import { useAuth } from '../../lib/auth';
import { formatDate } from '../../lib/format';
import { aprovarEntidade, cadastrarEntidade, type EntidadeAdmin } from '../../services/admin';
import { mensagemDeErro, useEntidadesAdmin, useGeraMutation } from '../../services/hooks';
import { AREAS, type Area } from '../../types/domain';

const EYEBROW = 'Administrador ACIJS';

const SELO: Record<EntidadeAdmin['status'], { texto: string; classe: string }> = {
  ativa: { texto: 'Ativa', classe: 'bg-primary-soft text-on-primary-soft' },
  pendente: { texto: 'Aguardando aprovação', classe: 'bg-highlight-soft text-on-highlight-soft' },
  inativa: { texto: 'Inativa', classe: 'bg-bg-subtle text-ink-muted' },
};

export function EntidadesAdminPage() {
  const lista = useEntidadesAdmin();
  const [filtro, setFiltro] = useState<'todas' | EntidadeAdmin['status']>('todas');
  const visiveis = lista.data?.filter((e) => filtro === 'todas' || e.status === filtro) ?? [];
  const contar = (s: EntidadeAdmin['status']) => lista.data?.filter((e) => e.status === s).length ?? 0;

  return (
    <>
      <PageHeader
        title="Entidades"
        eyebrow={EYEBROW}
        description="Todas as entidades do comitê, com voluntários ativos, horas e arrecadação do mês."
        actions={
          <ButtonLink to="nova">
            <Plus size={18} aria-hidden /> Cadastrar entidade
          </ButtonLink>
        }
      />
      {lista.isPending ? (
        <SkeletonList rows={5} />
      ) : lista.isError ? (
        <ErrorState error={lista.error} onRetry={() => lista.refetch()} />
      ) : (
        <div className="flex flex-col gap-4">
          <Chips
            label="Status"
            valor={filtro}
            onChange={setFiltro}
            opcoes={[
              { id: 'todas', label: `Todas · ${lista.data.length}` },
              { id: 'ativa', label: `Ativas · ${contar('ativa')}` },
              { id: 'pendente', label: `Aguardando · ${contar('pendente')}` },
            ]}
          />
          {visiveis.length === 0 ? (
            <EmptyState title="Nenhuma entidade com esse status" />
          ) : (
            <ul className="grid gap-4 lg:grid-cols-2">
              {visiveis.map((e) => (
                <ItemEntidade key={e.id} e={e} />
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}

function ItemEntidade({ e }: { e: EntidadeAdmin }) {
  const { verComoEntidade } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [aprovando, setAprovando] = useState(false);
  const aprovar = useGeraMutation(() => aprovarEntidade(e.id));
  return (
    <li className={`${cardClass} flex flex-col gap-3`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="break-words text-lg font-bold text-ink">{e.nome}</h2>
          <p className="text-sm text-ink-muted">{e.causa}</p>
        </div>
        <span className={cx('shrink-0 rounded-sm px-2 py-1 text-xs font-bold', SELO[e.status].classe)}>{SELO[e.status].texto}</span>
      </div>
      <dl className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <dt className="text-ink-muted">Voluntários ativos</dt>
          <dd className="font-bold tabular-nums text-ink">{formatNumber(e.voluntariosAtivos)}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Horas no mês</dt>
          <dd className="font-bold tabular-nums text-ink">{formatHours(e.horasNoMes)}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Arrecadado no mês</dt>
          <dd className="font-bold tabular-nums text-ink">{formatBRL(e.arrecadadoNoMes)}</dd>
        </div>
      </dl>
      <p className="text-xs text-ink-muted">
        {e.responsavel} · {e.email} · {e.telefone} · CNPJ {e.cnpj}
        {e.aprovadaEm && ` · aprovada em ${formatDate(e.aprovadaEm)}`}
      </p>
      <div className="mt-auto flex flex-wrap gap-2">
        {e.status === 'pendente' ? (
          <Button onClick={() => setAprovando(true)}>Aprovar entidade</Button>
        ) : (
          <Button
            variant="secondary"
            onClick={() => {
              verComoEntidade({ id: e.id, nome: e.nome });
              navigate('/entidade');
            }}
            aria-label={`Ver como ${e.nome}`}
          >
            <Eye size={16} aria-hidden /> Ver como entidade
          </Button>
        )}
      </div>
      <ConfirmDialog
        open={aprovando}
        title={`Aprovar ${e.nome}?`}
        confirmLabel="Aprovar"
        busy={aprovar.isPending}
        error={aprovar.isError ? mensagemDeErro(aprovar.error) : null}
        onClose={() => setAprovando(false)}
        onConfirm={() =>
          aprovar.mutate(undefined, {
            onSuccess: () => {
              setAprovando(false);
              toast.show(`${e.nome} aprovada. Ela já aparece no site e pode receber voluntários.`);
            },
          })
        }
      >
        <p>A entidade passa a aparecer no site, recebe voluntários e acessa o portal. A aprovação fica no histórico de auditoria.</p>
      </ConfirmDialog>
    </li>
  );
}

export function NovaEntidadePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const cadastrar = useGeraMutation(cadastrarEntidade);
  const [d, setD] = useState({ nome: '', causa: '', bairro: '', cnpj: '', email: '', telefone: '', responsavel: '' });
  const [areas, setAreas] = useState<Area[]>([]);
  const set = (k: keyof typeof d) => (e: { target: { value: string } }) => setD((x) => ({ ...x, [k]: e.target.value }));
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    cadastrar.mutate(
      { ...d, areas },
      {
        onSuccess: (ent) => {
          toast.show(`${ent.nome} cadastrada. O convite de acesso foi para ${ent.email}.`);
          navigate('/admin/entidades');
        },
      },
    );
  };
  return (
    <div className="max-w-2xl">
      <VoltarLink to="/admin/entidades">Entidades</VoltarLink>
      <PageHeader title="Cadastrar entidade" eyebrow={EYEBROW} description="Cadastrada pelo comitê, a entidade já entra aprovada." />
      <form onSubmit={enviar} noValidate className={`${cardClass} grid gap-4 sm:grid-cols-2`}>
        <Campo id="nome" label="Nome da entidade" className="sm:col-span-2">
          <input value={d.nome} onChange={set('nome')} className={inputClass} />
        </Campo>
        <Campo id="causa" label="Causa" dica="Uma frase, ex.: Apoio a pessoas com autismo e às suas famílias." className="sm:col-span-2">
          <input value={d.causa} onChange={set('causa')} className={inputClass} />
        </Campo>
        <fieldset className="flex flex-col gap-2 sm:col-span-2">
          <legend className="mb-1 text-sm font-semibold text-ink">Áreas de atuação</legend>
          <div className="flex flex-wrap gap-2">
            {AREAS.map((a) => (
              <label key={a} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-pill border border-border-strong px-3 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={areas.includes(a)}
                  onChange={(e) => setAreas((l) => (e.target.checked ? [...l, a] : l.filter((x) => x !== a)))}
                  className="h-4 w-4 accent-primary"
                />
                {a}
              </label>
            ))}
          </div>
        </fieldset>
        <Campo id="cnpj" label="CNPJ">
          <input value={d.cnpj} onChange={set('cnpj')} inputMode="numeric" placeholder="00.000.000/0001-00" className={inputClass} />
        </Campo>
        <Campo id="bairro" label="Bairro">
          <input value={d.bairro} onChange={set('bairro')} className={inputClass} />
        </Campo>
        <Campo id="responsavel" label="Responsável">
          <input value={d.responsavel} onChange={set('responsavel')} className={inputClass} />
        </Campo>
        <Campo id="telefone" label="Telefone">
          <input value={d.telefone} onChange={set('telefone')} inputMode="tel" className={inputClass} />
        </Campo>
        <Campo id="email" label="E-mail" dica="Recebe o convite de acesso ao portal." className="sm:col-span-2">
          <input type="email" value={d.email} onChange={set('email')} className={inputClass} />
        </Campo>
        <div className="flex flex-col gap-3 sm:col-span-2">
          <InlineError>{cadastrar.isError ? mensagemDeErro(cadastrar.error) : null}</InlineError>
          <Button type="submit" disabled={cadastrar.isPending} className="self-start">
            {cadastrar.isPending ? 'Cadastrando…' : 'Cadastrar entidade'}
          </Button>
        </div>
      </form>
    </div>
  );
}
