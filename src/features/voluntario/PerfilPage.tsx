import { useState, type FormEvent } from 'react';
import { Download, ShieldCheck, Trash2 } from 'lucide-react';
import { Button, cx } from '@gera/design-system';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { DisponibilidadeGrade } from '../../components/shared/DisponibilidadeGrade';
import { PageHeader } from '../../components/shared/PageHeader';
import { PreviaImpressao } from '../../components/shared/PreviaImpressao';
import { ErrorState, InlineError, Skeleton } from '../../components/shared/States';
import { TermoTexto } from '../../components/shared/TermoTexto';
import { useToast } from '../../components/shared/Toast';
import { cardClass } from '../../components/ui/card';
import { Campo } from '../../components/ui/Campo';
import { inputClass } from '../../components/ui/form';
import { useSession } from '../../lib/auth';
import { formatDate, formatDateTime } from '../../lib/format';
import { salvarArquivo } from '../../lib/salvarArquivo';
import { mensagemDeErro, useGeraMutation, useMeuPerfil } from '../../services/hooks';
import { exportarMeusDados, pedirExclusao, salvarMeuPerfil, salvarPreferencias, type MeuPerfil } from '../../services/perfil';
import { AREAS, type Area, type PreferenciasNotificacao } from '../../types/domain';

export function PerfilPage() {
  const { userId } = useSession();
  const perfil = useMeuPerfil(userId!);
  return (
    <>
      <PageHeader title="Perfil" />
      {perfil.isPending ? (
        <Skeleton className="h-96 border border-border" />
      ) : perfil.isError ? (
        <ErrorState error={perfil.error} onRetry={() => perfil.refetch()} />
      ) : (
        <div className="flex flex-col gap-4">
          <Dados perfil={perfil.data} />
          <Notificacoes perfil={perfil.data} />
          <Termo perfil={perfil.data} />
          <Lgpd perfil={perfil.data} />
        </div>
      )}
    </>
  );
}

