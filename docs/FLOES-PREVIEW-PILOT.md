# Piloto FLOES Preview

El storefront consulta el catálogo persistido de Chopify para `tenant-floes`. Las tarjetas representan productos padre; los colores y tallas se seleccionan dentro del PDP. No se cargan productos demo cuando el catálogo falla.

## Variables consumidas

Configurar únicamente el entorno Preview durante la validación del piloto:

- `CHOPIFY_BASE_URL`: URL exacta del deployment Chopify Preview.
- `CHOPIFY_COMMERCE_API_TOKEN`: credencial Commerce Preview para crear pedidos.
- `CHOPIFY_OWNER_API_TOKEN_FLOES`: credencial Owner Preview para operaciones administrativas.
- `CHOPIFY_VERCEL_PROTECTION_BYPASS_SECRET`: opcional; requerido si Chopify Preview usa protección de Vercel. Solo se envía desde funciones del servidor.
- `FLOES_WHATSAPP_NUMBER`: teléfono público real asociado al flujo FLOES, en formato internacional. `/api/store-config` publica únicamente el número sanitizado y activa el CTA cuando es válido.
- `FIREBASE_PROJECT_ID` y `FLOES_OWNER_UID`: validación del Owner existente.
- `FLOES_SITE_URL` y `VITE_SITE_URL`: URLs públicas para sitemap y SEO cuando se configuran explícitamente.

Las variables Firebase `VITE_FIREBASE_*` y `VITE_OWNER_UID` pertenecen al acceso administrativo existente. Ningún token Commerce debe tener prefijo `VITE_`. El tenant del backend es constante; no acepta otro tenant desde el navegador.

## Comportamiento verificado por código

`/api/catalog` y `/api/sitemap` siempre solicitan `tenant=tenant-floes` explícitamente. Ambos admiten el bypass de protección del deployment Chopify. El catálogo usa `Cache-Control: no-store` para evitar respuestas de stock almacenadas por Vercel.

El PDP cambia la imagen y el precio de la variante al elegir color, conserva las tallas declaradas por Chopify y muestra las unidades disponibles de la talla seleccionada. Las reservas las ejecuta Commerce; el storefront no descuenta otras tallas ni modifica existencias manualmente.

La guía usa `sizeGuide` del producto padre, separado de las variantes. Explica medir una prenda que quede bien sobre superficie plana, de lado a lado, y no multiplicar automáticamente por dos. La tabla y las condiciones de cambio provienen del catálogo.

El CTA recibe el contacto desde servidor para funcionar en un navegador nuevo. Una configuración sin número válido desactiva el enlace y elimina contactos locales anteriores. La selección Daniela / Vino / M genera:

> Hola, estoy interesada en el Modelo Daniela color Vino talla M.

## Validación remota requerida

Una vez configuradas las variables Preview, verificar `/api/catalog`, `/api/store-config`, `/catalogo` y `/producto/daniela?color=vino&talla=M`. El catálogo debe mostrar tres productos padre y el PDP debe reflejar las cantidades actuales de Chopify. El teléfono público debe corresponder al número Meta real; nunca usar un número de ejemplo ni un identificador Meta como teléfono de contacto.

La prueba real de Meta y la promoción a Production requieren completar primero el E2E coordinado de los tres servicios.
