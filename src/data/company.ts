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
    title: "Comercial JR LTDA - Máquinas, Ferramentas e Irrigação em Castelo ES",
    description:
      "Referência em máquinas elétricas, ferramentas, irrigação, bombas e motores no Espírito Santo. Revenda autorizada STIHL. Mais de 18.000 produtos, 41 anos de tradição.",
    image: "/og-image.jpg",
  },
};

export const navLinks = [
  { label: "Início", href: "/" },
  {
    label: "Segmentos",
    href: "/segmentos",
    children: [
      { label: "Assistência Técnica STIHL", href: "/segmentos/assistencia-stihl" },
      { label: "Bombas e Motores", href: "/segmentos/bombas-e-motores" },
      { label: "Ferramentas Manuais", href: "/segmentos/ferramentas" },
      { label: "Irrigação Agrícola", href: "/segmentos/irrigacao" },
      { label: "Locação de Equipamentos", href: "/segmentos/locacao" },
      { label: "Máquinas Elétricas", href: "/segmentos/maquinas" },
      { label: "Poços Artesianos", href: "/segmentos/pocos-artesianos" },
    ],
  },
  {
    label: "Loja",
    href: "https://loja.comercialjrltda.com.br/",
    external: true,
    children: [
      { label: "Ferramentas Elétricas", href: "https://loja.comercialjrltda.com.br/ferramentas-eletricas", external: true },
      { label: "Esmerilhadeira", href: "https://loja.comercialjrltda.com.br/esmerilhadeira", external: true },
      { label: "Furadeira", href: "https://loja.comercialjrltda.com.br/furadeira", external: true },
      { label: "Lixadeiras", href: "https://loja.comercialjrltda.com.br/lixadeira", external: true },
      { label: "Martelete", href: "https://loja.comercialjrltda.com.br/martelete", external: true },
      { label: "Parafusadeiras", href: "https://loja.comercialjrltda.com.br/parafusadeira", external: true },
      { label: "Politriz", href: "https://loja.comercialjrltda.com.br/politriz", external: true },
      { label: "Serra Circular", href: "https://loja.comercialjrltda.com.br/serra-circular", external: true },
      { label: "Serra Mármore", href: "https://loja.comercialjrltda.com.br/serra-marmore", external: true },
      { label: "Serra Tico-Tico", href: "https://loja.comercialjrltda.com.br/serra-tico-tico", external: true },
      { label: "Soprador Térmico", href: "https://loja.comercialjrltda.com.br/soprador-termico", external: true },
      { label: "Chave Elétrica", href: "https://loja.comercialjrltda.com.br/chave-eletrica", external: true },
      { label: "Ferramentas Manuais", href: "https://loja.comercialjrltda.com.br/ferramentas-manuais", external: true },
      { label: "Inversoras", href: "https://loja.comercialjrltda.com.br/inversoras", external: true },
      { label: "Pistolas de Pintura", href: "https://loja.comercialjrltda.com.br/pistola-de-pintura", external: true },
    ],
  },
  { label: "Nossa História", href: "/nossa-historia" },
  { label: "Blog", href: "/blog" },
  { label: "Contato", href: "/contato" },
];

export const brands = [
  { name: "STIHL", description: "Reconhecida pela robustez e alto padrão de qualidade em soluções para corte, poda e manutenção. Revenda e assistência técnica autorizada na Comercial JR." },
  { name: "TIGRE", description: "Marca líder em soluções para construção, reforma e condução de água com excelente confiabilidade." },
  { name: "AMANCO", description: "Linha completa para instalações hidráulicas e irrigação com praticidade no dia a dia do campo e da obra." },
  { name: "DeWalt", description: "Referência mundial em ferramentas elétricas profissionais, desempenho e durabilidade." },
  { name: "WEG", description: "Líder nacional em motores elétricos, com soluções para uso agrícola, industrial e doméstico." },
  { name: "Gedore", description: "Ferramentas manuais de precisão alemã para profissionais exigentes de todos os setores." },
];
