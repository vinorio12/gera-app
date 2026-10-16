/** Marcos de horas do voluntário: cada um é um dente a mais na cremalheira. */
export const MARCOS = [10, 50, 100, 250] as const;

export interface ProgressoMarcos {
  atingidos: number[];
  proximo: number | null;
  /** Horas que faltam para o próximo marco (0 quando todos foram atingidos). */
  faltam: number;
}

export function progressoMarcos(totalHoras: number): ProgressoMarcos {
  const atingidos = MARCOS.filter((m) => totalHoras >= m);
  const proximo = MARCOS.find((m) => totalHoras < m) ?? null;
  return { atingidos: [...atingidos], proximo, faltam: proximo ? Math.max(0, proximo - totalHoras) : 0 };
}
