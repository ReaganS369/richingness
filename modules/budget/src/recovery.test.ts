import { describe, it, expect } from 'vitest';
import { recommendRecovery, RecoverySource } from './recovery.js';

describe('Smart Recovery Heuristics Engine', () => {
  it('should recommend optimal transfers based on category priorities', () => {
    const targetCategoryId = 'clothing';
    const deficitAmount = 140000n; // ₹1400 deficit to cover

    const sources: RecoverySource[] = [
      { categoryId: 'wants', name: 'Wants', availableBalance: 70000n, priority: 3 }, // ₹700, Priority 3
      { categoryId: 'fun', name: 'Entertainment', availableBalance: 50000n, priority: 2 }, // ₹500, Priority 2
      { categoryId: 'misc', name: 'Miscellaneous', availableBalance: 60000n, priority: 1 }, // ₹600, Priority 1
      { categoryId: 'rent', name: 'Rent', availableBalance: 500000n, priority: 5 }, // ₹5000, Priority 5 (should not be touched if others cover)
    ];

    const recommendations = recommendRecovery(targetCategoryId, deficitAmount, sources);

    // Deficit is ₹1400.
    // Sources priority order: Priority 1 (misc), Priority 2 (fun), Priority 3 (wants), Priority 5 (rent).
    // Let's verify recommendation list details:
    expect(recommendations).toHaveLength(3);

    // 1st borrow: Priority 1 (misc) -> takes all ₹600
    expect(recommendations[0].fromCategoryId).toBe('misc');
    expect(recommendations[0].amount).toBe(60000n);

    // 2nd borrow: Priority 2 (fun) -> takes all ₹500
    expect(recommendations[1].fromCategoryId).toBe('fun');
    expect(recommendations[1].amount).toBe(50000n);

    // 3rd borrow: Priority 3 (wants) -> takes remaining ₹300 (1400 - 600 - 500)
    expect(recommendations[2].fromCategoryId).toBe('wants');
    expect(recommendations[2].amount).toBe(30000n);

    // Check Rent (Priority 5) was untouched
    const rentRec = recommendations.find(r => r.fromCategoryId === 'rent');
    expect(rentRec).toBeUndefined();
  });
});
