import { useId, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@gera/design-system';
import { labelClass } from '../ui/form';

/** Texto para copiar (Pix copia e cola, linha do boleto). Se o navegador negar a cópia, seleciona o texto. */
export function CopyField({ label, value }: { label: string; value: string }) {
  const id = useId();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      ref.current?.focus();
      ref.current?.select();
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={labelClass}>{label}</label>
      <textarea
        id={id}
        ref={ref}
        readOnly
        value={value}
        rows={3}
        className="w-full resize-none break-all rounded-md border border-border-strong bg-bg-subtle px-3 py-2 font-mono text-xs text-ink"
        onFocus={(e) => e.target.select()}
      />
      <Button variant="secondary" className="self-start" onClick={copiar}>
        {copiado ? <Check size={18} aria-hidden /> : <Copy size={18} aria-hidden />} {copiado ? 'Copiado' : 'Copiar'}
      </Button>
    </div>
  );
}
