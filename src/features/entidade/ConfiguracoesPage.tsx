import { useState, type FormEvent } from 'react';
import { Check, Trash2, UserPlus } from 'lucide-react';
import { Button, cx } from '@gera/design-system';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { Avatar, UploadImagem } from '../../components/shared/Imagens';
import { PageHeader } from '../../components/shared/PageHeader';
import { ErrorState, InlineError, Skeleton } from '../../components/shared/States';
import { useToast } from '../../components/shared/Toast';
import { cardClass } from '../../components/ui/card';
import { Campo } from '../../components/ui/Campo';
import { inputClass } from '../../components/ui/form';
import { useSession } from '../../lib/auth';
import { normalizarHex } from '../../lib/contraste';
import { corDoToken } from '../../lib/coresPdf';
import { COR_DESTAQUE } from '../../lib/corDestaque';
import { formatDate } from '../../lib/format';
import { hexDaMarca, marcaDaEntidade } from '../../lib/marca';
import { convidarMembro, definirCorDestaque, definirCorLivre, removerMembro, salvarDadosEntidade, salvarImagemEntidade } from '../../services/configuracoes';
import { mensagemDeErro, useEntidadeConfig, useGeraMutation } from '../../services/hooks';
import { AREAS, CORES_DESTAQUE, type Area, type CorDestaque, type Entidade, type MembroEquipe } from '../../types/domain';


