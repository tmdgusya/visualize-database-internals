import { create } from 'zustand';

// Plan Node Types
export type PlanNodeType =
  | 'SeqScan'
  | 'IndexScan'
  | 'IndexOnlyScan'
  | 'BitmapScan'
  | 'NestedLoop'
  | 'HashJoin'
  | 'MergeJoin'
  | 'Sort'
  | 'Aggregate'
  | 'Limit';

// Cost model constants (PostgreSQL defaults)
export const COST_CONSTANTS = {
  seq_page_cost: 1.0,
  random_page_cost: 4.0,
  cpu_tuple_cost: 0.01,
  cpu_index_tuple_cost: 0.005,
  cpu_operator_cost: 0.0025,
  effective_cache_size: 524288, // pages
} as const;

// Plan Node interface
export interface PlanNode {
  id: string;
  type: PlanNodeType;
  table?: string;
  index?: string;
  condition?: string;
  children: PlanNode[];
  cost: {
    startup: number;
    total: number;
  };
  rows: number;
  width: number;
  actualRows?: number;
  actualTime?: number;
  // Node-specific properties
  joinType?: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
  sortKeys?: string[];
  groupKeys?: string[];
  hashCond?: string;
  mergeCond?: string;
  indexCond?: string;
  filter?: string;
}

// Execution log entry
export interface ExecutionLogEntry {
  nodeId: string;
  action: 'start' | 'fetch' | 'complete' | 'join' | 'scan' | 'sort' | 'aggregate';
  rows: number;
  time: number;
  details?: string;
}

// Query Plan State
export interface QueryPlanState {
  // Plan tree
  planTree: PlanNode | null;
  sql: string;
  selectedNode: string | null;

  // Execution state
  executionState: 'idle' | 'running' | 'paused' | 'completed';
  currentStep: number;
  executionLog: ExecutionLogEntry[];
  currentNodeId: string | null;

  // Settings
  animationSpeed: number;
  showCosts: boolean;
  showActuals: boolean;
}

// Query Plan Actions
export interface QueryPlanActions {
  // Plan management
  parseSQL: (sql: string) => void;
  generatePlanForSQL: (sql: string) => PlanNode | null;
  setPlanTree: (plan: PlanNode | null) => void;
  clearPlan: () => void;

  // Node selection
  selectNode: (nodeId: string | null) => void;

  // Execution control
  startExecution: () => void;
  step: () => void;
  pause: () => void;
  reset: () => void;
  setAnimationSpeed: (speed: number) => void;

  // Settings
  setShowCosts: (show: boolean) => void;
  setShowActuals: (show: boolean) => void;

  // Computed helpers
  getNodeById: (nodeId: string) => PlanNode | null;
  getTotalCost: () => number;
  getTotalRows: () => number;
  getNodeCount: () => number;
  getMaxDepth: () => number;
}

// Helper to generate unique node IDs
let nodeIdCounter = 0;
const generateNodeId = (): string => `node-${Date.now()}-${nodeIdCounter++}`;

// Calculate scan cost
const calculateScanCost = (
  type: 'seq' | 'index' | 'bitmap',
  pages: number,
  tuples: number,
  selectivity: number = 1.0
): { startup: number; total: number } => {
  const { seq_page_cost, random_page_cost, cpu_tuple_cost, cpu_index_tuple_cost } = COST_CONSTANTS;

  let startup = 0;
  let total = 0;

  switch (type) {
    case 'seq':
      // Sequential scan: read all pages + process all tuples
      total = pages * seq_page_cost + tuples * cpu_tuple_cost;
      break;
    case 'index':
      // Index scan: random page access + index tuple processing
      const indexPages = Math.ceil(pages * selectivity);
      const heapPages = Math.ceil(pages * selectivity * 0.5); // Approximation
      startup = 0;
      total =
        indexPages * random_page_cost +
        heapPages * random_page_cost +
        tuples * selectivity * (cpu_tuple_cost + cpu_index_tuple_cost);
      break;
    case 'bitmap':
      // Bitmap scan: index scan + bitmap build + heap scan
      startup = tuples * selectivity * cpu_index_tuple_cost;
      total =
        startup +
        pages * selectivity * seq_page_cost +
        tuples * selectivity * cpu_tuple_cost;
      break;
  }

  return { startup: Math.round(startup * 100) / 100, total: Math.round(total * 100) / 100 };
};

