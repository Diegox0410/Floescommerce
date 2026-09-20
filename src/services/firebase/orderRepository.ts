import {
  collection,
  doc,
  getDocs,
  runTransaction,
  setDoc,
} from "firebase/firestore";

import type {
  Order,
} from "../../types/order";

import {
  normalizeOrder,
} from "../../utils/normalization";

import {
  db,
} from "./firebase";

const ordersCollection =
  collection(
    db,
    "orders",
  );

/*
 * Firestore no acepta valores
 * undefined.
 *
 * Este sanitizador los elimina
 * recursivamente de objetos y arrays.
 */
const removeUndefinedDeep = (
  value: unknown,
): unknown => {
  if (Array.isArray(value)) {
    return value.map(
      removeUndefinedDeep,
    );
  }

  if (
    value !== null &&
    typeof value === "object"
  ) {
    return Object.fromEntries(
      Object.entries(
        value as Record<
          string,
          unknown
        >,
      )
        .filter(
          ([, fieldValue]) =>
            fieldValue !==
            undefined,
        )
        .map(
          ([
            key,
            fieldValue,
          ]) => [
            key,
            removeUndefinedDeep(
              fieldValue,
            ),
          ],
        ),
    );
  }

  return value;
};

/*
 * =====================================================
 * PUBLIC ORDER PROJECTION
 * =====================================================
 *
 * Construye únicamente la información
 * permitida desde el checkout público.
 *
 * El cliente nunca es autoridad sobre:
 *
 * - costos
 * - utilidad
 * - estado administrativo
 * - estado de pago
 * - notas internas
 * - inventario comprometido
 */
const publicOrderData = (
  order: Order,
) => ({
  id:
    order.id,

  createdAt:
    order.createdAt,

  updatedAt:
    order.updatedAt,

  customer: {
    firstName:
      order.customer.firstName.trim(),

    lastName:
      order.customer.lastName.trim(),

    phone:
      order.customer.phone.trim(),

    email:
      order.customer.email.trim(),
  },

  shipping: {
    province:
      order.shipping.province.trim(),

    city:
      order.shipping.city.trim(),

    address:
      order.shipping.address.trim(),

    reference:
      order.shipping.reference.trim(),
  },

  items:
    order.items.map(
      (item) => ({
        productId:
          item.productId,

        name:
          item.name,

        sku:
          item.sku,

        price:
          item.price,

        /*
         * El checkout público nunca
         * persiste costos privados.
         */
        cost: 0,

        quantity:
          item.quantity,
      }),
    ),

  paymentMethod:
    order.paymentMethod,

  paymentStatus:
    "pending" as const,

  orderStatus:
    "new" as const,

  subtotal:
    order.subtotal,

  shippingCost:
    order.shippingCost,

  discount: 0,

  total:
    order.total,

  estimatedCost: 0,

  estimatedProfit: 0,

  notes: [],

  inventoryCommitted:
    false,
});

/*
 * =====================================================
 * CREATE PUBLIC ORDER
 * =====================================================
 *
 * Utilizado por Checkout.
 *
 * normalizeOrder() es útil para
 * reconstruir la estructura Order,
 * pero también calcula rentabilidad.
 *
 * Por eso, después de normalizar,
 * volvemos a imponer explícitamente
 * todos los valores administrativos
 * seguros para una creación pública.
 */
const normalizePlace = (
  value: string,
) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

export const createRemoteOrder =
  async (
    order: Order,
  ): Promise<Order> => {
    if (!order.items.length) {
      throw new Error(
        "El pedido debe contener productos.",
      );
    }

    if (
      order.paymentMethod !==
        "transfer" &&
      order.paymentMethod !==
        "cash"
    ) {
      throw new Error(
        "Método de pago no permitido para pedidos nuevos.",
      );
    }

    if (
      order.paymentMethod ===
        "cash" &&
      normalizePlace(
        order.shipping.city,
      ) !== "guayaquil"
    ) {
      throw new Error(
        "El pago en efectivo está disponible únicamente en Guayaquil.",
      );
    }

    const publicData =
      publicOrderData(
        order,
      );

    const normalized =
      normalizeOrder(
        publicData,
      );

    const safeOrder: Order = {
      ...normalized,

      /*
       * customerId todavía no existe
       * en un checkout público.
       *
       * Se deja undefined y el
       * sanitizador evita enviarlo
       * a Firestore.
       */
      customerId:
        undefined,

      items:
        normalized.items.map(
          (item) => ({
            ...item,

            cost: 0,
          }),
        ),

      paymentStatus:
        "pending",

      orderStatus:
        "new",

      discount:
        0,

      estimatedCost:
        0,

      estimatedProfit:
        0,

      notes:
        [],

      inventoryCommitted:
        false,
    };

    await setDoc(
      doc(
        db,
        "orders",
        safeOrder.id,
      ),
      removeUndefinedDeep(
        safeOrder,
      ),
    );

    return safeOrder;
  };

