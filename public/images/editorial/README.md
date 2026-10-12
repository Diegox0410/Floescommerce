# FLOES — biblioteca editorial

Esta carpeta contiene las siete imágenes de campaña entregadas en `Imagenes/Web (1–7).jpeg`, optimizadas a WebP para la web. Los JPEG de origen se conservan sin cambios en `Imagenes/`.

Consulta `manifest.json` para rutas, dimensiones, tamaños y usos previstos.

## Uso y límites

- `campana-hero-scrub-negro.webp` es el hero editorial general.
- Las fotos de campaña pueden aparecer en la historia visual de la marca y en secciones editoriales. No representan por sí mismas un SKU, variante, stock o precio activo.
- `campana-detalles-editorial.webp` es un collage de campaña. Puede aparecer en una composición editorial, pero nunca como fotografía principal de una tarjeta de producto.
- Las 39 fotos entregadas en `12_modelos/` se optimizaron como galerías por modelo en `modelos/`. La asociación confirma el modelo, no el color. La ficha marca esa galería como referencial al seleccionar un color sin foto específica aprobada.
- Las fotos específicas por color solo se agregan en `src/data/editorialProductImages.ts` después de comprobar el tono exacto y su aprobación para FLOES.
- Los activos técnicos originales de Chopify y sus rutas no se trasladan ni se reemplazan.

## Imágenes de variante pendientes

Hace falta confirmar qué color representa cada foto antes de asociarla a una variante. La fuente y el orden de las 39 imágenes se documentan en `modelos/manifest.json`; los JPEG originales de `12_modelos/` permanecen intactos.