// Calculate join cost
const calculateJoinCost = (
  type: 'nested' | 'hash' | 'merge',
  outerRows: number,
  innerRows: number,
  outerCost: number,
  innerCost: number
): { startup: number; total: number } => {
  const { cpu_tuple_cost, cpu_operator_cost } = COST_CONSTANTS;

  let startup = 0;
  let total = 0;

  switch (type) {
    case 'nested':
      // Nested loop: outer cost + (outer rows * inner cost)
      startup = outerCost;
      total = outerCost + outerRows * innerCost + outerRows * innerRows * cpu_tuple_cost;
      break;
    case 'hash':
      // Hash join: build hash table + probe
      startup = innerCost + innerRows * cpu_tuple_cost; // Build phase
      total = startup + outerCost + outerRows * cpu_tuple_cost + outerRows * cpu_operator_cost;
      break;
    case 'merge':
      // Merge join: sort both sides + merge
      const sortCost =
        outerRows * Math.log2(outerRows + 1) * cpu_tuple_cost +
        innerRows * Math.log2(innerRows + 1) * cpu_tuple_cost;
      startup = outerCost + innerCost + sortCost;
      total = startup + (outerRows + innerRows) * cpu_tuple_cost;
      break;
  }

  return { startup: Math.round(startup * 100) / 100, total: Math.round(total * 100) / 100 };
};

// SQL Parser - basic pattern matching
export const parseSQLQuery = (sql: string): ParsedSQL => {
  const normalizedSQL = sql.trim().toUpperCase();
  const result: ParsedSQL = {
    type: 'UNKNOWN',
    tables: [],
    columns: [],
    conditions: [],
    joins: [],
    aggregates: [],
    groupBy: [],
    orderBy: [],
    limit: null,
  };

  // Detect query type
  if (normalizedSQL.startsWith('SELECT')) {
    result.type = 'SELECT';
  } else if (normalizedSQL.startsWith('INSERT')) {
    result.type = 'INSERT';
  } else if (normalizedSQL.startsWith('UPDATE')) {
    result.type = 'UPDATE';
  } else if (normalizedSQL.startsWith('DELETE')) {
    result.type = 'DELETE';
  }

  // Extract tables
  const fromMatch = sql.match(/FROM\s+(\w+)(?:\s+AS\s+\w+)?/i);
  if (fromMatch) {
    result.tables.push(fromMatch[1]);
  }

  // Extract JOIN tables
  const joinMatches = sql.matchAll(/JOIN\s+(\w+)/gi);
  for (const match of joinMatches) {
    result.tables.push(match[1]);
    result.joins.push(match[1]);
  }

  // Extract columns
  const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM/i);
  if (selectMatch) {
    const cols = selectMatch[1].split(',').map(c => c.trim());
    result.columns = cols.filter(c => c !== '*');
  }

  // Extract WHERE conditions
  const whereMatch = sql.match(/WHERE\s+(.+?)(?:ORDER|GROUP|LIMIT|$)/i);
  if (whereMatch) {
    result.conditions.push(whereMatch[1].trim());
  }

  // Extract aggregate functions
  const aggMatches = sql.matchAll(/(COUNT|SUM|AVG|MIN|MAX)\s*\(/gi);
  for (const match of aggMatches) {
    result.aggregates.push(match[1]);
  }

  // Extract GROUP BY
  const groupMatch = sql.match(/GROUP\s+BY\s+(.+?)(?:ORDER|LIMIT|$)/i);
  if (groupMatch) {
    result.groupBy = groupMatch[1].split(',').map(c => c.trim());
  }

  // Extract ORDER BY
  const orderMatch = sql.match(/ORDER\s+BY\s+(.+?)(?:LIMIT|$)/i);
  if (orderMatch) {
    result.orderBy = orderMatch[1].split(',').map(c => c.trim());
  }

  // Extract LIMIT
  const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
  if (limitMatch) {
    result.limit = parseInt(limitMatch[1], 10);
  }

  return result;
};

export interface ParsedSQL {
  type: string;
  tables: string[];
  columns: string[];
  conditions: string[];
  joins: string[];
  aggregates: string[];
  groupBy: string[];
  orderBy: string[];
  limit: number | null;
}

