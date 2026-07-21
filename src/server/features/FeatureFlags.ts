export type FeatureFlag = "POS_ENABLED" | "AI_FEATURES" | "CUSTOMER_PORTAL";

export class FeatureFlags {
  private static flags: Record<FeatureFlag, boolean> = {
    POS_ENABLED: false,
    AI_FEATURES: false,
    CUSTOMER_PORTAL: false,
  };

  static isEnabled(flag: FeatureFlag, companyId?: string): boolean {
    // In production, we might query the Settings table or LaunchDarkly
    return this.flags[flag] || false;
  }
}
