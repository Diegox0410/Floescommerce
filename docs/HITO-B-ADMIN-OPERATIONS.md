# Hito B — DGNG Premium Admin Operations

Auditoría de cierre: 14 de septiembre de 2026. Proyecto: `C:\Users\User\commerce-builder`.

## Alcance y resultado

El Admin opera productos, costos, inventario, pedidos y clientes sobre datos persistidos localmente. El storefront comparte el catálogo y el checkout genera pedidos con snapshots históricos. Esta continuación conserva la implementación existente y termina su auditoría; no implementa Hito C ni crea commits.

Veredicto y resultados finales se registran al final de este documento.

## Arquitectura final

React, TypeScript, React Router y Zustand con middleware `persist`. Las páginas presentan información y llaman acciones de dominio; los stores contienen cambios de estado y validaciones. Los helpers normalizan datos antiguos y calculan métricas. `demoProducts` se usa únicamente para inicializar Product Store cuando no existe colección persistida; una colección vacía no se repuebla.

### Modelos

| Modelo | Contenido |
| --- | --- |
| Product | ID, SKU, slug, nombre, categoría, marca, descripción, descripción corta, precio, precio anterior opcional, costo producto/importación/otros, stock, mínimo, imágenes, badge, destacado, best seller, activo y timestamps. |
| InventoryMovement | ID, batchId, producto y nombre snapshot, entrada/salida/ajuste, cantidad, stock anterior/nuevo, motivo y fecha. |
| Order | ID y fechas, customerId, contacto y entrega snapshot, artículos con productId/nombre/SKU/precio/costo/cantidad, método y estado de pago, estado operativo, subtotal/envío/descuento/total, costo/utilidad estimados, notas e inventoryCommitted. |
| Customer | ID, contacto, ubicación, etiquetas, notas y fechas. Cantidad de pedidos, gasto, ticket y última compra se derivan del historial. |

### Stores y persistencia

| Store | Clave localStorage | Responsabilidad |
| --- | --- | --- |
| useProductStore | dgng-products (v1) | CRUD, SKU/slug únicos, validación numérica, activación, stock absoluto y appliedInventoryBatches. |
| useInventoryStore | dgng-inventory (v1) | Movimientos, validación completa de lotes, pendingBatch y recuperación. |
| useOrderStore | dgng-orders (v1) | Registro, estados, pagos, notas, confirmación/cancelación y reconciliación con lotes aplicados. |
| useCustomerStore | dgng-customers (v1) | Upsert desde pedido, deduplicación por correo o teléfono, etiquetas y notas. |
| useCheckoutStore | dgng-last-order (v1) | Guarda lastOrderId; migra el antiguo lastOrder una sola vez hacia Order Store. |
| useCartStore | commerce-builder-cart | Mantiene carrito existente; merge defensivo para snapshots y cantidades antiguas. |

`useCartItems` resuelve cada artículo contra Product Store para mostrar datos/precios actuales y conserva la referencia antigua si se elimina un producto. Checkout rechaza productos eliminados o inactivos con un mensaje que permite retirarlos del carrito.

### Helpers y UI compartida

- `productMetrics`: costo real = producto + importación + otros; utilidad = precio actual − costo; margen = utilidad/precio (cero si precio cero); valor de inventario = costo × stock; ingreso/utilidad potenciales y estado de stock. `oldPrice` nunca se considera costo.
- `orderMetrics`: subtotal, costo snapshot, utilidad de productos menos descuento y métricas CRM; el envío se considera cargo de paso para utilidad.
- `normalization`: lectura defensiva de unknown, defaults de productos/pedidos/clientes, snapshots legacy y slugify.
- `dashboardMetrics`: KPIs del mes, serie de siete días, productos vendidos y alertas a partir de stores; excluye cancelados e incluye pedidos con pagos pendientes, explicado en pantalla.
- `OperationsUI`, `operationFormat`, `AdminDialog`, `StockMovementDialog` e `InternalNotes`: tablas desplazables, campos, estados, errores, fecha/moneda, diálogos y notas reutilizables.

## Rutas

Nuevas: `/admin/productos/nuevo`, `/admin/productos/:id`, `/admin/pedidos/:id`, `/admin/clientes/:id`.

