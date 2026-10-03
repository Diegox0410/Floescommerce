# H1 — FLOES Production Stabilization

## Estado

H1 en estabilización final.

La integración técnica FLOES → Chopify está implementada y validada localmente.
El cierre definitivo de producción depende del smoke test posterior al deploy y de la disponibilidad de datos comerciales autoritativos para completar una compra real.

## Alcance

Este hito estabiliza exclusivamente FLOES.

Chopify permanece como fuente de verdad comercial.
No se modifican DGNG, MG Salud y Belleza / MG Trátasec ni GanoBot dentro de este hito.

Flujo objetivo:

HOME
→ CATÁLOGO
→ CATEGORÍA / BÚSQUEDA
→ PRODUCTO
→ CARRITO
→ CHECKOUT
→ CHOPIFY
→ PEDIDO
→ SUCCESS / RECEIPT
→ OWNER ADMIN

## Fuente de verdad

El catálogo público de FLOES deja de depender de una colección comercial independiente en Firebase.

La integración H1 consume el catálogo publicado por Chopify mediante la API server-side de FLOES.

Los pedidos creados desde checkout se envían a Chopify.

El navegador no es la fuente autoritativa de pedidos.

El estado persistido `lastOrder` de FLOES se conserva únicamente como cache de presentación para la experiencia posterior al checkout.

## Tenant

Tenant fijo del storefront:

`tenant-floes`

El tenant no se recibe libremente desde el navegador para las operaciones comerciales server-side.

## Seguridad

Los secretos de Chopify permanecen exclusivamente en funciones server-side.

Variables requeridas en producción:

- `CHOPIFY_BASE_URL`
- `CHOPIFY_COMMERCE_API_TOKEN`
- `CHOPIFY_OWNER_API_TOKEN_FLOES`
- `FIREBASE_PROJECT_ID`
- `FLOES_OWNER_UID`

No existen variables `VITE_*` para tokens de Chopify.

El Owner Admin requiere:

1. usuario autenticado mediante Firebase;
2. Firebase ID token válido;
3. UID coincidente con `FLOES_OWNER_UID`;
4. autorización server-side antes de ejecutar operaciones Owner en Chopify.

## Catálogo y datos comerciales desconocidos

H1 mantiene explícitamente la diferencia entre un valor desconocido y cero.

### Precio

Un producto con precio no definido en Chopify mantiene estado de precio pendiente.

No se presenta `$0.00` como precio comercial real.

La interfaz muestra:

`Precio por confirmar`

cuando el precio autoritativo todavía no existe.

Un producto sin precio conocido no puede añadirse legítimamente al flujo de compra.

### Inventario

Stock desconocido no significa stock cero.

Los productos configurados para venta sin inventario estricto pueden conservar disponibilidad cuando el precio es conocido y el stock es desconocido.

La lógica de H1 no fabrica existencias.

### Costos y rentabilidad

Los costos no proporcionados no se convierten en cero como dato financiero real.

FLOES no debe fabricar utilidad, margen ni rentabilidad cuando falta información comercial.

## Checkout

El checkout ya no persiste el pedido directamente como verdad comercial en Firebase.

El flujo utiliza:

`POST /api/orders`

La función server-side:

1. valida y normaliza la solicitud;
2. resuelve la identidad del cliente mediante Chopify;
3. crea el borrador/pedido mediante el contrato Commerce de Chopify;
4. utiliza una clave de idempotencia;
5. devuelve al storefront el resultado generado por Chopify.

Los precios no son confiados al navegador como autoridad.

Las líneas enviadas a Chopify contienen identificadores y cantidades; Chopify determina los valores comerciales autoritativos.

## Owner Admin

Las rutas operativas principales del administrador utilizan Chopify.

El panel permite consultar:

- resumen Owner;
- pedidos;
- pagos pendientes de revisión;
- pedidos por preparar;
- pedidos listos para despacho.

Las transiciones operativas disponibles respetan el flujo existente de Chopify:

- aprobar pago;
- rechazar comprobante;
- iniciar preparación;
- marcar listo;
- despachar;
- marcar entregado.

La aprobación de pago requiere confirmación humana explícita.

El despacho requiere:

- `courier`;
- `trackingCode`.

FLOES no aprueba pagos automáticamente.

## APIs H1

Funciones server-side incorporadas:

- `api/catalog.ts`
- `api/orders.ts`
- `api/owner.ts`
- `api/_lib/chopify.ts`
- `api/_lib/firebaseAuth.ts`
- `api/_lib/http.ts`

Servicios frontend:

- `src/services/chopify/catalog.ts`
- `src/services/chopify/orders.ts`
- `src/services/chopify/owner.ts`

## Validación local

### Tests

Resultado:

`35 / 35 PASS`

Incluye pruebas específicas para:

- precio desconocido no presentado como cero;
- stock desconocido compatible con made-to-order cuando existe precio;
- rechazo de payload de catálogo malformado.

La suite legacy `tests/operations.test.ts` permanece fuera de ejecución porque no es compatible con los stores Firebase actuales.

### Build

`npm.cmd run build`

Resultado:

`PASS`

Vite completó correctamente el build de producción.

Existen advertencias no bloqueantes relacionadas con LightningCSS y tamaño de chunks.

### Lint

`npm.cmd run lint`

Resultado:

`PASS`

### Diff

`git diff --check`

Resultado:

sin errores de whitespace.

Los avisos LF → CRLF corresponden al entorno Windows y no bloquean el hito.

## Vercel

Proyecto:

`floes-commerce`

Las variables server-side requeridas para la integración H1 están configuradas en Production.

Los secretos de Commerce y Owner fueron configurados como tipo Secret y sin comillas exteriores.

## Datos comerciales pendientes

A la fecha de este hito, la clienta de FLOES todavía no ha proporcionado todos los precios y costos necesarios.

Los productos publicados actualmente desde Chopify pueden permanecer con:

`pricingStatus = PENDING`

y precio autoritativo inexistente.

Esto es un estado válido.

No se deben crear precios, costos, márgenes o inventarios ficticios únicamente para completar una prueba.

Cuando la clienta proporcione esos valores, deberán registrarse mediante la fuente de verdad correspondiente.

## Criterio de cierre pendiente

Antes de declarar H1 como PASS definitivo se requiere:

1. commit controlado;
2. deploy de producción;
3. smoke test del catálogo público;
4. verificar que los productos pendientes muestran `Precio por confirmar`;
5. verificar búsqueda y detalle de producto;
6. verificar que un producto sin precio no pueda comprarse;
7. verificar rutas SPA y recarga directa;
8. verificar protección de `/api/owner`;
9. verificar Owner Admin autenticado;
10. cuando exista al menos un precio comercial autoritativo, validar el flujo completo de creación de pedido sin fabricar datos.

Hasta completar el smoke de producción:

`H1 STATUS: TECHNICALLY STABILIZED / PRODUCTION SMOKE PENDING`

Si todos los productos continúan sin precio por falta de datos de la clienta, el sistema debe permanecer seguro y bloquear la compra en lugar de inventar valores.
