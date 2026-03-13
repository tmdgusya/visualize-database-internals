import { create } from 'zustand';

// Join Algorithm Types
export type JoinAlgorithmType = 'NestedLoop' | 'HashJoin' | 'MergeJoin';

// Table Row Interface
export interface TableRow {
  id: number;
  value: number;
}

// Table Data Interface
export interface TableData {
  name: string;
  rows: TableRow[];
}

// Join Result Interface
export interface JoinResult {
  outerRow: TableRow;
  innerRow: TableRow;
}

// Hash Table Entry Interface
export interface HashTableEntry {
  key: number;
  rows: TableRow[];
}

// Animation Step Interface
export interface AnimationStep {
  type: 'compare' | 'match' | 'hash_build' | 'hash_probe' | 'sort' | 'advance_outer' | 'advance_inner' | 'advance_both';
  outerIndex?: number;
  innerIndex?: number;
  message: string;
  results?: JoinResult[];
}

// Join State Interface
export interface JoinState {
  algorithm: JoinAlgorithmType;
  outerTable: TableData;
  innerTable: TableData;
  results: JoinResult[];
  currentStep: number;
  comparisons: number;
  hashTable: Map<number, TableRow[]>;
  sortedOuter: TableRow[];
  sortedInner: TableRow[];
  outerCursor: number;
  innerCursor: number;
  animationSteps: AnimationStep[];
  isPlaying: boolean;
  animationSpeed: number;
  tableSize: number;
}

// Join Actions Interface
export interface JoinActions {
  setAlgorithm: (algorithm: JoinAlgorithmType) => void;
  generateTables: (size?: number) => void;
  setTableSize: (size: number) => void;
  startAnimation: () => void;
  step: () => void;
  play: () => void;
  pause: () => void;
  reset: () => void;
  setAnimationSpeed: (speed: number) => void;
  generateAnimationSteps: () => void;
}

// Generate random table data
const generateTableData = (name: string, size: number): TableData => {
  const rows: TableRow[] = [];
  for (let i = 0; i < size; i++) {
    rows.push({
      id: i + 1,
      value: Math.floor(Math.random() * 20) + 1, // Random values 1-20 for join key
    });
  }
  return { name, rows };
};

// Generate nested loop animation steps
const generateNestedLoopSteps = (
  outerTable: TableData,
  innerTable: TableData
): AnimationStep[] => {
  const steps: AnimationStep[] = [];
  const results: JoinResult[] = [];

  steps.push({
    type: 'compare',
    message: 'Starting Nested Loop Join: O(N×M)',
  });

  for (let i = 0; i < outerTable.rows.length; i++) {
    steps.push({
      type: 'advance_outer',
      outerIndex: i,
      message: `Outer loop: Processing row ${i + 1} (value=${outerTable.rows[i].value})`,
    });

    for (let j = 0; j < innerTable.rows.length; j++) {
      steps.push({
        type: 'compare',
        outerIndex: i,
        innerIndex: j,
        message: `Comparing outer[${i}].value=${outerTable.rows[i].value} with inner[${j}].value=${innerTable.rows[j].value}`,
      });

      if (outerTable.rows[i].value === innerTable.rows[j].value) {
        const match: JoinResult = {
          outerRow: outerTable.rows[i],
          innerRow: innerTable.rows[j],
        };
        results.push(match);
        steps.push({
          type: 'match',
          outerIndex: i,
          innerIndex: j,
          message: `MATCH FOUND! Adding to results`,
          results: [...results],
        });
      }
    }
  }

  steps.push({
    type: 'compare',
    message: `Nested Loop complete. Total comparisons: ${outerTable.rows.length * innerTable.rows.length}, Results: ${results.length}`,
    results: [...results],
  });

  return steps;
};

