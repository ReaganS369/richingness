import { describe, it, expect, beforeAll } from 'vitest';
import 'fake-indexeddb/auto'; // Polyfill for IndexedDB in Node
import { WebRepository } from '@repo/storage-web/src/indexeddb';
import { Account, LedgerOperation } from '@repo/module-finance';
import { BudgetCategory } from '@repo/module-budget';

describe('Richingness Stress and Logic Test', () => {
  let repo: WebRepository;
  let scoped: any;
  const USER_ID = 'test-qa@example.com';

  beforeAll(() => {
    repo = new WebRepository();
    scoped = repo.forUser(USER_ID);
  });

  it('should successfully create 100 nested categories quickly', async () => {
    const startTime = performance.now();
    for (let i = 0; i < 100; i++) {
      const category: BudgetCategory = {
        id: `[QA]-cat-${i}`,
        name: `QA Category ${i}`,
        parentId: i > 0 ? `[QA]-cat-${i - 1}` : null,
        budgetAmount: 500n,
        rolloverMode: 'none',
        priority: i,
        isIncome: false,
        isHidden: false,
        sortOrder: i
      };
      await scoped.saveCategory(category);
    }
    const endTime = performance.now();
    
    const categories = await scoped.getCategories();
    expect(categories.length).toBe(100);
    console.log(`Created 100 categories in ${Math.round(endTime - startTime)}ms`);
  });

  it('should successfully create 500 transactions quickly', async () => {
    const startTime = performance.now();
    
    // First create an account
    const account: Account = {
      id: '[QA]-acc-1',
      name: 'QA Test Account',
      type: 'checking',
      currency: 'USD'
    };
    await scoped.saveAccount(account);
    
    // Create 500 transactions
    for (let i = 0; i < 500; i++) {
      const op: LedgerOperation = {
        id: `[QA]-txn-${i}`,
        accountId: '[QA]-acc-1',
        type: 'EXPENSE',
        amount: 1000n,
        currency: 'USD',
        exchangeRate: 1.0,
        date: new Date(),
        referenceId: `[QA]-cat-${i % 100}`
      };
      await scoped.saveTransaction(op);
    }
    const endTime = performance.now();
    
    const txns = await scoped.getLedger();
    expect(txns.length).toBe(500);
    console.log(`Created 500 transactions in ${Math.round(endTime - startTime)}ms`);
  });
});
