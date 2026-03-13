import { create } from 'zustand';

export type TupleState = 'live' | 'dead' | 'frozen';

export interface Tuple {
  id: number;
  state: TupleState;
  xmin: number;
  xmax: number | null;
  data: string;
}

export interface TablePage {
  id: number;
  tuples: Tuple[];
  freeSpace: number;
  maxTuples: number;
}

export interface VacuumRun {
  id: number;
  startTime: number;
  endTime: number;
  deadTuplesRemoved: number;
  pagesScanned: number;
  pagesVacuumed: number;
  type: 'vacuum' | 'vacuum_full';
}

export interface VacuumState {
  // Table data
  pages: TablePage[];
  nextTupleId: number;
  nextPageId: number;

  // Statistics
  deadTupleCount: number;
  liveTupleCount: number;
  frozenTupleCount: number;
  bloatPercentage: number;

  // Transaction IDs
  currentXid: number;
  frozenXid: number;

  // Autovacuum settings
  autovacuumThreshold: number;
  autovacuumScaleFactor: number;

  // VACUUM state
  isVacuumRunning: boolean;
  vacuumProgress: number;
  currentVacuumPage: number;

  // Maps
  fsm: number[]; // Free Space Map - bytes of free space per page
  vm: { allVisible: boolean; allFrozen: boolean }[]; // Visibility Map

  // History
  vacuumHistory: VacuumRun[];

  // UI State
  selectedPage: number | null;
  activeTab: 'table' | 'vacuum' | 'xid' | 'autovacuum';
}

export interface VacuumActions {
  // Tuple operations
  insertTuple: (xid: number, data?: string) => { pageId: number; tupleId: number } | null;
  updateTuple: (xid: number, tupleId: number, data?: string) => boolean;
  deleteTuple: (xid: number, tupleId: number) => boolean;

  // VACUUM operations
  runVacuum: () => Promise<void>;
  runVacuumFull: () => Promise<void>;
  freeze: () => void;

  // Workload simulation
  generateWorkload: (inserts: number, updates: number, deletes: number) => void;

  // Utility
  reset: () => void;
  selectPage: (pageId: number | null) => void;
  setActiveTab: (tab: 'table' | 'vacuum' | 'xid' | 'autovacuum') => void;
  setAutovacuumThreshold: (threshold: number) => void;
  setAutovacuumScaleFactor: (factor: number) => void;

  // Getters
  getTuple: (tupleId: number) => Tuple | null;
  getPage: (pageId: number) => TablePage | null;
  getPageForTuple: (tupleId: number) => TablePage | null;
  shouldAutovacuum: () => boolean;
  getTableSize: () => number;
  getDeadTupleRatio: () => number;

  // Internal
  updateBloat: () => void;
}

const PAGE_SIZE = 8192; // 8KB page
const TUPLE_SIZE = 100; // Average tuple size
const MAX_TUPLES_PER_PAGE = Math.floor((PAGE_SIZE - 200) / TUPLE_SIZE); // Reserve header space

const INITIAL_FROZEN_XID = 3;
const WRAPAROUND_LIMIT = Math.pow(2, 31); // 2 billion
const DANGER_ZONE = Math.pow(2, 31) - 1000000; // 1 million before wraparound

const initialState: VacuumState = {
  pages: [],
  nextTupleId: 1,
  nextPageId: 1,
  deadTupleCount: 0,
  liveTupleCount: 0,
  frozenTupleCount: 0,
  bloatPercentage: 0,
  currentXid: 100,
  frozenXid: INITIAL_FROZEN_XID,
  autovacuumThreshold: 50,
  autovacuumScaleFactor: 0.2,
  isVacuumRunning: false,
  vacuumProgress: 0,
  currentVacuumPage: 0,
  fsm: [],
  vm: [],
  vacuumHistory: [],
  selectedPage: null,
  activeTab: 'table',
};

