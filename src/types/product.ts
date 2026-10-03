export type ProductAudience = "mujer" | "hombre" | "unisex" | "infantil" | "otro";

export interface ProductColor {
  name: string;
  hex?: string;
  /** Optional gallery shown when this color is selected. */
  images?: string[];
}

export interface ProductVariant {
  id: string;
  sku: string;
  size?: string;
  color?: string;
  measurement?: string;
  material?: string;
  price?: number;
  productCost?: number;
  stock: number;
  minimumStock: number;
  active: boolean;
  pricingStatus?: "READY" | "PENDING";
  availabilityStatus?: "AVAILABLE" | "OUT_OF_STOCK" | "NOT_CONFIGURED";
  available?: boolean;
  availableQuantity?: number | null;
  fulfillmentMode?: "STOCK" | "MADE_TO_ORDER" | "SERVICE" | "DIGITAL" | "HYBRID";
}

export interface SizeGuideRow {
  label: string;
  values: string[];
}

export interface SizeGuide {
  title?: string;
  columns: string[];
  rows: SizeGuideRow[];
  note?: string;
}

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
  pricingStatus?: "READY" | "PENDING";
  availabilityStatus?: "AVAILABLE_BY_MODE" | "AVAILABLE" | "OUT_OF_STOCK" | "NOT_CONFIGURED";
  fulfillmentMode?: "STOCK" | "MADE_TO_ORDER" | "SERVICE" | "DIGITAL" | "HYBRID";
  image?: string;
  images: string[];
  badge?: string;
  barcode?: string;
  weight?: number;
  sizeVolume?: string;
  productType?: string;
  collection?: string;
  audience?: ProductAudience;
  fabric?: string;
  material?: string;
  colors: ProductColor[];
  sizes: string[];
  variants: ProductVariant[];
  sizeGuide?: SizeGuide;
  featured: boolean;
  bestSeller: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
export type ProductInput = Omit<Product, "id" | "createdAt" | "updatedAt" | "colors" | "sizes" | "variants"> &
  Partial<Pick<Product, "colors" | "sizes" | "variants">>;
