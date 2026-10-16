/** "Jantar Beneficente da AMA" → "jantar-beneficente-da-ama". */
export const slugify = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

/** Slug que ainda não existe na lista (acrescenta -2, -3…). */
export function slugUnico(texto: string, existentes: string[], atual?: string) {
  const base = slugify(texto) || 'item';
  let slug = base;
  for (let n = 2; existentes.includes(slug) && slug !== atual; n++) slug = `${base}-${n}`;
  return slug;
}
