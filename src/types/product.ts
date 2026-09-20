export interface Product {
  id: string;
  sku: string;
  slug: string;
  name: string;
  category: string;
  brand: string;
  description: string;
  shortDescription: string;
  price: number;
  oldPrice?: number;
  productCost: number;
  importCost: number;
  otherCost: number;
  stock: number;
  minimumStock: number;
  /** Public catalog availability flag. Real stock stays private. */
  inStock?: boolean;
  image?: string;
  images: string[];
  badge?: string;
  barcode?: string;
  weight?: number;
  sizeVolume?: string;
  featured: boolean;
  bestSeller: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
export type ProductInput = Omit<Product, "id" | "createdAt" | "updatedAt">;
