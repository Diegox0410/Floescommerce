# Hito C — DGNG Business Intelligence

Proyecto: `C:\Users\User\commerce-builder`. Auditoría final: 15 de septiembre de 2026.

## Resumen y auditoría inicial

Finanzas, Proyección, Analítica y Dashboard consumen una capa compartida de métricas derivadas de pedidos, productos y contactos históricos. No se reconstruyen los stores operativos ni AdminLayout; no se añaden dependencias de gráficos, backend, IA o contabilidad fiscal. El único estado persistido nuevo contiene configuración del OWNER, no resultados calculados.

Inicio: `git status --short --branch` mostró main limpio. `git log -5 --oneline` identificó `8a4dbbc feat: implement DGNG premium admin operations` y `2831e0e feat: DGNG storefront and premium admin core`. Se revisaron documentación A/B, modelos, stores operativos, helpers y componentes existentes. No hubo commit automático.

## Arquitectura

| Archivo/capa | Responsabilidad |
| --- | --- |
| analyticsTypes.ts | Tipos de periodos, finanzas, rankings, series, escenarios y proyección. |
| periods.ts | Rangos locales, claves diarias, periodo anterior equivalente y variación segura. |
| salesMetrics.ts | Política de venta válida, importes snapshot, asignación de descuentos, rentabilidad y series diarias. |
| financeMetrics.ts | Agregados financieros históricos y capital actual. |
| inventoryMetrics.ts | Capital/stock actual y plan determinístico limitado por stock. |
| customerMetrics.ts | Identidad, adquisición, recurrencia, ingresos y lifetime local. |
| projectionEngine.ts | Funciones puras de meta, escenarios y equilibrio. |
| businessMetrics.ts | Composición ejecutiva común, comparación, alertas y proyección mensual. |
| useBusinessMetrics.ts | Suscripción a stores y reloj actualizado cada minuto; memoización sin persistir métricas. |
| businessSettingsStore.ts | Configuración Zustand/localStorage: dgng-business-settings v1. |
| BusinessUI / BusinessChart | Secciones, filtros, tablas ordenables, equilibrio y gráfico SVG con tabla diaria accesible. |

`utils/dashboardMetrics.ts` queda como adaptador compatible a la misma capa, sin las fórmulas comerciales antiguas. Los módulos ya no consumen adminDemoData. Los stores Product/Inventory/Order/Customer y los modelos operativos permanecen intactos.

Rutas funcionales: `/admin/finanzas`, `/admin/proyeccion`, `/admin/analitica` y `/admin`. Son rutas existentes; no se añaden rutas nuevas.

## Política única de venta válida

Cuenta un pedido con artículos y cantidades enteras positivas, siempre que no sea cancelled ni tenga paymentStatus rejected/refunded. Pendientes, confirmados, preparando, enviados y entregados son actividad comercial estimada, no evidencia de cobro. Toda capa BI aplica `isValidSale`; pedidos de fecha inválida o posterior al corte quedan fuera del periodo.

Un refunded se excluye por completo: el modelo actual no guarda importe de reembolso parcial. Cambiar pago no restaura stock; se mantienen las reglas operativas de Hito B, donde la restauración ocurre al cancelar el pedido comprometido. El CRM operativo de Hito B conserva su semántica previa; los indicadores comerciales de BI se etiquetan y calculan con esta política centralizada.

## Métricas y fórmulas

Los cálculos monetarios históricos utilizan exclusivamente `Order.items.price/cost/quantity`, no Product Store ni los totales derivados persistidos del pedido. Se recalculan desde snapshots.

| Métrica | Fórmula/alcance |
| --- | --- |
| grossRevenue | Suma de precio snapshot × cantidad de pedidos válidos. |
| discounts | Suma de descuento por pedido, limitado entre cero y su venta bruta. |
| netRevenue | grossRevenue − discounts, sin envío. |
| costOfGoodsSold | Suma de costo snapshot × cantidad. |
| grossProfit | netRevenue − costOfGoodsSold. Puede ser negativo. |
| grossMargin | grossProfit / netRevenue × 100; cero si no hay base positiva. |
| averageOrderValue | netRevenue / validOrders; cero con cero pedidos. |
| totalOrders | Todos los pedidos del rango, incluidos excluidos. |
| validOrders / cancelledOrders / excludedOrders | Conteos explícitos por la política común. |
| unitsSold | Suma de cantidades enteras de ventas válidas. |
| averageProductMargin | Media simple de márgenes por producto vendido con ingreso neto positivo; distinta del margen bruto ponderado por ingresos. |
| inventoryCostValue | Suma de (productCost + importCost + otherCost) × stock actual. |
| inventoryRetailValue | Suma de precio actual × stock actual. |
| inventoryPotentialProfit | retailValue − costValue. Incluye pérdidas potenciales. |
| customerLifetimeRevenue | Media de ingreso neto histórico local acumulado por comprador identificable, hasta el fin del rango; no predice valor futuro. |

