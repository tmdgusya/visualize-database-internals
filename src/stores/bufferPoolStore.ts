import { create } from 'zustand';
import type { BufferDescriptor, BufferState } from '../types';

export interface AccessLogEntry {
  id: number;
  blocknum: number;
  result: 'hit' | 'miss';
  bufferId?: number;
  timestamp: number;
}

export interface BufferPoolState {
  // Pool configuration
  size: number;
  buffers: BufferDescriptor[];
  clockHand: number;

  // Statistics
  accessCount: number;
  hitCount: number;
  missCount: number;

  // Access log
  accessLog: AccessLogEntry[];

  // UI state
  selectedBufferId: number | null;
  isAnimating: boolean;
  animationSpeed: number;
}

export interface BufferPoolActions {
  // Pool management
  initializePool: (size: number) => void;
  setPoolSize: (size: number) => void;
  resetPool: () => void;

  // Page access
  accessPage: (blocknum: number) => { result: 'hit' | 'miss'; bufferId: number };
  accessPages: (blocknums: number[]) => void;

  // Clock sweep
  tickClock: () => void;
  findVictim: () => number;

  // Buffer operations
  pinBuffer: (bufferId: number) => void;
  unpinBuffer: (bufferId: number) => void;
  toggleDirty: (bufferId: number) => void;
  checkpoint: () => void;

  // Selection
  selectBuffer: (bufferId: number | null) => void;

  // Animation
  setIsAnimating: (isAnimating: boolean) => void;
  setAnimationSpeed: (speed: number) => void;

  // Computed
  getHitRate: () => number;
  getMissRate: () => number;
  getDirtyCount: () => number;
  getPinnedCount: () => number;
}

const MAX_USAGE_COUNT = 5;

const createEmptyBuffer = (bufferId: number): BufferDescriptor => ({
  bufferId,
  relfilenode: 0,
  forknum: 0,
  blocknum: -1,
  usageCount: 0,
  pinCount: 0,
  isDirty: false,
  state: 'empty',
});

const getBufferState = (buffer: BufferDescriptor): BufferState => {
  if (buffer.pinCount > 0) return 'pinned';
  if (buffer.isDirty) return 'dirty';
  if (buffer.blocknum === -1) return 'empty';
  return 'clean';
};