// Generate plan tree from parsed SQL
export const generatePlanFromSQL = (sql: string): PlanNode | null => {
  const parsed = parseSQLQuery(sql);

  if (parsed.type !== 'SELECT' || parsed.tables.length === 0) {
    return null;
  }

  let rootNode: PlanNode | null = null;
  let currentNode: PlanNode | null = null;

  // Build from bottom up (scans first)
  const scanNodes: PlanNode[] = parsed.tables.map((table, index) => {
    const hasIndex = parsed.conditions.some(c => c.includes('id') || c.includes('idx'));
    const hasMultipleConditions = parsed.conditions.length > 1;

    let nodeType: PlanNodeType = 'SeqScan';
    let cost: { startup: number; total: number };
    let rows = 1000; // Default estimate
    let width = 100; // Default width

    // Estimate rows based on conditions
    if (parsed.conditions.length > 0) {
      rows = Math.floor(rows / Math.pow(2, parsed.conditions.length));
    }

    // Choose scan type
    if (hasIndex && parsed.columns.length > 0 && !parsed.columns.includes('*')) {
      nodeType = 'IndexOnlyScan';
      cost = calculateScanCost('index', 50, rows, 0.1);
    } else if (hasIndex) {
      nodeType = 'IndexScan';
      cost = calculateScanCost('index', 50, rows, 0.1);
    } else if (hasMultipleConditions) {
      nodeType = 'BitmapScan';
      cost = calculateScanCost('bitmap', 100, rows, 0.2);
    } else {
      nodeType = 'SeqScan';
      cost = calculateScanCost('seq', 100, rows);
    }

    return {
      id: generateNodeId(),
      type: nodeType,
      table,
      index: hasIndex ? `${table}_idx` : undefined,
      condition: parsed.conditions[index] || parsed.conditions[0],
      children: [],
      cost,
      rows,
      width,
      indexCond: hasIndex ? parsed.conditions[0] : undefined,
      filter: parsed.conditions[0],
    };
  });

  // Handle joins
  if (parsed.joins.length > 0 && scanNodes.length >= 2) {
    const joinType: PlanNodeType =
      scanNodes.length > 2 ? 'HashJoin' : parsed.conditions.length > 0 ? 'MergeJoin' : 'NestedLoop';

    const outerNode = scanNodes[0];
    const innerNode = scanNodes[1];

    const joinCost = calculateJoinCost(
      joinType === 'HashJoin' ? 'hash' : joinType === 'MergeJoin' ? 'merge' : 'nested',
      outerNode.rows,
      innerNode.rows,
      outerNode.cost.total,
      innerNode.cost.total
    );

    const joinNode: PlanNode = {
      id: generateNodeId(),
      type: joinType,
      children: [outerNode, innerNode],
      cost: joinCost,
      rows: Math.min(outerNode.rows, innerNode.rows),
      width: outerNode.width + innerNode.width,
      joinType: 'INNER',
      hashCond: joinType === 'HashJoin' ? parsed.conditions[0] : undefined,
      mergeCond: joinType === 'MergeJoin' ? parsed.conditions[0] : undefined,
    };

    currentNode = joinNode;

    // Add remaining scans
    for (let i = 2; i < scanNodes.length; i++) {
      const newJoinCost = calculateJoinCost(
        'hash',
        currentNode.rows,
        scanNodes[i].rows,
        currentNode.cost.total,
        scanNodes[i].cost.total
      );

      const newJoinNode: PlanNode = {
        id: generateNodeId(),
        type: 'HashJoin',
        children: [currentNode, scanNodes[i]],
        cost: newJoinCost,
        rows: Math.min(currentNode.rows, scanNodes[i].rows),
        width: currentNode.width + scanNodes[i].width,
        joinType: 'INNER',
      };

      currentNode = newJoinNode;
    }
  } else if (scanNodes.length === 1) {
    currentNode = scanNodes[0];
  }

  // Add aggregate node if needed
  if (parsed.aggregates.length > 0 || parsed.groupBy.length > 0) {
    const aggCost = {
      startup: currentNode ? currentNode.cost.total : 0,
      total: (currentNode ? currentNode.cost.total : 0) + 10,
    };

    const aggNode: PlanNode = {
      id: generateNodeId(),
      type: 'Aggregate',
      children: currentNode ? [currentNode] : [],
      cost: aggCost,
      rows: parsed.groupBy.length > 0 ? Math.floor((currentNode?.rows || 100) / 10) : 1,
      width: currentNode?.width || 100,
      groupKeys: parsed.groupBy.length > 0 ? parsed.groupBy : undefined,
    };

    currentNode = aggNode;
  }

  // Add sort node if needed
  if (parsed.orderBy.length > 0) {
    const sortCost = {
      startup: currentNode ? currentNode.cost.total : 0,
      total:
        (currentNode ? currentNode.cost.total : 0) +
        (currentNode?.rows || 100) * Math.log2((currentNode?.rows || 100) + 1) * COST_CONSTANTS.cpu_tuple_cost,
    };

    const sortNode: PlanNode = {
      id: generateNodeId(),
      type: 'Sort',
      children: currentNode ? [currentNode] : [],
      cost: sortCost,
      rows: currentNode?.rows || 100,
      width: currentNode?.width || 100,
      sortKeys: parsed.orderBy,
    };

    currentNode = sortNode;
  }

  // Add limit node if needed
  if (parsed.limit !== null) {
    const limitCost = {
      startup: currentNode ? currentNode.cost.startup : 0,
      total: currentNode ? currentNode.cost.startup + 0.01 : 0.01,
    };

    const limitNode: PlanNode = {
      id: generateNodeId(),
      type: 'Limit',
      children: currentNode ? [currentNode] : [],
      cost: limitCost,
      rows: Math.min(parsed.limit, currentNode?.rows || 100),
      width: currentNode?.width || 100,
    };

    currentNode = limitNode;
  }

  rootNode = currentNode;
  return rootNode;
};

