import { create } from 'zustand';

export type TransactionStatus = 'in_progress' | 'committed' | 'aborted';
export type IsolationLevel = 'read_committed' | 'repeatable_read' | 'serializable';

export interface Transaction {
  xid: number;
  startTime: number;
  endTime: number | null;
  status: TransactionStatus;
  isolationLevel: IsolationLevel;
}

export interface TupleVersion {
  id: number;
  data: string;
  xmin: number;
  xmax: number | null;
  t_ctid: number | null; // Points to next version in chain (for HOT updates)
  isHot: boolean;
  createdAt: number;
}

export interface Snapshot {
  xid: number; // Transaction that created this snapshot
  xmin: number; // Oldest active transaction
  xmax: number; // Next transaction ID to assign
  xipList: number[]; // Array of currently active transaction IDs
  createdAt: number;
}

export interface VisibilityResult {
  visible: boolean;
  reason: string;
  steps: VisibilityStep[];
}

export interface VisibilityStep {
  rule: string;
  result: boolean;
  explanation: string;
}

export interface MVCCState {
  // Data
  transactions: Transaction[];
  tupleVersions: TupleVersion[];
  snapshots: Snapshot[];
  clog: Map<number, TransactionStatus>; // Commit Log

  // Simulated time
  currentTime: number;
  nextXid: number;
  nextTupleId: number;

  // UI State
  selectedTransaction: number | null;
  selectedTuple: number | null;
  activeTab: 'timeline' | 'visibility' | 'version_chain';
  visibilityResult: VisibilityResult | null;
}

export interface MVCCActions {
  // Transaction operations
  startTransaction: (isolationLevel?: IsolationLevel) => number;
  commitTransaction: (xid: number) => void;
  abortTransaction: (xid: number) => void;
  getTransactionStatus: (xid: number) => TransactionStatus | null;

  // Tuple operations
  insertTuple: (xid: number, data: string) => number;
  updateTuple: (xid: number, tupleId: number, newData: string) => number | null;
  deleteTuple: (xid: number, tupleId: number) => void;
  getTupleVersions: (tupleId: number) => TupleVersion[];

  // Snapshot operations
  createSnapshot: (xid: number) => Snapshot;
  getSnapshot: (xid: number) => Snapshot | undefined;

  // Visibility check
  checkVisibility: (xid: number, tupleId: number, snapshotXid?: number) => VisibilityResult;
  isTupleVisible: (tuple: TupleVersion, snapshot: Snapshot) => boolean;

  // Time management
  advanceTime: () => void;

  // Selection
  selectTransaction: (xid: number | null) => void;
  selectTuple: (tupleId: number | null) => void;
  setActiveTab: (tab: 'timeline' | 'visibility' | 'version_chain') => void;

  // Preset scenarios
  loadPresetScenario: (scenario: 'simple_read' | 'concurrent_updates' | 'phantom_read' | 'serialization_anomaly') => void;

  // Reset
  reset: () => void;

  // Computed
  getActiveTransactions: () => Transaction[];
  getCommittedTransactions: () => Transaction[];
  getAbortedTransactions: () => Transaction[];
  getFrozenXid: () => number;
}

const FROZEN_XID = 2; // Special frozen XID in PostgreSQL

const initialState: MVCCState = {
  transactions: [],
  tupleVersions: [],
  snapshots: [],
  clog: new Map(),
  currentTime: 0,
  nextXid: 100, // Start from 100 to reserve special XIDs
  nextTupleId: 1,
  selectedTransaction: null,
  selectedTuple: null,
  activeTab: 'timeline',
  visibilityResult: null,
};

