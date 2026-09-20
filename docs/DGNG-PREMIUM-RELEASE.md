# DGNG Premium Commerce Release

Fecha de auditoría: 15 de septiembre de 2026. Base estable: `876a021`. Este pase refina presentación y QA sin cambiar contratos de Hitos A–D, política de pedidos, inventario, snapshots, métricas ni Projection Engine.

## Objetivo y sistema visual

DGNG se presenta como ecommerce multimarca de importados de USA: comercial, claro, aspiracional y preparado para fotografías reales. La interfaz evita posicionar la marca exclusivamente como wellness o cuidado personal.

`release.css` contiene la capa final de tokens y estilos. Define marca, superficie, texto, muted, borde, estados, radios, sombras, container y transiciones. `StoreLayout` enlaza `primary`, `secondary`, `accent` y `background` de StoreConfig con custom properties; no existe una segunda configuración. Los alias `--green-*` antiguos permanecen solo como compatibilidad interna y resuelven a colores DGNG, no a verde.

La jerarquía usa display editorial con serif del sistema, cuerpo sans legible, títulos fluidos mediante `clamp`, labels compactos y precios con contraste de marca. Focus visible y reduced motion son globales.

## Páginas y componentes refinados

- Announcement y Header: barra compacta, navegación clara, logo con `object-fit: contain`, fallback textual existente, iconos consistentes, carrito visible, navegación móvil y header sticky con fondo legible.
- Home: conserva `enabled` y `sortOrder`. Hero usa StoreConfig, composición editorial, imagen con cover y fallback CSS. Categorías usan imagen protagonista. Featured y Best Sellers siguen derivados de Product Store.
- ProductCard: ratio 4:5, imagen `contain`, fallback, badge, marca, nombre, precio efectivo/anterior, stock agotado y acción. El componente llama al motor promocional existente y nunca muta Product.
- Catálogo: PageHeader, toolbar, filtros, sidebar, contador, empty state y grid responsive de 4/3/2/1 columnas sin cambiar query params.
- Product Detail: galería contain, thumbnails solo cuando hay más de una imagen, marca, badge, precio, contenido, stock, cantidad limitada por existencias, carrito, envío y CTA contextual de WhatsApp.
- CartDrawer y Carrito: muestran fotografías reales cuando existen, fallback cuando no, cantidad, precio, subtotal y acciones; mantienen lógica Zustand.
- Checkout: conserva validaciones, agrupación, métodos, momento de creación y snapshots. La capa visual armoniza superficies, foco y CTA sin introducir pasarela ni impuestos.
- Order Success: conserva identificador, entrega, total, pago y retorno; el botón de WhatsApp ahora es un enlace funcional con el ID del pedido.
- Search: mantiene búsqueda y navegación; consume nombre corto de StoreConfig y limpia consulta al cerrar sin actualización síncrona dentro del effect.
- Footer y Social: consumen StoreConfig y solo muestran navegación/redes válidas y activas; no inventan dirección ni feed social.
- Admin: mantiene carácter ejecutivo. Se añadieron coherencia de focus/superficies y preview de URL de imagen en Product Editor, sin construir uploads.

## Product Editor y flujo real

El editor conserva nombre, marca, SKU, barcode, categoría, textos, imágenes, costos, precios, stocks, peso, tamaño/volumen, visibilidad, badge y rentabilidad. La imagen principal tiene preview y estado vacío; URLs adicionales permanecen una por línea. Upload real requiere almacenamiento/backend.

La prueba de integración crea un producto temporal con stock, calcula una promoción, registra el pedido con el precio pagado, crea/actualiza CRM, confirma una única salida de inventario, verifica Finanzas/Analytics desde snapshot aun después de cambiar el precio actual, cancela, restaura stock una vez y elimina el producto temporal. Los defaults no se contaminan.

## Responsive y accesibilidad

Breakpoints auditados estructuralmente: 1440, 1024, 768 y 390 px. Grids usan `minmax(0,1fr)`; producto pasa 4→3→2 y solo baja a una columna por debajo de 350 px. Hero y detalle pasan a una columna; navegación móvil se despliega verticalmente; cart drawer limita a viewport; formularios, tablas y diálogos mantienen reglas de Hito D.

Se verificaron labels existentes, nombres accesibles de icon buttons, alt/fallback de imágenes, `loading="lazy"` en imágenes de catálogo, foco visible, reduced motion y semántica de enlaces/botones. No se declara certificación completa. Se recomienda smoke test manual en dispositivos físicos antes de producción.

## QA técnico

- Baseline: 42/42 tests; build aprobado; 3 errores históricos de lint.
- Release: 43/43 tests; build final con código 0; lint con 0 errores y 0 warnings.
- HTTP: Vite reportó `http://127.0.0.1:5173/`; respondieron 200 Home, catálogo, producto demo real, carrito, checkout, confirmación y las rutas Admin principales.
- Hardcodes: el número DGNG existe únicamente como default central de StoreConfig. No hay branding MG ni `href="#"` en componentes. `siteConfig.ts` permanece como archivo legacy sin consumidores productivos. Los nombres `green` restantes son aliases de compatibilidad ya mapeados a purple/magenta; verdes del Admin se limitan a estados semánticos positivos.

## Limitaciones y deuda técnica

- Sin backend, auth real, multiusuario, sincronización ni concurrencia cross-tab.
- Sin almacenamiento/upload real de imágenes.
- Sin pasarela, logística automática, cupones aplicados en Checkout ni variantes.
- Sin integraciones sociales ni analytics externos.
- Validación visual automatizada no se considera requisito; revisión manual real sigue recomendada.

## Checklist de lanzamiento

- [ ] Logo definitivo validado
- [ ] Favicon definitivo
- [ ] Hero e imagen definitivos
- [ ] WhatsApp verificado con el negocio
- [ ] Instagram configurado
- [ ] Facebook configurado
- [ ] TikTok configurado
- [ ] Productos reales cargados
- [ ] Fotografías finales optimizadas
- [ ] Categorías reales revisadas
- [ ] Precios revisados
- [ ] Costos revisados
- [ ] Inventario físico conciliado
- [ ] Métodos de pago confirmados
- [ ] Política y costo de envío confirmados
- [ ] SEO final revisado
- [ ] Dominio configurado
- [ ] Prueba móvil en dispositivo real
- [ ] Pedido real de prueba completado

Recomendación inmediata: confirmar identidad/contacto/envío en `/admin/tienda`, cargar primero categorías reales y luego productos con SKU, costos, stock e imágenes finales; revisar catálogo móvil y completar un pedido controlado antes de publicar el dominio.