Capital en inventario incluye inactivos: siguen representando capital. Potencial disponible del proyector considera solo activos. Bajo mínimo significa saldo positivo ≤ minimumStock; agotado es saldo cero. No se calcula rotación histórica ni se inventan gastos operativos.

### Producto y categoría

Cada descuento se reparte proporcionalmente al importe bruto de las líneas del pedido. Ingreso neto de línea = importe bruto × (1 − descuento/importe bruto del pedido). Costos históricos se conservan; las sumas de producto/categoría reconcilian con Finanzas. La UI redondea al mostrar, no antes de agregar.

Rankings por ventas netas, utilidad, margen o unidades, descendentes y con ID como desempate estable. Solo aparecen productos con unidades vendidas. Nombres provienen de snapshots. Categorías usan el catálogo actual porque Hito B no guardó categoría snapshot; productos eliminados usan Sin categoría histórica. Esta limitación aparece en pantalla.

### Clientes

Identidad: customerId; fallback correo normalizado o teléfono sin separadores. Pedidos sin identidad no inventan un comprador: se reportan aparte y se excluyen de segmentación/lifetime, conservando sus ventas financieras y ticket general.

Clientes únicos: compradores válidos en el periodo. Nuevos: su primera compra válida ocurre en el periodo. Recurrentes: más de un pedido válido acumulado hasta el corte; un nuevo puede también volverse recurrente dentro del rango. Ingresos de primeras compras se asignan al primer pedido válido; ingresos recurrentes a pedidos posteriores. Los ingresos no se duplican entre segmentos. Orden estable fecha/ID para empates.

## Periodos y comparación

Finanzas: hoy, siete días, treinta días, mes actual, todo y rango personalizado. Analítica: siete días, treinta días y mes. Rangos inclusivos por fecha local, con corte en el momento actual; fechas futuras no suman. Mes significa desde el día uno hasta ahora. En personalizados se limita el fin a ahora y se indica un rango incompleto/invertido.

Series diarias incluyen días sin pedidos con cero. Gráfico propio SVG conserva ventas/utilidad con escala monetaria y pedidos en escala inferior separada; títulos accesibles y tabla expandible muestran valores exactos. Recharts no está instalado, por lo que no se agregó otra librería.

Periodo anterior: mismos días calendario y misma hora de corte final, desplazados hacia atrás por la longitud del rango. Para mes en curso se compara el tramo equivalente anterior, no un mes anterior completo de diferente duración. Variación = (actual − anterior)/anterior × 100 solo con base anterior positiva y pedidos comparables; de otro modo Sin datos suficientes. Utilidad anterior cero/negativa no produce porcentajes engañosos. Todo no tiene comparación equivalente.

## Proyector de ventas

Entradas: monthlyGoal, currentRevenue, daysElapsed, daysRemaining, averageTicket, averageMargin y disponibilidad de datos. Todos los resultados son derivados.

- goalProgress = currentRevenue/monthlyGoal × 100, cero si meta cero; indicador visual limitado a 100, cifra puede superarlo.
- remainingRevenue = max(0, goal − currentRevenue).
- requiredDailyRevenue = remainingRevenue/daysRemaining; null si hay faltante pero el mes cerró.
- requiredOrders = ceil(remainingRevenue/averageTicket); null si falta ticket positivo. Cero si no hay faltante.
- averageDailyRevenue = currentRevenue/daysElapsed.
- projectedEndRevenue = averageDailyRevenue × (daysElapsed + daysRemaining).
- projectedProfit = projectedEndRevenue × averageMargin/100.
- goalGap = max(0, goal − projectedEndRevenue).

