/** Dígitos verificadores do CPF a partir dos 9 primeiros dígitos. */
function checkDigits(base: number[]): [number, number] {
  const dv = (digits: number[]) => {
    const sum = digits.reduce((acc, d, i) => acc + d * (digits.length + 1 - i), 0);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  const d1 = dv(base);
  return [d1, dv([...base, d1])];
}

export function isValidCpf(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  const nums = [...digits].map(Number);
  const [d1, d2] = checkDigits(nums.slice(0, 9));
  return nums[9] === d1 && nums[10] === d2;
}

/** Monta um CPF válido a partir de 9 dígitos (usado nos dados de exemplo). */
export function cpfFromBase(base: number[]): string {
  const all = [...base, ...checkDigits(base)].join('');
  return `${all.slice(0, 3)}.${all.slice(3, 6)}.${all.slice(6, 9)}-${all.slice(9)}`;
}

/** LGPD: em listas, só o miolo do CPF aparece (***.456.789-**). */
export function maskCpf(cpf: string): string {
  const d = cpf.replace(/\D/g, '');
  return d.length === 11 ? `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**` : '***';
}
