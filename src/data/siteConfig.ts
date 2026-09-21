export const siteConfig = {
  brand: {
    name: "FLOES",
    fullName: "FLOES.ec",
    tagline: "Más que productos, un estilo de vida.",
    logo: "/images/brand/dgng-logo.jpg",
    cover: "/images/brand/dgng-cover.jpg",
  },

  announcement: {
    enabled: true,
    text: "Confección hecha en Ecuador",
    linkText: "Ver catálogo",
    href: "/catalogo",
  },

  store: {
    country: "Ecuador",
    origin: "Confección nacional",
    currency: "USD",
  },

  navigation: [
    {
      label: "Inicio",
      href: "/",
    },
    {
      label: "Catálogo",
      href: "/catalogo",
    },
    {
      label: "Cuidado personal",
      href: "/catalogo?categoria=cuidado-personal",
    },
    {
      label: "Bienestar",
      href: "/catalogo?categoria=bienestar",
    },
    {
      label: "Ofertas",
      href: "/catalogo?filter=ofertas",
    },
  ],

  social: {
    instagram: "#",
    facebook: "#",
    tiktok: "#",
  },

  contact: {
    whatsapp: "",
    email: "",
  },
};