El mes incluye hoy entre días transcurridos; los restantes excluyen hoy. La extrapolación necesita ingreso positivo y días transcurridos, además de pedidos observados. Sin base, se devuelve null y se muestra Sin datos suficientes. No es predicción de demanda; el día incompleto y pocos pedidos limitan la base. Meta cero significa Sin meta configurada y Dashboard muestra Configurar meta.

Estados (texto, además de color): achieved si ingreso actual ≥ meta positiva; onTrack si cierre proyectado ≥ meta; attention si cierre entre 80% y 100% o no hay base; atRisk si cierre <80% o el mes terminó con faltante. Sin meta, estado null.

### Escenarios

Configuración inicial de supuestos: conservador −15%, base 0%, agresivo +25% de volumen futuro. Son variaciones editables, no ventas hardcodeadas. Ticket y margen vacíos usan valores observados; cambios se aplican al guardar y persisten localmente.

Pedidos observados estimados = currentRevenue/averageTicket observado. Pedidos diarios = pedidos observados/daysElapsed. Pedidos futuros de escenario = pedidos diarios × daysRemaining × max(0, 1 + variación/100).

Ventas de cierre = ventas ya registradas + pedidos futuros × ticket supuesto. Utilidad de cierre = utilidad observada (ingreso × margen observado) + ingreso futuro × margen supuesto. Pedidos de cierre = observados + futuros; admite fracciones como estimación de ritmo. La columna Margen futuro identifica el supuesto, no un margen ponderado de todo el cierre. Con ticket/base insuficientes, no se inventa escenario.

## Plan orientativo de inventario

Elegibles: activos, stock entero >0, precio >0 y utilidad unitaria positiva. Score = 0.50 × margen/100 + 0.35 × utilidad/maxUtilidadElegible + 0.15 × stock/maxStockElegible. Desempate por ID.

Greedy en orden de score: asigna min(stock, ceil(faltante/precio)) unidades; actualiza faltante hasta cubrirlo o agotar elegibles. Devuelve producto/unidades/stock/venta/utilidad, cobertura del faltante limitada a 100%, descubierto y exceso por unidades enteras. No supera stock, no reserva unidades ni cambia stores. No optimiza globalmente toda combinación ni promete que se venderá. Meta alcanzada/cero devuelve plan vacío.

## Punto de equilibrio

OWNER introduce costos fijos mensuales y margen de contribución porcentual después de todos los costos variables. Venta de equilibrio = costos fijos/(margen/100). Margen debe ser >0 y ≤100; sin ese dato, resultado null. Costos fijos cero y margen válido dan equilibrio cero. No sustituye contabilidad fiscal; el margen de mercancía no estima automáticamente comisiones o logística.

## Persistencia y casos límite

`dgng-business-settings` v1 guarda únicamente monthlySalesGoal, fixedCosts, contributionMargin y tres escenarios (nombre/variación/ticket/margen). Merge/migrate normalizan configuración antigua o incompleta. No persiste KPIs, gráficos, ranking, planes, proyecciones ni clientes duplicados.

Se manejan pedidos vacíos, ingreso cero, ticket cero, días cero, meta cero, precio cero, stock cero, inactivos, costo mayor al precio, cancelados/rechazados/reembolsados y campos faltantes. Números legacy inválidos toman defaults seguros; pérdidas permanecen negativas. Resultados sin base usan null y texto explícito, sin NaN/Infinity/undefined en las vistas auditadas. Costos snapshot legacy desconocidos conservan cero y pueden sobreestimar rentabilidad.

## Evidencia manual y responsive

Base local de Hito B: venta válida 35, costo 11, utilidad 24, un cliente comprador. Sin meta, se comprobó CTA Configurar meta.

Se guardaron y recargaron supuestos QA: meta 1000; costos fijos 200; contribución 40% (equilibrio 500); agresivo +40% volumen, ticket 40, margen futuro 50%. Con ventas base 35, días 14/16: avance 3.5%, faltante 965, necesidad diaria 60.31, 28 pedidos estimados, cierre base 75. Escenario agresivo de QA: cierre 99 y utilidad 56. Plan orientativo cubrió 965 con ventas 975, sin superar stock.

Pedidos ficticios nuevos de checkout: DGNG-BAE38A28 (Hair Growth, 15/costo11) y DGNG-A1E6C5B2 (Serum Facial, 17/costo12), mismo Cliente QA Hito C, qa-hito-c@example.test. Primer pedido: ventas 50, utilidad 28, dos compradores y gráfico del día 15/4. Segundo: ventas 67, utilidad 33, un cliente recurrente; primeras compras 50 y compras posteriores 17.