/*
 * =====================================================
 * LOAD ORDERS
 * =====================================================
 *
 * Lectura administrativa.
 *
 * Firestore Rules permite esta
 * lectura únicamente al OWNER.
 */
export const getRemoteOrders =
  async (): Promise<Order[]> => {
    const snapshot =
      await getDocs(
        ordersCollection,
      );

    return snapshot.docs
      .map(
        (
          snapshotDocument,
        ) =>
          normalizeOrder({
            ...snapshotDocument.data(),

            id:
              snapshotDocument.id,
          }),
      )
      .sort(
        (a, b) =>
          Date.parse(
            b.createdAt,
          ) -
          Date.parse(
            a.createdAt,
          ),
      );
  };

/*
 * =====================================================
 * ENRICH PRIVATE COSTS
 * =====================================================
 *
 * Los pedidos públicos llegan con:
 *
 * cost = 0
 * estimatedCost = 0
 * estimatedProfit = 0
 *
 * Cuando el OWNER abre el panel,
 * reconstruimos esos datos usando
 * la colección privada /products.
 */
export const enrichRemoteOrderCosts =
  async (
    orderId: string,
  ): Promise<Order> =>
    runTransaction(
      db,
      async (
        transaction,
      ) => {
        const orderRef =
          doc(
            db,
            "orders",
            orderId,
          );

        const orderSnapshot =
          await transaction.get(
            orderRef,
          );

        if (
          !orderSnapshot.exists()
        ) {
          throw new Error(
            "Pedido no encontrado.",
          );
        }

        const order =
          normalizeOrder({
            ...orderSnapshot.data(),

            id:
              orderSnapshot.id,
          });

        /*
         * Eliminamos IDs duplicados
         * antes de consultar productos.
         */
        const productIds = [
          ...new Set(
            order.items.map(
              (item) =>
                item.productId,
            ),
          ),
        ];

        /*
         * Todas las lecturas ocurren
         * antes de las escrituras de
         * la transacción.
         */
        const productSnapshots =
          await Promise.all(
            productIds.map(
              (productId) =>
                transaction.get(
                  doc(
                    db,
                    "products",
                    productId,
                  ),
                ),
            ),
          );

        const costs =
          new Map<
            string,
            number
          >();

        productSnapshots.forEach(
          (
            productSnapshot,
          ) => {
            if (
              !productSnapshot.exists()
            ) {
              return;
            }

            const data =
              productSnapshot.data();

            const productCost =
              Number(
                data.productCost ??
                  0,
              );

            const importCost =
              Number(
                data.importCost ??
                  0,
              );

            const otherCost =
              Number(
                data.otherCost ??
                  0,
              );

            costs.set(
              productSnapshot.id,
              productCost +
                importCost +
                otherCost,
            );
          },
        );

        const items =
          order.items.map(
            (item) => ({
              ...item,

              cost:
                costs.get(
                  item.productId,
                ) ?? 0,
            }),
          );

        const estimatedCost =
          items.reduce(
            (
              total,
              item,
            ) =>
              total +
              item.cost *
                item.quantity,
            0,
          );

        const estimatedProfit =
          order.total -
          estimatedCost;

        /*
         * normalizeOrder() recalcula
         * las métricas utilizando los
         * costos que acabamos de cargar.
         */
        const updatedOrder =
          normalizeOrder({
            ...order,

            items,

            estimatedCost,

            estimatedProfit,

            updatedAt:
              new Date()
                .toISOString(),
          });

        transaction.set(
          orderRef,
          removeUndefinedDeep(
            updatedOrder,
          ),
        );

        return updatedOrder;
      },
    );

/*
 * =====================================================
 * SAVE ADMIN ORDER
 * =====================================================
 *
 * Escritura utilizada por el OWNER
 * para:
 *
 * - estado del pedido
 * - estado del pago
 * - notas
 * - inventario comprometido
 * - cambios administrativos
 */
export const saveRemoteOrder =
  async (
    order: Order,
  ): Promise<void> => {
    await setDoc(
      doc(
        db,
        "orders",
        order.id,
      ),
      removeUndefinedDeep(
        order,
      ),
    );
  };