Operativas conservadas: `/admin`, `/admin/productos`, `/admin/inventario`, `/admin/pedidos`, `/admin/clientes`. Finanzas, proyección, analítica, marketing y configuración mantienen el alcance previo de Hito A; su conversión en módulos completos corresponde al siguiente trabajo.

Públicas conservadas: `/`, `/catalogo`, `/producto/:id`, `/carrito`, `/checkout`, `/pedido-confirmado`.

## Flujos de datos

### Producto → Storefront

El editor valida y guarda en Product Store. Catálogo, ficha, búsqueda, destacados y best sellers leen ese mismo store y filtran activos. Cambiar precio se refleja públicamente; las imágenes configuradas se muestran en tarjetas/galería. Editar stock de un producto existente registra ajuste mediante Inventory Store; stock inicial al crear producto es su saldo inicial.

### Checkout → Pedido → Cliente

Checkout obtiene datos actuales y crea snapshots de precio/costo/nombre/SKU y contacto/entrega. Order Store registra el pedido como nuevo, sin descontar stock; Customer Store reutiliza un cliente cuyo correo normalizado o teléfono sin separadores coincida. Conserva etiquetas/notas y devuelve customerId. Checkout guarda lastOrderId, vacía carrito y navega a confirmación. La protección de carrito vacío considera processing para evitar una redirección prematura durante el envío exitoso.

CRM incluye todos los pedidos en historial. Gasto, ticket, cantidad y última compra excluyen cancelados; cuentan pedidos nuevos no pagados, por lo que representan actividad comercial estimada, no cobros bancarios.

### Confirmación → Inventario y prevención de doble descuento

1. El pedido nuevo conserva stock. Confirmar solicita el lote `order:<id>:commit` con todas las salidas.
2. Inventory Store valida todos los productos, cantidades, fechas y motivos, calculando stocks acumulados incluso si hay IDs repetidos. Si falta stock, no escribe journal, stock ni movimientos de ese lote.
3. Persiste pendingBatch antes de cambiar stock. Product Store escribe stocks finales absolutos y batchId juntos en una sola clave persistida.
4. Recuperación verifica batchId: un lote ya aplicado no vuelve a cambiar stock; incorpora movimientos con IDs deterministas `<batchId>:<índice>` sin duplicados y limpia pendingBatch.
5. Order Store marca inventoryCommitted. Repetir confirmado o volver desde preparando a confirmado conserva el descuento único.
6. Preparar/enviar/entregar exige confirmación previa; volver a nuevo después del descuento se rechaza.

### Cancelación y restauración

Cancelar un pedido comprometido usa el lote `order:<id>:restore`, con entradas por cantidades snapshot. Se restaura una vez y se marca cancelled/inventoryCommitted false. Repetir cancelación no cambia stock ni historial. Un cancelado no se reabre. Al hidratar, los IDs commit/restore de Product Store reconcilian flags y estado de pedidos interrumpidos. No se pueden eliminar productos referenciados por pedidos no cancelados; desactivar sigue disponible.

## Migración y auditoría del código

Productos antiguos sin SKU reciben `DGNG-<id>`; costos, stock y mínimo faltantes toman cero, active toma true y fechas reciben timestamp. Números inválidos no producen NaN. Se normalizan colecciones incluso si su versión ya coincide mediante merge; migrate atiende cambios de versión.

El antiguo lastOrder con artículos `{ product, quantity }` se convierte en snapshots y se importa por ID, sin duplicación ni descuento. Costos históricos desconocidos toman cero; no se inventan costos actuales para pedidos antiguos.

Se revisaron stores, normalizadores, flujos, snapshots, rutas y cambios de UI. TypeScript/build y pruebas confirman que no quedaron archivos fuente a medio escribir. `git diff --check` no reportó errores de whitespace; Git avisa conversión LF/CRLF según configuración local. Algunas páginas placeholder aparecen modificadas en status por fin de línea, sin cambios de contenido en diff. No se descartaron cambios.

## Evidencia funcional

Datos ficticios locales de QA conservados: Producto QA Demo, SKU DGNG-QA-B-001, precio 35, costo real 11, stock final 15; Cliente QA Demo, correo qa-hito-b@example.test. No representan ventas reales.

