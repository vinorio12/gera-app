import { useMemo, useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@gera/design-system';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { EmptyState } from '../../components/shared/EmptyState';
import { PageHeader } from '../../components/shared/PageHeader';
import { ErrorState, InlineError, Skeleton, SkeletonList } from '../../components/shared/States';
import { TermoTexto } from '../../components/shared/TermoTexto';
import { useToast } from '../../components/shared/Toast';
import { cardClass } from '../../components/ui/card';
import { Campo } from '../../components/ui/Campo';
import { inputClass } from '../../components/ui/form';
import { formatDate, formatDateTime } from '../../lib/format';
import { adicionarAdmin, publicarTermo, removerAdmin, salvarDadosComite } from '../../services/admin';
import { mensagemDeErro, useAuditoria, useComite, useGeraMutation } from '../../services/hooks';
import type { Comite } from '../../types/domain';

export function ConfiguracoesAdminPage() {
  const comite = useComite();
  return (
    <>
      <PageHeader title="Configurações" eyebrow="Administrador ACIJS" description="Dados do comitê, termo de voluntariado, administradores e o histórico de auditoria." />
      {comite.isPending ? (
        <Skeleton className="h-96 border border-border" />
      ) : comite.isError ? (
        <ErrorState error={comite.error} onRetry={() => comite.refetch()} />
      ) : (
        <div className="flex flex-col gap-8">
          <div className="grid gap-6 xl:grid-cols-2">
            <DadosComite comite={comite.data} />
            <Administradores comite={comite.data} />
          </div>
          <Termo comite={comite.data} />
          <Auditoria />
        </div>
      )}
    </>
  );
}

function DadosComite({ comite }: { comite: Comite }) {
  const toast = useToast();
  const salvar = useGeraMutation(salvarDadosComite);
  const [d, setD] = useState({ nome: comite.nome, cnpj: comite.cnpj, email: comite.email, telefone: comite.telefone, endereco: comite.endereco });
  const set = (k: keyof typeof d) => (e: { target: { value: string } }) => setD((x) => ({ ...x, [k]: e.target.value }));
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    salvar.mutate(d, { onSuccess: () => toast.show('Dados do comitê salvos.') });
  };
  return (
    <section aria-labelledby="dados" className={cardClass}>
      <h2 id="dados" className="mb-4 text-lg font-bold text-ink">Dados do comitê</h2>
      <form onSubmit={enviar} noValidate className="grid gap-4 sm:grid-cols-2">
        <Campo id="nome" label="Nome" className="sm:col-span-2">
          <input value={d.nome} onChange={set('nome')} className={inputClass} />
        </Campo>
        <Campo id="cnpj" label="CNPJ">
          <input value={d.cnpj} onChange={set('cnpj')} className={inputClass} />
        </Campo>
        <Campo id="telefone" label="Telefone">
          <input value={d.telefone} onChange={set('telefone')} className={inputClass} />
        </Campo>
        <Campo id="email" label="E-mail" className="sm:col-span-2">
          <input type="email" value={d.email} onChange={set('email')} className={inputClass} />
        </Campo>
        <Campo id="endereco" label="Endereço" className="sm:col-span-2">
          <input value={d.endereco} onChange={set('endereco')} className={inputClass} />
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

function Administradores({ comite }: { comite: Comite }) {
  const toast = useToast();
  const adicionar = useGeraMutation(adicionarAdmin);
  const remover = useGeraMutation(removerAdmin);
  const [novo, setNovo] = useState({ nome: '', email: '' });
  const [removendo, setRemovendo] = useState<Comite['admins'][number] | null>(null);
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    adicionar.mutate(novo, {
      onSuccess: () => {
        toast.show(`${novo.nome} agora é administrador. O convite foi para ${novo.email}.`);
        setNovo({ nome: '', email: '' });
      },
    });
  };
  return (
    <section aria-labelledby="admins" className={cardClass}>
      <h2 id="admins" className="mb-3 text-lg font-bold text-ink">Usuários administradores</h2>
      <ul className="mb-4 divide-y divide-border">
        {comite.admins.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-3 py-2">
            <div className="min-w-0">
              <p className="font-semibold text-ink">{a.nome}</p>
              <p className="break-all text-sm text-ink-muted">
                {a.email} · desde {formatDate(a.desde)}
              </p>
            </div>
            <Button variant="ghost" onClick={() => setRemovendo(a)} aria-label={`Remover ${a.nome}`}>
              <Trash2 size={16} aria-hidden /> Remover
            </Button>
          </li>
        ))}
      </ul>
      <form onSubmit={enviar} noValidate className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Campo id="admin-nome" label="Nome">
          <input value={novo.nome} onChange={(e) => setNovo((x) => ({ ...x, nome: e.target.value }))} className={inputClass} />
        </Campo>
        <Campo id="admin-email" label="E-mail">
          <input type="email" value={novo.email} onChange={(e) => setNovo((x) => ({ ...x, email: e.target.value }))} className={inputClass} />
        </Campo>
        <Button type="submit" disabled={adicionar.isPending}>
          Adicionar
        </Button>
      </form>
      <div className="mt-2">
        <InlineError>{adicionar.isError ? mensagemDeErro(adicionar.error) : null}</InlineError>
      </div>
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
        onConfirm={() => remover.mutate(removendo!.id, { onSuccess: () => (toast.show(`${removendo!.nome} não é mais administrador.`), setRemovendo(null)) })}
      >
        <p>A pessoa perde o acesso ao portal do comitê. A remoção fica no histórico de auditoria.</p>
      </ConfirmDialog>
    </section>
  );
}

