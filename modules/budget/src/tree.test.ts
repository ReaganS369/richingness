import { describe, it, expect } from 'vitest';
import { buildCategoryTree, aggregateCategoryTree, BudgetCategory } from './tree.js';

describe('Budget Category Tree Builder', () => {
  const mockCategories: BudgetCategory[] = [
    {
      id: 'root-needs',
      parentId: null,
      name: 'Needs',
      rolloverMode: 'none',
      budgetAmount: 100000n, // 1000.00
      priority: 5,
      isIncome: false,
      isHidden: false,
      sortOrder: 1,
    },
    {
      id: 'child-food',
      parentId: 'root-needs',
      name: 'Food',
      rolloverMode: 'carry',
      budgetAmount: 50000n, // 500.00
      priority: 5,
      isIncome: false,
      isHidden: false,
      sortOrder: 1,
    },
    {
      id: 'child-rent',
      parentId: 'root-needs',
      name: 'Rent',
      rolloverMode: 'recover',
      budgetAmount: 150000n, // 1500.00
      priority: 5,
      isIncome: false,
      isHidden: false,
      sortOrder: 2,
    },
    {
      id: 'root-wants',
      parentId: null,
      name: 'Wants',
      rolloverMode: 'none',
      budgetAmount: 40000n, // 400.00
      priority: 3,
      isIncome: false,
      isHidden: false,
      sortOrder: 2,
    },
  ];

  it('should build a hierarchical tree from a flat list', () => {
    const tree = buildCategoryTree(mockCategories);
    expect(tree).toHaveLength(2);
    
    // Sort orders respected
    expect(tree[0].id).toBe('root-needs');
    expect(tree[1].id).toBe('root-wants');

    // Children arrays verified
    const needsNode = tree[0];
    expect(needsNode.children).toHaveLength(2);
    expect(needsNode.children[0].id).toBe('child-food');
    expect(needsNode.children[1].id).toBe('child-rent');
  });

  it('should aggregate budget figures recursively', () => {
    const tree = buildCategoryTree(mockCategories);
    
    const mockSpentMap: Record<string, bigint> = {
      'root-needs': 10000n,   // 100.00
      'child-food': 30000n,   // 300.00
      'child-rent': 140000n,  // 1400.00
      'root-wants': 5000n,     // 50.00
    };

    const getSpentAmount = (id: string) => mockSpentMap[id] || 0n;

    aggregateCategoryTree(tree, getSpentAmount);

    const needsNode = tree[0];
    const wantsNode = tree[1];

    // Assert Wants node
    expect(wantsNode.totalBudgetAmount).toBe(40000n);
    expect(wantsNode.totalSpentAmount).toBe(5000n);
    expect(wantsNode.totalAvailableAmount).toBe(35000n); // 400 - 50 = 350

    // Assert child-food node in tree
    const foodNode = needsNode.children[0];
    expect(foodNode.totalBudgetAmount).toBe(50000n);
    expect(foodNode.totalSpentAmount).toBe(30000n);
    expect(foodNode.totalAvailableAmount).toBe(20000n);

    // Assert needsNode rollups
    // totalBudgetAmount = root assigned (1000) + childFood assigned (500) + childRent assigned (1500) = 3000
    expect(needsNode.totalBudgetAmount).toBe(300000n);
    // totalSpentAmount = root spent (100) + childFood spent (300) + childRent spent (1400) = 1800
    expect(needsNode.totalSpentAmount).toBe(180000n);
    // totalAvailableAmount = 3000 - 1800 = 1200
    expect(needsNode.totalAvailableAmount).toBe(120000n);
  });
});
