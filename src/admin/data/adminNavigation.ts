import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Megaphone,
  Settings,
  Store,
} from "lucide-react";
export const adminNavigation = [
  { path: "", title: "Dashboard", icon: LayoutDashboard, group: "ESPACIO DE TRABAJO" },

  {
    path: "pedidos",
    title: "Pedidos",
    icon: ShoppingBag,
    group: "VENTAS",
    description:
      "Consulta pedidos y acompaña su preparación, entrega y estado.",
    features: [
      "Listado de pedidos",
      "Estados y seguimiento",
      "Detalle de compra",
    ],
  },
  {
    path: "clientes",
    title: "Clientes",
    icon: Users,
    group: "VENTAS",
    description: "Conoce a tus clientes, su historial y su relación con FLOES.",
    features: ["Perfiles de clientes", "Historial de compras", "Segmentos"],
  },
  {
    path: "marketing",
    title: "Marketing",
    icon: Megaphone,
    group: "CRECIMIENTO",
    description: "Prepara campañas y estrategias para impulsar tu tienda.",
    features: [
      "Planificación de campañas",
      "Promociones",
      "Resultados comerciales",
    ],
  },
  {
    path: "tienda",
    title: "Tienda",
    icon: Store,
    group: "TIENDA",
    description: "Controla identidad, Home, navegación, contacto, comercio y SEO.",
    features: ["Storefront", "Categorías", "Configuración comercial"],
  },
  {
    path: "configuracion",
    title: "Configuración",
    icon: Settings,
    group: "SISTEMA",
    description:
      "Centraliza las preferencias de FLOES y la información del propietario.",
    features: [
      "Información del negocio",
      "Preferencias del panel",
      "Perfil OWNER",
    ],
  },
];
