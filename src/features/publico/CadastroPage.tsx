import { useEffect, useId, useState, type ChangeEvent } from 'react';
import { useForm, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { differenceInYears } from 'date-fns';
import { CircleCheck } from 'lucide-react';
import { Button, cx } from '@gera/design-system';
import { PageHeader } from '../../components/shared/PageHeader';
import { InlineError } from '../../components/shared/States';
import { Stepper } from '../../components/shared/Stepper';
import { useToast } from '../../components/shared/Toast';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { Campo } from '../../components/ui/Campo';
import { inputClass, labelClass } from '../../components/ui/form';
import { isoDay } from '../../lib/carteirinha';
import { isValidCpf } from '../../lib/cpf';
import { formatDate } from '../../lib/format';
import { buscarCep, cadastrarVoluntario, salvarFoto } from '../../services/cadastro';
import { mensagemDeErro, useEntidades, useGeraMutation, useTermoVigente } from '../../services/hooks';
import { TermoTexto } from '../../components/shared/TermoTexto';
import { AREAS } from '../../types/domain';

const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const TURNOS = ['Manhã', 'Tarde', 'Noite'];

const schema = z.object({
  nome: z.string().trim().min(3, 'Escreva seu nome completo.').refine((v) => v.includes(' '), 'Escreva nome e sobrenome.'),
  cpf: z.string().refine(isValidCpf, 'Confira o CPF: os números não batem.'),
  nascimento: z
    .string()
    .min(1, 'Informe sua data de nascimento.')
    .refine((v) => differenceInYears(new Date(), new Date(`${v}T12:00:00`)) >= 16, 'Para se cadastrar é preciso ter 16 anos ou mais.'),
  telefone: z.string().refine((v) => /^\d{10,11}$/.test(v.replace(/\D/g, '')), 'Informe o telefone com DDD.'),
  email: z.string().trim().email('Confira o e-mail.'),
  cep: z.string().refine((v) => v.replace(/\D/g, '').length === 8, 'O CEP tem 8 números.'),
  rua: z.string().trim().min(2, 'Informe a rua.'),
  numero: z.string().trim().min(1, 'Informe o número (ou "s/n").'),
  complemento: z.string(),
  bairro: z.string().trim().min(2, 'Informe o bairro.'),
  cidade: z.string().trim().min(2, 'Informe a cidade.'),
  uf: z.string().trim().length(2, 'Use a sigla do estado, ex.: SC.'),
  entidadeId: z.string().min(1, 'Escolha a entidade que você quer apoiar.'),
  formacao: z.string().trim().min(2, 'Conte sua formação (pode ser "Ensino médio").'),
  profissao: z.string(),
  empresa: z.string(),
  disponibilidade: z.array(z.string()).min(1, 'Marque ao menos um dia e turno.'),
  usaFormacao: z.boolean(),
  areas: z.array(z.enum(AREAS)).min(1, 'Escolha ao menos uma área de interesse.'),
  termoAceito: z.literal(true, { errorMap: () => ({ message: 'Para seguir, leia e aceite o termo.' }) }),
});

type Dados = z.infer<typeof schema>;

const PASSOS: Array<{ titulo: string; campos: Array<FieldPath<Dados>> }> = [
  { titulo: 'Seus dados', campos: ['nome', 'cpf', 'nascimento', 'telefone', 'email'] },
  { titulo: 'Endereço', campos: ['cep', 'rua', 'numero', 'complemento', 'bairro', 'cidade', 'uf'] },
  { titulo: 'Seu perfil', campos: ['entidadeId', 'formacao', 'profissao', 'empresa', 'disponibilidade', 'usaFormacao', 'areas'] },
  { titulo: 'Termo', campos: ['termoAceito'] },
];

const mascaraCpf = (v: string) =>
  v.replace(/\D/g, '').slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
const mascaraTelefone = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
};
const mascaraCep = (v: string) => v.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2');

