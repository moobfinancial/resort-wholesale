export type PricingMode = 'retail' | 'wholesale';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  wholesalePrice: number;
  image: string;
  isNew?: boolean;
}
