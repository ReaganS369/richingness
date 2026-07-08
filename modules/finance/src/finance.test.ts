import { describe, it, expect } from 'vitest';
import { computeAccountBalances, createTransferOperations, Account, LedgerOperation } from './ledger.js';
import { calculateNetWorth } from './networth.js';
import { aggregateMonthlyCashFlow } from './cashflow.js';
import { convertCurrency, ExchangeRate } from './currency.js';

describe('Finance Core Ledger Engine', () => {
  const mockAccounts: Account[] = [
    { id: 'checking-id', name: 'HDFC Checking', type: 'checking', currency: 'INR' },
    { id: 'cc-id', name: 'Amazon Pay ICICI Card', type: 'credit', currency: 'INR' },
    { id: 'us-savings', name: 'Chase Savings', type: 'savings', currency: 'USD' },
  ];

  it('should compute account balances dynamically from append-only ledger logs', () => {
    const operations: LedgerOperation[] = [
      {
        id: 'op-1',
        accountId: 'checking-id',
        type: 'INCOME',
        amount: 100000n, // +₹1000.00
        currency: 'INR',
        exchangeRate: 1.0,
        date: new Date('2026-07-01'),
      },
      {
        id: 'op-2',
        accountId: 'checking-id',
        type: 'EXPENSE',
        amount: 30000n, // -₹300.00
        currency: 'INR',
        exchangeRate: 1.0,
        date: new Date('2026-07-02'),
      },
      {
        id: 'op-3',
        accountId: 'cc-id',
        type: 'EXPENSE',
        amount: 50000n, // -₹500.00
        currency: 'INR',
        exchangeRate: 1.0,
        date: new Date('2026-07-03'),
      },
    ];

    const balances = computeAccountBalances(mockAccounts, operations);

    expect(balances.get('checking-id')?.clearedBalance).toBe(70000n); // 1000 - 300 = ₹700
    expect(balances.get('cc-id')?.clearedBalance).toBe(-50000n);      // -₹500
    expect(balances.get('us-savings')?.clearedBalance).toBe(0n);
  });

  it('should generate double-leg transfer operations safely', () => {
    const transferOps = createTransferOperations(
      'txn-trans-123',
      'checking-id',
      'cc-id',
      50000n,
      'INR',
      1.0,
      new Date('2026-07-05')
    );

    expect(transferOps).toHaveLength(2);
    expect(transferOps[0].type).toBe('TRANSFER_OUT');
    expect(transferOps[0].accountId).toBe('checking-id');
    expect(transferOps[0].amount).toBe(50000n);

    expect(transferOps[1].type).toBe('TRANSFER_IN');
    expect(transferOps[1].accountId).toBe('cc-id');
    expect(transferOps[1].amount).toBe(50000n);
  });

  it('should calculate net worth converting foreign balances to base currency', () => {
    const balances = new Map([
      ['checking-id', { accountId: 'checking-id', clearedBalance: 100000n, pendingBalance: 0n }], // +₹1000
      ['cc-id', { accountId: 'cc-id', clearedBalance: -50000n, pendingBalance: 0n }],             // -₹500
      ['us-savings', { accountId: 'us-savings', clearedBalance: 1000n, pendingBalance: 0n }],     // +$10
    ]);

    const exchangeRates = {
      INR: 1.0,
      USD: 83.5, // $1 = ₹83.5
    };

    const netWorth = calculateNetWorth(mockAccounts, balances, exchangeRates);

    // Assets: checking (₹1000) + us-savings ($10 * 83.5 = ₹835) = ₹1835
    expect(netWorth.totalAssets).toBe(183500n);
    // Liabilities: cc (-₹500) = ₹500
    expect(netWorth.totalLiabilities).toBe(50000n);
    // Net Worth: 1835 - 500 = ₹1335
    expect(netWorth.netWorth).toBe(133500n);
  });

  it('should aggregate monthly cash flow correctly', () => {
    const operations: LedgerOperation[] = [
      {
        id: 'op-1',
        accountId: 'checking-id',
        type: 'INCOME',
        amount: 200000n, // ₹2000
        currency: 'INR',
        exchangeRate: 1.0,
        date: new Date('2026-06-15'),
      },
      {
        id: 'op-2',
        accountId: 'checking-id',
        type: 'EXPENSE',
        amount: 80000n, // ₹800
        currency: 'INR',
        exchangeRate: 1.0,
        date: new Date('2026-06-20'),
      },
      {
        id: 'op-3',
        accountId: 'checking-id',
        type: 'INCOME',
        amount: 500000n, // ₹5000
        currency: 'INR',
        exchangeRate: 1.0,
        date: new Date('2026-07-01'),
      },
    ];

    const flows = aggregateMonthlyCashFlow(operations, 'INR');

    expect(flows).toHaveLength(2);
    
    // June
    expect(flows[0].monthYear).toBe('2026-06');
    expect(flows[0].income).toBe(200000n);
    expect(flows[0].expenses).toBe(80000n);
    expect(flows[0].savings).toBe(120000n);
    expect(flows[0].savingsRate).toBe(60.0); // 1200 / 2000 = 60%

    // July
    expect(flows[1].monthYear).toBe('2026-07');
    expect(flows[1].income).toBe(500000n);
    expect(flows[1].expenses).toBe(0n);
  });

  it('should convert foreign currencies utilizing historical rates maps', () => {
    const rates: ExchangeRate[] = [
      { from: 'USD', to: 'INR', rate: 80.0, date: new Date('2026-01-01') },
      { from: 'USD', to: 'INR', rate: 83.5, date: new Date('2026-07-01') },
    ];

    // Transaction on Jan 15th
    const transJan = convertCurrency(1000n, 'USD', 'INR', rates, new Date('2026-01-15'));
    expect(transJan.rate).toBe(80.0);
    expect(transJan.amount).toBe(80000n);

    // Transaction on July 10th
    const transJuly = convertCurrency(1000n, 'USD', 'INR', rates, new Date('2026-07-10'));
    expect(transJuly.rate).toBe(83.5);
    expect(transJuly.amount).toBe(83500n);
  });
});
