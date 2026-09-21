import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingBag,
  Users,
  Wallet,
  TrendingUp,
  ChartNoAxesCombined,
  Megaphone,
  Settings,
  Store,
} from "lucide-react";
export const adminNavigation = [
  { path: "", title: "Dashboard", icon: LayoutDashboard },
  {
    path: "productos",
    title: "Productos",
    icon: Package,
    description:
      "Gestiona catálogo, precios, costos, stock, imágenes y estados.",
    features: [
      "Catálogo y estados",
      "Precios y costos",
      "Imágenes de producto",
    ],
  },
  {
    path: "inventario",
    title: "Inventario",
    icon: Boxes,
    description: "Controla entradas, salidas, stock mínimo y valorización.",
    features: ["Entradas y salidas", "Alertas de stock", "Valorización"],
  },
  {
    path: "pedidos",
    title: "Pedidos",
    icon: ShoppingBag,
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
    description: "Conoce a tus clientes, su historial y su relación con FLOES.",
    features: ["Perfiles de clientes", "Historial de compras", "Segmentos"],
  },
  {
    path: "finanzas",
    title: "Finanzas",
    icon: Wallet,
    description: "Organiza ventas, costos, pagos y utilidad del negocio.",
    features: [
      "Ingresos y costos",
      "Pagos por confirmar",
      "Resumen de utilidad",
    ],
  },
  {
    path: "proyeccion",
    title: "Proyección",
    icon: TrendingUp,
    description: "Simula ventas, metas, márgenes y escenarios.",
    features: [
      "Metas mensuales",
      "Escenarios de ventas",
      "Estimación de márgenes",
    ],
  },
  {
    path: "analitica",
    title: "Analítica",
    icon: ChartNoAxesCombined,
    description:
      "Entiende el rendimiento de la tienda y descubre oportunidades.",
    features: [
      "Indicadores de rendimiento",
      "Tendencias de ventas",
      "Rendimiento del catálogo",
    ],
  },
  {
    path: "marketing",
    title: "Marketing",
    icon: Megaphone,
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
    description: "Controla identidad, Home, navegación, contacto, comercio y SEO.",
    features: ["Storefront", "Categorías", "Configuración comercial"],
  },
  {
    path: "configuracion",
    title: "Configuración",
    icon: Settings,
    description:
      "Centraliza las preferencias de FLOES y la información del propietario.",
    features: [
      "Información del negocio",
      "Preferencias del panel",
      "Perfil OWNER",
    ],
  },
];
