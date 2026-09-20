import {
  collection,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";

import type {
  Customer,
} from "../../types/customer";

import {
  normalizeCustomer,
} from "../../utils/normalization";

import {
  db,
} from "./firebase";

const customersCollection =
  collection(
    db,
    "customers",
  );

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
            fieldValue !== undefined,
        )
        .map(
          ([key, fieldValue]) => [
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

export const getRemoteCustomers =
  async (): Promise<Customer[]> => {
    const snapshot =
      await getDocs(
        customersCollection,
      );

    return snapshot.docs
      .map(
        (
          snapshotDocument,
        ) =>
          normalizeCustomer({
            ...snapshotDocument.data(),
            id:
              snapshotDocument.id,
          }),
      )
      .sort(
        (a, b) =>
          Date.parse(
            b.updatedAt,
          ) -
          Date.parse(
            a.updatedAt,
          ),
      );
  };

export const saveRemoteCustomer =
  async (
    customer: Customer,
  ): Promise<void> => {
    const normalized =
      normalizeCustomer(
        customer,
      );

    await setDoc(
      doc(
        db,
        "customers",
        normalized.id,
      ),
      removeUndefinedDeep(
        normalized,
      ),
    );
  };