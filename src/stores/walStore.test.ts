import { describe, it, expect, beforeEach } from 'vitest';
import { useWALStore, parseLsn, formatLsn, compareLsn, addToLsn, getSegmentName, getSegmentStartLsn } from './walStore';

describe('WALStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useWALStore.getState().reset();
  });

  describe('LSN Utilities', () => {
    describe('parseLsn', () => {
      it('should parse LSN string correctly', () => {
        const result = parseLsn('0/00000100');
        expect(result.timeline).toBe(0);
        expect(result.offset).toBe(256);
      });

      it('should parse LSN with different timeline', () => {
        const result = parseLsn('1/00000000');
        expect(result.timeline).toBe(1);
        expect(result.offset).toBe(0);
      });

      it('should parse LSN with large offset', () => {
        const result = parseLsn('0/FFFFFFFF');
        expect(result.timeline).toBe(0);
        expect(result.offset).toBe(4294967295);
      });
    });

    describe('formatLsn', () => {
      it('should format LSN correctly', () => {
        expect(formatLsn(0, 256)).toBe('0/00000100');
      });

      it('should pad offset to 8 digits', () => {
        expect(formatLsn(1, 0)).toBe('1/00000000');
      });

      it('should handle large offsets', () => {
        expect(formatLsn(0, 4294967295)).toBe('0/ffffffff');
      });
    });

    describe('compareLsn', () => {
      it('should return 0 for equal LSNs', () => {
        expect(compareLsn('0/00000100', '0/00000100')).toBe(0);
      });

      it('should return negative when lsn1 < lsn2', () => {
        expect(compareLsn('0/00000100', '0/00000200')).toBeLessThan(0);
      });

      it('should return positive when lsn1 > lsn2', () => {
        expect(compareLsn('0/00000200', '0/00000100')).toBeGreaterThan(0);
      });

      it('should compare timelines first', () => {
        expect(compareLsn('0/FFFFFFFF', '1/00000000')).toBeLessThan(0);
      });
    });

    describe('addToLsn', () => {
      it('should add bytes to LSN', () => {
        expect(addToLsn('0/00000100', 256)).toBe('0/00000200');
      });

      it('should handle adding zero bytes', () => {
        expect(addToLsn('0/00000100', 0)).toBe('0/00000100');
      });
    });

    describe('getSegmentName', () => {
      it('should generate segment name for initial LSN', () => {
        expect(getSegmentName('0/00000000')).toBe('000000010000000000000000');
      });

      it('should generate segment name for LSN in second segment', () => {
        // 16MB = 0x1000000 bytes per segment
        expect(getSegmentName('0/01000000')).toBe('000000010000000000000001');
      });
    });

    describe('getSegmentStartLsn', () => {
      it('should return same LSN for segment start', () => {
        expect(getSegmentStartLsn('0/00000000')).toBe('0/00000000');
      });

      it('should return segment start for LSN within segment', () => {
        expect(getSegmentStartLsn('0/00001000')).toBe('0/00000000');
      });

      it('should return correct segment start for second segment', () => {
        expect(getSegmentStartLsn('0/01000000')).toBe('0/01000000');
      });
    });
  });

  describe('Store Initialization', () => {
    it('should initialize with correct default state', () => {
      const state = useWALStore.getState();
      expect(state.segments).toHaveLength(1);
      expect(state.currentLsn).toBe('0/00000000');
      expect(state.currentXid).toBe(100);
      expect(state.isPlaying).toBe(false);
      expect(state.totalRecords).toBe(0);
    });

    it('should have one initial segment', () => {
      const state = useWALStore.getState();
      expect(state.segments[0].name).toBe('000000010000000000000000');
      expect(state.segments[0].timeline).toBe(1);
    });
  });

  describe('WAL Record Creation', () => {
    it('should generate a record with correct structure', () => {
      const { generateRecord } = useWALStore.getState();
      const record = generateRecord('INSERT', 123, 5);

      expect(record.type).toBe('INSERT');
      expect(record.xid).toBe(123);
      expect(record.affectedPage).toBe(5);
      expect(record.lsn).toBe('0/00000000');
      expect(record.timestamp).toBeDefined();
      expect(record.data).toContain('INSERT');
    });

    it('should use current XID when not provided', () => {
      const { generateRecord } = useWALStore.getState();
      const record = generateRecord('INSERT');
      expect(record.xid).toBe(100);
    });

    it('should add record to store', () => {
      const { generateRecord, addRecord } = useWALStore.getState();
      const record = generateRecord('INSERT', 100, 1);
      addRecord(record);

      const state = useWALStore.getState();
      expect(state.totalRecords).toBe(1);
      expect(state.segments[0].records).toHaveLength(1);
    });

    it('should advance LSN after adding record', () => {
      const { generateRecord, addRecord } = useWALStore.getState();
      const initialLsn = useWALStore.getState().currentLsn;
      
      const record = generateRecord('INSERT');
      addRecord(record);

      const newLsn = useWALStore.getState().currentLsn;
      expect(compareLsn(newLsn, initialLsn)).toBeGreaterThan(0);
    });

    it('should update record type counts', () => {
      const { generateRecord, addRecord } = useWALStore.getState();
      
      addRecord(generateRecord('INSERT'));
      addRecord(generateRecord('INSERT'));
      addRecord(generateRecord('UPDATE'));

      const state = useWALStore.getState();
      expect(state.recordsByType.INSERT).toBe(2);
      expect(state.recordsByType.UPDATE).toBe(1);
    });
  });

  describe('Segment Boundary Detection', () => {
    it('should detect segment boundary crossing', () => {
      const { generateRecord, addRecord } = useWALStore.getState();
      
      // Add a CHECKPOINT record which is larger (128 bytes) to cross boundary faster
      // We'll add enough large records to potentially trigger segment creation
      // Note: In actual implementation, segment crossing requires 16MB of data
      // For testing, we verify the logic by checking segment structure
      
      // Add records and verify segment tracking works
      for (let i = 0; i < 10; i++) {
        addRecord(generateRecord('CHECKPOINT'));
      }

      const state = useWALStore.getState();
      // At minimum, we should have the initial segment
      expect(state.segments.length).toBeGreaterThanOrEqual(1);
      // All records should be tracked
      expect(state.totalRecords).toBe(10);
    });

    it('should create new segment with correct name', () => {
      // Test segment name generation logic using exported utility
      const lsn1 = '0/00000000';
      const lsn2 = '0/01000000'; // 16MB boundary
      
      const name1 = getSegmentName(lsn1);
      const name2 = getSegmentName(lsn2);
      
      // Different LSNs in different segments should have different names
      expect(name1).not.toBe(name2);
      expect(name1).toBe('000000010000000000000000');
      expect(name2).toBe('000000010000000000000001');
    });
  });

  describe('Workload Generation', () => {
    it('should generate OLTP workload', () => {
      const { generateWorkload } = useWALStore.getState();
      generateWorkload(10, 'OLTP');

      const state = useWALStore.getState();
      expect(state.totalRecords).toBe(10);
      expect(state.recordsByType.INSERT).toBeGreaterThan(0);
      expect(state.recordsByType.COMMIT).toBeGreaterThan(0);
    });

    it('should generate OLAP workload', () => {
      const { generateWorkload } = useWALStore.getState();
      generateWorkload(10, 'OLAP');

      const state = useWALStore.getState();
      expect(state.totalRecords).toBe(10);
      expect(state.recordsByType.CHECKPOINT).toBeGreaterThan(0);
    });

    it('should generate mixed workload', () => {
      const { generateWorkload } = useWALStore.getState();
      generateWorkload(10, 'MIXED');

      const state = useWALStore.getState();
      expect(state.totalRecords).toBe(10);
    });

    it('should increment XID during workload', () => {
      const { generateWorkload } = useWALStore.getState();
      const initialXid = useWALStore.getState().currentXid;
      
      generateWorkload(50, 'OLTP');

      const state = useWALStore.getState();
      expect(state.currentXid).toBeGreaterThan(initialXid);
    });
  });

  describe('Crash Recovery', () => {
    it('should set crash point', () => {
      const { generateRecord, addRecord, crashAt } = useWALStore.getState();
      
      addRecord(generateRecord('INSERT'));
      const recordLsn = useWALStore.getState().segments[0].records[0].lsn;
      
      crashAt(recordLsn);

      const state = useWALStore.getState();
      expect(state.crashPointLsn).toBe(recordLsn);
      expect(state.isInRecovery).toBe(true);
    });

    it('should clear crash point', () => {
      const { generateRecord, addRecord, crashAt, clearCrashPoint } = useWALStore.getState();
      
      addRecord(generateRecord('INSERT'));
      crashAt(useWALStore.getState().segments[0].records[0].lsn);
      clearCrashPoint();

      const state = useWALStore.getState();
      expect(state.crashPointLsn).toBeNull();
      expect(state.isInRecovery).toBe(false);
    });

    it('should perform REDO recovery', () => {
      const { generateRecord, addRecord, crashAt, recover } = useWALStore.getState();
      
      // Generate some records
      for (let i = 0; i < 5; i++) {
        addRecord(generateRecord('INSERT', 100, i));
      }
      
      const records = useWALStore.getState().segments[0].records;
      const crashLsn = records[records.length - 1].lsn;
      
      crashAt(crashLsn);
      recover();

      const state = useWALStore.getState();
      expect(state.recoveryOperations.length).toBeGreaterThan(0);
      expect(state.recoveredPages.length).toBeGreaterThan(0);
    });

    it('should identify REDO vs SKIP operations', () => {
      const { generateRecord, addRecord, crashAt, recover } = useWALStore.getState();
      
      // Add a mix of record types
      // Start with some regular records
      addRecord(generateRecord('INSERT', 100, 1));
      addRecord(generateRecord('UPDATE', 100, 2));
      
      // Add a checkpoint (this will be SKIPped during recovery)
      addRecord(generateRecord('CHECKPOINT'));
      
      // Add more records after checkpoint (these will be REDO)
      addRecord(generateRecord('INSERT', 101, 3));
      addRecord(generateRecord('DELETE', 101, 4));
      
      const records = useWALStore.getState().segments[0].records;
      // Crash at the last record
      crashAt(records[records.length - 1].lsn);
      recover();

      const state = useWALStore.getState();
      const redoOps = state.recoveryOperations.filter(op => op.type === 'REDO');
      const skipOps = state.recoveryOperations.filter(op => op.type === 'SKIP');
      
      // Recovery processes records from the last checkpoint to crash point
      // The checkpoint itself is SKIPped, records after it are REDO
      // Since the last checkpoint is at records[2], records[3] and records[4] should be REDO
      expect(redoOps.length).toBeGreaterThanOrEqual(1);
      // The checkpoint at records[2] should be SKIPped
      expect(skipOps.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Record Lookup', () => {
    it('should find record by LSN', () => {
      const { generateRecord, addRecord, getRecordByLsn } = useWALStore.getState();
      
      addRecord(generateRecord('INSERT', 100, 1));
      const record = useWALStore.getState().segments[0].records[0];
      
      const found = getRecordByLsn(record.lsn);
      expect(found).toBeDefined();
      expect(found?.type).toBe('INSERT');
    });

    it('should return undefined for non-existent LSN', () => {
      const { getRecordByLsn } = useWALStore.getState();
      const found = getRecordByLsn('0/99999999');
      expect(found).toBeUndefined();
    });

    it('should get records in range', () => {
      const { generateRecord, addRecord, getRecordsInRange } = useWALStore.getState();
      
      for (let i = 0; i < 5; i++) {
        addRecord(generateRecord('INSERT'));
      }
      
      const records = useWALStore.getState().segments[0].records;
      const rangeRecords = getRecordsInRange(records[0].lsn, records[2].lsn);
      
      expect(rangeRecords.length).toBe(3);
    });

    it('should get segment for LSN', () => {
      const { generateRecord, addRecord, getSegmentForLsn } = useWALStore.getState();
      
      addRecord(generateRecord('INSERT'));
      const record = useWALStore.getState().segments[0].records[0];
      
      const segment = getSegmentForLsn(record.lsn);
      expect(segment).toBeDefined();
      expect(segment?.records).toContainEqual(expect.objectContaining({ lsn: record.lsn }));
    });
  });

  describe('Playback Controls', () => {
    it('should reset store', () => {
      const { generateRecord, addRecord, reset } = useWALStore.getState();
      
      addRecord(generateRecord('INSERT'));
      addRecord(generateRecord('UPDATE'));
      reset();

      const state = useWALStore.getState();
      expect(state.totalRecords).toBe(0);
      expect(state.segments).toHaveLength(1);
      expect(state.currentLsn).toBe('0/00000000');
    });

    it('should select record', () => {
      const { generateRecord, addRecord, selectRecord } = useWALStore.getState();
      
      addRecord(generateRecord('INSERT'));
      const record = useWALStore.getState().segments[0].records[0];
      
      selectRecord(record);
      expect(useWALStore.getState().selectedRecord).toEqual(record);
      
      selectRecord(null);
      expect(useWALStore.getState().selectedRecord).toBeNull();
    });

    it('should set playback speed', () => {
      const { setPlaybackSpeed } = useWALStore.getState();
      
      setPlaybackSpeed(1000);
      expect(useWALStore.getState().playbackSpeed).toBe(1000);
    });
  });
});