// Preset queries
export const PRESET_QUERIES = {
  simple: `SELECT * FROM users WHERE age > 25`,
  join: `SELECT u.name, o.amount
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active'`,
  aggregate: `SELECT department, COUNT(*) as count, AVG(salary) as avg_salary
FROM employees
WHERE hire_date > '2023-01-01'
GROUP BY department`,
  subquery: `SELECT name FROM products
WHERE category_id IN (
  SELECT id FROM categories WHERE name = 'Electronics'
)`,
  index: `SELECT id, email FROM users WHERE id = 123`,
  complex: `SELECT c.name, COUNT(o.id) as order_count, SUM(o.total) as total_amount
FROM customers c
JOIN orders o ON c.id = o.customer_id
JOIN order_items oi ON o.id = oi.order_id
WHERE o.created_at > '2024-01-01'
GROUP BY c.name
ORDER BY total_amount DESC
LIMIT 10`,
};

// Get all node IDs in the tree (for execution stepping)
const getAllNodeIds = (node: PlanNode): string[] => {
  const ids = [node.id];
  for (const child of node.children) {
    ids.push(...getAllNodeIds(child));
  }
  return ids;
};

// Get execution order (post-order traversal for pull-based execution)
const getExecutionOrder = (node: PlanNode): PlanNode[] => {
  const order: PlanNode[] = [];

  const traverse = (n: PlanNode) => {
    // Children first (they produce rows)
    for (const child of n.children) {
      traverse(child);
    }
    // Then parent (consumes rows)
    order.push(n);
  };

  traverse(node);
  return order;
};

