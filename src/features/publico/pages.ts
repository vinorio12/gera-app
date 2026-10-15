/** Telas do site público que já têm rota e ainda não têm conteúdo. */
export const PUBLIC_PLACEHOLDERS: Array<{ path: string; title: string; summary: string }> = [
  { path: 'eventos/:slug/ingressos', title: 'Ingressos', summary: 'Ingressos por tipo (Gratuito, Pago, VIP, Mesa, Patrocinador, Combo) com quantidade, preço e disponibilidade.' },
  { path: 'checkout', title: 'Pagamento', summary: 'Pix (QR, copia e cola e contagem regressiva), cartão com parcelamento ou boleto.' },
  { path: 'validar/:token', title: 'Validar carteirinha', summary: 'Validação pública da carteirinha: nome, entidade, status, horas e validade.' },
  { path: 'cadastro', title: 'Quero ser voluntário', summary: 'Cadastro em 4 passos: dados pessoais, endereço (o CEP preenche o resto), perfil e aceite do termo de voluntariado.' },
];
