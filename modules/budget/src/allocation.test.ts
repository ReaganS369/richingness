import { describe, it, expect } from 'vitest';
import { allocateIncome, validateAllocationRules, AllocationRule } from './allocation.js';

describe('Budget Income Allocation Engine', () => {
  it('should allocate fixed and percentage values accurately', () => {
    const rules: AllocationRule[] = [
      { categoryId: 'rent', type: 'fixed', value: 150000, priority: 5 },       // ₹1500.00
      { categoryId: 'savings', type: 'percentage', value: 0.30, priority: 3 }, // 30% of income
      { categoryId: 'investment', type: 'percentage', value: 0.10, priority: 2 }, // 10% of income
      { categoryId: 'fun', type: 'remainder', value: 1, priority: 1 },        // Remainder
    ];

    const income = 500000n; // ₹5000.00
    const result = allocateIncome(income, rules);

    // Assert allocations
    expect(result.allocations.get('rent')).toBe(150000n);       // ₹1500
    expect(result.allocations.get('savings')).toBe(150000n);    // 30% of ₹5000 = ₹1500
    expect(result.allocations.get('investment')).toBe(50000n);  // 10% of ₹5000 = ₹500
    expect(result.allocations.get('fun')).toBe(150000n);         // Remainder: 5000 - 1500 - 1500 - 500 = 1500
    expect(result.unallocatedAmount).toBe(0n);
  });

  it('should handle low income that does not satisfy fixed allocations gracefully', () => {
    const rules: AllocationRule[] = [
      { categoryId: 'rent', type: 'fixed', value: 100000, priority: 5 }, // ₹1000
      { categoryId: 'food', type: 'fixed', value: 50000, priority: 4 },  // ₹500
      { categoryId: 'fun', type: 'remainder', value: 1, priority: 1 },
    ];

    const income = 120000n; // ₹1200
    const result = allocateIncome(income, rules);

    expect(result.allocations.get('rent')).toBe(100000n);
    expect(result.allocations.get('food')).toBe(20000n); // Remaining ₹200 goes to food
    expect(result.allocations.get('fun')).toBeUndefined();
    expect(result.unallocatedAmount).toBe(0n);
  });

  it('should validate allocations and spot duplicated category rules', () => {
    const validRules: AllocationRule[] = [
      { categoryId: 'food', type: 'percentage', value: 0.5, priority: 1 },
      { categoryId: 'rent', type: 'percentage', value: 0.4, priority: 2 },
    ];

    const invalidPercentageRules: AllocationRule[] = [
      { categoryId: 'food', type: 'percentage', value: 0.7, priority: 1 },
      { categoryId: 'rent', type: 'percentage', value: 0.4, priority: 2 },
    ];

    const duplicateRules: AllocationRule[] = [
      { categoryId: 'food', type: 'percentage', value: 0.2, priority: 1 },
      { categoryId: 'food', type: 'fixed', value: 1000, priority: 2 },
    ];

    expect(validateAllocationRules(validRules)).toHaveLength(0);
    expect(validateAllocationRules(invalidPercentageRules)[0]).toContain('percentage');
    expect(validateAllocationRules(duplicateRules)[0]).toContain('Duplicate');
  });
});
