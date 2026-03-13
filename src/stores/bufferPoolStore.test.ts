import { describe, it, expect, beforeEach } from 'vitest';
import { useBufferPoolStore } from './bufferPoolStore';

describe('BufferPoolStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useBufferPoolStore.getState().initializePool(16);
  });

  describe('Pool Management', () => {
    it('should initialize pool with correct size', () => {
      const state = useBufferPoolStore.getState();
      expect(state.size).toBe(16);
      expect(state.buffers).toHaveLength(16);
      expect(state.buffers[0].bufferId).toBe(0);
      expect(state.buffers[15].bufferId).toBe(15);
    });

    it('should resize pool correctly', () => {
      const { setPoolSize } = useBufferPoolStore.getState();

      setPoolSize(32);
      const state = useBufferPoolStore.getState();
      expect(state.size).toBe(32);
      expect(state.buffers).toHaveLength(32);
    });

    it('should reset pool to empty state', () => {
      const { accessPage, resetPool } = useBufferPoolStore.getState();

      // Access some pages
      accessPage(1);
      accessPage(2);

      resetPool();

      const state = useBufferPoolStore.getState();
      expect(state.buffers.every((b) => b.blocknum === -1)).toBe(true);
      expect(state.accessCount).toBe(0);
      expect(state.hitCount).toBe(0);
      expect(state.missCount).toBe(0);
    });
  });

  describe('Page Access - Hit Detection', () => {
    it('should detect a hit when accessing the same block twice', () => {
      const { accessPage } = useBufferPoolStore.getState();

      const first = accessPage(5);
      expect(first.result).toBe('miss');

      const second = accessPage(5);
      expect(second.result).toBe('hit');
    });

    it('should increment usage count on hit', () => {
      const { accessPage } = useBufferPoolStore.getState();

      accessPage(5);
      let state = useBufferPoolStore.getState();
      const bufferId = state.buffers.find((b) => b.blocknum === 5)?.bufferId;
      expect(bufferId).toBeDefined();
      if (bufferId === undefined) return;

      // First access sets usage_count to 1
      expect(state.buffers[bufferId].usageCount).toBe(1);

      // Hit should increment
      accessPage(5);
      state = useBufferPoolStore.getState();
      expect(state.buffers[bufferId].usageCount).toBe(2);
    });

    it('should cap usage count at 5', () => {
      const { accessPage } = useBufferPoolStore.getState();

      accessPage(5);
      let state = useBufferPoolStore.getState();
      const bufferId = state.buffers.find((b) => b.blocknum === 5)?.bufferId;
      expect(bufferId).toBeDefined();
      if (bufferId === undefined) return;

      // Access 10 times to try to exceed max
      for (let i = 0; i < 10; i++) {
        accessPage(5);
      }

      state = useBufferPoolStore.getState();
      expect(state.buffers[bufferId].usageCount).toBe(5);
    });
  });

  describe('Clock Sweep Algorithm', () => {
    it('should find victim with usage_count = 0', () => {
      const { accessPage, findVictim } = useBufferPoolStore.getState();

      // Fill some buffers
      for (let i = 0; i < 5; i++) {
        accessPage(i);
      }

      // All have usage_count = 1, so clock sweep should decrement
      const victim = findVictim();
      const state = useBufferPoolStore.getState();

      // Victim should be valid index
      expect(victim).toBeGreaterThanOrEqual(0);
      expect(victim).toBeLessThan(state.buffers.length);
    });

    it('should decrement usage_count during clock sweep', () => {
      const { accessPage, tickClock } = useBufferPoolStore.getState();

      accessPage(5);
      let state = useBufferPoolStore.getState();
      const bufferId = state.buffers.find((b) => b.blocknum === 5)?.bufferId;
      expect(state.buffers[bufferId!].usageCount).toBe(1);

      // Tick clock at the buffer's position
      useBufferPoolStore.setState({ clockHand: bufferId });
      tickClock();

      state = useBufferPoolStore.getState();
      expect(state.buffers[bufferId!].usageCount).toBe(0);
    });

    it('should skip pinned buffers during victim selection', () => {
      const { accessPage, pinBuffer, findVictim } = useBufferPoolStore.getState();

      // Fill first few buffers
      for (let i = 0; i < 3; i++) {
        accessPage(i);
      }

      // Pin buffer 0
      pinBuffer(0);

      // Find victim should skip pinned buffer
      const victim = findVictim();
      // Since buffer 0 is pinned, victim should be different
      // unless all other buffers are also pinned (which they're not)
      const state = useBufferPoolStore.getState();
      if (state.buffers[0].pinCount > 0) {
        // Buffer 0 is pinned, so victim should be >= 1
        expect(victim).toBeGreaterThanOrEqual(1);
      }
    });

    it('should replace buffer with usage_count = 0', () => {
      const { accessPage, tickClock } = useBufferPoolStore.getState();

      // Access a page at buffer 0
      accessPage(100);
      let state = useBufferPoolStore.getState();
      const bufferId = state.buffers.find((b) => b.blocknum === 100)?.bufferId;
      expect(bufferId).toBeDefined();
      if (bufferId === undefined) return;

      // Set clock to this buffer and tick to decrement usage to 0
      useBufferPoolStore.setState({ clockHand: bufferId });
      tickClock();

      // Verify usage count is now 0
      state = useBufferPoolStore.getState();
      expect(state.buffers[bufferId].usageCount).toBe(0);

      // Set clock back to this buffer for replacement
      useBufferPoolStore.setState({ clockHand: bufferId });

      // Now access a new page - it should replace the one with usage_count = 0
      accessPage(200);

      state = useBufferPoolStore.getState();
      const updatedBuffer = state.buffers[bufferId];
      expect(updatedBuffer.blocknum).toBe(200);
    });
  });

  describe('Buffer State Transitions', () => {
    it('should mark buffer as dirty', () => {
      const { accessPage, toggleDirty } = useBufferPoolStore.getState();

      accessPage(5);
      let state = useBufferPoolStore.getState();
      const bufferId = state.buffers.find((b) => b.blocknum === 5)?.bufferId;
      expect(bufferId).toBeDefined();
      if (bufferId === undefined) return;

      expect(state.buffers[bufferId].isDirty).toBe(false);
      expect(state.buffers[bufferId].state).toBe('clean');

      toggleDirty(bufferId);

      state = useBufferPoolStore.getState();
      expect(state.buffers[bufferId].isDirty).toBe(true);
      expect(state.buffers[bufferId].state).toBe('dirty');
    });

    it('should pin and unpin buffer', () => {
      const { accessPage, pinBuffer, unpinBuffer } = useBufferPoolStore.getState();

      accessPage(5);
      let state = useBufferPoolStore.getState();
      const bufferId = state.buffers.find((b) => b.blocknum === 5)?.bufferId;
      expect(bufferId).toBeDefined();
      if (bufferId === undefined) return;

      expect(state.buffers[bufferId].pinCount).toBe(0);

      pinBuffer(bufferId);
      state = useBufferPoolStore.getState();
      expect(state.buffers[bufferId].pinCount).toBe(1);
      expect(state.buffers[bufferId].state).toBe('pinned');

      unpinBuffer(bufferId);
      state = useBufferPoolStore.getState();
      expect(state.buffers[bufferId].pinCount).toBe(0);
    });

    it('should flush dirty pages on checkpoint', () => {
      const { accessPage, toggleDirty, checkpoint } = useBufferPoolStore.getState();

      accessPage(5);
      accessPage(6);

      let state = useBufferPoolStore.getState();
      const bufferId5 = state.buffers.find((b) => b.blocknum === 5)?.bufferId;
      const bufferId6 = state.buffers.find((b) => b.blocknum === 6)?.bufferId;
      expect(bufferId5).toBeDefined();
      expect(bufferId6).toBeDefined();
      if (bufferId5 === undefined || bufferId6 === undefined) return;

      toggleDirty(bufferId5);
      toggleDirty(bufferId6);

      expect(useBufferPoolStore.getState().getDirtyCount()).toBe(2);

      checkpoint();

      state = useBufferPoolStore.getState();
      expect(state.buffers[bufferId5].isDirty).toBe(false);
      expect(state.buffers[bufferId6].isDirty).toBe(false);
      expect(state.getDirtyCount()).toBe(0);
    });
  });

  describe('Statistics', () => {
    it('should calculate hit rate correctly', () => {
      const { accessPage, getHitRate } = useBufferPoolStore.getState();

      // 2 misses, 1 hit
      accessPage(1); // miss
      accessPage(2); // miss
      accessPage(1); // hit

      expect(getHitRate()).toBeCloseTo(33.33, 1);
    });

    it('should calculate miss rate correctly', () => {
      const { accessPage, getMissRate } = useBufferPoolStore.getState();

      accessPage(1); // miss
      accessPage(1); // hit
      accessPage(2); // miss

      expect(getMissRate()).toBeCloseTo(66.67, 1);
    });

    it('should return 0 for rates when no accesses', () => {
      const { getHitRate, getMissRate } = useBufferPoolStore.getState();

      expect(getHitRate()).toBe(0);
      expect(getMissRate()).toBe(0);
    });
  });

  describe('Access Log', () => {
    it('should record access log entries', () => {
      const { accessPage } = useBufferPoolStore.getState();

      accessPage(1);
      accessPage(2);
      accessPage(1);

      const state = useBufferPoolStore.getState();
      expect(state.accessLog).toHaveLength(3);
      expect(state.accessLog[0].blocknum).toBe(1);
      expect(state.accessLog[0].result).toBe('hit');
      expect(state.accessLog[1].blocknum).toBe(2);
      expect(state.accessLog[1].result).toBe('miss');
    });
  });
});