| Comprobación | Resultado |
| --- | --- |
| Crear y editar producto | Apareció en catálogo; precio 25 → 35 reflejado. |
| Entrada manual | Stock 10 → 15, movimiento con motivo. |
| Pedido nuevo DGNG-2B0F3E72 | Stock permaneció 15. |
| Confirmar y preparar/confirmar otra vez | Stock 15 → 14; una sola salida. |
| Cancelar y recargar | Stock 14 → 15; una sola restauración e historial persistido. Repetición de cancelación también cubierta por dominio. |
| Segundo checkout DGNG-EEC6EC2A | Llegó a /pedido-confirmado; carrito vacío, pedido nuevo, stock sin cambio. |
| CRM deduplicación | Un cliente para ambos pedidos. Correo con distinto case y teléfono con separadores cubiertos por pruebas. |
| CRM métricas e historial | Dos filas (cancelado y nuevo), un pedido computable, gasto 35, ticket 35, última compra del segundo pedido. |
| CRM etiquetas/notas | VIP y nota interna visibles y conservadas tras recarga. |
| Activos y búsqueda | Desactivar QA lo excluyó de catálogo y búsqueda; reactivado al terminar. Búsqueda activa devolvió un resultado a 35. |
| Home | Destacados/best sellers desde Product Store; integración comprobada en código y navegación. |
| Rutas públicas | Home, catálogo, ficha demo-01, carrito y confirmación cargaron. Checkout vacío redirige al carrito como corresponde; checkout con artículos ya aprobado. |

### Responsive

Se verificaron productos, editor, inventario, pedidos, detalle pedido, clientes y detalle cliente en 1440, 1024, 768 y 390 px. En todos los casos document.scrollWidth ≤ viewport; tablas contenidas con overflow-x auto. KPIs/formularios/detalles se adaptan y campos siguen accesibles. Nuevo editor también revisado en móvil.

Capturas revisadas de escritorio, tablet y móvil. En 390 px se accedió al botón Entrada de la tabla desplazable y se abrió modal: límites dentro de 390 × 844, cierre y registro visibles; se cerró sin agregar movimientos. Sin problemas funcionales que exigieran polish o reconstrucción. Viewport temporal restaurado y navegador dejado en dashboard.

## Pruebas y comandos

`node scripts/test-domain.mjs` ejecuta las pruebas existentes de dominio mediante Node --test y TypeScript instalado, con storage simulado. Los archivos transpilados quedan en node_modules/.tmp, fuera del repositorio. No existían otras suites ni script npm test.

Cobertura: métricas/defaults, validaciones de productos, idempotencia tras hidratación, stock insuficiente sin aplicación parcial, journal/flags recuperables, snapshots/CRM, checkout legacy, colección vacía persistida; auditoría añade lote multiproducto exitoso con restauración y productos legacy hidratados.

`npm run build`: aprobado (tsc -b y Vite). Bundle JS 391.72 kB, gzip 116.66 kB. Avisos anteriores de LightningCSS @theme/@tailwind; no error de build.

`npm run lint`: tres errores previos de react-hooks/set-state-in-effect: SearchOverlay.tsx:43 y Catalog.tsx:47/53. Las llamadas equivalentes están presentes en HEAD de Hito A. Cero errores nuevos de Hito B; no se suprimieron reglas ni se hizo refactor masivo.

## Limitaciones, deuda y preparación para Hito C

- Persistencia por navegador/origen, sin backend, autenticación operativa, respaldo ni sincronización entre dispositivos. La recuperación protege lotes locales interrumpidos; no ofrece bloqueo transaccional entre pestañas concurrentes ni garantías ante fallo de cuota/storage.
- Pedidos nuevos no reservan inventario: disponibilidad se comprueba al confirmar. Cancelados permanecen como historial y no se reabren.
- Costos históricos legacy desconocidos a cero pueden sobreestimar utilidad; necesitan identificación/reconciliación futura. No hay contabilidad de cobros reales ni integración logística/pagos.
- El envío sigue por confirmar en checkout. La meta mensual conserva el preset local de 5000, pendiente de configuración persistida.
- Deduplicación local por correo o teléfono no resuelve fusiones de clientes ya duplicados ni normalización internacional de teléfono.
- Journals/lotes/historial crecen sin política de archivo. CRUD directo de stock a nivel store requiere disciplina de consumidores para mantener ledger; UI usa Inventory Store.
- Persisten tres errores lint anteriores y avisos CSS del toolchain. Módulos avanzados siguen en alcance Hito A.