// Generate hash join animation steps
const generateHashJoinSteps = (
  outerTable: TableData,
  innerTable: TableData
): AnimationStep[] => {
  const steps: AnimationStep[] = [];
  const results: JoinResult[] = [];
  const hashTable = new Map<number, TableRow[]>();

  steps.push({
    type: 'compare',
    message: 'Starting Hash Join: O(N+M)',
  });

  // Build phase
  steps.push({
    type: 'compare',
    message: '=== BUILD PHASE: Creating hash table from inner table ===',
  });

  for (let i = 0; i < innerTable.rows.length; i++) {
    const row = innerTable.rows[i];
    const existing = hashTable.get(row.value) || [];
    existing.push(row);
    hashTable.set(row.value, existing);

    steps.push({
      type: 'hash_build',
      innerIndex: i,
      message: `Hashing inner[${i}]: value=${row.value} → bucket[${row.value}]`,
    });
  }

  steps.push({
    type: 'compare',
    message: `Build phase complete. Hash table has ${hashTable.size} buckets`,
  });

  // Probe phase
  steps.push({
    type: 'compare',
    message: '=== PROBE PHASE: Scanning outer table and probing hash table ===',
  });

  for (let i = 0; i < outerTable.rows.length; i++) {
    const row = outerTable.rows[i];
    steps.push({
      type: 'hash_probe',
      outerIndex: i,
      message: `Probing outer[${i}]: value=${row.value} → lookup bucket[${row.value}]`,
    });

    const matches = hashTable.get(row.value);
    if (matches && matches.length > 0) {
      for (const match of matches) {
        const joinResult: JoinResult = {
          outerRow: row,
          innerRow: match,
        };
        results.push(joinResult);
      }
      steps.push({
        type: 'match',
        outerIndex: i,
        message: `Found ${matches.length} match(es) in bucket[${row.value}]`,
        results: [...results],
      });
    }
  }

  steps.push({
    type: 'compare',
    message: `Hash Join complete. Total operations: ${innerTable.rows.length + outerTable.rows.length}, Results: ${results.length}`,
    results: [...results],
  });

  return steps;
};

