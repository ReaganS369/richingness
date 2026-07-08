export interface Account {
  id: string;
  name: string;
  type:
    | 'cash'
    | 'checking'
    | 'savings'
    | 'credit'
    | 'investment'
    | 'crypto'
    | 'loan'
    | 'asset'
    | 'liability';
  currency: string;
}

export interface LedgerOperation {
  id: string;
  accountId: string;
  toAccountId?: string | null; // Used if type is 'TRANSFER'
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'ADJUSTMENT';
  amount: bigint;              // Always stored as positive bigint (paise)
  currency: string;
  exchangeRate: number;        // To base reporting currency
  date: Date;
  referenceId?: string | null;  // Paired transaction UUID or recovery session ID
}

export interface AccountBalance {
  accountId: string;
  clearedBalance: bigint;
  pendingBalance: bigint;
}

/**
 * Computes individual balances of accounts based on an immutable append-only ledger operation log.
 */
export function computeAccountBalances(
  accounts: Account[],
  operations: LedgerOperation[]
): Map<string, AccountBalance> {
  const balanceMap = new Map<string, AccountBalance>();

  // Initialize
  for (const acct of accounts) {
    balanceMap.set(acct.id, {
      accountId: acct.id,
      clearedBalance: 0n,
      pendingBalance: 0n,
    });
  }

  // Iterate over ledger operations chronologically
  for (const op of operations) {
    const bal = balanceMap.get(op.accountId);
    if (!bal) continue;

    switch (op.type) {
      case 'INCOME':
        bal.clearedBalance += op.amount;
        break;
      case 'EXPENSE':
        bal.clearedBalance -= op.amount;
        break;
      case 'TRANSFER_OUT':
        bal.clearedBalance -= op.amount;
        break;
      case 'TRANSFER_IN':
        bal.clearedBalance += op.amount;
        break;
      case 'ADJUSTMENT':
        // For adjustments, amount can be positive (credit) or negative (debit)
        bal.clearedBalance += op.amount;
        break;
    }
  }

  return balanceMap;
}

/**
 * Helper to generate transfer ledger operations.
 * A transfer always generates TWO immutable entries: TRANSFER_OUT on source, TRANSFER_IN on destination.
 */
export function createTransferOperations(
  transferId: string,
  fromAccountId: string,
  toAccountId: string,
  amount: bigint,
  currency: string,
  exchangeRate: number,
  date: Date
): LedgerOperation[] {
  if (amount <= 0n) {
    throw new Error('Transfer amount must be greater than zero');
  }

  return [
    {
      id: `${transferId}-out`,
      accountId: fromAccountId,
      toAccountId: toAccountId,
      type: 'TRANSFER_OUT',
      amount,
      currency,
      exchangeRate,
      date,
      referenceId: transferId,
    },
    {
      id: `${transferId}-in`,
      accountId: toAccountId,
      toAccountId: fromAccountId,
      type: 'TRANSFER_IN',
      amount,
      currency,
      exchangeRate,
      date,
      referenceId: transferId,
    },
  ];
}