function Dados({ perfil }: { perfil: MeuPerfil }) {
  const v = perfil.voluntario;
  const toast = useToast();
  const salvar = useGeraMutation((d: Parameters<typeof salvarMeuPerfil>[1]) => salvarMeuPerfil(v.id, d));
  const [d, setD] = useState({ nome: v.nome, email: v.email, telefone: v.telefone, formacao: v.formacao, profissao: v.profissao ?? '', empresa: v.empresa ?? '' });
  const [disp, setDisp] = useState<string[]>(v.disponibilidade ?? []);
  const [areas, setAreas] = useState<Area[]>(v.areas);
  const [usaFormacao, setUsaFormacao] = useState(!!v.usaFormacao);
  const set = (k: keyof typeof d) => (e: { target: { value: string } }) => setD((x) => ({ ...x, [k]: e.target.value }));
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    salvar.mutate({ ...d, disponibilidade: disp, areas, usaFormacao }, { onSuccess: () => toast.show('Perfil salvo. As sugestões de oportunidades já levam isso em conta.') });
  };
  return (
    <form onSubmit={enviar} noValidate className={`${cardClass} flex flex-col gap-4 p-4`} aria-labelledby="dados-titulo">
      <h2 id="dados-titulo" className="text-lg font-bold text-ink">Seus dados</h2>
      <p className="text-sm text-ink-muted">
        Carteirinha {v.registro} · {perfil.entidades.join(', ')}
      </p>
      <Campo id="nome" label="Nome completo">
        <input value={d.nome} onChange={set('nome')} autoComplete="name" className={inputClass} />
      </Campo>
      <Campo id="email" label="E-mail">
        <input type="email" value={d.email} onChange={set('email')} autoComplete="email" className={inputClass} />
      </Campo>
      <Campo id="telefone" label="Telefone">
        <input value={d.telefone} onChange={set('telefone')} inputMode="tel" autoComplete="tel" className={inputClass} />
      </Campo>
      <Campo id="formacao" label="Formação">
        <input value={d.formacao} onChange={set('formacao')} className={inputClass} />
      </Campo>
      <Campo id="profissao" label="Profissão">
        <input value={d.profissao} onChange={set('profissao')} className={inputClass} />
      </Campo>
      <Campo id="empresa" label="Empresa onde trabalha" dica="Entra no relatório de voluntariado corporativo da empresa.">
        <input value={d.empresa} onChange={set('empresa')} className={inputClass} />
      </Campo>
      <fieldset>
        <legend className="text-sm font-semibold text-ink">Áreas de interesse</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {AREAS.map((a) => (
            <label key={a} className={cx('flex min-h-11 cursor-pointer items-center gap-2 rounded-pill border px-3 text-sm', areas.includes(a) ? 'border-primary bg-primary-soft text-on-primary-soft' : 'border-border-strong text-ink')}>
              <input type="checkbox" checked={areas.includes(a)} onChange={(e) => setAreas((l) => (e.target.checked ? [...l, a] : l.filter((x) => x !== a)))} className="h-4 w-4 accent-primary" />
              {a}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-ink">
        <input type="checkbox" checked={usaFormacao} onChange={(e) => setUsaFormacao(e.target.checked)} className="h-5 w-5 accent-primary" />
        Quero atuar na minha formação quando der
      </label>
      {/* min-w-0: o fieldset cresce até a largura mínima da tabela e escaparia da tela em 360px. */}
      <fieldset className="min-w-0">
        <legend className="text-sm font-semibold text-ink">Quando você pode</legend>
        <DisponibilidadeGrade valor={disp} onChange={setDisp} />
      </fieldset>
      <InlineError>{salvar.isError ? mensagemDeErro(salvar.error) : null}</InlineError>
      <Button type="submit" disabled={salvar.isPending} className="justify-center">
        {salvar.isPending ? 'Salvando…' : 'Salvar perfil'}
      </Button>
    </form>
  );
}

const ITENS: Array<{ k: keyof Omit<PreferenciasNotificacao, 'canais'>; label: string }> = [
  { k: 'oportunidades', label: 'Oportunidades novas nas minhas áreas' },
  { k: 'lembretes', label: 'Lembrete na véspera da ação' },
  { k: 'beneficios', label: 'Benefícios novos dos parceiros' },
  { k: 'carteirinha', label: 'Aviso quando a carteirinha estiver para vencer' },
];
const CANAIS: Array<{ id: PreferenciasNotificacao['canais'][number]; label: string }> = [
  { id: 'app', label: 'No app (sino)' },
  { id: 'email', label: 'E-mail' },
  { id: 'whatsapp', label: 'WhatsApp' },
];

function Notificacoes({ perfil }: { perfil: MeuPerfil }) {
  const v = perfil.voluntario;
  const toast = useToast();
  const [p, setP] = useState<PreferenciasNotificacao>(v.preferencias!);
  const salvar = useGeraMutation((novo: PreferenciasNotificacao) => salvarPreferencias(v.id, novo));
  const mudar = (novo: PreferenciasNotificacao) => {
    const anterior = p;
    setP(novo);
    salvar.mutate(novo, { onSuccess: () => toast.show('Preferências salvas.'), onError: () => setP(anterior) });
  };
  return (
    <section aria-labelledby="notif-titulo" className={`${cardClass} flex flex-col gap-3 p-4`}>
      <h2 id="notif-titulo" className="text-lg font-bold text-ink">Notificações</h2>
      <fieldset className="flex flex-col">
        <legend className="mb-1 text-sm font-semibold text-ink">O que avisar</legend>
        {ITENS.map((i) => (
          <label key={i.k} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-ink">
            <input type="checkbox" checked={p[i.k]} onChange={(e) => mudar({ ...p, [i.k]: e.target.checked })} className="h-5 w-5 shrink-0 accent-primary" />
            {i.label}
          </label>
        ))}
        <p className="text-sm text-ink-muted">Cadastro aprovado e ingressos confirmados sempre chegam.</p>
      </fieldset>
      <fieldset className="flex flex-col">
        <legend className="mb-1 text-sm font-semibold text-ink">Por onde</legend>
        {CANAIS.map((c) => (
          <label key={c.id} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-ink">
            <input
              type="checkbox"
              checked={p.canais.includes(c.id)}
              onChange={(e) => mudar({ ...p, canais: e.target.checked ? [...p.canais, c.id] : p.canais.filter((x) => x !== c.id) })}
              className="h-5 w-5 shrink-0 accent-primary"
            />
            {c.label}
          </label>
        ))}
      </fieldset>
      <InlineError>{salvar.isError ? mensagemDeErro(salvar.error) : null}</InlineError>
    </section>
  );
}

function Termo({ perfil }: { perfil: MeuPerfil }) {
  const { termo } = perfil;
  return (
    <section aria-labelledby="termo-titulo" className={`${cardClass} flex flex-col gap-2 p-4`}>
      <h2 id="termo-titulo" className="text-lg font-bold text-ink">Termo de voluntariado</h2>
      <p className="flex items-start gap-2 text-sm text-ink">
        <ShieldCheck size={18} aria-hidden className="mt-0.5 shrink-0 text-link" />
        {termo.aceitoEm
          ? `Você aceitou a versão ${termo.versao ?? '1.0'} em ${formatDate(termo.aceitoEm)}.`
          : 'Você ainda não aceitou o termo.'}
      </p>
      {termo.versao && termo.versao !== termo.vigente && (
        <p className="text-sm text-ink-muted">A versão vigente hoje é a {termo.vigente}. A entidade avisa quando for preciso aceitar de novo.</p>
      )}
      <details className="text-sm">
        <summary className="cursor-pointer font-semibold text-link">Ler o termo vigente (versão {termo.vigente})</summary>
        <div className="mt-2 rounded-md bg-bg-subtle p-3 text-ink">
          <TermoTexto texto={termo.texto} />
        </div>
      </details>
    </section>
  );
}

function Lgpd({ perfil }: { perfil: MeuPerfil }) {
  const v = perfil.voluntario;
  const toast = useToast();
  const [previa, setPrevia] = useState<string | null>(null);
  const [baixando, setBaixando] = useState(false);
  const [erroDownload, setErroDownload] = useState<string | null>(null);
  const [pedindo, setPedindo] = useState(false);
  const [motivo, setMotivo] = useState('');
  const pedir = useGeraMutation((m: string) => pedirExclusao(v.id, m));
  const baixar = async () => {
    setErroDownload(null);
    setBaixando(true);
    try {
      const dados = await exportarMeusDados(v.id);
      const json = JSON.stringify(dados, null, 2);
      const r = await salvarArquivo(json, `meus-dados-gera-${v.registro.toLowerCase()}.json`, 'application/json');
      if (r.estado === 'previa') setPrevia(json);
      else if (r.estado === 'tentar-de-novo') setErroDownload(r.mensagem);
      else if (r.estado === 'salvo') toast.show('Seus dados foram baixados em JSON.');
    } finally {
      setBaixando(false);
    }
  };
  return (
    <section aria-labelledby="lgpd-titulo" className={`${cardClass} flex flex-col gap-3 p-4`}>
      <h2 id="lgpd-titulo" className="text-lg font-bold text-ink">Seus dados (LGPD)</h2>
      <p className="text-sm text-ink-muted">Você pode baixar tudo o que a GERA guarda sobre você ou pedir a exclusão do cadastro.</p>
      <Button variant="secondary" onClick={baixar} disabled={baixando} className="justify-center">
        <Download size={18} aria-hidden /> {baixando ? 'Preparando…' : 'Baixar meus dados'}
      </Button>
      <InlineError>{erroDownload}</InlineError>
      {perfil.pedidoExclusao ? (
        <p role="status" className="rounded-md bg-info-soft px-3 py-2 text-sm text-on-info-soft">
          Pedido de exclusão registrado em {formatDateTime(perfil.pedidoExclusao.pedidoEm)}. O comitê responde em até 15 dias, pelo seu e-mail.
        </p>
      ) : (
        <Button variant="ghost" onClick={() => setPedindo(true)} className="justify-center">
          <Trash2 size={18} aria-hidden /> Pedir exclusão
        </Button>
      )}
      <ConfirmDialog
        open={pedindo}
        title="Pedir a exclusão dos seus dados?"
        confirmLabel="Registrar pedido"
        variant="danger"
        busy={pedir.isPending}
        error={pedir.isError ? mensagemDeErro(pedir.error) : null}
        onClose={() => setPedindo(false)}
        onConfirm={() =>
          pedir.mutate(motivo, {
            onSuccess: () => {
              setPedindo(false);
              toast.show('Pedido de exclusão registrado. O comitê vai te responder por e-mail.');
            },
          })
        }
      >
        <p>
          O comitê exclui o cadastro e anonimiza o histórico de horas (que entra nas prestações de contas). A carteirinha e os certificados deixam de valer.
        </p>
        <Campo id="motivo" label="Quer contar o motivo? (opcional)">
          <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} className={`${inputClass} py-2`} />
        </Campo>
      </ConfirmDialog>
      {previa && (
        <PreviaImpressao titulo="Meus dados (JSON)" onClose={() => setPrevia(null)}>
          <pre className="whitespace-pre-wrap break-all font-mono text-xs text-ink">{previa}</pre>
        </PreviaImpressao>
      )}
    </section>
  );
}