// Generate merge join animation steps
const generateMergeJoinSteps = (
  outerTable: TableData,
  innerTable: TableData
): AnimationStep[] => {
  const steps: AnimationStep[] = [];
  const results: JoinResult[] = [];

  steps.push({
    type: 'compare',
    message: 'Starting Merge Join: O(N log N + M log M)',
  });

  // Sort phase
  steps.push({
    type: 'compare',
    message: '=== SORT PHASE: Sorting both tables by join key ===',
  });

  const sortedOuter = [...outerTable.rows].sort((a, b) => a.value - b.value);
  const sortedInner = [...innerTable.rows].sort((a, b) => a.value - b.value);

  steps.push({
    type: 'sort',
    message: `Outer table sorted: [${sortedOuter.map(r => r.value).join(', ')}]`,
  });

  steps.push({
    type: 'sort',
    message: `Inner table sorted: [${sortedInner.map(r => r.value).join(', ')}]`,
  });

  // Merge phase
  steps.push({
    type: 'compare',
    message: '=== MERGE PHASE: Merging with dual cursors ===',
  });

  let outerIdx = 0;
  let innerIdx = 0;

  steps.push({
    type: 'advance_both',
    outerIndex: outerIdx,
    innerIndex: innerIdx,
    message: 'Initialize cursors: outer=0, inner=0',
  });

  while (outerIdx < sortedOuter.length && innerIdx < sortedInner.length) {
    const outerVal = sortedOuter[outerIdx].value;
    const innerVal = sortedInner[innerIdx].value;

    steps.push({
      type: 'compare',
      outerIndex: outerIdx,
      innerIndex: innerIdx,
      message: `Compare outer[${outerIdx}].value=${outerVal} with inner[${innerIdx}].value=${innerVal}`,
    });

    if (outerVal === innerVal) {
      // Find all matches for this value
      const outerMatches: TableRow[] = [];
      const innerMatches: TableRow[] = [];

      let tempOuterIdx = outerIdx;
      while (tempOuterIdx < sortedOuter.length && sortedOuter[tempOuterIdx].value === outerVal) {
        outerMatches.push(sortedOuter[tempOuterIdx]);
        tempOuterIdx++;
      }

      let tempInnerIdx = innerIdx;
      while (tempInnerIdx < sortedInner.length && sortedInner[tempInnerIdx].value === innerVal) {
        innerMatches.push(sortedInner[tempInnerIdx]);
        tempInnerIdx++;
      }

      // Generate cross product of matches
      for (const outerRow of outerMatches) {
        for (const innerRow of innerMatches) {
          results.push({ outerRow, innerRow });
        }
      }

      steps.push({
        type: 'match',
        outerIndex: outerIdx,
        innerIndex: innerIdx,
        message: `MATCH! Found ${outerMatches.length}×${innerMatches.length}=${outerMatches.length * innerMatches.length} result(s)`,
        results: [...results],
      });

      outerIdx = tempOuterIdx;
      innerIdx = tempInnerIdx;

      if (outerIdx < sortedOuter.length && innerIdx < sortedInner.length) {
        steps.push({
          type: 'advance_both',
          outerIndex: outerIdx,
          innerIndex: innerIdx,
          message: `Advance both cursors: outer=${outerIdx}, inner=${innerIdx}`,
        });
      }
    } else if (outerVal < innerVal) {
      outerIdx++;
      if (outerIdx < sortedOuter.length) {
        steps.push({
          type: 'advance_outer',
          outerIndex: outerIdx,
          message: `outer[${outerIdx - 1}].value < inner[${innerIdx}].value, advance outer cursor to ${outerIdx}`,
        });
      }
    } else {
      innerIdx++;
      if (innerIdx < sortedInner.length) {
        steps.push({
          type: 'advance_inner',
          innerIndex: innerIdx,
          message: `outer[${outerIdx}].value > inner[${innerIdx - 1}].value, advance inner cursor to ${innerIdx}`,
        });
      }
    }
  }

  steps.push({
    type: 'compare',
    message: `Merge Join complete. Results: ${results.length}`,
    results: [...results],
  });

  return steps;
};

// Initial state
const createInitialState = (): Omit<JoinState, keyof JoinActions> => {
  const outerTable = generateTableData('Outer Table', 5);
  const innerTable = generateTableData('Inner Table', 5);

  return {
    algorithm: 'NestedLoop',
    outerTable,
    innerTable,
    results: [],
    currentStep: 0,
    comparisons: 0,
    hashTable: new Map(),
    sortedOuter: [],
    sortedInner: [],
    outerCursor: 0,
    innerCursor: 0,
    animationSteps: generateNestedLoopSteps(outerTable, innerTable),
    isPlaying: false,
    animationSpeed: 800,
    tableSize: 5,
  };
};

