import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, CircleCheck } from 'lucide-react';
import { Button, formatHours } from '@gera/design-system';
import { CertificadoDownload } from '../../components/shared/CertificadoDownload';
import { Chips } from '../../components/shared/Chips';
import { EmptyState } from '../../components/shared/EmptyState';
import { PageHeader } from '../../components/shared/PageHeader';
import { ErrorState, InlineError, SkeletonList } from '../../components/shared/States';
import { useToast } from '../../components/shared/Toast';
import { VoltarLink } from '../../components/shared/VoltarLink';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { cardClass } from '../../components/ui/card';
import { Campo } from '../../components/ui/Campo';
import { inputClass } from '../../components/ui/form';
import { useSession } from '../../lib/auth';
import { isoDay } from '../../lib/carteirinha';
import { formatDate } from '../../lib/format';
import { emitirCertificados, type CertificadoDetalhado } from '../../services/certificados';
import { mensagemDeErro, useCertificadosDaEntidade, useElegiveis, useGeraMutation } from '../../services/hooks';

export function CertificadosPage() {
  const { orgId, orgName } = useSession();
  const lista = useCertificadosDaEntidade(orgId!);
  const [busca, setBusca] = useState('');
  const visiveis = lista.data?.filter((c) => c.nome.toLowerCase().includes(busca.trim().toLowerCase()) || c.codigo.includes(busca.trim().toUpperCase())) ?? [];
  return (
    <>
      <PageHeader
        title="Certificados"
        eyebrow={orgName}
        description="Certificados das horas de voluntariado, com código de verificação que qualquer pessoa confere no site."
        actions={
          <ButtonLink to="emitir">
            <Award size={18} aria-hidden /> Emitir certificados
          </ButtonLink>
        }
      />
      {lista.isPending ? (
        <SkeletonList rows={4} />
      ) : lista.isError ? (
        <ErrorState error={lista.error} onRetry={() => lista.refetch()} />
      ) : lista.data.length === 0 ? (
        <EmptyState title="Nenhum certificado emitido ainda" description="Emita em lote para todos que têm horas no período, ou um a um." action={<ButtonLink to="emitir">Emitir certificados</ButtonLink>} />
      ) : (
        <div className="flex flex-col gap-3">
          <Campo id="busca" label="Buscar por nome ou código" className="max-w-sm">
            <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} className={inputClass} />
          </Campo>
          {visiveis.length === 0 ? (
            <EmptyState title="Nenhum certificado encontrado" description="Confira o nome ou o código." />
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border bg-bg-card shadow-card">
              {visiveis.map((c) => (
                <ItemCertificado key={c.id} c={c} />
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}

function ItemCertificado({ c }: { c: CertificadoDetalhado }) {
  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-semibold text-ink">{c.nome}</p>
        <p className="text-sm text-ink-muted">
          {formatHours(c.horas)} · {formatDate(c.inicio)} a {formatDate(c.fim)} · emitido em {formatDate(c.emitidoEm)}
        </p>
        <p className="text-sm">
          <Link to={`/validar/certificado/${c.codigo}`} className="font-mono font-semibold text-link hover:underline">
            {c.codigo}
          </Link>
        </p>
      </div>
      <CertificadoDownload certificado={c} />
    </li>
  );
}

export function EmitirCertificadosPage() {
  const { orgId, orgName } = useSession();
  const toast = useToast();
  const hoje = isoDay(new Date());
  const [periodo, setPeriodo] = useState({ inicio: `${hoje.slice(0, 4)}-01-01`, fim: hoje });
  const [modo, setModo] = useState<'lote' | 'individual'>('lote');
  const elegiveis = useElegiveis(orgId!, periodo);
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [individual, setIndividual] = useState('');
  const emitir = useGeraMutation(emitirCertificados);
  const [emitidos, setEmitidos] = useState<CertificadoDetalhado[] | null>(null);

  // Ao trocar o período, marca todos que ainda não têm certificado desse período.
  const lista = useMemo(() => elegiveis.data ?? [], [elegiveis.data]);
  useEffect(() => {
    setMarcados(new Set(lista.filter((e) => !e.jaEmitido).map((e) => e.voluntarioId)));
  }, [lista]);

  const alternar = (id: string) =>
    setMarcados((m) => {
      const n = new Set(m);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const enviar = () => {
    const ids = modo === 'lote' ? [...marcados] : individual ? [individual] : [];
    emitir.mutate(
      { entidadeId: orgId!, periodo, voluntarioIds: ids },
      {
        onSuccess: (r) => {
          setEmitidos(r);
          toast.show(r.length === 1 ? `Certificado de ${r[0]!.nome} emitido.` : `${r.length} certificados emitidos.`);
        },
      },
    );
  };

  const escolhido = lista.find((e) => e.voluntarioId === individual);
  const totalHoras = lista.filter((e) => marcados.has(e.voluntarioId)).reduce((s, e) => s + e.horas, 0);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <VoltarLink to="/entidade/certificados">Certificados</VoltarLink>
        <PageHeader title="Emitir certificados" eyebrow={orgName} description="As horas vêm do banco de horas da entidade no período escolhido." />
      </div>

      {emitidos ? (
        <section className={`${cardClass} flex flex-col gap-4`} aria-labelledby="emitidos">
          <h2 id="emitidos" className="flex items-center gap-2 text-lg font-bold text-ink">
            <CircleCheck size={22} aria-hidden className="text-link" />
            {emitidos.length === 1 ? 'Certificado emitido' : `${emitidos.length} certificados emitidos`}
          </h2>
          <p className="text-sm text-ink-muted">Cada voluntário também encontra o seu no app, em Mais › Certificados.</p>
          <ul className="divide-y divide-border">
            {emitidos.map((c) => (
              <ItemCertificado key={c.id} c={c} />
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => (setEmitidos(null), emitir.reset())}>
              Emitir outros
            </Button>
            <ButtonLink to="/entidade/certificados" variant="ghost">
              Ver todos os certificados
            </ButtonLink>
          </div>
        </section>
      ) : (
        <section className={`${cardClass} flex flex-col gap-4`} aria-label="Emissão">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="inicio" label="De">
              <input type="date" value={periodo.inicio} max={periodo.fim} onChange={(e) => e.target.value && setPeriodo((p) => ({ ...p, inicio: e.target.value }))} className={inputClass} />
            </Campo>
            <Campo id="fim" label="Até">
              <input type="date" value={periodo.fim} min={periodo.inicio} max={hoje} onChange={(e) => e.target.value && setPeriodo((p) => ({ ...p, fim: e.target.value }))} className={inputClass} />
            </Campo>
          </div>
          <Chips
            label="Como emitir"
            valor={modo}
            onChange={setModo}
            opcoes={[
              { id: 'lote', label: 'Em lote' },
              { id: 'individual', label: 'Um a um' },
            ]}
          />
          {elegiveis.isError ? (
            <ErrorState error={elegiveis.error} onRetry={() => elegiveis.refetch()} />
          ) : !elegiveis.data ? (
            <SkeletonList rows={3} />
          ) : lista.length === 0 ? (
            <EmptyState title="Ninguém tem horas nesse período" description="Escolha outro período." className="shadow-none" />
          ) : modo === 'lote' ? (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-semibold text-ink">
                Voluntários com horas no período ({marcados.size} de {lista.length} marcados, {formatHours(totalHoras)})
              </legend>
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" onClick={() => setMarcados(new Set(lista.map((e) => e.voluntarioId)))}>
                  Marcar todos
                </Button>
                <Button variant="ghost" onClick={() => setMarcados(new Set())}>
                  Desmarcar todos
                </Button>
              </div>
              <ul className="max-h-[420px] divide-y divide-border overflow-y-auto rounded-md border border-border">
                {lista.map((e) => (
                  <li key={e.voluntarioId}>
                    <label className="flex min-h-12 cursor-pointer items-center gap-3 px-3 py-2 hover:bg-bg-subtle">
                      <input type="checkbox" checked={marcados.has(e.voluntarioId)} onChange={() => alternar(e.voluntarioId)} className="h-5 w-5 shrink-0 accent-primary" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-ink">{e.nome}</span>
                        <span className="block text-sm text-ink-muted">
                          {formatHours(e.horas)} em {e.acoes} {e.acoes === 1 ? 'ação' : 'ações'}
                          {e.jaEmitido && ' · já tem certificado deste período'}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          ) : (
            <div className="flex flex-col gap-2">
              <Campo id="voluntario" label="Voluntário">
                <select value={individual} onChange={(e) => setIndividual(e.target.value)} className={inputClass}>
                  <option value="">Escolha…</option>
                  {lista.map((e) => (
                    <option key={e.voluntarioId} value={e.voluntarioId}>
                      {e.nome} ({formatHours(e.horas)})
                    </option>
                  ))}
                </select>
              </Campo>
              {escolhido && (
                <p className="rounded-md bg-bg-subtle px-3 py-2 text-sm text-ink">
                  {escolhido.nome}: <strong>{formatHours(escolhido.horas)}</strong> em {escolhido.acoes} {escolhido.acoes === 1 ? 'ação' : 'ações'} de {formatDate(periodo.inicio)} a{' '}
                  {formatDate(periodo.fim)}.{escolhido.jaEmitido && ' Já existe um certificado deste período; outro será emitido.'}
                </p>
              )}
            </div>
          )}
          <InlineError>{emitir.isError ? mensagemDeErro(emitir.error) : null}</InlineError>
          <Button
            className="self-start"
            disabled={emitir.isPending || (modo === 'lote' ? marcados.size === 0 : !individual)}
            onClick={enviar}
          >
            <Award size={18} aria-hidden />
            {emitir.isPending ? 'Emitindo…' : modo === 'lote' ? `Emitir ${marcados.size} ${marcados.size === 1 ? 'certificado' : 'certificados'}` : 'Emitir certificado'}
          </Button>
        </section>
      )}
    </div>
  );
}
