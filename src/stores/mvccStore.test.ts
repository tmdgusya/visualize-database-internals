import { describe, it, expect, beforeEach } from 'vitest';
import { useMVCCStore } from './mvccStore';

describe('MVCCStore', () => {
  beforeEach(() => {
    useMVCCStore.getState().reset();
  });

  describe('Transaction Operations', () => {
    it('should start a new transaction', () => {
      const xid = useMVCCStore.getState().startTransaction();
      expect(xid).toBeGreaterThan(0);

      const state = useMVCCStore.getState();
      const transaction = state.transactions.find((t) => t.xid === xid);
      expect(transaction).toBeDefined();
      expect(transaction?.status).toBe('in_progress');
      expect(transaction?.isolationLevel).toBe('read_committed');
    });

    it('should start transaction with different isolation levels', () => {
      const xid1 = useMVCCStore.getState().startTransaction('read_committed');
      const xid2 = useMVCCStore.getState().startTransaction('repeatable_read');
      const xid3 = useMVCCStore.getState().startTransaction('serializable');

      const state = useMVCCStore.getState();
      expect(state.transactions.find((t) => t.xid === xid1)?.isolationLevel).toBe('read_committed');
      expect(state.transactions.find((t) => t.xid === xid2)?.isolationLevel).toBe('repeatable_read');
      expect(state.transactions.find((t) => t.xid === xid3)?.isolationLevel).toBe('serializable');
    });

    it('should commit a transaction', () => {
      const { startTransaction, commitTransaction } = useMVCCStore.getState();
      const xid = startTransaction();

      commitTransaction(xid);

      const state = useMVCCStore.getState();
      const transaction = state.transactions.find((t) => t.xid === xid);
      expect(transaction?.status).toBe('committed');
      expect(transaction?.endTime).not.toBeNull();
      expect(state.clog.get(xid)).toBe('committed');
    });

    it('should abort a transaction', () => {
      const { startTransaction, abortTransaction } = useMVCCStore.getState();
      const xid = startTransaction();

      abortTransaction(xid);

      const state = useMVCCStore.getState();
      const transaction = state.transactions.find((t) => t.xid === xid);
      expect(transaction?.status).toBe('aborted');
      expect(transaction?.endTime).not.toBeNull();
      expect(state.clog.get(xid)).toBe('aborted');
    });

    it('should not commit already committed transaction', () => {
      const { startTransaction, commitTransaction } = useMVCCStore.getState();
      const xid = startTransaction();

      commitTransaction(xid);
      const endTime = useMVCCStore.getState().transactions.find((t) => t.xid === xid)?.endTime;

      // Try to commit again
      commitTransaction(xid);

      const state = useMVCCStore.getState();
      expect(state.transactions.find((t) => t.xid === xid)?.endTime).toBe(endTime);
    });

    it('should get transaction status from CLOG', () => {
      const { startTransaction, commitTransaction, abortTransaction, getTransactionStatus } = useMVCCStore.getState();

      const xid1 = startTransaction();
      expect(getTransactionStatus(xid1)).toBe('in_progress');

      const xid2 = startTransaction();
      commitTransaction(xid2);
      expect(getTransactionStatus(xid2)).toBe('committed');

      const xid3 = startTransaction();
      abortTransaction(xid3);
      expect(getTransactionStatus(xid3)).toBe('aborted');

      expect(getTransactionStatus(99999)).toBeNull();
    });
  });

  describe('Tuple Operations', () => {
    it('should insert a new tuple', () => {
      const { startTransaction, insertTuple } = useMVCCStore.getState();
      const xid = startTransaction();

      const tupleId = insertTuple(xid, 'Test Data');

      const state = useMVCCStore.getState();
      const tuple = state.tupleVersions.find((t) => t.id === tupleId);
      expect(tuple).toBeDefined();
      expect(tuple?.data).toBe('Test Data');
      expect(tuple?.xmin).toBe(xid);
      expect(tuple?.xmax).toBeNull();
    });

    it('should update a tuple creating new version', () => {
      const { startTransaction, insertTuple, updateTuple, commitTransaction } = useMVCCStore.getState();
      const xid1 = startTransaction();
      const tupleId = insertTuple(xid1, 'Original Data');
      commitTransaction(xid1);

      const xid2 = startTransaction();
      const newTupleId = updateTuple(xid2, tupleId, 'Updated Data');

      expect(newTupleId).not.toBeNull();

      const state = useMVCCStore.getState();
      const oldTuple = state.tupleVersions.find((t) => t.id === tupleId);
      const newTuple = state.tupleVersions.find((t) => t.id === newTupleId);

      expect(oldTuple?.xmax).toBe(xid2);
      expect(oldTuple?.t_ctid).toBe(newTupleId);
      expect(newTuple?.data).toBe('Updated Data');
      expect(newTuple?.xmin).toBe(xid2);
    });

    it('should mark tuple as deleted', () => {
      const { startTransaction, insertTuple, deleteTuple } = useMVCCStore.getState();
      const xid = startTransaction();
      const tupleId = insertTuple(xid, 'Data to delete');

      deleteTuple(xid, tupleId);

      const state = useMVCCStore.getState();
      const tuple = state.tupleVersions.find((t) => t.id === tupleId);
      expect(tuple?.xmax).toBe(xid);
    });

    it('should get tuple version chain', () => {
      const { startTransaction, insertTuple, updateTuple, commitTransaction, getTupleVersions } = useMVCCStore.getState();

      const xid1 = startTransaction();
      const tupleId1 = insertTuple(xid1, 'Version 1');
      commitTransaction(xid1);

      const xid2 = startTransaction();
      const tupleId2 = updateTuple(xid2, tupleId1, 'Version 2');
      commitTransaction(xid2);

      const xid3 = startTransaction();
      updateTuple(xid3, tupleId2!, 'Version 3');

      const chain = getTupleVersions(tupleId1);

      expect(chain).toHaveLength(3);
      expect(chain[0].data).toBe('Version 1');
      expect(chain[1].data).toBe('Version 2');
      expect(chain[2].data).toBe('Version 3');
    });

    it('should detect HOT updates', () => {
      const { startTransaction, insertTuple, updateTuple, commitTransaction } = useMVCCStore.getState();

      const xid1 = startTransaction();
      const tupleId1 = insertTuple(xid1, 'Data');
      commitTransaction(xid1);

      const xid2 = startTransaction();
      const tupleId2 = updateTuple(xid2, tupleId1, 'Updated Data');

      const state = useMVCCStore.getState();
      const newTuple = state.tupleVersions.find((t) => t.id === tupleId2);
      expect(newTuple?.isHot).toBe(true);
    });

    it('should not detect HOT update for indexed columns', () => {
      const { startTransaction, insertTuple, updateTuple, commitTransaction } = useMVCCStore.getState();

      const xid1 = startTransaction();
      const tupleId1 = insertTuple(xid1, 'Data');
      commitTransaction(xid1);

      const xid2 = startTransaction();
      const tupleId2 = updateTuple(xid2, tupleId1, 'indexed column updated');

      const state = useMVCCStore.getState();
      const newTuple = state.tupleVersions.find((t) => t.id === tupleId2);
      expect(newTuple?.isHot).toBe(false);
    });
  });

  describe('Snapshot Operations', () => {
    it('should create a snapshot', () => {
      const { startTransaction, createSnapshot } = useMVCCStore.getState();

      const xid1 = startTransaction();
      const xid2 = startTransaction();
      const xid3 = startTransaction();

      const snapshot = createSnapshot(xid1);

      expect(snapshot.xid).toBe(xid1);
      expect(snapshot.xmin).toBe(xid2); // Oldest active (excluding self)
      expect(snapshot.xmax).toBeGreaterThan(xid3);
      expect(snapshot.xipList).toContain(xid2);
      expect(snapshot.xipList).toContain(xid3);
      expect(snapshot.xipList).not.toContain(xid1);
    });

    it('should get snapshot by xid', () => {
      const { startTransaction, createSnapshot, getSnapshot } = useMVCCStore.getState();

      const xid = startTransaction();
      createSnapshot(xid);

      const snapshot = getSnapshot(xid);
      expect(snapshot).toBeDefined();
      expect(snapshot?.xid).toBe(xid);
    });

    it('should return undefined for non-existent snapshot', () => {
      const { getSnapshot } = useMVCCStore.getState();
      expect(getSnapshot(99999)).toBeUndefined();
    });
  });

  describe('Visibility Rules', () => {
    it('should make tuple visible when xmin is committed and before snapshot', () => {
      const { startTransaction, insertTuple, commitTransaction, createSnapshot, checkVisibility } = useMVCCStore.getState();

      const xid1 = startTransaction();
      const tupleId = insertTuple(xid1, 'Test Data');
      commitTransaction(xid1);

      const xid2 = startTransaction();
      const snapshot = createSnapshot(xid2);

      const result = checkVisibility(xid2, tupleId, snapshot.xid);

      expect(result.visible).toBe(true);
      expect(result.reason).toContain('not deleted');
    });

    it('should not make tuple visible when xmin is in_progress', () => {
      const { startTransaction, insertTuple, createSnapshot, checkVisibility } = useMVCCStore.getState();

      const xid1 = startTransaction();
      const tupleId = insertTuple(xid1, 'Test Data');
      // Don't commit

      const xid2 = startTransaction();
      const snapshot = createSnapshot(xid2);

      const result = checkVisibility(xid2, tupleId, snapshot.xid);

      expect(result.visible).toBe(false);
      expect(result.reason).toContain('Creating transaction not visible');
    });

    it('should not make tuple visible when deleted before snapshot', () => {
      const { startTransaction, insertTuple, commitTransaction, deleteTuple, createSnapshot, checkVisibility } = useMVCCStore.getState();

      const xid1 = startTransaction();
      const tupleId = insertTuple(xid1, 'Test Data');
      commitTransaction(xid1);

      const xid2 = startTransaction();
      deleteTuple(xid2, tupleId);
      commitTransaction(xid2);

      const xid3 = startTransaction();
      const snapshot = createSnapshot(xid3);

      const result = checkVisibility(xid3, tupleId, snapshot.xid);

      expect(result.visible).toBe(false);
      expect(result.reason).toContain('deleted before snapshot');
    });

    it('should make tuple visible when deleted by in_progress transaction', () => {
      const { startTransaction, insertTuple, commitTransaction, deleteTuple, createSnapshot, checkVisibility } = useMVCCStore.getState();

      const xid1 = startTransaction();
      const tupleId = insertTuple(xid1, 'Test Data');
      commitTransaction(xid1);

      const xid2 = startTransaction();
      deleteTuple(xid2, tupleId);
      // Don't commit xid2

      const xid3 = startTransaction();
      const snapshot = createSnapshot(xid3);

      const result = checkVisibility(xid3, tupleId, snapshot.xid);

      expect(result.visible).toBe(true);
      expect(result.reason).toContain('Deletion not committed');
    });

    it('should make tuple visible when deleted by aborted transaction', () => {
      const { startTransaction, insertTuple, commitTransaction, deleteTuple, abortTransaction, createSnapshot, checkVisibility } = useMVCCStore.getState();

      const xid1 = startTransaction();
      const tupleId = insertTuple(xid1, 'Test Data');
      commitTransaction(xid1);

      const xid2 = startTransaction();
      deleteTuple(xid2, tupleId);
      abortTransaction(xid2);

      const xid3 = startTransaction();
      const snapshot = createSnapshot(xid3);

      const result = checkVisibility(xid3, tupleId, snapshot.xid);

      expect(result.visible).toBe(true);
    });

    it('should return visibility steps', () => {
      const { startTransaction, insertTuple, commitTransaction, createSnapshot, checkVisibility } = useMVCCStore.getState();

      const xid1 = startTransaction();
      const tupleId = insertTuple(xid1, 'Test Data');
      commitTransaction(xid1);

      const xid2 = startTransaction();
      const snapshot = createSnapshot(xid2);

      const result = checkVisibility(xid2, tupleId, snapshot.xid);

      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.steps[0].rule).toContain('Rule 1');
    });
  });

  describe('Time Management', () => {
    it('should advance time', () => {
      const { advanceTime } = useMVCCStore.getState();

      advanceTime();

      const state = useMVCCStore.getState();
      expect(state.currentTime).toBe(1);
    });
  });

  describe('Selection', () => {
    it('should select transaction', () => {
      const { startTransaction, selectTransaction } = useMVCCStore.getState();
      const xid = startTransaction();

      selectTransaction(xid);

      const state = useMVCCStore.getState();
      expect(state.selectedTransaction).toBe(xid);
    });

    it('should select tuple', () => {
      const { startTransaction, insertTuple, selectTuple } = useMVCCStore.getState();
      const xid = startTransaction();
      const tupleId = insertTuple(xid, 'Data');

      selectTuple(tupleId);

      const state = useMVCCStore.getState();
      expect(state.selectedTuple).toBe(tupleId);
    });

    it('should set active tab', () => {
      const { setActiveTab } = useMVCCStore.getState();

      setActiveTab('visibility');

      const state = useMVCCStore.getState();
      expect(state.activeTab).toBe('visibility');
    });
  });

  describe('Preset Scenarios', () => {
    it('should load simple read scenario', () => {
      const { loadPresetScenario, getCommittedTransactions, getActiveTransactions } = useMVCCStore.getState();

      loadPresetScenario('simple_read');

      const state = useMVCCStore.getState();
      expect(getCommittedTransactions().length).toBe(1);
      expect(getActiveTransactions().length).toBe(1);
      expect(state.tupleVersions.length).toBe(1);
      expect(state.snapshots.length).toBe(1);
    });

    it('should load concurrent updates scenario', () => {
      const { loadPresetScenario, getCommittedTransactions, getActiveTransactions } = useMVCCStore.getState();

      loadPresetScenario('concurrent_updates');

      expect(getCommittedTransactions().length).toBe(1);
      expect(getActiveTransactions().length).toBe(2);
    });

    it('should load phantom read scenario', () => {
      const { loadPresetScenario } = useMVCCStore.getState();

      loadPresetScenario('phantom_read');

      const state = useMVCCStore.getState();
      const t1 = state.transactions.find((t) => t.isolationLevel === 'repeatable_read');
      expect(t1).toBeDefined();
      expect(state.tupleVersions.length).toBe(1);
    });

    it('should load serialization anomaly scenario', () => {
      const { loadPresetScenario, getActiveTransactions } = useMVCCStore.getState();

      loadPresetScenario('serialization_anomaly');

      const state = useMVCCStore.getState();
      const serializableTxns = state.transactions.filter((t) => t.isolationLevel === 'serializable');
      expect(serializableTxns.length).toBe(2);
      expect(getActiveTransactions().length).toBe(2);
    });
  });

  describe('Computed Getters', () => {
    it('should get active transactions', () => {
      const { startTransaction, commitTransaction, getActiveTransactions } = useMVCCStore.getState();

      const xid1 = startTransaction();
      startTransaction();
      startTransaction();

      commitTransaction(xid1);

      const active = getActiveTransactions();
      expect(active.length).toBe(2);
      expect(active.every((t) => t.status === 'in_progress')).toBe(true);
    });

    it('should get committed transactions', () => {
      const { startTransaction, commitTransaction, getCommittedTransactions } = useMVCCStore.getState();

      const xid1 = startTransaction();
      const xid2 = startTransaction();
      startTransaction();

      commitTransaction(xid1);
      commitTransaction(xid2);

      const committed = getCommittedTransactions();
      expect(committed.length).toBe(2);
    });

    it('should get aborted transactions', () => {
      const { startTransaction, abortTransaction, getAbortedTransactions } = useMVCCStore.getState();

      const xid1 = startTransaction();
      const xid2 = startTransaction();
      startTransaction();

      abortTransaction(xid1);
      abortTransaction(xid2);

      const aborted = getAbortedTransactions();
      expect(aborted.length).toBe(2);
    });

    it('should return frozen XID', () => {
      const { getFrozenXid } = useMVCCStore.getState();
      expect(getFrozenXid()).toBe(2);
    });
  });

  describe('Reset', () => {
    it('should reset all state', () => {
      const { startTransaction, insertTuple, reset } = useMVCCStore.getState();

      startTransaction();
      startTransaction();
      insertTuple(100, 'Data');

      reset();

      const state = useMVCCStore.getState();
      expect(state.transactions).toHaveLength(0);
      expect(state.tupleVersions).toHaveLength(0);
      expect(state.snapshots).toHaveLength(0);
      expect(state.currentTime).toBe(0);
    });
  });
});