// Create the store
export const useJoinAlgorithmStore = create<JoinState & JoinActions>((set, get) => ({
  ...createInitialState(),

  setAlgorithm: (algorithm: JoinAlgorithmType) => {
    const { outerTable, innerTable } = get();
    let animationSteps: AnimationStep[] = [];

    switch (algorithm) {
      case 'NestedLoop':
        animationSteps = generateNestedLoopSteps(outerTable, innerTable);
        break;
      case 'HashJoin':
        animationSteps = generateHashJoinSteps(outerTable, innerTable);
        break;
      case 'MergeJoin':
        animationSteps = generateMergeJoinSteps(outerTable, innerTable);
        break;
    }

    set({
      algorithm,
      animationSteps,
      currentStep: 0,
      results: [],
      comparisons: 0,
      isPlaying: false,
    });
  },

  generateTables: (size?: number) => {
    const tableSize = size || get().tableSize;
    const outerTable = generateTableData('Outer Table', tableSize);
    const innerTable = generateTableData('Inner Table', tableSize);

    const { algorithm } = get();
    let animationSteps: AnimationStep[] = [];

    switch (algorithm) {
      case 'NestedLoop':
        animationSteps = generateNestedLoopSteps(outerTable, innerTable);
        break;
      case 'HashJoin':
        animationSteps = generateHashJoinSteps(outerTable, innerTable);
        break;
      case 'MergeJoin':
        animationSteps = generateMergeJoinSteps(outerTable, innerTable);
        break;
    }

    set({
      outerTable,
      innerTable,
      animationSteps,
      currentStep: 0,
      results: [],
      comparisons: 0,
      isPlaying: false,
    });
  },

  setTableSize: (size: number) => {
    set({ tableSize: size });
    get().generateTables(size);
  },

  generateAnimationSteps: () => {
    const { algorithm, outerTable, innerTable } = get();
    let animationSteps: AnimationStep[] = [];

    switch (algorithm) {
      case 'NestedLoop':
        animationSteps = generateNestedLoopSteps(outerTable, innerTable);
        break;
      case 'HashJoin':
        animationSteps = generateHashJoinSteps(outerTable, innerTable);
        break;
      case 'MergeJoin':
        animationSteps = generateMergeJoinSteps(outerTable, innerTable);
        break;
    }

    set({ animationSteps });
  },

  startAnimation: () => {
    set({
      currentStep: 0,
      results: [],
      comparisons: 0,
      isPlaying: true,
    });

    // Start auto-stepping
    const autoStep = () => {
      const currentState = get();
      if (!currentState.isPlaying) return;

      if (currentState.currentStep >= currentState.animationSteps.length - 1) {
        set({ isPlaying: false });
        return;
      }

      get().step();
      setTimeout(autoStep, currentState.animationSpeed);
    };

    const initialState = get();
    setTimeout(autoStep, initialState.animationSpeed);
  },

  step: () => {
    const { currentStep, animationSteps, results } = get();

    if (currentStep >= animationSteps.length) {
      set({ isPlaying: false });
      return;
    }

    const step = animationSteps[currentStep];
    let newComparisons = get().comparisons;

    if (step.type === 'compare') {
      newComparisons++;
    }

    set({
      currentStep: currentStep + 1,
      comparisons: newComparisons,
      results: step.results || results,
    });
  },

  play: () => {
    set({ isPlaying: true });

    const autoStep = () => {
      const state = get();
      if (!state.isPlaying) return;

      if (state.currentStep >= state.animationSteps.length - 1) {
        set({ isPlaying: false });
        return;
      }

      get().step();
      setTimeout(autoStep, state.animationSpeed);
    };

    autoStep();
  },

  pause: () => {
    set({ isPlaying: false });
  },

  reset: () => {
    set({
      currentStep: 0,
      results: [],
      comparisons: 0,
      isPlaying: false,
    });
  },

  setAnimationSpeed: (speed: number) => {
    set({ animationSpeed: speed });
  },
}));

// Helper to get algorithm complexity
export const getAlgorithmComplexity = (algorithm: JoinAlgorithmType): string => {
  switch (algorithm) {
    case 'NestedLoop':
      return 'O(N × M)';
    case 'HashJoin':
      return 'O(N + M)';
    case 'MergeJoin':
      return 'O(N log N + M log M)';
    default:
      return '';
  }
};

// Helper to get algorithm description
export const getAlgorithmDescription = (algorithm: JoinAlgorithmType): string => {
  switch (algorithm) {
    case 'NestedLoop':
      return 'For each row in outer table, scan all rows in inner table';
    case 'HashJoin':
      return 'Build hash table from inner table, then probe with outer table';
    case 'MergeJoin':
      return 'Sort both tables, then merge with dual cursors';
    default:
      return '';
  }
};

// Helper to get algorithm best use case
export const getAlgorithmBestUseCase = (algorithm: JoinAlgorithmType): string => {
  switch (algorithm) {
    case 'NestedLoop':
      return 'Small tables, indexed inner table';
    case 'HashJoin':
      return 'Large tables, equality joins';
    case 'MergeJoin':
      return 'Pre-sorted data, range queries';
    default:
      return '';
  }
};