export const useMVCCStore = create<MVCCState & MVCCActions>((set, get) => ({
  ...initialState,

  // Transaction operations
  startTransaction: (isolationLevel: IsolationLevel = 'read_committed') => {
    const state = get();
    const xid = state.nextXid;

    const transaction: Transaction = {
      xid,
      startTime: state.currentTime,
      endTime: null,
      status: 'in_progress',
      isolationLevel,
    };

    set({
      transactions: [...state.transactions, transaction],
      nextXid: xid + 1,
      clog: new Map(state.clog).set(xid, 'in_progress'),
    });

    return xid;
  },

  commitTransaction: (xid: number) => {
    const state = get();
    const transaction = state.transactions.find((t) => t.xid === xid);

    if (!transaction || transaction.status !== 'in_progress') return;

    const updatedTransactions = state.transactions.map((t) =>
      t.xid === xid
        ? { ...t, status: 'committed' as TransactionStatus, endTime: state.currentTime }
        : t
    );

    set({
      transactions: updatedTransactions,
      clog: new Map(state.clog).set(xid, 'committed'),
    });
  },

  abortTransaction: (xid: number) => {
    const state = get();
    const transaction = state.transactions.find((t) => t.xid === xid);

    if (!transaction || transaction.status !== 'in_progress') return;

    const updatedTransactions = state.transactions.map((t) =>
      t.xid === xid
        ? { ...t, status: 'aborted' as TransactionStatus, endTime: state.currentTime }
        : t
    );

    set({
      transactions: updatedTransactions,
      clog: new Map(state.clog).set(xid, 'aborted'),
    });
  },

  getTransactionStatus: (xid: number) => {
    return get().clog.get(xid) || null;
  },

  // Tuple operations
  insertTuple: (xid: number, data: string) => {
    const state = get();
    const id = state.nextTupleId;

    const tuple: TupleVersion = {
      id,
      data,
      xmin: xid,
      xmax: null,
      t_ctid: null,
      isHot: false,
      createdAt: state.currentTime,
    };

    set({
      tupleVersions: [...state.tupleVersions, tuple],
      nextTupleId: id + 1,
    });

    return id;
  },

  updateTuple: (xid: number, tupleId: number, newData: string) => {
    const state = get();
    const oldTuple = state.tupleVersions.find((t) => t.id === tupleId && t.xmax === null);

    if (!oldTuple) return null;

    // Mark old tuple as deleted by this transaction
    const updatedVersions = state.tupleVersions.map((t) =>
      t.id === tupleId && t.xmax === null ? { ...t, xmax: xid } : t
    );

    // Create new version
    const newTupleId = state.nextTupleId;
    const isHot = !newData.includes('indexed'); // Simplified HOT detection

    const newTuple: TupleVersion = {
      id: newTupleId,
      data: newData,
      xmin: xid,
      xmax: null,
      t_ctid: null,
      isHot,
      createdAt: state.currentTime,
    };

    // Update old tuple's ctid to point to new version
    const finalVersions = updatedVersions.map((t) =>
      t.id === tupleId ? { ...t, t_ctid: newTupleId } : t
    );

    set({
      tupleVersions: [...finalVersions, newTuple],
      nextTupleId: newTupleId + 1,
    });

    return newTupleId;
  },

  deleteTuple: (xid: number, tupleId: number) => {
    const state = get();

    const updatedVersions = state.tupleVersions.map((t) =>
      t.id === tupleId && t.xmax === null ? { ...t, xmax: xid } : t
    );

    set({ tupleVersions: updatedVersions });
  },

  getTupleVersions: (tupleId: number) => {
    const state = get();
    const versions: TupleVersion[] = [];
    let currentId: number | null = tupleId;

    while (currentId !== null) {
      const tuple = state.tupleVersions.find((t) => t.id === currentId);
      if (!tuple) break;
      versions.push(tuple);
      currentId = tuple.t_ctid;
    }

    return versions;
  },

  // Snapshot operations
  createSnapshot: (xid: number) => {
    const state = get();
    const activeTransactions = state.transactions.filter((t) => t.status === 'in_progress');
    const otherActiveTransactions = activeTransactions.filter((t) => t.xid !== xid);

    const xmin = otherActiveTransactions.length > 0
      ? Math.min(...otherActiveTransactions.map((t) => t.xid))
      : state.nextXid;

    const snapshot: Snapshot = {
      xid,
      xmin,
      xmax: state.nextXid,
      xipList: otherActiveTransactions.map((t) => t.xid),
      createdAt: state.currentTime,
    };

    set({ snapshots: [...state.snapshots, snapshot] });
    return snapshot;
  },

  getSnapshot: (xid: number) => {
    return get().snapshots.find((s) => s.xid === xid);
  },

  // Visibility check
  checkVisibility: (xid: number, tupleId: number, snapshotXid?: number) => {
    const state = get();
    const tuple = state.tupleVersions.find((t) => t.id === tupleId);

    if (!tuple) {
      return {
        visible: false,
        reason: 'Tuple not found',
        steps: [{ rule: 'Existence Check', result: false, explanation: 'Tuple does not exist' }],
      };
    }

    const snapshot = snapshotXid !== undefined
      ? state.snapshots.find((s) => s.xid === snapshotXid)
      : state.createSnapshot(xid);

    if (!snapshot) {
      return {
        visible: false,
        reason: 'Snapshot not found',
        steps: [{ rule: 'Snapshot Check', result: false, explanation: 'Snapshot does not exist' }],
      };
    }

    const steps: VisibilityStep[] = [];

    // Rule 1: Check if xmin is committed and xmin < snapshot.xmin
    const xminStatus = state.clog.get(tuple.xmin);
    const xminCommitted = xminStatus === 'committed';
    const xminInSnapshot = snapshot.xipList.includes(tuple.xmin);
    const xminVisible = xminCommitted && (tuple.xmin < snapshot.xmin || xminInSnapshot);

    steps.push({
      rule: 'Rule 1: xmin committed and visible',
      result: xminVisible,
      explanation: `xmin=${tuple.xmin} status=${xminStatus}, xmin < snapshot.xmin (${tuple.xmin < snapshot.xmin}) or in xip_list=${xminInSnapshot}`,
    });

    if (!xminVisible) {
      return {
        visible: false,
        reason: 'Creating transaction not visible',
        steps,
      };
    }

    // Rule 2: Check if xmax is set
    if (tuple.xmax === null) {
      steps.push({
        rule: 'Rule 2: xmax check',
        result: true,
        explanation: 'xmax is null (not deleted), tuple is visible',
      });
      return {
        visible: true,
        reason: 'Tuple is not deleted',
        steps,
      };
    }

    // Rule 3: Check xmax status
    const xmaxStatus = state.clog.get(tuple.xmax);

    if (xmaxStatus === 'in_progress' || xmaxStatus === 'aborted') {
      steps.push({
        rule: 'Rule 3: xmax in_progress or aborted',
        result: true,
        explanation: `xmax=${tuple.xmax} status=${xmaxStatus}, deletion not committed, tuple is visible`,
      });
      return {
        visible: true,
        reason: 'Deletion not committed',
        steps,
      };
    }

    // Rule 4: xmax is committed
    const xmaxCommittedBeforeSnapshot = tuple.xmax < snapshot.xmin;
    steps.push({
      rule: 'Rule 4: xmax committed check',
      result: !xmaxCommittedBeforeSnapshot,
      explanation: `xmax=${tuple.xmax} committed, xmax < snapshot.xmin (${xmaxCommittedBeforeSnapshot})`,
    });

    if (xmaxCommittedBeforeSnapshot) {
      return {
        visible: false,
        reason: 'Tuple was deleted before snapshot',
        steps,
      };
    }

    // xmax committed but after snapshot
    return {
      visible: true,
      reason: 'Deletion committed after snapshot',
      steps,
    };
  },

  isTupleVisible: (tuple: TupleVersion, snapshot: Snapshot) => {
    const state = get();

    // Check xmin visibility
    const xminStatus = state.clog.get(tuple.xmin);
    if (xminStatus !== 'committed') return false;
    if (tuple.xmin >= snapshot.xmax && !snapshot.xipList.includes(tuple.xmin)) return false;

    // Check xmax
    if (tuple.xmax === null) return true;

    const xmaxStatus = state.clog.get(tuple.xmax);
    if (xmaxStatus === 'in_progress' || xmaxStatus === 'aborted') return true;
    if (xmaxStatus === 'committed' && tuple.xmax >= snapshot.xmax) return true;

    return false;
  },

  // Time management
  advanceTime: () => {
    set((state) => ({ currentTime: state.currentTime + 1 }));
  },

  // Selection
  selectTransaction: (xid: number | null) => {
    set({ selectedTransaction: xid });
  },

  selectTuple: (tupleId: number | null) => {
    set({ selectedTuple: tupleId });
  },

  setActiveTab: (tab: 'timeline' | 'visibility' | 'version_chain') => {
    set({ activeTab: tab });
  },

  // Preset scenarios
  loadPresetScenario: (scenario: 'simple_read' | 'concurrent_updates' | 'phantom_read' | 'serialization_anomaly') => {
    const state = get();
    state.reset();

    switch (scenario) {
      case 'simple_read': {
        // T1: INSERT -> COMMIT
        // T2: SELECT (should see T1's data)
        const t1 = state.startTransaction();
        state.insertTuple(t1, 'Row A');
        state.commitTransaction(t1);

        state.advanceTime();

        const t2 = state.startTransaction();
        state.createSnapshot(t2);
        break;
      }

      case 'concurrent_updates': {
        // T1: INSERT -> COMMIT
        // T2: UPDATE (conflict check)
        // T3: SELECT (sees T1's version, not T2's uncommitted)
        const t1 = state.startTransaction();
        const rowId = state.insertTuple(t1, 'Original Data');
        state.commitTransaction(t1);

        state.advanceTime();

        const t2 = state.startTransaction();
        state.updateTuple(t2, rowId, 'Updated by T2');

        state.advanceTime();

        const t3 = state.startTransaction();
        state.createSnapshot(t3);
        break;
      }

      case 'phantom_read': {
        // T1: SELECT (snapshot)
        // T2: INSERT -> COMMIT
        // T1: SELECT again (phantom read in RC, not in RR)
        const t1 = state.startTransaction('repeatable_read');
        state.createSnapshot(t1);

        state.advanceTime();

        const t2 = state.startTransaction();
        state.insertTuple(t2, 'Phantom Row');
        state.commitTransaction(t2);

        state.advanceTime();
        break;
      }

      case 'serialization_anomaly': {
        // T1: SELECT WHERE x = 1 (finds nothing)
        // T2: SELECT WHERE x = 2 (finds nothing)
        // T1: INSERT (1, 2)
        // T2: INSERT (2, 1) - would conflict in serializable
        const t1 = state.startTransaction('serializable');
        state.createSnapshot(t1);

        state.advanceTime();

        const t2 = state.startTransaction('serializable');
        state.createSnapshot(t2);

        state.advanceTime();

        state.insertTuple(t1, 'T1 Data');
        state.insertTuple(t2, 'T2 Data');
        break;
      }
    }
  },

  // Reset
  reset: () => {
    set(initialState);
  },

  // Computed
  getActiveTransactions: () => {
    return get().transactions.filter((t) => t.status === 'in_progress');
  },

  getCommittedTransactions: () => {
    return get().transactions.filter((t) => t.status === 'committed');
  },

  getAbortedTransactions: () => {
    return get().transactions.filter((t) => t.status === 'aborted');
  },

  getFrozenXid: () => {
    return FROZEN_XID;
  },
}));
