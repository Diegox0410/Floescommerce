# Hito A — DGNG Premium Admin Core

Admin core implementado con dashboard ejecutivo, shell independiente y diez rutas administrativas. La única modificación de código público está en `src/App.tsx`, para integrar las rutas; las rutas y los componentes de la tienda se conservaron.

## Archivos creados

- `src/admin/components/AdminModulePlaceholder.tsx`
- `src/admin/components/AdminSectionHeader.tsx`
- `src/admin/components/AdminSidebar.tsx`
- `src/admin/components/AdminStatCard.tsx`
- `src/admin/components/AdminTopbar.tsx`
- `src/admin/components/AlertList.tsx`
- `src/admin/components/ProjectionCard.tsx`
- `src/admin/components/SalesChart.tsx`
- `src/admin/components/TopProductsTable.tsx`
- `src/admin/components/format.ts`
- `src/admin/data/adminDemoData.ts`
- `src/admin/data/adminNavigation.ts`
- `src/admin/layout/AdminLayout.tsx`
- `src/admin/pages/AdminAnalytics.tsx`
- `src/admin/pages/AdminCustomers.tsx`
- `src/admin/pages/AdminDashboard.tsx`
- `src/admin/pages/AdminFinance.tsx`
- `src/admin/pages/AdminInventory.tsx`
- `src/admin/pages/AdminMarketing.tsx`
- `src/admin/pages/AdminOrders.tsx`
- `src/admin/pages/AdminProducts.tsx`
- `src/admin/pages/AdminProjection.tsx`
- `src/admin/pages/AdminSettings.tsx`
- `src/admin/types/admin.ts`
- `src/styles/admin.css`

- `docs/HITO-A-ADMIN-CORE.md` (esta entrega).

## Archivos modificados

- `src/App.tsx`: imports administrativos y rama `/admin` con nested routes, `AdminLayout` y `Outlet`. Incluye estado de ruta administrativa desconocida dentro del propio shell.
- `dist/`: salida regenerada por `npm run build`, ignorada según la configuración existente.

No se modificaron main.tsx, siteConfig.ts, global.css, dependencias, lockfile, StoreLayout, páginas públicas ni stores Zustand.

## Rutas creadas y verificadas en navegador

| Ruta | Página | Resultado |
| --- | --- | --- |
| `/admin` | Dashboard | Carga, opción activa correcta |
| `/admin/productos` | Productos | Módulo preparado, opción activa correcta |
| `/admin/inventario` | Inventario | Módulo preparado, opción activa correcta |
| `/admin/pedidos` | Pedidos | Módulo preparado, opción activa correcta |
| `/admin/clientes` | Clientes | Módulo preparado, opción activa correcta |
| `/admin/finanzas` | Finanzas | Módulo preparado, opción activa correcta |
| `/admin/proyeccion` | Proyección | Módulo preparado, opción activa correcta |
| `/admin/analitica` | Analítica | Módulo preparado, opción activa correcta |
| `/admin/marketing` | Marketing | Módulo preparado, opción activa correcta |
| `/admin/configuracion` | Configuración | Módulo preparado, opción activa correcta |

## Componentes y decisiones

- AdminSidebar: navegación NavLink, OWNER local, configuración separada y Ver tienda.
- AdminTopbar: módulo actual, propietario y modo demo.
- AdminLayout: sidebar fijo y contraíble, drawer móvil, área Outlet; sin Header/Footer públicos.
- AdminSectionHeader y AdminStatCard: estructura y tarjetas reutilizables.
- SalesChart: SVG ligero con ventas y utilidad de siete días, leyenda y descripción accesible; no requiere librería adicional.
- ProjectionCard: cálculo dinámico, progreso y estado según meta y ritmo del escenario.
- TopProductsTable: columnas de producto, categoría, unidades, ventas y utilidad.
- AlertList: tipo, descripción, prioridad y enlaces al módulo correspondiente.
- AdminModulePlaceholder: contenido compartido para los nueve módulos preparados.
- Tipos explícitos sin any; todos los datasets demo están centralizados en adminDemoData.ts.
- adminNavigation.ts centraliza navegación y metadatos de los módulos.
- Formato monetario toma USD de siteConfig, con locale es-EC.
- CSS administrativo utiliza prefijo admin y variables DGNG existentes para aislar el diseño.
- OWNER es exclusivamente una identidad demo, reemplazable por un proveedor de autenticación posterior.
- El escenario de proyección es fijo: mes de 30 días con 12 restantes, independiente del periodo actual mostrado en el encabezado.

## Proyección demo

Meta: $5.000; ventas actuales: $3.240; avance: 64,8%; faltante: $1.760; necesario por día: $146,67; proyección de cierre: $5.400. Estado: En camino. La proyección usa ritmo lineal de los 18 días transcurridos del escenario.

## Verificación

- Desktop: dashboard y sidebar revisados visualmente; colapso confirmado.
- Tablet: viewport 1024 × 768 revisado visualmente.
- Mobile: viewport 390 × 844 revisado visualmente, sin overflow horizontal del documento.
- Drawer: apertura, cierre al navegar, bloqueo del fondo, foco inicial, ciclo Tab/Shift+Tab, cierre con Escape y devolución del foco verificados.
- Tabla: contenedor con overflow horizontal para pantallas estrechas.
- Todas las rutas administrativas cargan sin cabecera pública.
- `/`, `/catalogo`, `/producto/demo-01` y `/carrito` cargan con layout público.
- `/checkout` con carrito vacío conserva la redirección existente a `/carrito`.
- `/pedido-confirmado` sin pedido conserva la redirección existente a `/`.
- Consola del navegador: sin errores observados en la revisión.

## Calidad

`npm run build`: PASÓ, TypeScript y bundle de producción generados (exit 0).

Persisten advertencias previas de Lightning CSS para las directivas @theme y @tailwind de la configuración actual. No se modificó la configuración CSS de la tienda en este hito.

`npm run lint`: FALLÓ por tres errores existentes de react-hooks/set-state-in-effect en archivos públicos conservados:

- src/components/search/SearchOverlay.tsx:44 — setQuery dentro de effect.
- src/pages/Catalog.tsx:46 — setSelectedCategory dentro de effect.
- src/pages/Catalog.tsx:52 — setSearch dentro de effect.

`npx eslint src/admin src/App.tsx`: PASÓ, sin errores. No se desactivaron reglas ni se añadieron supresiones.

## Git

Los comandos solicitados `git status --short --branch`, `git log -3 --oneline` y `git status --short` devolvieron:

```text
fatal: not a git repository (or any of the parent directories): .git
```

Esta carpeta no contiene repositorio Git. No se inicializó un repositorio ni se creó un commit.

## Próximo hito

Implementar las operaciones del módulo que se priorice y definir contratos de datos, persistencia y autenticación OWNER cuando se autoricen. Este hito entrega únicamente admin core, dashboard, shell y rutas; no incluye CRUD real, backend ni autenticación real.