Para Hito C quedan disponibles modelos tipados, snapshots, helpers y acciones de dominio para finanzas/analítica, configuración y eventual adaptador remoto. Este cierre no implementa esas capacidades.

## Inventario Git de entrega

La siguiente salida expandida de `git status --short --untracked-files=all` identifica archivos creados (??) y modificados (M). No hay archivos borrados ni staging/commit realizado.

```text
 M src/App.tsx
 M src/admin/components/AdminTopbar.tsx
 M src/admin/components/AlertList.tsx
 M src/admin/components/ProjectionCard.tsx
 M src/admin/components/SalesChart.tsx
 M src/admin/components/TopProductsTable.tsx
 M src/admin/layout/AdminLayout.tsx
 M src/admin/pages/AdminAnalytics.tsx
 M src/admin/pages/AdminCustomers.tsx
 M src/admin/pages/AdminDashboard.tsx
 M src/admin/pages/AdminFinance.tsx
 M src/admin/pages/AdminInventory.tsx
 M src/admin/pages/AdminMarketing.tsx
 M src/admin/pages/AdminOrders.tsx
 M src/admin/pages/AdminProducts.tsx
 M src/admin/pages/AdminProjection.tsx
 M src/admin/pages/AdminSettings.tsx
 M src/components/cart/CartDrawer.tsx
 M src/components/home/BestSellers.tsx
 M src/components/home/FeaturedProducts.tsx
 M src/components/products/ProductCard.tsx
 M src/components/products/ProductGallery.tsx
 M src/components/products/ProductInfo.tsx
 M src/components/search/SearchOverlay.tsx
 M src/data/products.ts
 M src/pages/Cart.tsx
 M src/pages/Catalog.tsx
 M src/pages/Checkout.tsx
 M src/pages/OrderSuccess.tsx
 M src/pages/ProductDetail.tsx
 M src/store/cartStore.ts
 M src/store/checkoutStore.ts
 M src/styles/admin.css
 M src/styles/product-detail.css
 M src/styles/products.css
 M src/types/order.ts
 M src/types/product.ts
?? docs/HITO-B-ADMIN-OPERATIONS.md
?? scripts/test-domain.mjs
?? src/admin/components/AdminDialog.tsx
?? src/admin/components/InternalNotes.tsx
?? src/admin/components/OperationsUI.tsx
?? src/admin/components/StockMovementDialog.tsx
?? src/admin/components/operationFormat.ts
?? src/admin/pages/AdminCustomerDetail.tsx
?? src/admin/pages/AdminOrderDetail.tsx
?? src/admin/pages/AdminProductEditor.tsx
?? src/store/customerStore.ts
?? src/store/inventoryStore.ts
?? src/store/orderStore.ts
?? src/store/productStore.ts
?? src/store/useCartItems.ts
?? src/types/customer.ts
?? src/types/inventory.ts
?? src/utils/dashboardMetrics.ts
?? src/utils/normalization.ts
?? src/utils/orderMetrics.ts
?? src/utils/productMetrics.ts
?? tests/operations.test.ts
?? tests/storage-fixture.ts
```

## Resultado final de cierre

| Validación | Resultado |
| --- | --- |
| Pruebas de dominio ejecutadas | 10 |
| Aprobadas / fallidas | 10 / 0 |
| Build | Aprobado, exit 0 |
| Lint global | Exit 1: 3 errores anteriores, 0 nuevos |
| Funcional y CRM | Aprobado según evidencia registrada |
| Responsive | Siete vistas, cuatro anchos, sin problemas funcionales encontrados |
| Git | Rama main, 37 modificados y 23 creados; sin commit automático |

**HITO B APTO PARA CERRAR** dentro de su alcance local. La deuda anterior de lint y las limitaciones de persistencia quedan explícitas. Hito C no implementado. Commit pendiente de aprobación del usuario.
