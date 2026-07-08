import { Account, AccountBalance } from './ledger.js';

export interface NetWorthSummary {
  totalAssets: bigint;      // In reporting base currency
  totalLiabilities: bigint; // In reporting base currency
  netWorth: bigint;         // Assets - Liabilities
}

/**
 * Calculates net worth by aggregating assets and liabilities.
 * Auto-converts account balances to the reporting base currency using the account exchange rates.
 */
export function calculateNetWorth(
  accounts: Account[],
  balances: Map<string, AccountBalance>,
  // Rates map: original_currency -> rate to base currency
  exchangeRates: Record<string, number>
): NetWorthSummary {
  let totalAssets = 0n;
  let totalLiabilities = 0n;

  const assetTypes = ['cash', 'checking', 'savings', 'investment', 'crypto', 'asset'];
  const liabilityTypes = ['credit', 'loan', 'liability'];

  for (const acct of accounts) {
    const bal = balances.get(acct.id);
    if (!bal) continue;

    const rate = exchangeRates[acct.currency] || 1;
    // Cleared balance represents the actual confirmed cash balance
    const balanceInBase = BigInt(Math.floor(Number(bal.clearedBalance) * rate));

    if (assetTypes.includes(acct.type)) {
      totalAssets += balanceInBase;
    } else if (liabilityTypes.includes(acct.type)) {
      // Liabilities are aggregated as positive values, then subtracted from assets
      totalLiabilities += balanceInBase < 0n ? -balanceInBase : balanceInBase;
    }
  }

  return {
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
  };
}