Pago rechazado del primero: ventas 52/utilidad29. Cancelación de ambos: regreso a venta35/utilidad24, un comprador y cero recurrentes; gráfico del día cero y cierre base75. Pedidos de QA quedan cancelados como historial; no descontaron inventario porque nunca fueron confirmados. No se eliminaron datos de trabajo. Los supuestos QA locales quedan guardados y pueden editarse en la UI; no son defaults comerciales del código.

Finanzas, Proyección y Analítica revisados en 1440/1024/768/390 px: document.scrollWidth ≤ viewport, tablas overflow-x auto, gráficos dentro del contenedor, campos/botones accesibles. Capturas revisadas y tabla diaria abierta en móvil. También verificados filtros de siete/treinta días, hoy sin ventas válidas, todo, orden por utilidad y recarga. Se restauró viewport y se dejó Dashboard. Sin cambios en la estética global o AdminLayout.

## Tests y validación

`node scripts/test-domain.mjs` ahora descubre todas las suites .test.ts, usando TypeScript instalado y Node --test sin dependencia nueva. Se mantienen diez pruebas operativas B y se añaden pruebas determinísticas C: revenue/COGS/profit/margen/ticket, política única, snapshots tras edición/eliminación, descuento por línea/categoría, inventario, recurrencia/lifetime, series/corte, proyección/estados/ceros, escenarios, límites/exclusiones del plan, redondeo/no mutación, equilibrio, comparación, legacy/undefined/pérdidas, integración ejecutiva y configuración persistida. Incluye clientes sin identidad y proyección sin ingreso neto.

### Cierre técnico final

- Árbol antes del cierre: `## main...origin/main`, sin archivos modificados, creados sin seguimiento ni diferencias parciales; `git diff --stat` vacío.
- Tests: 30 ejecutados, 30 aprobados, 0 fallidos. La cifra incluye 20 pruebas de Hito C y 10 pruebas de regresión de Hito B.
- Build: `npm run build` aprobado; TypeScript y Vite terminaron con código 0. Lightning CSS informó avisos no bloqueantes sobre directivas Tailwind (`@theme` y `@tailwind`) ya presentes en el CSS generado.
- Lint: `npm run lint` conserva 3 errores previos a Hito C (`react-hooks/set-state-in-effect`): uno en `src/components/search/SearchOverlay.tsx` y dos en `src/pages/Catalog.tsx`. Los archivos creados o modificados por Hito C aportan 0 errores nuevos.
- Consistencia: Dashboard, Finanzas, Proyección y Analítica llegan a `businessMetrics`; ventas, importes snapshot, descuentos y rentabilidad proceden de `salesMetrics`/`financeMetrics`; clientes de `customerMetrics`; periodos de `periods`. `utils/dashboardMetrics.ts` es un adaptador de salida. El helper operativo de CRM de Hito B (`utils/orderMetrics.ts`) conserva su semántica para fichas de cliente y no alimenta ningún KPI ni vista BI.
- Seguridad numérica: las pruebas cubren meta, ventas, ticket, margen y días en cero; meta alcanzada/superada; cierre de mes; datos legacy; pérdidas e inventario insuficiente. Los valores no disponibles son `null` y se presentan con texto explícito, sin `NaN`, `Infinity` ni `undefined` en UI.

## Deuda y preparación para Hito D

Persistencia limitada a localStorage del navegador/origen; no hay backend, autenticación real, multiusuario, cobros reales, sincronización ni control de concurrencia entre pestañas. El historial se limita a los datos conservados localmente y no existen integraciones externas. Rentabilidad bruta excluye gastos no modelados; estimaciones no prueban demanda futura. Pedidos antiguos pueden carecer de snapshots completos de costo y categoría y necesitan reconciliación; lifetime es solo historia disponible localmente. No hay reembolso parcial, rotación fiable, estacionalidad ni optimización global del plan. JavaScript usa aritmética decimal de punto flotante y la UI redondea importes.

La capa pura tipada y configuración separada quedan listas para reutilizarse en Hito D, incorporar más costos/atributos snapshot, más fuentes operativas o un adaptador de persistencia cuando se autorice. No se implementan capacidades excluidas ni Hito D en esta entrega.