export const useQueryPlanStore = create<QueryPlanState & QueryPlanActions>((set, get) => ({
  // Initial state
  planTree: null,
  sql: '',
  selectedNode: null,
  executionState: 'idle',
  currentStep: 0,
  executionLog: [],
  currentNodeId: null,
  animationSpeed: 500,
  showCosts: true,
  showActuals: false,

  // Plan management
  parseSQL: (sql: string) => {
    const plan = generatePlanFromSQL(sql);
    set({
      sql,
      planTree: plan,
      selectedNode: null,
      executionState: 'idle',
      currentStep: 0,
      executionLog: [],
      currentNodeId: null,
    });
  },

  generatePlanForSQL: (sql: string) => {
    return generatePlanFromSQL(sql);
  },

  setPlanTree: (plan: PlanNode | null) => {
    set({ planTree: plan });
  },

  clearPlan: () => {
    set({
      planTree: null,
      sql: '',
      selectedNode: null,
      executionState: 'idle',
      currentStep: 0,
      executionLog: [],
      currentNodeId: null,
    });
  },

  // Node selection
  selectNode: (nodeId: string | null) => {
    set({ selectedNode: nodeId });
  },

  // Execution control
  startExecution: () => {
    const { planTree } = get();
    if (!planTree) return;

    set({
      executionState: 'running',
      currentStep: 0,
      executionLog: [],
      currentNodeId: null,
    });

    // Start auto-stepping
    const stepExecution = () => {
      const state = get();
      if (state.executionState !== 'running') return;

      const executionOrder = getExecutionOrder(planTree);
      if (state.currentStep >= executionOrder.length) {
        set({ executionState: 'completed' });
        return;
      }

      const currentNode = executionOrder[state.currentStep];

      // Simulate actual execution
      const actualRows = Math.floor(currentNode.rows * (0.8 + Math.random() * 0.4)); // +/- 20%
      const actualTime = currentNode.cost.total * (0.5 + Math.random() * 0.5); // +/- 50%

      const logEntry: ExecutionLogEntry = {
        nodeId: currentNode.id,
        action: getActionForNodeType(currentNode.type),
        rows: actualRows,
        time: Math.round(actualTime * 100) / 100,
        details: `${currentNode.type} on ${currentNode.table || 'intermediate result'}`,
      };

      set({
        currentStep: state.currentStep + 1,
        currentNodeId: currentNode.id,
        executionLog: [...state.executionLog, logEntry],
      });

      // Schedule next step
      setTimeout(stepExecution, state.animationSpeed);
    };

    stepExecution();
  },

  step: () => {
    const { planTree, currentStep, executionLog, executionState } = get();
    if (!planTree || executionState === 'completed') return;

    const executionOrder = getExecutionOrder(planTree);
    if (currentStep >= executionOrder.length) {
      set({ executionState: 'completed' });
      return;
    }

    const currentNode = executionOrder[currentStep];

    // Simulate actual execution
    const actualRows = Math.floor(currentNode.rows * (0.8 + Math.random() * 0.4));
    const actualTime = currentNode.cost.total * (0.5 + Math.random() * 0.5);

    const logEntry: ExecutionLogEntry = {
      nodeId: currentNode.id,
      action: getActionForNodeType(currentNode.type),
      rows: actualRows,
      time: Math.round(actualTime * 100) / 100,
      details: `${currentNode.type} on ${currentNode.table || 'intermediate result'}`,
    };

    set({
      currentStep: currentStep + 1,
      currentNodeId: currentNode.id,
      executionLog: [...executionLog, logEntry],
      executionState: currentStep + 1 >= executionOrder.length ? 'completed' : 'paused',
    });
  },

  pause: () => {
    set({ executionState: 'paused' });
  },

  reset: () => {
    set({
      executionState: 'idle',
      currentStep: 0,
      executionLog: [],
      currentNodeId: null,
    });
  },

  setAnimationSpeed: (speed: number) => {
    set({ animationSpeed: speed });
  },

  // Settings
  setShowCosts: (show: boolean) => {
    set({ showCosts: show });
  },

  setShowActuals: (show: boolean) => {
    set({ showActuals: show });
  },

  // Computed helpers
  getNodeById: (nodeId: string): PlanNode | null => {
    const { planTree } = get();
    if (!planTree) return null;

    const findNode = (node: PlanNode): PlanNode | null => {
      if (node.id === nodeId) return node;
      for (const child of node.children) {
        const found = findNode(child);
        if (found) return found;
      }
      return null;
    };

    return findNode(planTree);
  },

  getTotalCost: (): number => {
    const { planTree } = get();
    if (!planTree) return 0;
    return planTree.cost.total;
  },

  getTotalRows: (): number => {
    const { planTree } = get();
    if (!planTree) return 0;
    return planTree.rows;
  },

  getNodeCount: (): number => {
    const { planTree } = get();
    if (!planTree) return 0;

    const countNodes = (node: PlanNode): number => {
      let count = 1;
      for (const child of node.children) {
        count += countNodes(child);
      }
      return count;
    };

    return countNodes(planTree);
  },

  getMaxDepth: (): number => {
    const { planTree } = get();
    if (!planTree) return 0;

    const getDepth = (node: PlanNode): number => {
      if (node.children.length === 0) return 1;
      let maxChildDepth = 0;
      for (const child of node.children) {
        maxChildDepth = Math.max(maxChildDepth, getDepth(child));
      }
      return maxChildDepth + 1;
    };

    return getDepth(planTree);
  },
}));

// Helper to get action type for node type
const getActionForNodeType = (type: PlanNodeType): ExecutionLogEntry['action'] => {
  switch (type) {
    case 'SeqScan':
    case 'IndexScan':
    case 'IndexOnlyScan':
    case 'BitmapScan':
      return 'scan';
    case 'NestedLoop':
    case 'HashJoin':
    case 'MergeJoin':
      return 'join';
    case 'Sort':
      return 'sort';
    case 'Aggregate':
      return 'aggregate';
    default:
      return 'fetch';
  }
};
