/** Telas do site público que já têm rota e ainda não têm conteúdo. */
export const PUBLIC_PLACEHOLDERS: Array<{ path: string; title: string; summary: string }> = [
  { path: 'oportunidades', title: 'Oportunidades', summary: 'Oportunidades de voluntariado filtráveis por área (Educação, Meio ambiente, Esporte, Cultura, Saúde, Assistência social), entidade, data, turno e “usa minha formação”.' },
  { path: 'oportunidades/:id', title: 'Oportunidade', summary: 'Descrição, entidade, local, vagas restantes e o botão “Quero participar”.' },
  { path: 'eventos', title: 'Eventos', summary: 'Próximos eventos das entidades, gratuitos e pagos.' },
  { path: 'eventos/:slug', title: 'Evento', summary: 'Banner, fotos, descrição, local com mapa, data, horário, organizador e os tipos de ingresso.' },
  { path: 'eventos/:slug/ingressos', title: 'Ingressos', summary: 'Ingressos por tipo (Gratuito, Pago, VIP, Mesa, Patrocinador, Combo) com quantidade, preço e disponibilidade.' },
  { path: 'campanhas', title: 'Campanhas', summary: 'Campanhas ativas das entidades, com meta, valor arrecadado e prazo.' },
  { path: 'campanhas/:slug', title: 'Campanha', summary: 'História, fotos, meta e barra de progresso, com apoio por Pix, cartão ou doação mensal.' },
  { path: 'loja', title: 'Loja solidária', summary: 'Produtos das entidades (camisetas, canecas, livros, rifas, artesanato) com filtro por entidade.' },
  { path: 'loja/:produto', title: 'Produto', summary: 'Variações de tamanho e cor, estoque visível e o botão de compra.' },
  { path: 'carrinho', title: 'Carrinho', summary: 'Produtos e ingressos escolhidos, com retirada ou entrega.' },
  { path: 'checkout', title: 'Pagamento', summary: 'Pix (QR, copia e cola e contagem regressiva), cartão com parcelamento ou boleto.' },
  { path: 'entidades', title: 'Entidades', summary: 'As entidades sociais do comitê, com causa, impacto, eventos e campanhas.' },
  { path: 'entidades/:slug', title: 'Entidade', summary: 'Perfil da entidade com causa, impacto, eventos e campanhas.' },
  { path: 'parceiros', title: 'Parceiros', summary: 'Empresas parceiras e seus benefícios para voluntários, por categoria (Alimentação, Saúde, Educação).' },
  { path: 'validar/:token', title: 'Validar carteirinha', summary: 'Validação pública da carteirinha: nome, entidade, status, horas e validade.' },
  { path: 'cadastro', title: 'Quero ser voluntário', summary: 'Cadastro em 4 passos: dados pessoais, endereço (o CEP preenche o resto), perfil e aceite do termo de voluntariado.' },
];