export const useBufferPoolStore = create<BufferPoolState & BufferPoolActions>((set, get) => ({
  // Initial state
  size: 64,
  buffers: Array.from({ length: 64 }, (_, i) => createEmptyBuffer(i)),
  clockHand: 0,
  accessCount: 0,
  hitCount: 0,
  missCount: 0,
  accessLog: [],
  selectedBufferId: null,
  isAnimating: false,
  animationSpeed: 500,

  // Pool management
  initializePool: (size: number) => {
    set({
      size,
      buffers: Array.from({ length: size }, (_, i) => createEmptyBuffer(i)),
      clockHand: 0,
      accessCount: 0,
      hitCount: 0,
      missCount: 0,
      accessLog: [],
      selectedBufferId: null,
    });
  },

  setPoolSize: (size: number) => {
    const { buffers } = get();
    if (size > buffers.length) {
      // Add new empty buffers
      const newBuffers = [
        ...buffers,
        ...Array.from({ length: size - buffers.length }, (_, i) =>
          createEmptyBuffer(buffers.length + i)
        ),
      ];
      set({ size, buffers: newBuffers });
    } else if (size < buffers.length) {
      // Remove buffers from the end (only if they're empty)
      const newBuffers = buffers.slice(0, size);
      set({ size, buffers: newBuffers });
    }
  },

  resetPool: () => {
    const { size } = get();
    get().initializePool(size);
  },

  // Page access
  accessPage: (blocknum: number) => {
    const state = get();
    const { buffers } = state;

    // Check for hit
    const existingBufferIndex = buffers.findIndex((b) => b.blocknum === blocknum);

    if (existingBufferIndex !== -1) {
      // Hit!
      const buffer = buffers[existingBufferIndex];
      const newUsageCount = Math.min(buffer.usageCount + 1, MAX_USAGE_COUNT);

      const newBuffers = [...buffers];
      newBuffers[existingBufferIndex] = {
        ...buffer,
        usageCount: newUsageCount,
        state: getBufferState({ ...buffer, usageCount: newUsageCount }),
      };

      const logEntry: AccessLogEntry = {
        id: Date.now(),
        blocknum,
        result: 'hit',
        bufferId: existingBufferIndex,
        timestamp: Date.now(),
      };

      set({
        buffers: newBuffers,
        accessCount: state.accessCount + 1,
        hitCount: state.hitCount + 1,
        accessLog: [logEntry, ...state.accessLog].slice(0, 100),
      });

      return { result: 'hit', bufferId: existingBufferIndex };
    }

    // Miss - use clock sweep to find victim
    const victimIndex = state.findVictim();

    const newBuffers = [...buffers];
    newBuffers[victimIndex] = {
      bufferId: victimIndex,
      relfilenode: 1, // Default table
      forknum: 0, // Main fork
      blocknum,
      usageCount: 1,
      pinCount: 0,
      isDirty: false,
      state: 'clean',
    };

    const logEntry: AccessLogEntry = {
      id: Date.now(),
      blocknum,
      result: 'miss',
      bufferId: victimIndex,
      timestamp: Date.now(),
    };

    set({
      buffers: newBuffers,
      clockHand: (victimIndex + 1) % state.size,
      accessCount: state.accessCount + 1,
      missCount: state.missCount + 1,
      accessLog: [logEntry, ...state.accessLog].slice(0, 100),
    });

    return { result: 'miss', bufferId: victimIndex };
  },

  accessPages: (blocknums: number[]) => {
    const { accessPage, setIsAnimating } = get();
    setIsAnimating(true);

    blocknums.forEach((blocknum, index) => {
      setTimeout(() => {
        accessPage(blocknum);
        if (index === blocknums.length - 1) {
          setIsAnimating(false);
        }
      }, index * get().animationSpeed);
    });
  },

  // Clock sweep
  tickClock: () => {
    const { buffers, clockHand, size } = get();
    const currentBuffer = buffers[clockHand];

    // If buffer has usage count > 0, decrement it
    if (currentBuffer.usageCount > 0 && currentBuffer.pinCount === 0) {
      const newBuffers = [...buffers];
      newBuffers[clockHand] = {
        ...currentBuffer,
        usageCount: currentBuffer.usageCount - 1,
        state: getBufferState({ ...currentBuffer, usageCount: currentBuffer.usageCount - 1 }),
      };
      set({ buffers: newBuffers });
    }

    // Advance clock hand
    set({ clockHand: (clockHand + 1) % size });
  },

  findVictim: () => {
    const { buffers, clockHand, size } = get();
    let currentIndex = clockHand;
    let iterations = 0;

    while (iterations < size * 2) {
      const buffer = buffers[currentIndex];

      // Skip pinned buffers
      if (buffer.pinCount > 0) {
        currentIndex = (currentIndex + 1) % size;
        iterations++;
        continue;
      }

      // If usage count is 0, this is our victim
      if (buffer.usageCount === 0) {
        return currentIndex;
      }

      // Decrement usage count (second chance)
      const newBuffers = [...buffers];
      newBuffers[currentIndex] = {
        ...buffer,
        usageCount: buffer.usageCount - 1,
        state: getBufferState({ ...buffer, usageCount: buffer.usageCount - 1 }),
      };
      set({ buffers: newBuffers });

      currentIndex = (currentIndex + 1) % size;
      iterations++;
    }

    // Fallback: return current clock hand position
    return currentIndex;
  },

  // Buffer operations
  pinBuffer: (bufferId: number) => {
    const { buffers } = get();
    const buffer = buffers[bufferId];

    const newBuffers = [...buffers];
    const newPinCount = buffer.pinCount + 1;
    newBuffers[bufferId] = {
      ...buffer,
      pinCount: newPinCount,
      state: getBufferState({ ...buffer, pinCount: newPinCount }),
    };

    set({ buffers: newBuffers });
  },

  unpinBuffer: (bufferId: number) => {
    const { buffers } = get();
    const buffer = buffers[bufferId];

    if (buffer.pinCount === 0) return;

    const newBuffers = [...buffers];
    const newPinCount = buffer.pinCount - 1;
    newBuffers[bufferId] = {
      ...buffer,
      pinCount: newPinCount,
      state: getBufferState({ ...buffer, pinCount: newPinCount }),
    };

    set({ buffers: newBuffers });
  },

  toggleDirty: (bufferId: number) => {
    const { buffers } = get();
    const buffer = buffers[bufferId];

    const newBuffers = [...buffers];
    const newIsDirty = !buffer.isDirty;
    newBuffers[bufferId] = {
      ...buffer,
      isDirty: newIsDirty,
      state: getBufferState({ ...buffer, isDirty: newIsDirty }),
    };

    set({ buffers: newBuffers });
  },

  checkpoint: () => {
    const { buffers } = get();

    const newBuffers = buffers.map((buffer) => {
      if (buffer.isDirty) {
        return {
          ...buffer,
          isDirty: false,
          state: getBufferState({ ...buffer, isDirty: false }) as BufferState,
        };
      }
      return buffer;
    });

    set({ buffers: newBuffers });
  },

  // Selection
  selectBuffer: (bufferId: number | null) => {
    set({ selectedBufferId: bufferId });
  },

  // Animation
  setIsAnimating: (isAnimating: boolean) => {
    set({ isAnimating });
  },

  setAnimationSpeed: (speed: number) => {
    set({ animationSpeed: speed });
  },

  // Computed
  getHitRate: () => {
    const { accessCount, hitCount } = get();
    return accessCount === 0 ? 0 : (hitCount / accessCount) * 100;
  },

  getMissRate: () => {
    const { accessCount, missCount } = get();
    return accessCount === 0 ? 0 : (missCount / accessCount) * 100;
  },

  getDirtyCount: () => {
    return get().buffers.filter((b) => b.isDirty).length;
  },

  getPinnedCount: () => {
    return get().buffers.filter((b) => b.pinCount > 0).length;
  },
}));
