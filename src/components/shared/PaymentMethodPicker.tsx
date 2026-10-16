import { Barcode, CreditCard, QrCode, type LucideIcon } from 'lucide-react';
import { cx } from '@gera/design-system';
import type { MetodoPagamento } from '../../types/domain';

const METODOS: Array<{ id: MetodoPagamento; label: string; detalhe: string; icon: LucideIcon }> = [
  { id: 'pix', label: 'Pix', detalhe: 'Aprovação na hora', icon: QrCode },
  { id: 'cartao', label: 'Cartão de crédito', detalhe: 'Até 3x sem juros', icon: CreditCard },
  { id: 'boleto', label: 'Boleto', detalhe: 'Compensa em até 2 dias úteis', icon: Barcode },
];

interface PaymentMethodPickerProps {
  value: MetodoPagamento;
  onChange: (m: MetodoPagamento) => void;
  /** Métodos indisponíveis e o porquê (ex.: doação mensal só no cartão). */
  indisponiveis?: Partial<Record<MetodoPagamento, string>>;
}

/** Escolha da forma de pagamento: rádios em cartões, com o motivo quando um método não vale. */
export function PaymentMethodPicker({ value, onChange, indisponiveis = {} }: PaymentMethodPickerProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-semibold text-ink">Forma de pagamento</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {METODOS.map(({ id, label, detalhe, icon: Icon }) => {
          const motivo = indisponiveis[id];
          const ativo = value === id;
          return (
            <label
              key={id}
              className={cx(
                'flex min-h-11 cursor-pointer items-start gap-3 rounded-md border px-3 py-3',
                ativo ? 'border-primary bg-primary-soft' : 'border-border-strong bg-bg-card',
                motivo && 'cursor-not-allowed opacity-60',
              )}
            >
              <input
                type="radio"
                name="metodo-pagamento"
                value={id}
                checked={ativo}
                disabled={!!motivo}
                onChange={() => onChange(id)}
                className="mt-1 h-4 w-4 accent-primary"
              />
              <span className="flex flex-col">
                <span className="flex items-center gap-2 font-semibold text-ink">
                  <Icon size={18} aria-hidden /> {label}
                </span>
                <span className="text-sm text-ink-muted">{motivo ?? detalhe}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
