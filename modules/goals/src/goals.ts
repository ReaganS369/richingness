export interface SavingGoal {
  id: string;
  name: string;
  targetAmount: bigint;       // Target in paise
  currentAmount: bigint;      // Saved amount in paise
  monthlyContribution: bigint; // Planned monthly savings in paise
  targetDate?: Date | null;    // Deadline if specified
  linkedCategoryId?: string | null;
}

export interface GoalProgressSummary {
  goalId: string;
  progressPercent: number;    // 0 to 100
  remainingAmount: bigint;
  monthsToTarget: number;     // -1 if unreachable (contribution is 0)
  targetDateETA?: Date | null;
  recommendedMonthlyContribution?: bigint | null;
}

/**
 * Calculates a summary of savings goal parameters, including progress, ETA, and recommended contributions.
 */
export function calculateGoalProgress(
  goal: SavingGoal,
  referenceDate: Date = new Date()
): GoalProgressSummary {
  const remainingAmount = goal.targetAmount > goal.currentAmount 
    ? goal.targetAmount - goal.currentAmount 
    : 0n;

  // 1. Calculate progress percentage
  let progressPercent = 100.0;
  if (goal.targetAmount > 0n) {
    progressPercent = Number((goal.currentAmount * 10000n) / goal.targetAmount) / 100;
    progressPercent = Math.min(100.0, Math.max(0.0, progressPercent));
  }

  // 2. Calculate months remaining based on planned monthly contribution
  let monthsToTarget = -1;
  let targetDateETA: Date | null = null;

  if (remainingAmount === 0n) {
    monthsToTarget = 0;
  } else if (goal.monthlyContribution > 0n) {
    // Round up months to target
    monthsToTarget = Number(
      (remainingAmount + goal.monthlyContribution - 1n) / goal.monthlyContribution
    );

    // Calculate dynamic ETA date
    const eta = new Date(referenceDate);
    eta.setMonth(eta.getMonth() + monthsToTarget);
    targetDateETA = eta;
  }

  // 3. If target date is defined, recommend a monthly saving amount to hit the deadline
  let recommendedMonthlyContribution: bigint | null = null;
  if (goal.targetDate && remainingAmount > 0n) {
    const deadline = new Date(goal.targetDate);
    const monthsRemaining = getMonthsDifference(referenceDate, deadline);

    if (monthsRemaining > 0) {
      recommendedMonthlyContribution = remainingAmount / BigInt(monthsRemaining);
      // Ensure we don't round down to 0 if there is still a remaining amount
      if (recommendedMonthlyContribution === 0n && remainingAmount > 0n) {
        recommendedMonthlyContribution = 1n;
      }
    } else {
      // If deadline is this month or past, recommend the entire remaining amount
      recommendedMonthlyContribution = remainingAmount;
    }
  }

  return {
    goalId: goal.id,
    progressPercent,
    remainingAmount,
    monthsToTarget,
    targetDateETA,
    recommendedMonthlyContribution,
  };
}

/**
 * Helper to compute month intervals between two dates.
 */
function getMonthsDifference(startDate: Date, endDate: Date): number {
  const yearsDiff = endDate.getFullYear() - startDate.getFullYear();
  const monthsDiff = endDate.getMonth() - startDate.getMonth();
  return yearsDiff * 12 + monthsDiff;
}
