import { describe, it, expect } from 'vitest';
import {
  useToastStore,
  TOAST_TUPLE_THRESHOLD,
  TOAST_TUPLE_TARGET,
  TOAST_MAX_CHUNK_SIZE
} from './toastStore';

describe('toastStore', () => {
  describe('TOAST decision logic', () => {
    it('should correctly identify when TOAST is needed', () => {
      const store = useToastStore.getState();

      // Data below threshold should not trigger TOAST
      store.setDataSize(1000);
      expect(useToastStore.getState().shouldToast()).toBe(false);

      // Data above threshold should trigger TOAST
      store.setDataSize(3000);
      expect(useToastStore.getState().shouldToast()).toBe(true);

      // Exactly at threshold should not trigger TOAST
      store.setDataSize(TOAST_TUPLE_THRESHOLD);
      expect(useToastStore.getState().shouldToast()).toBe(false);
    });

    it('should handle PLAIN strategy correctly', () => {
      const store = useToastStore.getState();
      store.setStrategy('PLAIN');
      store.setDataSize(1000);
      store.generateTextData(1000);

      const state = useToastStore.getState();
      expect(state.getStorageLocation()).toBe('inline');
      expect(state.chunks.length).toBe(0);
    });

    it('should handle EXTENDED strategy with compression', () => {
      const store = useToastStore.getState();
      store.setStrategy('EXTENDED');
      store.setCompression('PGLZ');
      store.setDataSize(5000);
      store.generateTextData(5000);

      // Text data with PGLZ should compress well
      const state = useToastStore.getState();
      const compressedSize = state.getCompressedSize();
      expect(compressedSize).toBeLessThan(5000);
    });

    it('should handle EXTERNAL strategy (no compression)', () => {
      const store = useToastStore.getState();
      store.setDataSize(5000);
      store.setStrategy('EXTERNAL');
      store.setCompression('NONE');
      store.generateRandomData(5000);

      const state = useToastStore.getState();
      expect(state.getStorageLocation()).toBe('out-of-line');
      // EXTERNAL strategy with large data should create chunks
      expect(state.chunks.length).toBeGreaterThan(0);
    });

    it('should handle MAIN strategy correctly', () => {
      const store = useToastStore.getState();
      store.setStrategy('MAIN');
      store.setCompression('PGLZ');
      store.setDataSize(5000);
      store.generateTextData(5000);

      // MAIN tries inline first with compression
      const state = useToastStore.getState();
      const compressedSize = state.getCompressedSize();
      if (compressedSize <= TOAST_TUPLE_TARGET) {
        expect(state.getStorageLocation()).toBe('inline');
      } else {
        expect(state.getStorageLocation()).toBe('out-of-line');
      }
    });
  });

  describe('Chunk calculation', () => {
    it('should calculate correct number of chunks for out-of-line storage', () => {
      const store = useToastStore.getState();
      store.setDataSize(5000);
      store.setStrategy('EXTERNAL');
      store.setCompression('NONE');
      store.generateRandomData(5000);

      const state = useToastStore.getState();
      // 5000 bytes / 2048 bytes per chunk = ~3 chunks
      const expectedChunks = Math.ceil(5000 / TOAST_MAX_CHUNK_SIZE);
      expect(state.chunks.length).toBe(expectedChunks);
    });

    it('should create chunks with correct properties', () => {
      const store = useToastStore.getState();
      store.setStrategy('EXTENDED');
      store.setCompression('PGLZ');
      store.setDataSize(5000);
      store.generateTextData(5000);

      const state = useToastStore.getState();
      if (state.chunks.length > 0) {
        const chunk = state.chunks[0];
        expect(chunk.chunk_id).toBeGreaterThan(0);
        expect(chunk.chunk_seq).toBe(0);
        expect(chunk.size).toBeGreaterThan(0);
        expect(chunk.size).toBeLessThanOrEqual(TOAST_MAX_CHUNK_SIZE);
        expect(typeof chunk.chunk_data).toBe('string');
      }
    });

    it('should handle empty data correctly', () => {
      const store = useToastStore.getState();
      store.setDataSize(100);
      store.setStrategy('PLAIN');
      store.generateTextData(100);

      const state = useToastStore.getState();
      expect(state.chunks.length).toBe(0);
      expect(state.getStorageLocation()).toBe('inline');
    });
  });

  describe('Compression ratio estimation', () => {
    it('should return 1.0 for NONE compression', () => {
      const store = useToastStore.getState();
      store.setCompression('NONE');
      store.generateRandomData(1000);

      const state = useToastStore.getState();
      const ratio = state.calculateCompressionRatio();
      expect(ratio).toBe(1.0);
    });

    it('should return lower ratio for text data with PGLZ', () => {
      const store = useToastStore.getState();
      store.setCompression('PGLZ');
      store.generateTextData(5000);

      const state = useToastStore.getState();
      const ratio = state.calculateCompressionRatio();
      expect(ratio).toBeLessThan(1.0);
    });

    it('should return lower ratio for JSON data', () => {
      const store = useToastStore.getState();
      store.setCompression('PGLZ');
      store.generateJSONData(5000);

      const state = useToastStore.getState();
      const ratio = state.calculateCompressionRatio();
      expect(ratio).toBeLessThan(1.0);
    });

    it('should return 1.0 for random data with NONE compression', () => {
      const store = useToastStore.getState();
      store.setCompression('NONE');
      store.generateRandomData(5000);

      const state = useToastStore.getState();
      const ratio = state.calculateCompressionRatio();
      expect(ratio).toBe(1.0);
    });
  });

  describe('Strategy comparison', () => {
    it('should show different storage locations for different strategies', () => {
      const store = useToastStore.getState();
      const results: Record<string, string> = {};

      // Test PLAIN
      store.setStrategy('PLAIN');
      store.setDataSize(5000);
      store.generateRandomData(5000);
      results['PLAIN'] = useToastStore.getState().getStorageLocation();

      // Test EXTERNAL
      store.setStrategy('EXTERNAL');
      store.setDataSize(5000);
      store.generateRandomData(5000);
      results['EXTERNAL'] = useToastStore.getState().getStorageLocation();

      // PLAIN should always be inline
      expect(results['PLAIN']).toBe('inline');

      // EXTERNAL with large data should be out-of-line
      expect(results['EXTERNAL']).toBe('out-of-line');
    });

    it('should calculate effective size correctly', () => {
      const store = useToastStore.getState();

      // Inline storage: effective size equals data size
      store.setDataSize(1000);
      store.setStrategy('PLAIN');
      store.generateTextData(1000);
      expect(useToastStore.getState().getEffectiveSize()).toBe(1000);

      // Out-of-line storage: effective size is 18 bytes (pointer)
      store.setDataSize(5000);
      store.setStrategy('EXTERNAL');
      store.setCompression('NONE');
      store.generateRandomData(5000);
      const state = useToastStore.getState();
      if (state.chunks.length > 0) {
        expect(state.getEffectiveSize()).toBe(18);
      }
    });
  });

  describe('TOAST pointer structure', () => {
    it('should have valid pointer properties', () => {
      const store = useToastStore.getState();
      store.setDataSize(5000);
      store.setStrategy('EXTERNAL');
      store.setCompression('NONE');
      store.generateRandomData(5000);

      const state = useToastStore.getState();
      const pointer = state.mainTablePointer;
      expect(pointer.size).toBe(18);
      expect(pointer.va_rawsize).toBeGreaterThan(0);
      expect(pointer.va_oid).toBeGreaterThan(0);
      expect(pointer.pointer).toMatch(/^0x[0-9a-f]+$/);
    });

    it('should set compression flag correctly', () => {
      const store = useToastStore.getState();

      // Without compression
      store.setDataSize(1000);
      store.setStrategy('PLAIN');
      store.setCompression('NONE');
      store.generateTextData(1000);
      let state = useToastStore.getState();
      expect(state.mainTablePointer.va_extinfo & 0x01).toBe(0);

      // With compression on text data (which is compressible)
      store.setDataSize(5000);
      store.setStrategy('EXTENDED');
      store.setCompression('PGLZ');
      store.generateTextData(5000);
      state = useToastStore.getState();
      // When text data is compressed and stored, flag should be set
      expect(state.mainTablePointer.va_extinfo & 0x01).toBe(1);
    });
  });

  describe('Data generation', () => {
    it('should generate text data of correct size', () => {
      const store = useToastStore.getState();
      store.generateTextData(5000);

      const state = useToastStore.getState();
      expect(state.dataSize).toBe(5000);
      expect(state.data.length).toBe(5000);
    });

    it('should generate JSON data', () => {
      const store = useToastStore.getState();
      store.setCompression('NONE');
      store.generateJSONData(5000);

      const state = useToastStore.getState();
      expect(state.dataSize).toBe(5000);
      // JSON data should start with valid JSON characters
      expect(state.data.startsWith('{')).toBe(true);
    });

    it('should generate random data', () => {
      const store = useToastStore.getState();
      store.generateRandomData(5000);

      const state = useToastStore.getState();
      expect(state.dataSize).toBe(5000);
      expect(state.data.length).toBe(5000);
    });

    it('should generate image metadata', () => {
      const store = useToastStore.getState();
      store.setCompression('NONE');
      store.generateImageMetadata(5000);

      const state = useToastStore.getState();
      expect(state.dataSize).toBe(5000);
      // Image metadata should contain format field
      expect(state.data).toContain('format');
    });
  });

  describe('Thresholds', () => {
    it('should have correct TOAST threshold values', () => {
      expect(TOAST_TUPLE_THRESHOLD).toBe(2048);
      expect(TOAST_TUPLE_TARGET).toBe(2048);
      expect(TOAST_MAX_CHUNK_SIZE).toBe(2048);
    });
  });
});
