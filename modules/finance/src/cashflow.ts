import { LedgerOperation } from './ledger.js';

export interface MonthlyCashFlow {
  monthYear: string;   // "YYYY-MM"
  income: bigint;      // Converted to base reporting currency
  expenses: bigint;    // Converted to base reporting currency
  savings: bigint;     // income - expenses
  savingsRate: number; // percentage (0 to 100)
}

/**
 * Aggregates ledger operations into monthly cash flow snapshots.
 */
export function aggregateMonthlyCashFlow(
  operations: LedgerOperation[],
  baseCurrencyCode: string
): MonthlyCashFlow[] {
  const map = new Map<string, { income: bigint; expenses: bigint }>();

  for (const op of operations) {
    const date = new Date(op.date);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const monthYear = `${year}-${month}`;

    if (!map.has(monthYear)) {
      map.set(monthYear, { income: 0n, expenses: 0n });
    }

    const data = map.get(monthYear)!;
    const rateMultiplier = BigInt(Math.round(op.exchangeRate * 1000000));
    const amountInBase = (op.amount * rateMultiplier) / 1000000n;

    if (op.type === 'INCOME') {
      data.income += amountInBase;
    } else if (op.type === 'EXPENSE') {
      data.expenses += amountInBase;
    }
  }

  const summaries: MonthlyCashFlow[] = [];

  for (const [monthYear, data] of map.entries()) {
    const savings = data.income - data.expenses;
    let savingsRate = 0;

    if (data.income > 0n) {
      savingsRate = Number((savings * 10000n) / data.income) / 100;
    }

    summaries.push({
      monthYear,
      income: data.income,
      expenses: data.expenses,
      savings,
      savingsRate,
    });
  }

  // Sort chronologically
  return summaries.sort((a, b) => a.monthYear.localeCompare(b.monthYear));
}
