export interface RecoverySource {
  categoryId: string;
  name: string;
  availableBalance: bigint; // Current available balance in paise
  priority: number;          // 1 (lowest) to 5 (highest)
}

export interface RecoveryRecommendation {
  fromCategoryId: string;
  fromCategoryName: string;
  toCategoryId: string;
  amount: bigint;            // Amount in paise
}

/**
 * Smart Recovery Engine Heuristic.
 * Recommends optimal budget moves from surplus categories to cover a deficit,
 * prioritizing borrowing from lowest-priority categories first.
 */
export function recommendRecovery(
  toCategoryId: string,
  deficitAmount: bigint, // Deficit to cover (positive amount in paise, e.g. cover ₹1400 deficit = 140000n)
  sources: RecoverySource[]
): RecoveryRecommendation[] {
  if (deficitAmount <= 0n) {
    return [];
  }

  // Filter sources: must have positive balance and cannot be the target category itself
  let availableSources = sources
    .filter(src => src.availableBalance > 0n && src.categoryId !== toCategoryId)
    .map(src => ({ ...src })); // Clone to avoid mutating inputs

  // Sort available sources:
  // 1. By priority ascending (borrow from lowest priority first)
  // 2. By available balance descending (borrow from categories with the largest reserves first)
  availableSources.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    // Convert BigInt comparison to standard number representation
    return a.availableBalance > b.availableBalance ? -1 : a.availableBalance < b.availableBalance ? 1 : 0;
  });

  const recommendations: RecoveryRecommendation[] = [];
  let remainingDeficit = deficitAmount;

  for (const src of availableSources) {
    if (remainingDeficit <= 0n) break;

    const borrowAmount = src.availableBalance >= remainingDeficit ? remainingDeficit : src.availableBalance;
    
    recommendations.push({
      fromCategoryId: src.categoryId,
      fromCategoryName: src.name,
      toCategoryId: toCategoryId,
      amount: borrowAmount
    });

    remainingDeficit -= borrowAmount;
  }

  // If we couldn't cover the entire deficit, we still return the partial recommendations
  return recommendations;
}
