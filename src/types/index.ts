export interface Product {
  id: string;
  name: string;
  description: string;
  category: "jewelry" | "swimwear" | "accessories";
  images: string[];
  retailPrice: number;
  wholesalePrice: number;
  minWholesaleQty: number;
  inventory: number;
  priceBreaks: {
    quantity: number;
    discount: number;
  }[];
  materials: string[];
  sizes?: string[];
  origin: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  isWholesale: boolean;
  businessDetails?: {
    companyName: string;
    taxId: string;
    verified: boolean;
  };
  wishlist: string[];
}

export type PricingMode = "retail" | "wholesale";

export interface Collection {
  _count: number;
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  productCount: number;
}
