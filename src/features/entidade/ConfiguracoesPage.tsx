import { useState, type FormEvent } from 'react';
import { Check, Trash2, UserPlus } from 'lucide-react';
import { Button, cx } from '@gera/design-system';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { PageHeader } from '../../components/shared/PageHeader';
import { ErrorState, InlineError, Skeleton } from '../../components/shared/States';
import { useToast } from '../../components/shared/Toast';
import { cardClass } from '../../components/ui/card';
import { Campo } from '../../components/ui/Campo';
import { inputClass } from '../../components/ui/form';
import { useSession } from '../../lib/auth';
import { COR_DESTAQUE } from '../../lib/corDestaque';
import { formatDate } from '../../lib/format';
import { convidarMembro, definirCorDestaque, removerMembro, salvarDadosEntidade } from '../../services/configuracoes';
import { mensagemDeErro, useEntidadeConfig, useGeraMutation } from '../../services/hooks';
import { AREAS, CORES_DESTAQUE, type Area, type CorDestaque, type Entidade, type MembroEquipe } from '../../types/domain';


export function ConfiguracoesPage() {
  const { orgId, orgName } = useSession();
  const config = useEntidadeConfig(orgId!);
  return (
    <>
      <PageHeader title="Configurações" eyebrow={orgName} description="Dados da entidade, a cor de destaque no site e a equipe que acessa o portal." />
      {config.isPending ? (
        <Skeleton className="h-96 border border-border" />
      ) : config.isError ? (
        <ErrorState error={config.error} onRetry={() => config.refetch()} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <Dados entidade={config.data} />
          <div className="flex flex-col gap-6">
            <Marca entidade={config.data} />
            <Equipe entidade={config.data} />
          </div>
        </div>
      )}
    </>
  );
}

function Dados({ entidade: e }: { entidade: Entidade }) {
  const toast = useToast();
  const salvar = useGeraMutation((d: Parameters<typeof salvarDadosEntidade>[1]) => salvarDadosEntidade(e.id, d));
  const [d, setD] = useState({ nome: e.nome, causa: e.causa, bairro: e.bairro, cnpj: e.cnpj, email: e.email, telefone: e.telefone, responsavel: e.responsavel });
  const [areas, setAreas] = useState<Area[]>(e.areas);
  const set = (k: keyof typeof d) => (ev: { target: { value: string } }) => setD((x) => ({ ...x, [k]: ev.target.value }));
  const enviar = (ev: FormEvent) => {
    ev.preventDefault();
    salvar.mutate({ ...d, areas }, { onSuccess: () => toast.show('Dados da entidade salvos.') });
  };
  return (
    <section aria-labelledby="dados" className={cardClass}>
      <h2 id="dados" className="mb-4 text-lg font-bold text-ink">Dados</h2>
      <form onSubmit={enviar} noValidate className="grid gap-4 sm:grid-cols-2">
        <Campo id="nome" label="Nome" className="sm:col-span-2">
          <input value={d.nome} onChange={set('nome')} className={inputClass} />
        </Campo>
        <Campo id="causa" label="Causa" className="sm:col-span-2">
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
                  onChange={(ev) => setAreas((l) => (ev.target.checked ? [...l, a] : l.filter((x) => x !== a)))}
                  className="h-4 w-4 accent-primary"
                />
                {a}
              </label>
            ))}
          </div>
        </fieldset>
        <Campo id="cnpj" label="CNPJ">
          <input value={d.cnpj} onChange={set('cnpj')} className={inputClass} />
        </Campo>
        <Campo id="bairro" label="Bairro">
          <input value={d.bairro} onChange={set('bairro')} className={inputClass} />
        </Campo>
        <Campo id="responsavel" label="Responsável">
          <input value={d.responsavel} onChange={set('responsavel')} className={inputClass} />
        </Campo>
        <Campo id="telefone" label="Telefone">
          <input value={d.telefone} onChange={set('telefone')} className={inputClass} />
        </Campo>
        <Campo id="email" label="E-mail" className="sm:col-span-2">
          <input type="email" value={d.email} onChange={set('email')} className={inputClass} />
        </Campo>
        <div className="flex flex-col gap-3 sm:col-span-2">
          <InlineError>{salvar.isError ? mensagemDeErro(salvar.error) : null}</InlineError>
          <Button type="submit" disabled={salvar.isPending} className="self-start">
            {salvar.isPending ? 'Salvando…' : 'Salvar dados'}
          </Button>
        </div>
      </form>
    </section>
  );
}

