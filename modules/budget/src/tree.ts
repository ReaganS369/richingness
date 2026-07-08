export interface BudgetCategory {
  id: string;
  parentId: string | null;
  name: string;
  rolloverMode: 'none' | 'carry' | 'recover';
  budgetAmount: bigint; // Monthly allocated budget in paise
  priority: number;     // 1 (lowest) to 5 (highest)
  isIncome: boolean;
  isHidden: boolean;
  sortOrder: number;
}

export interface CategoryNode extends BudgetCategory {
  children: CategoryNode[];
  // Aggregated values computed dynamically
  totalBudgetAmount: bigint;
  totalSpentAmount: bigint;
  totalAvailableAmount: bigint;
}

/**
 * Builds a recursive tree from a flat list of budget categories.
 */
export function buildCategoryTree(categories: BudgetCategory[]): CategoryNode[] {
  const map = new Map<string, CategoryNode>();
  const roots: CategoryNode[] = [];

  // Initialize nodes
  for (const cat of categories) {
    map.set(cat.id, {
      ...cat,
      children: [],
      totalBudgetAmount: 0n,
      totalSpentAmount: 0n,
      totalAvailableAmount: 0n,
    });
  }

  // Build tree hierarchy
  for (const cat of categories) {
    const node = map.get(cat.id)!;
    if (cat.parentId === null) {
      roots.push(node);
    } else {
      const parentNode = map.get(cat.parentId);
      if (parentNode) {
        parentNode.children.push(node);
      } else {
        // Fallback to root if parent is invalid
        roots.push(node);
      }
    }
  }

  // Sort children by sortOrder
  for (const node of map.values()) {
    node.children.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  roots.sort((a, b) => a.sortOrder - b.sortOrder);
  return roots;
}

/**
 * Recursively aggregates budget figures from leaf nodes up to the roots.
 * Assumes a callback function is provided to fetch raw spent amounts per category ID.
 */
export function aggregateCategoryTree(
  nodes: CategoryNode[],
  getSpentAmount: (categoryId: string) => bigint,
  getAssignedAmount?: (categoryId: string) => bigint
): void {
  for (const node of nodes) {
    // Recurse into children first
    if (node.children.length > 0) {
      aggregateCategoryTree(node.children, getSpentAmount, getAssignedAmount);
    }

    const rawSpent = getSpentAmount(node.id);
    const rawAssigned = getAssignedAmount ? getAssignedAmount(node.id) : node.budgetAmount;

    // Node direct values
    let childBudgetSum = 0n;
    let childSpentSum = 0n;
    let childAvailableSum = 0n;

    for (const child of node.children) {
      childBudgetSum += child.totalBudgetAmount;
      childSpentSum += child.totalSpentAmount;
      childAvailableSum += child.totalAvailableAmount;
    }

    node.totalBudgetAmount = rawAssigned + childBudgetSum;
    node.totalSpentAmount = rawSpent + childSpentSum;
    node.totalAvailableAmount = node.totalBudgetAmount - node.totalSpentAmount;
  }
}
