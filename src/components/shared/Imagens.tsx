import { useId, useState, type ChangeEvent } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { Button, cx } from '@gera/design-system';
import { ErroDeImagem, prepararImagem, type TipoImagem } from '../../lib/imagem';
import type { MarcaDaEntidade } from '../../lib/marca';
import { mensagemDeErro } from '../../services/hooks';
import { InlineError } from './States';
import { useToast } from './Toast';

const iniciaisDe = (nome: string) =>
  nome
    .split(/\s+/)
    .filter((p) => p.length > 2 || /^[A-ZÀ-Ý]/.test(p))
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');

interface AvatarProps {
  /** Data URL da foto ou do logo. Sem ela, aparecem as iniciais. */
  src?: string;
  nome: string;
  /** "Logo" para entidades e empresas, "Foto de" para pessoas. */
  tipo?: 'logo' | 'foto';
  /** Lado em pixels. */
  tamanho?: number;
  /** Cor da entidade: nas iniciais só vira fundo se o texto passar de 4,5:1; senão fica só na borda. */
  marca?: MarcaDaEntidade;
  className?: string;
}

/** Foto de perfil (voluntário) ou logo (entidade e empresa), quadrada e recortada em círculo. */
export function Avatar({ src, nome, tipo = 'logo', tamanho = 40, className, marca }: AvatarProps) {
  const alt = tipo === 'logo' ? `Logo: ${nome}` : `Foto de ${nome}`;
  const lado = { width: tamanho, height: tamanho };
  if (src) {
    return <img src={src} alt={alt} style={lado} className={cx('shrink-0 rounded-full bg-bg-subtle object-cover', className)} />;
  }
  const corNoFundo = marca?.texto;
  return (
    <span
      role="img"
      aria-label={alt}
      style={{ ...lado, ...(marca?.estilo ?? {}), fontSize: Math.max(12, tamanho * 0.38) }}
      className={cx(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full font-bold',
        corNoFundo
          ? 'bg-[var(--cor-entidade)] text-[color:var(--texto-cor-entidade)]'
          : cx('bg-bg-subtle text-ink', marca && 'border-2 border-[var(--cor-entidade)]'),
        className,
      )}
    >
      <span aria-hidden>{iniciaisDe(nome) || '?'}</span>
    </span>
  );
}

interface UploadImagemProps {
  tipo: TipoImagem;
  /** Nome do campo, ex.: "Foto de perfil da entidade". Também é o rótulo do seletor de arquivo. */
  titulo: string;
  /** Texto alternativo da prévia (com o nome da entidade, da empresa ou da pessoa). */
  alt: string;
  valor?: string;
  dica?: string;
  /** Salva a imagem já reduzida; recebe null quando a pessoa remove. Deve lançar com a mensagem pronta se não der. */
  onSalvar: (dataUrl: string | null) => Promise<unknown>;
}

/** Enviar, trocar e remover uma foto ou banner, com prévia. A imagem é recortada e reduzida no navegador. */
export function UploadImagem({ tipo, titulo, alt, valor, dica, onSalvar }: UploadImagemProps) {
  const id = useId();
  const toast = useToast();
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const banner = tipo === 'banner';

  const executar = async (acao: () => Promise<string | null>, ok: string) => {
    setErro(null);
    setOcupado(true);
    try {
      await onSalvar(await acao());
      toast.show(ok);
    } catch (e) {
      setErro(e instanceof ErroDeImagem ? e.message : mensagemDeErro(e));
    } finally {
      setOcupado(false);
    }
  };

  const escolher = (e: ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (arquivo) void executar(() => prepararImagem(arquivo, tipo), `${titulo} salva.`);
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-ink">{titulo}</p>
      <div className={cx('flex gap-4', banner ? 'flex-col' : 'flex-wrap items-center')}>
        <div
          className={cx(
            'flex items-center justify-center overflow-hidden border border-border bg-bg-subtle text-sm text-ink-muted',
            banner ? 'aspect-[16/5] w-full max-w-md rounded-md' : 'h-24 w-24 rounded-full',
          )}
        >
          {valor ? <img src={valor} alt={alt} className="h-full w-full object-cover" /> : 'Sem imagem'}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor={id} className="gr-btn gr-btn--secondary cursor-pointer has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus-ring">
              <ImagePlus size={18} aria-hidden /> {ocupado ? 'Enviando…' : valor ? 'Trocar imagem' : 'Escolher imagem'}
              <span className="sr-only">: {titulo}</span>
              <input id={id} type="file" accept="image/jpeg,image/png,image/webp" onChange={escolher} disabled={ocupado} className="sr-only" />
            </label>
            {valor && (
              <Button type="button" variant="ghost" disabled={ocupado} onClick={() => void executar(async () => null, `${titulo} removida.`)} aria-label={`Remover: ${titulo}`}>
                <Trash2 size={16} aria-hidden /> Remover
              </Button>
            )}
          </div>
          <p className="text-sm text-ink-muted">{dica ?? (banner ? 'JPG, PNG ou WebP. Cortada em 16:5 (1600 × 500).' : 'JPG, PNG ou WebP. Cortada em quadrado.')}</p>
        </div>
      </div>
      <InlineError>{erro}</InlineError>
    </div>
  );
}