export function ConfiguracoesPage() {
  const { orgId, orgName } = useSession();
  const config = useEntidadeConfig(orgId!);
  return (
    <>
      <PageHeader title="Configurações" eyebrow={orgName} description="Dados da entidade, a marca no site (cor, foto de perfil e banner) e a equipe que acessa o portal." />
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
  const definirLivre = useGeraMutation((hex: string) => definirCorLivre(e.id, hex));
  const salvarLogo = useGeraMutation((d: string | null) => salvarImagemEntidade(e.id, 'logo', d));
  const salvarBanner = useGeraMutation((d: string | null) => salvarImagemEntidade(e.id, 'banner', d));
  const [texto, setTexto] = useState(hexDaMarca(e));
  const hex = normalizarHex(texto);
  // Prévia ao vivo: usa o que está no campo, mesmo antes de salvar.
  const marca = marcaDaEntidade({ corDestaque: e.corDestaque, corLivre: hex ?? hexDaMarca(e) });
  const razao = marca.razao.toFixed(1).replace('.', ',');
  return (
    <section aria-labelledby="marca" className={cardClass}>
      <h2 id="marca" className="mb-1 text-lg font-bold text-ink">Marca</h2>
      <p className="mb-4 text-sm text-ink-muted">
        A cor de destaque aparece na página da entidade no site. Use um atalho da GERA ou qualquer cor: o texto sobre ela é calculado para ter contraste.
      </p>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink">Atalhos da GERA</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {CORES_DESTAQUE.map((c) => {
            const marcado = !e.corLivre && e.corDestaque === c;
            return (
              <label
                key={c}
                className={cx(
                  'flex min-h-12 cursor-pointer items-center gap-3 rounded-md border px-3 has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus-ring',
                  marcado ? 'border-primary bg-primary-soft text-on-primary-soft' : 'border-border-strong text-ink',
                )}
              >
                <input
                  type="radio"
                  name="cor-destaque"
                  value={c}
                  checked={marcado}
                  onChange={() => {
                    setTexto(corDoToken(c));
                    definir.mutate(c, { onSuccess: () => toast.show(`Cor de destaque: ${COR_DESTAQUE[c].nome}.`) });
                  }}
                  className="sr-only"
                />
                <span aria-hidden className={cx('h-6 w-6 shrink-0 rounded-sm border border-border', COR_DESTAQUE[c].amostra)} />
                <span className="flex-1 text-sm font-semibold">{COR_DESTAQUE[c].nome}</span>
                {marcado && <Check size={18} aria-hidden />}
              </label>
            );
          })}
        </div>
      </fieldset>

      <form
        noValidate
        className="mt-4 flex flex-col gap-3"
        onSubmit={(ev) => {
          ev.preventDefault();
          if (hex) definirLivre.mutate(hex, { onSuccess: () => toast.show(`Cor da entidade: ${hex.toUpperCase()}.`) });
        }}
      >
        <div className="flex flex-wrap items-end gap-3">
          <Campo id="cor-seletor" label="Escolher a cor">
            <input type="color" value={hex ?? hexDaMarca(e)} onChange={(ev) => setTexto(ev.target.value)} className="h-11 w-16 cursor-pointer rounded-md border border-border-strong bg-bg-card p-1" />
          </Campo>
          <Campo id="cor-hex" label="Código da cor (hex)" erro={hex ? undefined : 'Use o formato #RRGGBB: o # e seis números ou letras de A a F.'} className="min-w-[160px] flex-1">
            <input value={texto} onChange={(ev) => setTexto(ev.target.value)} inputMode="text" autoComplete="off" spellCheck={false} maxLength={7} className={inputClass} />
          </Campo>
          <Button type="submit" variant="secondary" disabled={!hex || definirLivre.isPending}>
            {definirLivre.isPending ? 'Salvando…' : 'Salvar cor'}
          </Button>
        </div>
        <InlineError>{definirLivre.isError ? mensagemDeErro(definirLivre.error) : definir.isError ? mensagemDeErro(definir.error) : null}</InlineError>
      </form>

      <div className="mt-4 overflow-hidden rounded-md border border-border" style={marca.estilo} data-testid="previa-marca" data-texto={marca.texto ?? 'nenhum'}>
        {e.bannerUrl ? (
          <img src={e.bannerUrl} alt={`Banner: ${e.nome}`} className="aspect-[16/5] w-full object-cover" />
        ) : (
          <div aria-hidden className="h-12 bg-brand-deep" />
        )}
        <div aria-hidden className="h-2 bg-[var(--cor-entidade)]" />
        <div className="flex items-center gap-3 px-3 py-3">
          <Avatar src={e.logoUrl} nome={e.nome} marca={marca} tamanho={44} />
          <p className="min-w-0 flex-1 truncate text-sm font-bold text-ink">{e.nome}</p>
          {marca.texto && (
            <span className="rounded-sm bg-[var(--cor-entidade)] px-3 py-1 text-sm font-bold text-[color:var(--texto-cor-entidade)]">Exemplo de texto</span>
          )}
        </div>
      </div>
      <p role="status" className={cx('mt-2 text-sm', marca.texto ? 'text-ink-muted' : 'font-semibold text-on-accent-soft')}>
        {marca.texto
          ? `Texto ${marca.texto === 'tinta' ? 'escuro' : 'claro'} sobre a cor, com contraste de ${razao}:1.`
          : `Essa cor não tem contraste suficiente com texto escuro nem claro (o melhor é ${razao}:1, e o mínimo é 4,5:1). Ela vai aparecer só em detalhes, como a faixa e a borda, nunca atrás de texto.`}
      </p>

      <div className="mt-6 flex flex-col gap-6">
        <UploadImagem
          tipo="foto"
          titulo="Foto de perfil da entidade"
          alt={`Logo: ${e.nome}`}
          valor={e.logoUrl}
          dica="Aparece na página da entidade, no cartão e no topo do menu. JPG, PNG ou WebP, cortada em quadrado."
          onSalvar={(d) => salvarLogo.mutateAsync(d)}
        />
        <UploadImagem
          tipo="banner"
          titulo="Banner da entidade"
          alt={`Banner: ${e.nome}`}
          valor={e.bannerUrl}
          dica="Substitui a faixa da página da entidade. JPG, PNG ou WebP, cortada em 16:5 (1600 × 500)."
          onSalvar={(d) => salvarBanner.mutateAsync(d)}
        />
      </div>
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
