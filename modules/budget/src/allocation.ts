export interface AllocationRule {
  categoryId: string;
  type: 'percentage' | 'fixed' | 'remainder';
  value: number; // For percentage, value is 0-1 (e.g. 0.45 for 45%). For fixed, value is in paise. For remainder, it can be a weight (e.g. 1).
  priority: number;
}

export interface AllocationResult {
  allocations: Map<string, bigint>;
  unallocatedAmount: bigint;
}

/**
 * Calculates allocation values from total income according to rules.
 */
export function allocateIncome(income: bigint, rules: AllocationRule[]): AllocationResult {
  if (income < 0n) {
    throw new Error('Income amount cannot be negative');
  }

  const allocations = new Map<string, bigint>();
  let remainingIncome = income;

  // Validate percentage rules
  const percentageSum = rules
    .filter(r => r.type === 'percentage')
    .reduce((sum, r) => sum + r.value, 0);

  if (percentageSum > 1.0) {
    throw new Error('Total percentage allocations cannot exceed 100%');
  }

  // 1. Process fixed rules first (highest priority rules first)
  const fixedRules = rules
    .filter(r => r.type === 'fixed')
    .sort((a, b) => b.priority - a.priority);

  for (const rule of fixedRules) {
    const fixedAmount = BigInt(Math.max(0, Math.floor(rule.value)));
    const allocated = fixedAmount > remainingIncome ? remainingIncome : fixedAmount;
    allocations.set(rule.categoryId, (allocations.get(rule.categoryId) || 0n) + allocated);
    remainingIncome -= allocated;
  }

  // 2. Process percentage rules based on initial income
  const percentageRules = rules
    .filter(r => r.type === 'percentage')
    .sort((a, b) => b.priority - a.priority);

  for (const rule of percentageRules) {
    if (remainingIncome <= 0n) break;
    // Calculate percentage based on total initial income
    const percentageInt = BigInt(Math.round(rule.value * 1000000));
    const calculatedAmount = (income * percentageInt) / 1000000n;
    const allocated = calculatedAmount > remainingIncome ? remainingIncome : calculatedAmount;
    allocations.set(rule.categoryId, (allocations.get(rule.categoryId) || 0n) + allocated);
    remainingIncome -= allocated;
  }

  // 3. Distribute any remaining income to remainder rules
  const remainderRules = rules.filter(r => r.type === 'remainder');
  if (remainderRules.length > 0 && remainingIncome > 0n) {
    const totalWeight = remainderRules.reduce((sum, r) => sum + (r.value || 1), 0);
    let distributedRemainder = 0n;

    for (let i = 0; i < remainderRules.length; i++) {
      const rule = remainderRules[i];
      const weight = rule.value || 1;
      
      // If it's the last rule, assign all remaining to avoid rounding leaks
      if (i === remainderRules.length - 1) {
        const allocated = remainingIncome - distributedRemainder;
        allocations.set(rule.categoryId, (allocations.get(rule.categoryId) || 0n) + allocated);
      } else {
        const allocated = (remainingIncome * BigInt(Math.floor(weight))) / BigInt(Math.floor(totalWeight));
        allocations.set(rule.categoryId, (allocations.get(rule.categoryId) || 0n) + allocated);
        distributedRemainder += allocated;
      }
    }
    remainingIncome = 0n;
  }

  return {
    allocations,
    unallocatedAmount: remainingIncome
  };
}

/**
 * Validates rule consistency.
 */
export function validateAllocationRules(rules: AllocationRule[]): string[] {
  const errors: string[] = [];
  
  const percentageSum = rules
    .filter(r => r.type === 'percentage')
    .reduce((sum, r) => sum + r.value, 0);

  if (percentageSum > 1.0) {
    errors.push('Total percentage allocations exceed 100%');
  }

  const duplicates = new Set<string>();
  for (const rule of rules) {
    if (duplicates.has(rule.categoryId)) {
      errors.push(`Duplicate allocation rule found for category ID: ${rule.categoryId}`);
    }
    duplicates.add(rule.categoryId);
  }

  return errors;
}