function proximaVersao(v: string) {
  const [maior = '1', menor = '0'] = v.split('.');
  return `${maior}.${Number(menor) + 1}`;
}

function Termo({ comite }: { comite: Comite }) {
  const toast = useToast();
  const publicar = useGeraMutation(publicarTermo);
  const [editando, setEditando] = useState(false);
  const [d, setD] = useState({ versao: proximaVersao(comite.termo.versao), texto: comite.termo.texto });
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    publicar.mutate(d, {
      onSuccess: () => {
        toast.show(`Versão ${d.versao} do termo publicada. Os novos cadastros aceitam essa versão.`);
        setEditando(false);
      },
    });
  };
  return (
    <section aria-labelledby="termo" className={cardClass}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="termo" className="text-lg font-bold text-ink">Termo de voluntariado</h2>
          <p className="text-sm text-ink-muted">
            Versão vigente: <strong className="text-ink">{comite.termo.versao}</strong>, publicada em {formatDate(comite.termo.publicadoEm)}.
            O perfil de cada voluntário mostra a versão que ele aceitou.
          </p>
        </div>
        {!editando && (
          <Button
            variant="secondary"
            onClick={() => {
              setD({ versao: proximaVersao(comite.termo.versao), texto: comite.termo.texto });
              setEditando(true);
            }}
          >
            Publicar nova versão
          </Button>
        )}
      </div>
      {editando ? (
        <form onSubmit={enviar} noValidate className="flex flex-col gap-3">
          <Campo id="versao" label="Número da nova versão" className="max-w-[200px]">
            <input value={d.versao} onChange={(e) => setD((x) => ({ ...x, versao: e.target.value }))} className={inputClass} />
          </Campo>
          <Campo id="texto" label="Texto do termo" dica='Linhas que começam com "- " viram itens numerados.'>
            <textarea value={d.texto} onChange={(e) => setD((x) => ({ ...x, texto: e.target.value }))} rows={10} className={`${inputClass} py-2`} />
          </Campo>
          <InlineError>{publicar.isError ? mensagemDeErro(publicar.error) : null}</InlineError>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={publicar.isPending}>
              {publicar.isPending ? 'Publicando…' : `Publicar versão ${d.versao}`}
            </Button>
            <Button variant="ghost" onClick={() => setEditando(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <div className="max-h-64 overflow-y-auto rounded-md border border-border bg-bg-subtle p-4 text-sm text-ink" tabIndex={0} aria-label="Texto do termo vigente">
          <TermoTexto texto={comite.termo.texto} />
        </div>
      )}
      <p className="mt-3 text-sm text-ink-muted">
        Versões anteriores: {comite.termo.historico.map((h) => `${h.versao} (${formatDate(h.publicadoEm)})`).join(' · ')}
      </p>
    </section>
  );
}

const LIMITE = 30;

function Auditoria() {
  const lista = useAuditoria();
  const [acao, setAcao] = useState('');
  const [mostrar, setMostrar] = useState(LIMITE);
  const acoes = useMemo(() => [...new Set(lista.data?.map((r) => r.acao) ?? [])].sort(), [lista.data]);
  const filtrada = lista.data?.filter((r) => !acao || r.acao === acao) ?? [];
  return (
    <section aria-labelledby="auditoria" className="flex flex-col gap-3">
      <h2 id="auditoria" className="text-2xl font-bold text-ink">Histórico de auditoria</h2>
      <p className="text-sm text-ink-muted">Quem aprovou, desligou, reativou, lançou horas à mão ou despesa, e quando.</p>
      <Campo id="acao" label="Ação" className="max-w-xs">
        <select value={acao} onChange={(e) => setAcao(e.target.value)} className={inputClass}>
          <option value="">Todas as ações</option>
          {acoes.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
      </Campo>
      {lista.isPending ? (
        <SkeletonList rows={5} />
      ) : lista.isError ? (
        <ErrorState error={lista.error} onRetry={() => lista.refetch()} />
      ) : filtrada.length === 0 ? (
        <EmptyState title="Nada registrado com esse filtro" />
      ) : (
        <>
          <div className="relative overflow-x-auto rounded-lg border border-border bg-bg-card shadow-card">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border text-ink-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Quando</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Quem</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Ação</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Sobre</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Entidade</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Detalhe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtrada.slice(0, mostrar).map((r) => (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap px-4 py-2 tabular-nums text-ink-muted">{formatDateTime(r.em)}</td>
                    <td className="px-4 py-2 text-ink">{r.autor}</td>
                    <td className="px-4 py-2 font-semibold text-ink">{r.acao}</td>
                    <td className="px-4 py-2 text-ink">{r.alvo}</td>
                    <td className="px-4 py-2 text-ink-muted">{r.entidadeNome}</td>
                    <td className="px-4 py-2 text-ink-muted">{r.detalhe ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {mostrar < filtrada.length && (
            <Button variant="secondary" className="self-start" onClick={() => setMostrar((m) => m + LIMITE)}>
              Mostrar mais
            </Button>
          )}
        </>
      )}
    </section>
  );
}
