import { describe, it, expect } from 'vitest';
import { generateSpendingSummary, generateBudgetHealthSummary } from './summaries.js';
import { compileCategoryAnalytics, compileGoalAnalytics } from './analytics.js';

describe('Reporting Engine Summaries', () => {
  it('should compile transaction arrays into formatted spending breakdowns', () => {
    const mockTxs = [
      { categoryId: 'food', categoryName: 'Food', merchantName: 'Swiggy', amountInBase: 12000n }, // ₹120
      { categoryId: 'food', categoryName: 'Food', merchantName: 'Zomato', amountInBase: 8000n },   // ₹80
      { categoryId: 'fun', categoryName: 'Fun', merchantName: 'Netflix', amountInBase: 30000n },  // ₹300
    ];

    const summary = generateSpendingSummary(mockTxs);

    expect(summary.totalSpent).toBe(50000n); // ₹500 total
    expect(summary.byCategory).toHaveLength(2);
    
    // Fun is largest spent (₹300 -> 60%)
    expect(summary.byCategory[0].categoryId).toBe('fun');
    expect(summary.byCategory[0].amount).toBe(30000n);
    expect(summary.byCategory[0].percentage).toBe(60.0);

    // Food (₹200 -> 40%)
    expect(summary.byCategory[1].categoryId).toBe('food');
    expect(summary.byCategory[1].amount).toBe(20000n);
    expect(summary.byCategory[1].percentage).toBe(40.0);

    // By Merchant (Netflix ₹300 -> 60%, Swiggy ₹120 -> 24%, Zomato ₹80 -> 16%)
    expect(summary.byMerchant).toHaveLength(3);
    expect(summary.byMerchant[0].merchantName).toBe('Netflix');
  });

  it('should evaluate budget burn rates and highlight warnings', () => {
    // Normal burn (50% spent)
    const normal = generateBudgetHealthSummary(100000n, 50000n);
    expect(normal.status).toBe('healthy');
    expect(normal.burnRatePercent).toBe(50.0);

    // High burn (90% spent)
    const warning = generateBudgetHealthSummary(100000n, 90000n);
    expect(warning.status).toBe('warning');

    // Over spent (110% spent)
    const danger = generateBudgetHealthSummary(100000n, 110000n);
    expect(danger.status).toBe('danger');
  });

  it('should compile category trends and compute averages', () => {
    const trends = [
      { monthYear: '2026-05', spent: 10000n, assigned: 20000n },
      { monthYear: '2026-06', spent: 20000n, assigned: 20000n },
    ];

    const report = compileCategoryAnalytics('food', 'Food', trends);

    expect(report.averageSpent).toBe(15000n); // (100 + 200) / 2 = 150
    expect(report.maxSpent).toBe(20000n);
    expect(report.monthlyTrends[0].monthYear).toBe('2026-05');
  });
});
