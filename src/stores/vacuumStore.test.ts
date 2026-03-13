import { describe, it, expect, beforeEach } from 'vitest';
import { useVacuumStore, PAGE_SIZE, MAX_TUPLES_PER_PAGE } from './vacuumStore';

describe('VacuumStore', () => {
  beforeEach(() => {
    useVacuumStore.getState().reset();
  });

  describe('Tuple Operations', () => {
    it('should insert a tuple', () => {
      const { insertTuple } = useVacuumStore.getState();
      const result = insertTuple(100, 'Test Data');

      expect(result).not.toBeNull();
      expect(result?.tupleId).toBeGreaterThan(0);
      expect(result?.pageId).toBeGreaterThan(0);

      const state = useVacuumStore.getState();
      expect(state.liveTupleCount).toBe(1);
      expect(state.pages.length).toBe(1);
    });

    it('should insert multiple tuples into same page', () => {
      const { insertTuple } = useVacuumStore.getState();

      insertTuple(100, 'Tuple 1');
      insertTuple(101, 'Tuple 2');
      insertTuple(102, 'Tuple 3');

      const state = useVacuumStore.getState();
      expect(state.pages.length).toBe(1);
      expect(state.pages[0].tuples.length).toBe(3);
      expect(state.liveTupleCount).toBe(3);
    });

    it('should create new page when current is full', () => {
      const { insertTuple } = useVacuumStore.getState();

      // Fill up first page
      for (let i = 0; i < MAX_TUPLES_PER_PAGE + 1; i++) {
        insertTuple(100 + i, `Tuple ${i}`);
      }

      const state = useVacuumStore.getState();
      expect(state.pages.length).toBe(2);
    });

    it('should update a tuple (mark old as dead, create new)', () => {
      const { insertTuple, updateTuple } = useVacuumStore.getState();
      
      const result = insertTuple(100, 'Original Data');
      const success = updateTuple(101, result!.tupleId, 'Updated Data');

      expect(success).toBe(true);

      const state = useVacuumStore.getState();
      expect(state.deadTupleCount).toBe(1);
      expect(state.liveTupleCount).toBe(1);

      const oldTuple = state.pages[0].tuples.find(t => t.id === result!.tupleId);
      expect(oldTuple?.state).toBe('dead');
      expect(oldTuple?.xmax).toBe(101);
    });

    it('should not update a dead tuple', () => {
      const { insertTuple, updateTuple, deleteTuple } = useVacuumStore.getState();
      
      const result = insertTuple(100, 'Data');
      deleteTuple(101, result!.tupleId);
      
      const success = updateTuple(102, result!.tupleId, 'New Data');
      expect(success).toBe(false);
    });

    it('should delete a tuple (mark as dead)', () => {
      const { insertTuple, deleteTuple } = useVacuumStore.getState();
      
      const result = insertTuple(100, 'Data to delete');
      const success = deleteTuple(101, result!.tupleId);

      expect(success).toBe(true);

      const state = useVacuumStore.getState();
      expect(state.deadTupleCount).toBe(1);
      expect(state.liveTupleCount).toBe(0);

      const tuple = state.pages[0].tuples.find(t => t.id === result!.tupleId);
      expect(tuple?.state).toBe('dead');
      expect(tuple?.xmax).toBe(101);
    });

    it('should not delete non-existent tuple', () => {
      const { deleteTuple } = useVacuumStore.getState();
      const success = deleteTuple(100, 99999);
      expect(success).toBe(false);
    });

    it('should get tuple by id', () => {
      const { insertTuple, getTuple } = useVacuumStore.getState();
      
      const result = insertTuple(100, 'Test Data');
      const tuple = getTuple(result!.tupleId);

      expect(tuple).not.toBeNull();
      expect(tuple?.data).toBe('Test Data');
      expect(tuple?.state).toBe('live');
    });

    it('should return null for non-existent tuple', () => {
      const { getTuple } = useVacuumStore.getState();
      const tuple = getTuple(99999);
      expect(tuple).toBeNull();
    });

    it('should get page for tuple', () => {
      const { insertTuple, getPageForTuple } = useVacuumStore.getState();
      
      const result = insertTuple(100, 'Test Data');
      const page = getPageForTuple(result!.tupleId);

      expect(page).not.toBeNull();
      expect(page?.tuples.some(t => t.id === result!.tupleId)).toBe(true);
    });
  });

  describe('VACUUM Process', () => {
    it('should remove dead tuples during VACUUM', async () => {
      const { insertTuple, deleteTuple, runVacuum } = useVacuumStore.getState();
      
      // Insert and delete some tuples
      const result1 = insertTuple(100, 'Live Data');
      const result2 = insertTuple(101, 'Dead Data');
      deleteTuple(102, result2!.tupleId);

      expect(useVacuumStore.getState().deadTupleCount).toBe(1);

      await runVacuum();

      const state = useVacuumStore.getState();
      expect(state.deadTupleCount).toBe(0);
      expect(state.pages[0].tuples.length).toBe(1);
      expect(state.pages[0].tuples[0].id).toBe(result1!.tupleId);
    });

    it('should update FSM after VACUUM', async () => {
      const { insertTuple, deleteTuple, runVacuum } = useVacuumStore.getState();
      
      // Insert and delete tuples to create free space
      const result = insertTuple(100, 'Data');
      deleteTuple(101, result!.tupleId);

      const fsmBefore = useVacuumStore.getState().fsm[0];
      
      await runVacuum();

      const fsmAfter = useVacuumStore.getState().fsm[0];
      expect(fsmAfter).toBeGreaterThan(fsmBefore);
    });

    it('should update VM after VACUUM', async () => {
      const { insertTuple, runVacuum } = useVacuumStore.getState();
      
      insertTuple(100, 'Data');

      const vmBefore = useVacuumStore.getState().vm[0];
      expect(vmBefore.allVisible).toBe(false);

      await runVacuum();

      const vmAfter = useVacuumStore.getState().vm[0];
      expect(vmAfter.allVisible).toBe(true);
    });

    it('should track vacuum history', async () => {
      const { insertTuple, deleteTuple, runVacuum } = useVacuumStore.getState();
      
      const result = insertTuple(100, 'Data');
      deleteTuple(101, result!.tupleId);

      await runVacuum();

      const state = useVacuumStore.getState();
      expect(state.vacuumHistory.length).toBe(1);
      expect(state.vacuumHistory[0].deadTuplesRemoved).toBe(1);
      expect(state.vacuumHistory[0].type).toBe('vacuum');
    });

    it('should not run VACUUM if already running', async () => {
      const { insertTuple, runVacuum } = useVacuumStore.getState();
      
      insertTuple(100, 'Data');

      // Start first VACUUM
      const promise1 = runVacuum();
      
      // Try to start second VACUUM immediately
      const promise2 = runVacuum();

      await Promise.all([promise1, promise2]);

      // Should only have one vacuum run in history
      const state = useVacuumStore.getState();
      expect(state.vacuumHistory.length).toBe(1);
    });
  });

  describe('VACUUM FULL', () => {
    it('should compact table during VACUUM FULL', async () => {
      const { insertTuple, deleteTuple, runVacuumFull } = useVacuumStore.getState();
      
      // Create scattered dead tuples across pages
      for (let i = 0; i < MAX_TUPLES_PER_PAGE * 2; i++) {
        const result = insertTuple(100 + i, `Data ${i}`);
        if (i % 2 === 0) {
          deleteTuple(200 + i, result!.tupleId);
        }
      }

      const pagesBefore = useVacuumStore.getState().pages.length;

      await runVacuumFull();

      const state = useVacuumStore.getState();
      expect(state.pages.length).toBeLessThan(pagesBefore);
      expect(state.deadTupleCount).toBe(0);
    });

    it('should track VACUUM FULL in history', async () => {
      const { insertTuple, runVacuumFull } = useVacuumStore.getState();
      
      insertTuple(100, 'Data');

      await runVacuumFull();

      const state = useVacuumStore.getState();
      expect(state.vacuumHistory.length).toBe(1);
      expect(state.vacuumHistory[0].type).toBe('vacuum_full');
    });
  });

  describe('Freeze Process', () => {
    it('should freeze old tuples', () => {
      const { insertTuple, freeze } = useVacuumStore.getState();
      
      // Insert tuples with old XIDs
      insertTuple(100, 'Old Data');
      insertTuple(200, 'Recent Data');

      const state = useVacuumStore.getState();
      state.currentXid = 100000; // Advance current XID

      freeze();

      const updatedState = useVacuumStore.getState();
      expect(updatedState.frozenTupleCount).toBeGreaterThan(0);
      
      const frozenTuple = updatedState.pages[0].tuples.find(t => t.xmin === 100);
      expect(frozenTuple?.state).toBe('frozen');
    });

    it('should update VM with all-frozen flag after freeze', () => {
      const { insertTuple, freeze } = useVacuumStore.getState();
      
      insertTuple(100, 'Data');

      const state = useVacuumStore.getState();
      state.currentXid = 100000;

      freeze();

      const vm = useVacuumStore.getState().vm[0];
      expect(vm.allFrozen).toBe(true);
    });
  });

  describe('XID Wraparound', () => {
    it('should track current XID', () => {
      const { insertTuple } = useVacuumStore.getState();
      
      insertTuple(100, 'Data');

      const state = useVacuumStore.getState();
      expect(state.currentXid).toBe(100);
    });

    it('should track frozen XID', () => {
      const { insertTuple, freeze } = useVacuumStore.getState();
      
      insertTuple(100, 'Data');
      
      const state = useVacuumStore.getState();
      state.currentXid = 100000;
      
      freeze();

      const updatedState = useVacuumStore.getState();
      expect(updatedState.frozenXid).toBeGreaterThan(3);
    });
  });

  describe('Autovacuum', () => {
    it('should calculate autovacuum threshold', () => {
      const { insertTuple, shouldAutovacuum } = useVacuumStore.getState();
      
      // Insert enough tuples
      for (let i = 0; i < 100; i++) {
        insertTuple(100 + i, `Data ${i}`);
      }

      expect(shouldAutovacuum()).toBe(false);

      // Delete enough tuples to trigger autovacuum
      const state = useVacuumStore.getState();
      const liveTuples = state.pages.flatMap(p => p.tuples).filter(t => t.state === 'live');
      
      for (let i = 0; i < 30; i++) {
        useVacuumStore.getState().deleteTuple(200 + i, liveTuples[i].id);
      }

      expect(useVacuumStore.getState().shouldAutovacuum()).toBe(true);
    });

    it('should respect autovacuum settings', () => {
      const { setAutovacuumThreshold, setAutovacuumScaleFactor } = useVacuumStore.getState();
      
      setAutovacuumThreshold(100);
      setAutovacuumScaleFactor(0.1);

      const state = useVacuumStore.getState();
      expect(state.autovacuumThreshold).toBe(100);
      expect(state.autovacuumScaleFactor).toBe(0.1);
    });
  });

  describe('Workload Generation', () => {
    it('should generate insert workload', () => {
      const { generateWorkload } = useVacuumStore.getState();
      
      generateWorkload(10, 0, 0);

      const state = useVacuumStore.getState();
      expect(state.liveTupleCount).toBe(10);
    });

    it('should generate mixed workload', () => {
      const { insertTuple, generateWorkload } = useVacuumStore.getState();
      
      // First insert some tuples to update/delete
      for (let i = 0; i < 20; i++) {
        insertTuple(100 + i, `Data ${i}`);
      }

      generateWorkload(5, 10, 5);

      const state = useVacuumStore.getState();
      expect(state.liveTupleCount).toBeGreaterThan(0);
      expect(state.deadTupleCount).toBeGreaterThan(0);
    });

    it('should advance XID during workload', () => {
      const { generateWorkload } = useVacuumStore.getState();
      
      const initialXid = useVacuumStore.getState().currentXid;
      generateWorkload(5, 3, 2);

      const state = useVacuumStore.getState();
      expect(state.currentXid).toBeGreaterThan(initialXid);
    });
  });

  describe('Statistics', () => {
    it('should calculate table size', () => {
      const { insertTuple, getTableSize } = useVacuumStore.getState();
      
      // Fill multiple pages
      for (let i = 0; i < MAX_TUPLES_PER_PAGE * 2; i++) {
        insertTuple(100 + i, `Data ${i}`);
      }

      const size = getTableSize();
      expect(size).toBe(2 * PAGE_SIZE);
    });

    it('should calculate dead tuple ratio', () => {
      const { insertTuple, deleteTuple, getDeadTupleRatio } = useVacuumStore.getState();
      
      insertTuple(100, 'Live');
      const result2 = insertTuple(101, 'Dead');
      deleteTuple(102, result2!.tupleId);

      const ratio = getDeadTupleRatio();
      expect(ratio).toBe(0.5);
    });

    it('should calculate bloat percentage', async () => {
      const { insertTuple, deleteTuple, runVacuum } = useVacuumStore.getState();
      
      // Create bloat by deleting many tuples
      const results = [];
      for (let i = 0; i < 20; i++) {
        const result = insertTuple(100 + i, `Data ${i}`);
        results.push(result);
      }

      // Delete half
      for (let i = 0; i < 10; i++) {
        deleteTuple(200 + i, results[i]!.tupleId);
      }

      const bloatBefore = useVacuumStore.getState().bloatPercentage;
      expect(bloatBefore).toBeGreaterThan(0);

      await runVacuum();

      const bloatAfter = useVacuumStore.getState().bloatPercentage;
      expect(bloatAfter).toBeLessThan(bloatBefore);
    });
  });

  describe('Selection', () => {
    it('should select page', () => {
      const { insertTuple, selectPage } = useVacuumStore.getState();
      
      const result = insertTuple(100, 'Data');
      selectPage(result!.pageId);

      const state = useVacuumStore.getState();
      expect(state.selectedPage).toBe(result!.pageId);
    });

    it('should set active tab', () => {
      const { setActiveTab } = useVacuumStore.getState();
      
      setActiveTab('xid');

      const state = useVacuumStore.getState();
      expect(state.activeTab).toBe('xid');
    });
  });

  describe('Reset', () => {
    it('should reset all state', () => {
      const { insertTuple, deleteTuple, reset } = useVacuumStore.getState();
      
      const result = insertTuple(100, 'Data');
      deleteTuple(101, result!.tupleId);

      reset();

      const state = useVacuumStore.getState();
      expect(state.pages).toHaveLength(0);
      expect(state.liveTupleCount).toBe(0);
      expect(state.deadTupleCount).toBe(0);
      expect(state.vacuumHistory).toHaveLength(0);
    });
  });
});
