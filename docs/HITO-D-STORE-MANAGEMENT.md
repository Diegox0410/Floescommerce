# Hito D — DGNG Store Management

Auditoría e implementación: 15 de septiembre de 2026. No se reconstruyeron los Hitos A, B o C, no se añadió backend ni IA y no se realizó commit automático.

## Arquitectura

El Admin escribe configuración local persistente y el storefront se suscribe directamente a sus stores Zustand. Los datos operativos permanecen separados.

| Capa | Responsabilidad |
| --- | --- |
| `storeConfigStore` | Identidad, contacto, social, comercio, SEO, announcement, navegación y Home. |
| `categoryStore` | Categorías administrables, activación, destacado y orden. |
| `marketingStore` | Promociones y estructura persistente de cupones. |
| `utils/storefront` | URL segura de WhatsApp, estados y precio promocional puro. |
| `/admin/tienda` | Centro de control del storefront y categorías. |
| `/admin/marketing` | Alta, edición y activación de promociones. |

La persistencia usa `dgng-store-config`, `dgng-categories` y `dgng-marketing`. StoreConfig tiene defaults DGNG y normalización defensiva de configuraciones antiguas o incompletas.

## StoreConfig y storefront

Identidad incluye nombre, nombre corto, tagline, logo, favicon y cuatro colores. Contacto incluye WhatsApp, mensaje predeterminado, email, ciudad y país. Redes incluye Instagram, Facebook y TikTok con `enabled`, URL y handle; enlaces vacíos, desactivados o `#` no se muestran.

Commerce configura USD/Ecuador, envío habilitado, texto, modo pendiente/fijo, costo, checkout web, compra por WhatsApp y métodos declarados. SEO configura título, descripción y keywords; el layout actualiza `document.title` y la meta descripción existente sin dependencia nueva.

Announcement, Header y Footer consumen StoreConfig. Footer presenta identidad, tagline, WhatsApp, navegación válida, redes activas y copyright dinámico. El CTA reutilizable genera mensajes generales o contextuales por producto y normaliza el teléfono ecuatoriano antes de codificar el texto.

## Categorías y Home

Category contiene ID, nombre, slug, descripción, imagen, estado activo, destacado y orden. El storefront muestra únicamente categorías activas y las ordena establemente. El Admin permite crear, editar propiedades básicas, activar/desactivar, destacar y mover; identifica categorías usadas por productos. El store rechaza una eliminación solicitada como utilizada.

Home conserva las ocho secciones originales. Cada entrada tiene ID, tipo, enabled y sortOrder; el Admin puede activarlas y moverlas. Hero consume eyebrow, título, descripción, botones e imágenes desde configuración. Campaign, beneficios, navegación, Featured y Best Sellers permanecen derivados: los productos proceden exclusivamente de Product Store; configuración solo gobierna sección y límite.

## Marketing, promociones y cupones

Promotion admite porcentaje, valor fijo o información; ventana temporal; estado manual; alcance global, categoría o producto; IDs objetivo y copy. Los estados Programada, Activa, Finalizada e Inactiva son derivados en tiempo de lectura. Descuentos nunca producen precio negativo y no modifican `product.price`.

El precio efectivo se calcula al presentar catálogo/producto, se revalida en carrito y otra vez en Checkout. El pedido guarda el precio realmente aplicado en `Order.items.price`. Finanzas y Analytics continúan usando exclusivamente ese snapshot histórico, por lo que una promoción posterior no reescribe resultados pasados.

Coupon dispone de modelo y persistencia básica, pero su aplicación en Checkout queda pendiente. Se eligió no alterar el flujo estable de pedidos hasta definir reglas de combinación, validación y comunicación de errores.

## Product Editor

Mantiene nombre, SKU, slug, marca, categoría, descripciones, costos, precios, stocks, flags, badge e imágenes. Añade barcode, peso y tamaño/volumen opcionales. La acción peligrosa “Limpiar productos demo” exige confirmación y solo identifica IDs del catálogo demo conocido; productos reales no coincidentes permanecen intactos y las restricciones operativas de borrado siguen vigentes.

## Tests y casos límite

Las pruebas D cubren defaults/migración de StoreConfig, categorías activas/orden, secciones Home, WhatsApp vacío y codificado, cuatro estados de promoción, descuentos porcentual/fijo, límite cero y promociones no aplicables. Las suites completas mantienen regresión B y C.

Se manejan campos undefined mediante defaults, redes vacías, WhatsApp vacío, categorías/secciones inactivas, promociones expiradas, descuentos superiores al precio y productos sin imagen. No se generan enlaces `#` desde configuración. Las funciones monetarias usan valores finitos y límite inferior cero.

## Validación final

- HTTP local: Vite sirvió `/`, `/catalogo`, `/admin`, `/admin/productos`, `/admin/marketing` y `/admin/tienda` con respuesta 200.
- Tests: 42 ejecutados, 42 aprobados y 0 fallidos; incluyen 12 pruebas D, 20 de regresión C y 10 de regresión B.
- Build: `npm run build` terminó con código 0. Los avisos de Lightning CSS sobre `@theme`/`@tailwind` son no bloqueantes y ya estaban identificados.
- Lint global: conserva exactamente 3 errores históricos `react-hooks/set-state-in-effect`, uno en SearchOverlay y dos en Catalog. El lint limitado a los archivos de Hito D terminó con código 0: 0 errores nuevos.
- Responsive: auditado estructuralmente en los cortes relevantes para 1440, 1024, 768 y 390 px. AdminLayout ya transforma el sidebar a panel móvil; editor pasa de dos columnas a una a 900 px; formularios pasan a una columna a 760 px; tablas mantienen `overflow-x: auto`; diálogos limitan ancho y alto. Durante el cierre se añadió apilado móvil para formularios y filas de Tienda/Marketing. Validación visual manual recomendada antes de producción; no se declara automatización visual.
- Integridad: no existen marcadores de conflicto ni archivos parcialmente escritos; todas las rutas compiladas forman parte del bundle.

Correcciones del cierre: moneda del Admin, nombre del Topbar y texto de envío pasaron a StoreConfig; redes ahora aceptan únicamente HTTP(S); promociones con NaN/Infinity se normalizan de forma finita; Featured/Best Sellers exponen título, descripción y límite; y se añadieron reglas responsive para los nuevos controles.

## Limitaciones y deuda técnica

- Persistencia localStorage por navegador, sin backend, autenticación real, multiusuario o control entre pestañas.
- URLs de imágenes, no carga ni almacenamiento de archivos.
- Cupones preparados pero no aplicados todavía en Checkout.
- Sin stacking avanzado, variantes, pasarela de pagos, cálculo logístico real ni integraciones externas.
- Los colores están disponibles en StoreConfig, pero el theming visual completo se reserva para el pase premium.
- Las categorías históricas de pedidos siguen sin snapshot propio; Analytics conserva la limitación documentada en Hito C.
- La validación de rutas internas es editorial; no existe constructor de mega menú.

## Preparación para el pase premium

El contenido comercial ya está desacoplado de los componentes principales. El próximo pase puede consumir colores, refinar componentes y animaciones, mejorar carga de imágenes y diseñar un editor visual sin cambiar los contratos operativos, históricos o de configuración establecidos aquí.
