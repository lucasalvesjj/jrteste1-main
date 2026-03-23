export const company = {
  name: "Comercial JR LTDA",
  shortName: "Comercial JR",
  slogan: "Sua casa de máquinas, ferramentas e irrigação.",
  description:
    "Com mais de 18.000 produtos, atendemos com foco em máquinas, ferramentas, irrigação e acessórios. São mais de 41 anos de tradição no mercado capixaba.",
  phone: "(28) 3542-1332 / (28) 99945-6792",
  whatsapp: "5528999456792",
  email: "contato@comercialjrltda.com.br",
  address: "Castelo - ES",
  fullAddress: "Av. Nossa Senhora da Penha, 1320 - Centro, Castelo - ES",
  mapsUrl: "https://maps.app.goo.gl/CZqaLr24pM5C4HvQ8",
  businessHours: "Seg a Sex: 7h às 17h | Sáb: 7h às 11:30h",
  serviceArea: "Atendimento em Castelo, região sul do Espírito Santo e vendas online para todo o Brasil.",
  social: {
    facebook: "https://www.facebook.com/comercialjrltda",
    instagram: "https://www.instagram.com/comercialjrltda",
  },
  store: "https://loja.comercialjrltda.com.br/",
  siteUrl: "https://comercialjrltda.com.br",
  stats: {
    products: 18000,
    clients: 15000,
    years: 41,
  },
  seo: {
    title: "Comercial JR LTDA - Máquinas, Ferramentas e Irrigação",
    description:
      "Referência em máquinas, ferramentas e irrigação no Espírito Santo. Mais de 18.000 produtos, 41 anos de tradição e frete grátis para todo o ES.",
    image: "/og-image.jpg",
  },
};

export const navLinks = [
  { label: "Início", href: "/" },
  {
    label: "Segmentos",
    href: "/segmentos",
    children: [
      { label: "Irrigação", href: "/segmentos/irrigacao" },
      { label: "Ferramentas", href: "/segmentos/ferramentas" },
      { label: "Máquinas", href: "/segmentos/maquinas" },
    ],
  },
  {
    label: "Loja",
    href: "https://loja.comercialjrltda.com.br/",
    external: true,
    children: [
      { label: "Irrigação", href: "https://loja.comercialjrltda.com.br/marcas/agrologic", external: true },
      { label: "Ferramentas", href: "https://loja.comercialjrltda.com.br/jogo-de-ferramentas", external: true },
      { label: "Máquinas", href: "https://loja.comercialjrltda.com.br/ferramentas-eletricas", external: true },
    ],
  },
  { label: "Nossa História", href: "/nossa-historia" },
  { label: "Blog", href: "/blog" },
  { label: "Contato", href: "/contato" },
];

export const brands = [
  {
    name: "STIHL",
    description:
      "Reconhecida pela robustez e pelo alto padrão de qualidade em soluções para corte, poda e manutenção.",
  },
  {
    name: "TIGRE",
    description:
      "Marca líder em soluções para construção, reforma e condução de água com excelente confiabilidade.",
  },
  {
    name: "AMANCO",
    description:
      "Linha completa para instalações hidráulicas e irrigação com praticidade no dia a dia do campo e da obra.",
  },
  {
    name: "DeWalt",
    description: "Referência mundial em ferramentas elétricas profissionais, desempenho e durabilidade.",
  },
];
