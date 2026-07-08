import { describe, it, expect } from 'vitest';
import { calculateGoalProgress, SavingGoal } from './goals.js';

describe('Goal Progress Calculations Engine', () => {
  it('should compute percentages and remainders accurately', () => {
    const goal: SavingGoal = {
      id: 'car-goal',
      name: 'New SUV',
      targetAmount: 1000000n, // ₹10,000.00
      currentAmount: 400000n,  // ₹4,000.00
      monthlyContribution: 50000n, // ₹500.00 / month
    };

    const referenceDate = new Date('2026-07-08');
    const summary = calculateGoalProgress(goal, referenceDate);

    expect(summary.remainingAmount).toBe(600000n);
    expect(summary.progressPercent).toBe(40.0);
    expect(summary.monthsToTarget).toBe(12); // 600000 / 50000 = 12 months

    const expectedETA = new Date(referenceDate);
    expectedETA.setMonth(expectedETA.getMonth() + 12);
    expect(summary.targetDateETA?.getFullYear()).toBe(expectedETA.getFullYear());
    expect(summary.targetDateETA?.getMonth()).toBe(expectedETA.getMonth());
  });

  it('should recommend monthly contributions to hit a deadline', () => {
    const referenceDate = new Date('2026-07-08');
    const targetDate = new Date('2027-07-08'); // exactly 12 months away

    const goal: SavingGoal = {
      id: 'house-fund',
      name: 'Down Payment',
      targetAmount: 1200000n, // ₹12,000
      currentAmount: 0n,
      monthlyContribution: 0n,
      targetDate,
    };

    const summary = calculateGoalProgress(goal, referenceDate);

    expect(summary.remainingAmount).toBe(1200000n);
    // Recommend: 1,200,000 / 12 months = 100,000n
    expect(summary.recommendedMonthlyContribution).toBe(100000n);
  });
});
