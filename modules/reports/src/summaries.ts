export interface CategorySpendBreakdown {
  categoryId: string;
  categoryName: string;
  amount: bigint;
  percentage: number; // 0 to 100
}

export interface MerchantSpendBreakdown {
  merchantName: string;
  amount: bigint;
  percentage: number;
}

export interface SpendingSummary {
  totalSpent: bigint;
  byCategory: CategorySpendBreakdown[];
  byMerchant: MerchantSpendBreakdown[];
}

export interface BudgetHealthSummary {
  totalBudgeted: bigint;
  totalSpent: bigint;
  variance: bigint;           // budgeted - spent
  burnRatePercent: number;    // spent / budgeted * 100
  status: 'healthy' | 'warning' | 'danger';
}

/**
 * Generates a Spending Summary model from a list of transactions.
 * Maps values to the reporting base currency.
 */
export function generateSpendingSummary(
  transactions: { categoryId: string; categoryName: string; merchantName: string; amountInBase: bigint }[]
): SpendingSummary {
  let totalSpent = 0n;
  const categoryMap = new Map<string, { name: string; amount: bigint }>();
  const merchantMap = new Map<string, bigint>();

  for (const tx of transactions) {
    totalSpent += tx.amountInBase;

    // Category aggregation
    const catData = categoryMap.get(tx.categoryId) || { name: tx.categoryName, amount: 0n };
    catData.amount += tx.amountInBase;
    categoryMap.set(tx.categoryId, catData);

    // Merchant aggregation
    const merchantAmount = merchantMap.get(tx.merchantName) || 0n;
    merchantMap.set(tx.merchantName, merchantAmount + tx.amountInBase);
  }

  const byCategory: CategorySpendBreakdown[] = [];
  for (const [id, data] of categoryMap.entries()) {
    const percentage = totalSpent > 0n 
      ? Number((data.amount * 10000n) / totalSpent) / 100 
      : 0;
    byCategory.push({
      categoryId: id,
      categoryName: data.name,
      amount: data.amount,
      percentage
    });
  }

  const byMerchant: MerchantSpendBreakdown[] = [];
  for (const [name, amount] of merchantMap.entries()) {
    const percentage = totalSpent > 0n 
      ? Number((amount * 10000n) / totalSpent) / 100 
      : 0;
    byMerchant.push({
      merchantName: name,
      amount,
      percentage
    });
  }

  // Sort descending by amount
  byCategory.sort((a, b) => (b.amount > a.amount ? 1 : b.amount < a.amount ? -1 : 0));
  byMerchant.sort((a, b) => (b.amount > a.amount ? 1 : b.amount < a.amount ? -1 : 0));

  return {
    totalSpent,
    byCategory,
    byMerchant,
  };
}

/**
 * Generates Budget health indicators.
 */
export function generateBudgetHealthSummary(
  totalBudgeted: bigint,
  totalSpent: bigint
): BudgetHealthSummary {
  const variance = totalBudgeted - totalSpent;
  let burnRatePercent = 0;

  if (totalBudgeted > 0n) {
    burnRatePercent = Number((totalSpent * 10000n) / totalBudgeted) / 100;
  }

  let status: 'healthy' | 'warning' | 'danger' = 'healthy';
  if (burnRatePercent > 100) {
    status = 'danger';
  } else if (burnRatePercent > 85) {
    status = 'warning';
  }

  return {
    totalBudgeted,
    totalSpent,
    variance,
    burnRatePercent,
    status
  };
}
