export type Plan = 'Free' | 'Starter' | 'Elevate' | 'Supreme';
export type BillingCycle = 'monthly' | 'annual';

interface PlanPricing {
  monthly: number;
  annual: number;
}

export const plans: Record<Plan, PlanPricing> = {
  Free: { monthly: 0, annual: 0 },
  Starter: { monthly: 68, annual: 68 * 10 },
  Elevate: { monthly: 150, annual: 150 * 10 },
  Supreme: { monthly: 350, annual: 350 * 10 }
};