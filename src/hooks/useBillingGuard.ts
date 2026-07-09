import { useCallback, useState } from "react";
import { Account, CloudJob, Tier, estimateCredits, lockCredits, settleCredits } from "../../server/billing/credits";

export type PremiumFeature = "cloud_export" | "ai_removal" | "4k_export";

const featureRequirements: Record<PremiumFeature, { tier: Tier; creditEstimate: number }> = {
  cloud_export: { tier: "pro", creditEstimate: 50 },
  ai_removal: { tier: "pro", creditEstimate: 20 },
  "4k_export": { tier: "pro", creditEstimate: 30 }
};

export function useBillingGuard() {
  const [account, setAccount] = useState<Account>({
    id: "user_default",
    tenantId: "tenant_default",
    tier: "free",
    credits: 120,
    lockedCredits: 0
  });

  const canUsePremium = useCallback(
    (feature: PremiumFeature) => {
      const requirement = featureRequirements[feature];
      return account.tier === requirement.tier || account.tier === "enterprise";
    },
    [account.tier]
  );

  const validateFeature = useCallback(
    (feature: PremiumFeature) => {
      const requirement = featureRequirements[feature];
      if (account.tier !== requirement.tier && account.tier !== "enterprise") {
        throw new Error("UPGRADE_REQUIRED");
      }
      if (account.credits - account.lockedCredits < requirement.creditEstimate) {
        throw new Error("INSUFFICIENT_CREDITS");
      }
      return true;
    },
    [account]
  );

  const lockJobCredits = useCallback(
    (job: CloudJob) => {
      const nextAccount = lockCredits(account, job);
      setAccount(nextAccount);
      return nextAccount;
    },
    [account]
  );

  const finalizeJobCredits = useCallback(
    (job: CloudJob, success: boolean) => {
      const nextAccount = settleCredits(account, job, success);
      setAccount(nextAccount);
      return nextAccount;
    },
    [account]
  );

  const upgradeToPro = useCallback(() => {
    setAccount(prev => ({ ...prev, tier: "pro", credits: Math.max(prev.credits, 200) }));
  }, []);

  const estimateJobCost = useCallback((job: CloudJob) => estimateCredits(job), []);

  return {
    account,
    canUsePremium,
    validateFeature,
    lockJobCredits,
    finalizeJobCredits,
    estimateJobCost,
    upgradeToPro
  };
}
