export type CompatibilityStatus = 'compatible' | 'incompatible' | 'incomplete';

export type CompatibilityRuleStatus = CompatibilityStatus;

export interface CompatibilityProductSummary {
  id: number;
  name: string;
  componentType: string | null;
}

export interface CompatibilityCheck {
  rule: string;
  status: CompatibilityRuleStatus;
  productIds: number[];
  message: string;
}

export interface CompatibilityResult {
  status: CompatibilityStatus;
  products: CompatibilityProductSummary[];
  checks: CompatibilityCheck[];
}
