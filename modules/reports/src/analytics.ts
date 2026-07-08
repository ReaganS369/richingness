export interface MonthlyCategoryTrend {
  monthYear: string;
  spent: bigint;
  assigned: bigint;
}

export interface CategoryAnalyticsReport {
  categoryId: string;
  categoryName: string;
  monthlyTrends: MonthlyCategoryTrend[];
  averageSpent: bigint;
  maxSpent: bigint;
}

export interface GoalAnalyticsSummary {
  totalGoalsCount: number;
  completedGoalsCount: number;
  totalTargetRequired: bigint;
  totalAmountSaved: bigint;
  overallSavingsProgressPercent: number;
}

/**
 * Compiles historical category spending trends.
 */
export function compileCategoryAnalytics(
  categoryId: string,
  categoryName: string,
  trends: MonthlyCategoryTrend[]
): CategoryAnalyticsReport {
  if (trends.length === 0) {
    return {
      categoryId,
      categoryName,
      monthlyTrends: [],
      averageSpent: 0n,
      maxSpent: 0n
    };
  }

  let totalSpent = 0n;
  let maxSpent = 0n;

  for (const t of trends) {
    totalSpent += t.spent;
    if (t.spent > maxSpent) {
      maxSpent = t.spent;
    }
  }

  const averageSpent = totalSpent / BigInt(trends.length);

  return {
    categoryId,
    categoryName,
    monthlyTrends: [...trends].sort((a, b) => a.monthYear.localeCompare(b.monthYear)),
    averageSpent,
    maxSpent
  };
}

/**
 * Compiles aggregations over all active saving goals.
 */
export function compileGoalAnalytics(
  goals: { targetAmount: bigint; currentAmount: bigint; isCompleted: boolean }[]
): GoalAnalyticsSummary {
  const totalGoalsCount = goals.length;
  const completedGoalsCount = goals.filter(g => g.isCompleted).length;
  let totalTargetRequired = 0n;
  let totalAmountSaved = 0n;

  for (const g of goals) {
    totalTargetRequired += g.targetAmount;
    totalAmountSaved += g.currentAmount;
  }

  let overallSavingsProgressPercent = 100.0;
  if (totalTargetRequired > 0n) {
    overallSavingsProgressPercent = Number((totalAmountSaved * 10000n) / totalTargetRequired) / 100;
    overallSavingsProgressPercent = Math.min(100.0, Math.max(0.0, overallSavingsProgressPercent));
  }

  return {
    totalGoalsCount,
    completedGoalsCount,
    totalTargetRequired,
    totalAmountSaved,
    overallSavingsProgressPercent
  };
}
