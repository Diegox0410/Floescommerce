export const siteConfig = {
  brand: {
    name: "DGNG",
    fullName: "DGNG Store",
    tagline: "Más que productos, un estilo de vida.",
    logo: "/images/brand/dgng-logo.jpg",
    cover: "/images/brand/dgng-cover.jpg",
  },

  announcement: {
    enabled: true,
    text: "Productos importados de USA",
    linkText: "Ver catálogo",
    href: "/catalogo",
  },

  store: {
    country: "Ecuador",
    origin: "Importados de USA",
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