export const useVacuumStore = create<VacuumState & VacuumActions>((set, get) => ({
  ...initialState,

  // Tuple operations
  insertTuple: (xid: number, data?: string) => {
    const state = get();
    
    // Find page with enough space
    let targetPage = state.pages.find(p => p.tuples.length < MAX_TUPLES_PER_PAGE);
    
    // Create new page if needed
    if (!targetPage) {
      const newPage: TablePage = {
        id: state.nextPageId,
        tuples: [],
        freeSpace: PAGE_SIZE - 200,
        maxTuples: MAX_TUPLES_PER_PAGE,
      };
      targetPage = newPage;
      set({
        pages: [...state.pages, newPage],
        nextPageId: state.nextPageId + 1,
        fsm: [...state.fsm, PAGE_SIZE - 200],
        vm: [...state.vm, { allVisible: false, allFrozen: false }],
      });
    }

    const tupleId = state.nextTupleId;
    const newTuple: Tuple = {
      id: tupleId,
      state: 'live',
      xmin: xid,
      xmax: null,
      data: data || `Tuple ${tupleId}`,
    };

    const updatedPages = state.pages.map(p => {
      if (p.id === targetPage!.id) {
        return {
          ...p,
          tuples: [...p.tuples, newTuple],
          freeSpace: p.freeSpace - TUPLE_SIZE,
        };
      }
      return p;
    });

    // If we created a new page, it won't be in updatedPages yet
    const finalPages = targetPage.tuples.length === 0 
      ? updatedPages 
      : updatedPages;

    // Update FSM for the target page
    const pageIndex = finalPages.findIndex(p => p.id === targetPage!.id);
    const newFsm = [...state.fsm];
    if (pageIndex >= 0 && pageIndex < newFsm.length) {
      newFsm[pageIndex] = finalPages[pageIndex].freeSpace;
    }

    set({
      pages: finalPages,
      nextTupleId: tupleId + 1,
      liveTupleCount: state.liveTupleCount + 1,
      fsm: newFsm,
    });

    return { pageId: targetPage.id, tupleId };
  },

  updateTuple: (xid: number, tupleId: number, data?: string) => {
    const state = get();
    let success = false;

    const updatedPages = state.pages.map(page => {
      const tupleIndex = page.tuples.findIndex(t => t.id === tupleId);
      if (tupleIndex === -1) return page;

      const tuple = page.tuples[tupleIndex];
      if (tuple.state !== 'live') return page;

      // Mark old tuple as dead
      const updatedTuples = [...page.tuples];
      updatedTuples[tupleIndex] = {
        ...tuple,
        state: 'dead',
        xmax: xid,
      };

      // Insert new version
      const newTupleId = state.nextTupleId;
      const newTuple: Tuple = {
        id: newTupleId,
        state: 'live',
        xmin: xid,
        xmax: null,
        data: data || tuple.data,
      };

      // Check if page has space for new tuple
      if (updatedTuples.length < MAX_TUPLES_PER_PAGE) {
        updatedTuples.push(newTuple);
        success = true;
        set({ nextTupleId: newTupleId + 1 });
      }

      return {
        ...page,
        tuples: updatedTuples,
        freeSpace: page.freeSpace - TUPLE_SIZE,
      };
    });

    if (success) {
      set({
        pages: updatedPages,
        deadTupleCount: state.deadTupleCount + 1,
      });
      get().updateBloat();
    }

    return success;
  },

  deleteTuple: (xid: number, tupleId: number) => {
    const state = get();
    let found = false;

    const updatedPages = state.pages.map(page => {
      const tupleIndex = page.tuples.findIndex(t => t.id === tupleId);
      if (tupleIndex === -1) return page;

      const tuple = page.tuples[tupleIndex];
      if (tuple.state !== 'live') return page;

      found = true;
      const updatedTuples = [...page.tuples];
      updatedTuples[tupleIndex] = {
        ...tuple,
        state: 'dead',
        xmax: xid,
      };

      return {
        ...page,
        tuples: updatedTuples,
      };
    });

    if (found) {
      set({
        pages: updatedPages,
        deadTupleCount: state.deadTupleCount + 1,
        liveTupleCount: state.liveTupleCount - 1,
      });
      get().updateBloat();
    }

    return found;
  },

  // VACUUM operations
  runVacuum: async () => {
    const state = get();
    if (state.isVacuumRunning) return;

    set({ isVacuumRunning: true, vacuumProgress: 0, currentVacuumPage: 0 });

    const startTime = Date.now();
    let deadTuplesRemoved = 0;
    let pagesVacuumed = 0;

    const totalPages = state.pages.length;
    
    for (let i = 0; i < totalPages; i++) {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 200));

      const page = state.pages[i];
      const liveTuples: Tuple[] = [];
      const deadTuples: Tuple[] = [];

      page.tuples.forEach(tuple => {
        if (tuple.state === 'dead') {
          deadTuples.push(tuple);
        } else {
          liveTuples.push(tuple);
        }
      });

      if (deadTuples.length > 0) {
        deadTuplesRemoved += deadTuples.length;
        pagesVacuumed++;

        // Update page
        set(currentState => ({
          pages: currentState.pages.map((p, idx) => 
            idx === i 
              ? {
                  ...p,
                  tuples: liveTuples,
                  freeSpace: PAGE_SIZE - 200 - (liveTuples.length * TUPLE_SIZE),
                }
              : p
          ),
        }));

        // Update FSM
        set(currentState => {
          const newFsm = [...currentState.fsm];
          newFsm[i] = PAGE_SIZE - 200 - (liveTuples.length * TUPLE_SIZE);
          return { fsm: newFsm };
        });
      }

      // Update VM - mark page as all-visible if all tuples are visible to all
      const allVisible = liveTuples.length > 0 && liveTuples.every(t => 
        t.xmin < state.frozenXid || t.state === 'frozen'
      );
      const allFrozen = liveTuples.length > 0 && liveTuples.every(t => t.state === 'frozen');

      set(currentState => {
        const newVm = [...currentState.vm];
        newVm[i] = { allVisible, allFrozen };
        return { vm: newVm };
      });

      set({
        vacuumProgress: ((i + 1) / totalPages) * 100,
        currentVacuumPage: i + 1,
      });
    }

    const endTime = Date.now();
    const vacuumRun: VacuumRun = {
      id: state.vacuumHistory.length + 1,
      startTime,
      endTime,
      deadTuplesRemoved,
      pagesScanned: totalPages,
      pagesVacuumed,
      type: 'vacuum',
    };

    set({
      isVacuumRunning: false,
      vacuumProgress: 100,
      deadTupleCount: 0,
      vacuumHistory: [...state.vacuumHistory, vacuumRun],
    });

    get().updateBloat();
  },

  runVacuumFull: async () => {
    const state = get();
    if (state.isVacuumRunning) return;

    set({ isVacuumRunning: true, vacuumProgress: 0, currentVacuumPage: 0 });

    const startTime = Date.now();
    
    // Collect all live tuples
    const allLiveTuples: Tuple[] = [];
    state.pages.forEach(page => {
      page.tuples.forEach(tuple => {
        if (tuple.state === 'live' || tuple.state === 'frozen') {
          allLiveTuples.push(tuple);
        }
      });
    });

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Rebuild pages compactly
    const newPages: TablePage[] = [];
    const newFsm: number[] = [];
    const newVm: { allVisible: boolean; allFrozen: boolean }[] = [];
    
    let currentPage: TablePage = {
      id: 1,
      tuples: [],
      freeSpace: PAGE_SIZE - 200,
      maxTuples: MAX_TUPLES_PER_PAGE,
    };

    allLiveTuples.forEach((tuple, index) => {
      if (currentPage.tuples.length >= MAX_TUPLES_PER_PAGE) {
        newPages.push(currentPage);
        newFsm.push(currentPage.freeSpace);
        newVm.push({ 
          allVisible: currentPage.tuples.every(t => t.xmin < state.frozenXid || t.state === 'frozen'),
          allFrozen: currentPage.tuples.every(t => t.state === 'frozen'),
        });
        
        currentPage = {
          id: currentPage.id + 1,
          tuples: [],
          freeSpace: PAGE_SIZE - 200,
          maxTuples: MAX_TUPLES_PER_PAGE,
        };
      }
      
      currentPage.tuples.push(tuple);
      currentPage.freeSpace -= TUPLE_SIZE;
      
      set({ vacuumProgress: ((index + 1) / allLiveTuples.length) * 100 });
    });

    if (currentPage.tuples.length > 0) {
      newPages.push(currentPage);
      newFsm.push(currentPage.freeSpace);
      newVm.push({ 
        allVisible: currentPage.tuples.every(t => t.xmin < state.frozenXid || t.state === 'frozen'),
        allFrozen: currentPage.tuples.every(t => t.state === 'frozen'),
      });
    }

    const endTime = Date.now();
    const vacuumRun: VacuumRun = {
      id: state.vacuumHistory.length + 1,
      startTime,
      endTime,
      deadTuplesRemoved: state.deadTupleCount,
      pagesScanned: state.pages.length,
      pagesVacuumed: newPages.length,
      type: 'vacuum_full',
    };

    set({
      pages: newPages,
      nextPageId: newPages.length + 1,
      isVacuumRunning: false,
      vacuumProgress: 100,
      deadTupleCount: 0,
      liveTupleCount: allLiveTuples.length,
      fsm: newFsm,
      vm: newVm,
      vacuumHistory: [...state.vacuumHistory, vacuumRun],
    });

    get().updateBloat();
  },

  freeze: () => {
    const state = get();
    const freezeLimit = state.currentXid - 50000; // vacuum_freeze_min_age

    let frozenCount = 0;

    const updatedPages = state.pages.map(page => ({
      ...page,
      tuples: page.tuples.map(tuple => {
        if (tuple.state === 'live' && tuple.xmin < freezeLimit) {
          frozenCount++;
          return { ...tuple, state: 'frozen' as TupleState, xmin: INITIAL_FROZEN_XID };
        }
        return tuple;
      }),
    }));

    set({
      pages: updatedPages,
      frozenTupleCount: state.frozenTupleCount + frozenCount,
      frozenXid: Math.max(state.frozenXid, freezeLimit),
    });

    // Update VM
    const newVm = updatedPages.map(page => ({
      allVisible: page.tuples.length > 0 && page.tuples.every(t => 
        t.xmin < state.frozenXid || t.state === 'frozen'
      ),
      allFrozen: page.tuples.length > 0 && page.tuples.every(t => t.state === 'frozen'),
    }));

    set({ vm: newVm });
  },

  // Workload simulation
  generateWorkload: (inserts: number, updates: number, deletes: number) => {
    const state = get();
    let xid = state.currentXid;

    // Generate inserts
    for (let i = 0; i < inserts; i++) {
      get().insertTuple(xid++, `Workload Tuple ${i}`);
    }

    // Generate updates (on existing live tuples)
    const liveTuples = state.pages
      .flatMap(p => p.tuples)
      .filter(t => t.state === 'live');
    
    for (let i = 0; i < Math.min(updates, liveTuples.length); i++) {
      const tuple = liveTuples[i];
      get().updateTuple(xid++, tuple.id, `Updated ${tuple.data}`);
    }

    // Generate deletes (on remaining live tuples)
    const remainingLiveTuples = get().pages
      .flatMap(p => p.tuples)
      .filter(t => t.state === 'live');
    
    for (let i = 0; i < Math.min(deletes, remainingLiveTuples.length); i++) {
      const tuple = remainingLiveTuples[i];
      get().deleteTuple(xid++, tuple.id);
    }

    set({ currentXid: xid });
  },

  // Utility
  reset: () => {
    set(initialState);
  },

  selectPage: (pageId: number | null) => {
    set({ selectedPage: pageId });
  },

  setActiveTab: (tab: 'table' | 'vacuum' | 'xid' | 'autovacuum') => {
    set({ activeTab: tab });
  },

  setAutovacuumThreshold: (threshold: number) => {
    set({ autovacuumThreshold: threshold });
  },

  setAutovacuumScaleFactor: (factor: number) => {
    set({ autovacuumScaleFactor: factor });
  },

  // Getters
  getTuple: (tupleId: number) => {
    const state = get();
    for (const page of state.pages) {
      const tuple = page.tuples.find(t => t.id === tupleId);
      if (tuple) return tuple;
    }
    return null;
  },

  getPage: (pageId: number) => {
    return get().pages.find(p => p.id === pageId) || null;
  },

  getPageForTuple: (tupleId: number) => {
    return get().pages.find(p => p.tuples.some(t => t.id === tupleId)) || null;
  },

  shouldAutovacuum: () => {
    const state = get();
    const threshold = state.autovacuumThreshold + 
      Math.floor(state.autovacuumScaleFactor * state.liveTupleCount);
    return state.deadTupleCount >= threshold;
  },

  getTableSize: () => {
    return get().pages.length * PAGE_SIZE;
  },

  getDeadTupleRatio: () => {
    const state = get();
    const total = state.liveTupleCount + state.deadTupleCount + state.frozenTupleCount;
    return total === 0 ? 0 : state.deadTupleCount / total;
  },

  // Internal helper
  updateBloat: () => {
    const state = get();
    const optimalPages = Math.ceil(state.liveTupleCount / MAX_TUPLES_PER_PAGE);
    const actualPages = state.pages.length;
    const bloat = optimalPages === 0 ? 0 : ((actualPages - optimalPages) / optimalPages) * 100;
    set({ bloatPercentage: Math.max(0, bloat) });
  },
}));

// Export constants for use in components
export { PAGE_SIZE, TUPLE_SIZE, MAX_TUPLES_PER_PAGE, WRAPAROUND_LIMIT, DANGER_ZONE };
