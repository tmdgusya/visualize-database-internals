import { create } from 'zustand';
import type { Page, PageSize, PageHeader, LinePointer, Tuple } from '../types';

const PAGE_HEADER_SIZE = 24;
const LINE_POINTER_SIZE = 4;

const createDefaultHeader = (size: PageSize): PageHeader => ({
  pd_lsn: '0/00000000',
  pd_checksum: 0,
  pd_flags: 0,
  pd_lower: PAGE_HEADER_SIZE,
  pd_upper: size,
  pd_special: size,
  pd_pagesize_version: 0x0402,
  pd_prune_xid: 0,
});

interface PageState {
  page: Page;
  selectedTupleId: number | null;
  hoveredHeaderField: string | null;
  isByteView: boolean;

  // Actions
  setPageSize: (size: PageSize) => void;
  addTuple: (data: string) => void;
  removeTuple: (id: number) => void;
  compactPage: () => void;
  selectTuple: (id: number | null) => void;
  setHoveredHeaderField: (field: string | null) => void;
  toggleByteView: () => void;

  // Computed
  freeSpace: number;
  fragmentation: number;
  totalTupleSize: number;
}

export const usePageStore = create<PageState>((set, get) => ({
  page: {
    size: 8192,
    header: createDefaultHeader(8192),
    linePointers: [],
    tuples: [],
  },
  selectedTupleId: null,
  hoveredHeaderField: null,
  isByteView: false,

  setPageSize: (size: PageSize) => {
    set({
      page: {
        size,
        header: createDefaultHeader(size),
        linePointers: [],
        tuples: [],
      },
    });
  },

  addTuple: (data: string) => {
    const { page } = get();
    const tupleLength = data.length * 2; // UTF-16 approximation

    // Check if there's enough space
    const requiredSpace = LINE_POINTER_SIZE + tupleLength;
    const availableSpace = page.header.pd_upper - page.header.pd_lower;

    if (requiredSpace > availableSpace) {
      console.warn('Not enough space in page');
      return;
    }

    const newTuple: Tuple = {
      id: Date.now(),
      data,
      length: tupleLength,
      t_xmin: 1,
      t_xmax: 0,
      t_cid: 0,
      t_ctid: [0, page.linePointers.length + 1],
    };

    const newLinePointer: LinePointer = {
      offset: page.header.pd_upper - tupleLength,
      length: tupleLength,
      flags: 0,
    };

    set({
      page: {
        ...page,
        header: {
          ...page.header,
          pd_lower: page.header.pd_lower + LINE_POINTER_SIZE,
          pd_upper: page.header.pd_upper - tupleLength,
        },
        linePointers: [...page.linePointers, newLinePointer],
        tuples: [...page.tuples, newTuple],
      },
    });
  },

  removeTuple: (id: number) => {
    const { page } = get();
    const tupleIndex = page.tuples.findIndex((t) => t.id === id);
    if (tupleIndex === -1) return;

    // Mark line pointer as dead (lp_flags = 0)
    const newLinePointers = [...page.linePointers];
    newLinePointers[tupleIndex] = { ...newLinePointers[tupleIndex], flags: 0 };

    set({
      page: {
        ...page,
        linePointers: newLinePointers,
      },
    });
  },

  compactPage: () => {
    const { page } = get();

    // Filter out dead tuples and reorganize
    const liveTuples = page.tuples.filter((_, i) => page.linePointers[i].flags !== 0);

    let currentOffset = page.size;
    const newLinePointers: LinePointer[] = [];

    liveTuples.forEach((tuple) => {
      currentOffset -= tuple.length;
      newLinePointers.push({
        offset: currentOffset,
        length: tuple.length,
        flags: 1,
      });
    });

    set({
      page: {
        ...page,
        header: {
          ...page.header,
          pd_lower: PAGE_HEADER_SIZE + newLinePointers.length * LINE_POINTER_SIZE,
          pd_upper: currentOffset,
        },
        linePointers: newLinePointers,
        tuples: liveTuples,
      },
    });
  },

  selectTuple: (id: number | null) => {
    set({ selectedTupleId: id });
  },

  setHoveredHeaderField: (field: string | null) => {
    set({ hoveredHeaderField: field });
  },

  toggleByteView: () => {
    set((state) => ({ isByteView: !state.isByteView }));
  },

  get freeSpace() {
    const { page } = get();
    return page.header.pd_upper - page.header.pd_lower;
  },

  get fragmentation() {
    const { page } = get();
    const totalSpace = page.size - PAGE_HEADER_SIZE;
    const deadSpace = page.linePointers
      .filter((lp) => lp.flags === 0)
      .reduce((sum, lp) => sum + lp.length, 0);
    return totalSpace > 0 ? (deadSpace / totalSpace) * 100 : 0;
  },

  get totalTupleSize() {
    const { page } = get();
    return page.tuples.reduce((sum, t) => sum + t.length, 0);
  },
}));