function Marca({ entidade: e }: { entidade: Entidade }) {
  const toast = useToast();
  const definir = useGeraMutation((cor: CorDestaque) => definirCorDestaque(e.id, cor));
  const [cor, setCor] = useState<CorDestaque>(e.corDestaque);
  return (
    <section aria-labelledby="marca" className={cardClass}>
      <h2 id="marca" className="mb-1 text-lg font-bold text-ink">Marca</h2>
      <p className="mb-4 text-sm text-ink-muted">A cor de destaque aparece na página da entidade no site. Só as cores da GERA, para manter o contraste.</p>
      <fieldset>
        <legend className="sr-only">Cor de destaque</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {CORES_DESTAQUE.map((c) => (
            <label
              key={c}
              className={cx(
                'flex min-h-12 cursor-pointer items-center gap-3 rounded-md border px-3 has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus-ring',
                cor === c ? 'border-primary bg-primary-soft text-on-primary-soft' : 'border-border-strong text-ink',
              )}
            >
              <input
                type="radio"
                name="cor-destaque"
                value={c}
                checked={cor === c}
                onChange={() => {
                  setCor(c);
                  definir.mutate(c, { onSuccess: () => toast.show(`Cor de destaque: ${COR_DESTAQUE[c].nome}.`) });
                }}
                className="sr-only"
              />
              <span aria-hidden className={cx('h-6 w-6 shrink-0 rounded-sm border border-border', COR_DESTAQUE[c].amostra)} />
              <span className="flex-1 text-sm font-semibold">{COR_DESTAQUE[c].nome}</span>
              {cor === c && <Check size={18} aria-hidden />}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="mt-4 overflow-hidden rounded-md border border-border" aria-hidden>
        <div className="h-12 bg-brand-deep" />
        <div className={cx('h-2', COR_DESTAQUE[cor].amostra)} />
        <p className="px-3 py-2 text-sm font-bold text-ink">{e.nome}</p>
      </div>
      <InlineError>{definir.isError ? mensagemDeErro(definir.error) : null}</InlineError>
    </section>
  );
}

function Equipe({ entidade: e }: { entidade: Entidade }) {
  const toast = useToast();
  const convidar = useGeraMutation((d: { nome: string; email: string; papel: MembroEquipe['papel'] }) => convidarMembro(e.id, d));
  const remover = useGeraMutation((id: string) => removerMembro(e.id, id));
  const [novo, setNovo] = useState({ nome: '', email: '', papel: 'Equipe' as MembroEquipe['papel'] });
  const [removendo, setRemovendo] = useState<MembroEquipe | null>(null);
  const enviar = (ev: FormEvent) => {
    ev.preventDefault();
    convidar.mutate(novo, {
      onSuccess: () => {
        toast.show(`Convite enviado para ${novo.email}.`);
        setNovo({ nome: '', email: '', papel: 'Equipe' });
      },
    });
  };
  return (
    <section aria-labelledby="equipe" className={cardClass}>
      <h2 id="equipe" className="mb-3 text-lg font-bold text-ink">Equipe</h2>
      <ul className="mb-4 divide-y divide-border">
        {e.equipe.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3 py-2">
            <div className="min-w-0">
              <p className="font-semibold text-ink">
                {m.nome} <span className="text-sm font-normal text-ink-muted">· {m.papel}</span>
              </p>
              <p className="break-all text-sm text-ink-muted">
                {m.email} · {m.convitePendente ? 'convite enviado' : `desde ${formatDate(m.desde)}`}
              </p>
            </div>
            <Button variant="ghost" onClick={() => setRemovendo(m)} aria-label={`Remover ${m.nome}`}>
              <Trash2 size={16} aria-hidden /> Remover
            </Button>
          </li>
        ))}
      </ul>
      <form onSubmit={enviar} noValidate className="grid gap-3 sm:grid-cols-2">
        <Campo id="membro-nome" label="Nome">
          <input value={novo.nome} onChange={(ev) => setNovo((x) => ({ ...x, nome: ev.target.value }))} className={inputClass} />
        </Campo>
        <Campo id="membro-email" label="E-mail">
          <input type="email" value={novo.email} onChange={(ev) => setNovo((x) => ({ ...x, email: ev.target.value }))} className={inputClass} />
        </Campo>
        <Campo id="membro-papel" label="Papel">
          <select value={novo.papel} onChange={(ev) => setNovo((x) => ({ ...x, papel: ev.target.value as MembroEquipe['papel'] }))} className={inputClass}>
            <option>Equipe</option>
            <option>Administrador</option>
          </select>
        </Campo>
        <Button type="submit" disabled={convidar.isPending} className="self-end">
          <UserPlus size={18} aria-hidden /> Convidar
        </Button>
        <div className="sm:col-span-2">
          <InlineError>{convidar.isError ? mensagemDeErro(convidar.error) : null}</InlineError>
        </div>
      </form>
      <ConfirmDialog
        open={!!removendo}
        title={`Remover ${removendo?.nome ?? ''}?`}
        confirmLabel="Remover"
        variant="danger"
        busy={remover.isPending}
        error={remover.isError ? mensagemDeErro(remover.error) : null}
        onClose={() => {
          setRemovendo(null);
          remover.reset();
        }}
        onConfirm={() => remover.mutate(removendo!.id, { onSuccess: () => (toast.show(`${removendo!.nome} saiu da equipe.`), setRemovendo(null)) })}
      >
        <p>A pessoa perde o acesso ao portal da entidade.</p>
      </ConfirmDialog>
    </section>
  );
}
