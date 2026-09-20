import type {
  Product,
} from "../../types/product";

import {
  getRemoteProducts,
  saveRemoteProducts,
} from "./productRepository";

export interface ProductMigrationResult {
  uploaded: number;
  remoteBefore: number;
  skipped: boolean;
}

export const migrateLocalProductsToFirestore =
  async (
    localProducts: Product[],
  ): Promise<ProductMigrationResult> => {
    const remote =
      await getRemoteProducts();

    if (remote.length > 0) {
      return {
        uploaded: 0,
        remoteBefore: remote.length,
        skipped: true,
      };
    }

    if (!localProducts.length) {
      return {
        uploaded: 0,
        remoteBefore: 0,
        skipped: false,
      };
    }

    await saveRemoteProducts(
      localProducts,
    );

    return {
      uploaded: localProducts.length,
      remoteBefore: 0,
      skipped: false,
    };
  };