export function CadastroPage() {
  const [passo, setPasso] = useState(0);
  const [concluido, setConcluido] = useState<{ id: string; registro: string; entidade: string; nome: string } | null>(null);
  const entidades = useEntidades();
  const termo = useTermoVigente();
  const cadastrar = useGeraMutation(cadastrarVoluntario);
  const [cepMsg, setCepMsg] = useState<string | null>(null);
  const form = useForm<Dados>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      nome: '', cpf: '', nascimento: '', telefone: '', email: '', cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '',
      entidadeId: '', formacao: '', profissao: '', empresa: '', disponibilidade: [], usaFormacao: false, areas: [],
      termoAceito: false as unknown as true,
    },
  });
  const { register, formState: { errors }, watch, setValue, trigger, handleSubmit } = form;

  // Campo com erro é revalidado enquanto a pessoa digita: a mensagem some assim que o valor fica certo,
  // e o botão "Continuar" não pula de lugar no meio do clique.
  useEffect(() => {
    const sub = watch((_, { name }) => {
      if (name && form.getFieldState(name).invalid) void trigger(name);
    });
    return () => sub.unsubscribe();
  }, [watch, trigger, form]);

  const avancar = async () => {
    if (await trigger(PASSOS[passo]!.campos, { shouldFocus: true })) setPasso((p) => p + 1);
  };

  const preencherCep = async (e: ChangeEvent<HTMLInputElement>) => {
    const v = mascaraCep(e.target.value);
    setValue('cep', v, { shouldValidate: v.length === 9 });
    setCepMsg(null);
    if (v.length !== 9) return;
    setCepMsg('Buscando o endereço…');
    try {
      const end = await buscarCep(v);
      if (!end) return setCepMsg('Não encontramos esse CEP. Preencha o endereço abaixo.');
      (['rua', 'bairro', 'cidade', 'uf'] as const).forEach((k) => end[k] && setValue(k, end[k], { shouldValidate: true }));
      setCepMsg(end.rua ? 'Endereço preenchido pelo CEP. Falta o número.' : 'Encontramos a cidade. Complete a rua e o bairro.');
    } catch (err) {
      setCepMsg(mensagemDeErro(err));
    }
  };

  const enviar = handleSubmit((d) =>
    cadastrar.mutate(
      {
        ...d,
        endereco: { cep: d.cep, rua: d.rua, numero: d.numero, complemento: d.complemento, bairro: d.bairro, cidade: d.cidade, uf: d.uf.toUpperCase() },
        termoAceito: d.termoAceito,
      },
      { onSuccess: (r) => setConcluido({ ...r, nome: d.nome }) },
    ),
  );

  if (concluido) return <Concluido {...concluido} />;

  const erro = (k: FieldPath<Dados>) => {
    const msg = k.split('.').reduce<unknown>((o, p) => (o as Record<string, unknown> | undefined)?.[p], errors) as { message?: string } | undefined;
    return msg?.message;
  };
  const areas = watch('areas');
  const disp = watch('disponibilidade');

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <PageHeader title="Quero ser voluntário" description="Leva uns 3 minutos. Depois, a entidade aprova seu cadastro e você recebe um aviso." />
      <Stepper passos={PASSOS.map((p) => p.titulo)} atual={passo} />
      <form onSubmit={(e) => (passo === PASSOS.length - 1 ? enviar(e) : (e.preventDefault(), void avancar()))} noValidate className="flex flex-col gap-4">
        {passo === 0 && (
          <>
            <Campo id="nome" label="Nome completo" erro={erro('nome')}>
              <input {...register('nome')} autoComplete="name" className={inputClass} />
            </Campo>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo id="cpf" label="CPF" erro={erro('cpf')}>
                <input
                  {...register('cpf')}
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  onChange={(e) => setValue('cpf', mascaraCpf(e.target.value), { shouldValidate: !!errors.cpf })}
                  className={inputClass}
                />
              </Campo>
              <Campo id="nascimento" label="Data de nascimento" erro={erro('nascimento')}>
                <input {...register('nascimento')} type="date" max={isoDay(new Date())} autoComplete="bday" className={inputClass} />
              </Campo>
              <Campo id="telefone" label="Celular com DDD" erro={erro('telefone')}>
                <input
                  {...register('telefone')}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(47) 99999-9999"
                  onChange={(e) => setValue('telefone', mascaraTelefone(e.target.value), { shouldValidate: !!errors.telefone })}
                  className={inputClass}
                />
              </Campo>
              <Campo id="email" label="E-mail" erro={erro('email')}>
                <input {...register('email')} type="email" autoComplete="email" className={inputClass} />
              </Campo>
            </div>
            <p className="text-xs text-ink-muted">Seu CPF fica protegido: nas listas da entidade aparecem só os números do meio (LGPD).</p>
          </>
        )}

        {passo === 1 && (
          <>
            <Campo id="cep" label="CEP" erro={erro('cep')} dica={cepMsg ?? 'O CEP preenche o resto do endereço.'}>
              <input {...register('cep')} inputMode="numeric" autoComplete="postal-code" placeholder="89251-000" onChange={preencherCep} className={`${inputClass} max-w-[12rem]`} />
            </Campo>
            <Campo id="rua" label="Rua" erro={erro('rua')}>
              <input {...register('rua')} autoComplete="address-line1" className={inputClass} />
            </Campo>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo id="numero" label="Número" erro={erro('numero')}>
                <input {...register('numero')} className={inputClass} />
              </Campo>
              <Campo id="complemento" label="Complemento (opcional)" erro={erro('complemento')}>
                <input {...register('complemento')} autoComplete="address-line2" className={inputClass} />
              </Campo>
              <Campo id="bairro" label="Bairro" erro={erro('bairro')}>
                <input {...register('bairro')} className={inputClass} />
              </Campo>
              <div className="grid grid-cols-[1fr_5rem] gap-3">
                <Campo id="cidade" label="Cidade" erro={erro('cidade')}>
                  <input {...register('cidade')} autoComplete="address-level2" className={inputClass} />
                </Campo>
                <Campo id="uf" label="UF" erro={erro('uf')}>
                  <input {...register('uf')} autoComplete="address-level1" maxLength={2} className={`${inputClass} uppercase`} />
                </Campo>
              </div>
            </div>
          </>
        )}

        {passo === 2 && (
          <>
            <Campo id="entidadeId" label="Entidade que você quer apoiar" erro={erro('entidadeId')}>
              <select {...register('entidadeId')} className={inputClass}>
                <option value="">Escolha…</option>
                {entidades.data?.map((e) => (
                  <option key={e.id} value={e.id}>{e.nome}</option>
                ))}
              </select>
            </Campo>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo id="formacao" label="Formação" erro={erro('formacao')}>
                <input {...register('formacao')} placeholder="Ex.: Pedagogia" className={inputClass} />
              </Campo>
              <Campo id="profissao" label="Profissão (opcional)" erro={erro('profissao')}>
                <input {...register('profissao')} autoComplete="organization-title" className={inputClass} />
              </Campo>
              <Campo id="empresa" label="Empresa (opcional)" erro={erro('empresa')}>
                <input {...register('empresa')} autoComplete="organization" className={inputClass} />
              </Campo>
            </div>
            <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-ink">
              <input type="checkbox" {...register('usaFormacao')} className="h-5 w-5 accent-primary" />
              Quero atuar na minha formação quando der
            </label>

            <fieldset aria-describedby={errors.disponibilidade ? 'erro-disp' : undefined}>
              <legend className={labelClass}>Quando você pode</legend>
              <div className="mt-2 overflow-x-auto rounded-md border border-border">
                <table className="w-full min-w-[420px] text-sm">
                  <thead>
                    <tr className="text-ink-muted">
                      <th scope="col" className="p-2 text-left font-semibold">Dia</th>
                      {TURNOS.map((t) => (
                        <th key={t} scope="col" className="p-2 font-semibold">{t}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DIAS.map((d) => (
                      <tr key={d} className="border-t border-border">
                        <th scope="row" className="p-2 text-left font-semibold text-ink">{d}</th>
                        {TURNOS.map((t) => {
                          const v = `${d} · ${t}`;
                          return (
                            <td key={t} className="p-0 text-center">
                              <label className="flex h-11 cursor-pointer items-center justify-center">
                                <input
                                  type="checkbox"
                                  aria-label={v}
                                  checked={disp.includes(v)}
                                  onChange={(e) =>
                                    setValue('disponibilidade', e.target.checked ? [...disp, v] : disp.filter((x) => x !== v), { shouldValidate: true })
                                  }
                                  className="h-5 w-5 accent-primary"
                                />
                              </label>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {errors.disponibilidade && <p id="erro-disp" className="mt-1 text-sm font-semibold text-on-accent-soft">{errors.disponibilidade.message}</p>}
            </fieldset>

            <fieldset>
              <legend className={labelClass}>Áreas de interesse</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {AREAS.map((a) => {
                  const on = areas.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setValue('areas', on ? areas.filter((x) => x !== a) : [...areas, a], { shouldValidate: true })}
                      className={cx(
                        'min-h-11 rounded-pill border px-4 text-sm font-semibold',
                        on ? 'border-primary bg-primary-soft text-on-primary-soft' : 'border-border-strong bg-bg-card text-ink-muted',
                      )}
                    >
                      {a}
                    </button>
                  );
                })}
              </div>
              {errors.areas && <p className="mt-1 text-sm font-semibold text-on-accent-soft">{errors.areas.message}</p>}
            </fieldset>
          </>
        )}

        {passo === 3 && (
          <>
            <section aria-labelledby="termo-titulo" className="flex flex-col gap-2">
              <h2 id="termo-titulo" className="text-lg font-bold text-ink">Termo de adesão ao serviço voluntário</h2>
              {termo.data && <p className="text-sm text-ink-muted">Versão {termo.data.versao}, publicada em {formatDate(termo.data.publicadoEm)} pelo Comitê Social ACIJS.</p>}
              <div tabIndex={0} className="max-h-64 overflow-y-auto rounded-md border border-border bg-bg-subtle p-4 text-sm text-ink" aria-label="Texto do termo (role para ler)">
                {termo.data ? <TermoTexto texto={termo.data.texto} /> : <p>Carregando o termo…</p>}
              </div>
            </section>
            <label className="flex min-h-11 cursor-pointer items-start gap-2 text-sm font-semibold text-ink">
              <input type="checkbox" {...register('termoAceito')} className="mt-0.5 h-5 w-5 accent-primary" />
              Li e aceito o termo de voluntariado. Data do aceite: {formatDate(isoDay(new Date()))}.
            </label>
            {errors.termoAceito && <p className="text-sm font-semibold text-on-accent-soft">{errors.termoAceito.message}</p>}
          </>
        )}

        <InlineError>{cadastrar.isError ? mensagemDeErro(cadastrar.error) : null}</InlineError>
        <div className="mt-2 flex flex-wrap justify-between gap-2">
          {passo > 0 ? (
            <Button variant="ghost" onClick={() => setPasso((p) => p - 1)}>
              Voltar
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit" disabled={cadastrar.isPending}>
            {passo < PASSOS.length - 1 ? 'Continuar' : cadastrar.isPending ? 'Enviando…' : 'Enviar cadastro'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Concluido({ id, registro, entidade, nome }: { id: string; registro: string; entidade: string; nome: string }) {
  const [foto, setFoto] = useState<string | null>(null);
  const [erroFoto, setErroFoto] = useState<string | null>(null);
  const toast = useToast();
  const fotoId = useId();

  const escolherFoto = (e: ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setErroFoto(null);
    const img = new Image();
    img.onload = async () => {
      // Reduz para 160px e JPEG: a foto vai para a carteirinha e precisa ser leve.
      const lado = 160;
      const canvas = document.createElement('canvas');
      canvas.width = lado;
      canvas.height = lado;
      const menor = Math.min(img.width, img.height);
      canvas.getContext('2d')!.drawImage(img, (img.width - menor) / 2, (img.height - menor) / 2, menor, menor, 0, 0, lado, lado);
      const url = canvas.toDataURL('image/jpeg', 0.8);
      URL.revokeObjectURL(img.src);
      try {
        await salvarFoto(id, url);
        setFoto(url);
        toast.show('Foto salva. Ela aparece na sua carteirinha.');
      } catch (err) {
        setErroFoto(mensagemDeErro(err));
      }
    };
    img.onerror = () => setErroFoto('Não conseguimos abrir essa imagem. Tente uma foto JPG ou PNG.');
    img.src = URL.createObjectURL(arquivo);
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
      <div className="flex items-start gap-3 rounded-lg bg-primary-soft p-5 text-on-primary-soft" role="status">
        <CircleCheck size={28} aria-hidden className="shrink-0" />
        <div>
          <p className="text-lg font-bold">Cadastro enviado. A entidade vai aprovar e você recebe um aviso.</p>
          <p className="text-sm">
            Valeu, {nome.split(' ')[0]}! A {entidade} já vê seu cadastro. Seu número de voluntário é <strong className="tabular-nums">{registro}</strong>.
          </p>
        </div>
      </div>
      <section aria-labelledby="foto-titulo" className="flex flex-col gap-3 rounded-lg border border-border bg-bg-card p-5 shadow-card">
        <h2 id="foto-titulo" className="text-lg font-bold text-ink">Sua foto para a carteirinha (opcional)</h2>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg bg-bg-subtle text-sm text-ink-muted">
            {foto ? <img src={foto} alt="Prévia da sua foto" className="h-full w-full object-cover" /> : 'Sem foto'}
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={fotoId} className={labelClass}>Escolher foto</label>
            <input id={fotoId} type="file" accept="image/*" onChange={escolherFoto} className="text-sm text-ink" />
          </div>
        </div>
        <InlineError>{erroFoto}</InlineError>
      </section>
      <p className="text-sm text-ink-muted">
        No protótipo, entre como <strong>AMA Jaraguá</strong> (se escolheu ela) para ver seu cadastro em Voluntários, aguardando aprovação.
      </p>
      <div className="flex flex-wrap gap-2">
        <ButtonLink to="/oportunidades">Ver oportunidades</ButtonLink>
        <ButtonLink to="/" variant="secondary">Voltar para o início</ButtonLink>
      </div>
    </div>
  );
}
