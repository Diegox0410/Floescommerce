export const siteConfig = {
  brand: {
    name: "FLOES",
    fullName: "FLOES.ec",
    tagline: "Confección para salud, belleza y bienestar.",
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
      label: "Uniformes",
      href: "/catalogo?categoria=uniformes",
    },
    {
      label: "Sábanas",
      href: "/catalogo?categoria=sabanas",
    },
    {
      label: "Ofertas",
      href: "/catalogo?filter=ofertas",
    },
  ],

  social: {
    instagram: "https://www.instagram.com/floes.ec/",
    facebook: "#",
    tiktok: "#",
  },

  contact: {
    whatsapp: "",
    email: "",
  },
};
