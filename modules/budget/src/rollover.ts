export interface RolloverInput {
  categoryId: string;
  assigned: bigint;       // Budget amount assigned for current month
  spent: bigint;          // Amount spent this month
  rolloverIn: bigint;     // Balance brought in from previous month
  rolloverMode: 'none' | 'carry' | 'recover';
}

export interface RolloverOutput {
  categoryId: string;
  closingBalance: bigint; // Closing balance of current month
  rolloverOut: bigint;    // The actual amount rolled over into next month
  nextMonthStartingBalance: bigint; // next month start: nextMonthAssigned + rolloverOut
}

/**
 * Calculates rollover figures for a single category snapshot.
 */
export function calculateRollover(input: RolloverInput, nextMonthAssigned = 0n): RolloverOutput {
  const currentTotalAvailable = input.assigned + input.rolloverIn;
  const closingBalance = currentTotalAvailable - input.spent;

  let rolloverOut = 0n;
  switch (input.rolloverMode) {
    case 'none':
      rolloverOut = 0n;
      break;
    case 'carry':
      // Only roll over positive surplus balances
      rolloverOut = closingBalance > 0n ? closingBalance : 0n;
      break;
    case 'recover':
      // Roll over both surplus and deficits
      rolloverOut = closingBalance;
      break;
    default:
      throw new Error(`Invalid rollover mode: ${input.rolloverMode}`);
  }

  return {
    categoryId: input.categoryId,
    closingBalance,
    rolloverOut,
    nextMonthStartingBalance: nextMonthAssigned + rolloverOut
  };
}

/**
 * Executes rollover calculations across all snapshots.
 */
export function processMonthlyRollover(
  categories: RolloverInput[],
  nextMonthAssignedMap: Map<string, bigint>
): RolloverOutput[] {
  return categories.map(cat => {
    const nextAssigned = nextMonthAssignedMap.get(cat.categoryId) || 0n;
    return calculateRollover(cat, nextAssigned);
  });
}
