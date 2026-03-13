import { create } from 'zustand';

// WAL Record Types
export type WALRecordType = 'INSERT' | 'UPDATE' | 'DELETE' | 'COMMIT' | 'CHECKPOINT' | 'ABORT';

// WAL Record Structure
export interface WALRecord {
  lsn: string;           // LSN format: "0/00000000" (timeline/offset)
  type: WALRecordType;
  xid: number;           // Transaction ID
  data: string;          // Record data (hex string for visualization)
  timestamp: number;     // Unix timestamp
  affectedPage?: number; // Affected page number
}

// XLogRecord Header (simplified representation)
export interface XLogRecordHeader {
  xl_prev: string;       // Previous record LSN (8 bytes)
  xl_xid: number;        // Transaction ID (4 bytes)
  xl_tot_len: number;    // Total length (4 bytes)
  xl_info: number;       // Info flags (1 byte)
  xl_rmid: number;       // Resource manager ID (1 byte)
}

// WAL Segment (16MB file)
export interface WALSegment {
  name: string;          // Segment filename: 000000010000000000000000
  timeline: number;      // Timeline ID
  startLsn: string;      // Start LSN of segment
  endLsn: string;        // End LSN of segment
  records: WALRecord[];
}

// Recovery operation for crash recovery visualization
export interface RecoveryOperation {
  id: number;
  lsn: string;
  type: 'REDO' | 'SKIP';
  description: string;
  affectedPage?: number;
  applied: boolean;
}

// Workload pattern types
export type WorkloadPattern = 'OLTP' | 'OLAP' | 'MIXED';

// WAL Store State
export interface WALState {
  // Segments
  segments: WALSegment[];
  
  // Current position
  currentLsn: string;
  currentXid: number;
  
  // Playback state
  isPlaying: boolean;
  playbackSpeed: number;  // ms between steps
  currentRecordIndex: number;
  
  // Crash recovery
  crashPointLsn: string | null;
  isInRecovery: boolean;
  recoveryOperations: RecoveryOperation[];
  recoveredPages: number[];
  
  // Selection
  selectedRecord: WALRecord | null;
  
  // Statistics
  totalRecords: number;
  recordsByType: Record<WALRecordType, number>;
}

// WAL Store Actions
export interface WALActions {
  // Record generation
  generateRecord: (type: WALRecordType, xid?: number, affectedPage?: number, data?: string) => WALRecord;
  addRecord: (record: WALRecord) => void;
  
  // Workload generation
  generateWorkload: (count: number, pattern?: WorkloadPattern) => void;
  
  // Crash recovery
  crashAt: (lsn: string) => void;
  recover: () => void;
  clearCrashPoint: () => void;
  
  // Playback controls
  step: () => void;
  play: () => void;
  pause: () => void;
  setPlaybackSpeed: (speed: number) => void;
  reset: () => void;
  
  // Selection
  selectRecord: (record: WALRecord | null) => void;
  
  // Computed helpers
  getCurrentSegment: () => WALSegment | null;
  getRecordByLsn: (lsn: string) => WALRecord | undefined;
  getRecordsInRange: (startLsn: string, endLsn: string) => WALRecord[];
  compareLsn: (lsn1: string, lsn2: string) => number;
  getSegmentForLsn: (lsn: string) => WALSegment | null;
}

// Constants
const SEGMENT_SIZE = 16 * 1024 * 1024; // 16MB

// Initial LSN
const INITIAL_LSN = '0/00000000';

// Helper: Parse LSN string to numeric value for comparison
export function parseLsn(lsn: string): { timeline: number; offset: number } {
  const [timeline, offset] = lsn.split('/');
  return {
    timeline: parseInt(timeline, 10),
    offset: parseInt(offset, 16),
  };
}

// Helper: Format offset to LSN string
export function formatLsn(timeline: number, offset: number): string {
  return `${timeline}/${offset.toString(16).padStart(8, '0')}`;
}

// Helper: Compare two LSNs
// Returns: negative if lsn1 < lsn2, 0 if equal, positive if lsn1 > lsn2
export function compareLsn(lsn1: string, lsn2: string): number {
  const parsed1 = parseLsn(lsn1);
  const parsed2 = parseLsn(lsn2);
  
  if (parsed1.timeline !== parsed2.timeline) {
    return parsed1.timeline - parsed2.timeline;
  }
  return parsed1.offset - parsed2.offset;
}

// Helper: Add bytes to LSN
export function addToLsn(lsn: string, bytes: number): string {
  const parsed = parseLsn(lsn);
  const newOffset = parsed.offset + bytes;
  return formatLsn(parsed.timeline, newOffset);
}

// Helper: Get segment name from LSN
export function getSegmentName(lsn: string, timeline: number = 1): string {
  const parsed = parseLsn(lsn);
  const segmentNumber = Math.floor(parsed.offset / SEGMENT_SIZE);
  const highBits = Math.floor(segmentNumber / 0x100);
  const lowBits = segmentNumber % 0x100;
  return `${timeline.toString().padStart(8, '0')}${highBits.toString(16).padStart(8, '0')}${lowBits.toString(16).padStart(8, '0')}`;
}

// Helper: Get segment start LSN
export function getSegmentStartLsn(lsn: string): string {
  const parsed = parseLsn(lsn);
  const segmentStartOffset = Math.floor(parsed.offset / SEGMENT_SIZE) * SEGMENT_SIZE;
  return formatLsn(parsed.timeline, segmentStartOffset);
}

// Helper: Generate XLogRecord header visualization
export function generateXLogHeader(record: WALRecord): XLogRecordHeader {
  // Simplified header generation for visualization
  const baseLength = 24; // XLogRecord header size
  const dataLength = record.data.length / 2; // hex string to bytes
  
  return {
    xl_prev: addToLsn(record.lsn, -(baseLength + dataLength)),
    xl_xid: record.xid,
    xl_tot_len: baseLength + dataLength,
    xl_info: getRecordTypeInfo(record.type),
    xl_rmid: getResourceManagerId(record.type),
  };
}

function getRecordTypeInfo(type: WALRecordType): number {
  const infoMap: Record<WALRecordType, number> = {
    'INSERT': 0x00,
    'UPDATE': 0x10,
    'DELETE': 0x20,
    'COMMIT': 0x00,
    'CHECKPOINT': 0x00,
    'ABORT': 0x00,
  };
  return infoMap[type] || 0x00;
}

function getResourceManagerId(type: WALRecordType): number {
  const rmidMap: Record<WALRecordType, number> = {
    'INSERT': 0x01,  // RM_HEAP_ID
    'UPDATE': 0x01,
    'DELETE': 0x01,
    'COMMIT': 0x10,  // RM_XACT_ID
    'CHECKPOINT': 0x11, // RM_XLOG_ID
    'ABORT': 0x10,
  };
  return rmidMap[type] || 0x00;
}

// Helper: Generate random hex data
function generateRandomData(length: number): string {
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper: Generate sample data based on record type
function generateRecordData(type: WALRecordType, affectedPage?: number): string {
  switch (type) {
    case 'INSERT':
      return `INSERT INTO table_page_${affectedPage || 0} (id, data) VALUES (${Math.floor(Math.random() * 1000)}, '${generateRandomData(20)}')`;
    case 'UPDATE':
      return `UPDATE table_page_${affectedPage || 0} SET data = '${generateRandomData(20)}' WHERE id = ${Math.floor(Math.random() * 1000)}`;
    case 'DELETE':
      return `DELETE FROM table_page_${affectedPage || 0} WHERE id = ${Math.floor(Math.random() * 1000)}`;
    case 'COMMIT':
      return `COMMIT TRANSACTION`;
    case 'CHECKPOINT':
      return `CHECKPOINT: Flushing buffers to disk`;
    case 'ABORT':
      return `ABORT TRANSACTION`;
    default:
      return '';
  }
}

// Create initial segment
function createInitialSegment(): WALSegment {
  return {
    name: getSegmentName(INITIAL_LSN),
    timeline: 1,
    startLsn: INITIAL_LSN,
    endLsn: formatLsn(0, SEGMENT_SIZE),
    records: [],
  };
}

// Calculate record size (simplified)
function getRecordSize(type: WALRecordType): number {
  const baseSize = 24; // XLogRecord header
  const dataSizes: Record<WALRecordType, number> = {
    'INSERT': 64,
    'UPDATE': 72,
    'DELETE': 40,
    'COMMIT': 32,
    'CHECKPOINT': 104,
    'ABORT': 32,
  };
  return baseSize + dataSizes[type];
}

// Initial state
const initialState: WALState = {
  segments: [createInitialSegment()],
  currentLsn: INITIAL_LSN,
  currentXid: 100,
  isPlaying: false,
  playbackSpeed: 500,
  currentRecordIndex: 0,
  crashPointLsn: null,
  isInRecovery: false,
  recoveryOperations: [],
  recoveredPages: [],
  selectedRecord: null,
  totalRecords: 0,
  recordsByType: {
    INSERT: 0,
    UPDATE: 0,
    DELETE: 0,
    COMMIT: 0,
    CHECKPOINT: 0,
    ABORT: 0,
  },
};

// Create the store
export const useWALStore = create<WALState & WALActions>((set, get) => ({
  ...initialState,

  // Generate a new WAL record
  generateRecord: (type, xid, affectedPage, data) => {
    const state = get();
    const record: WALRecord = {
      lsn: state.currentLsn,
      type,
      xid: xid ?? state.currentXid,
      data: data ?? generateRecordData(type, affectedPage),
      timestamp: Date.now(),
      affectedPage,
    };
    return record;
  },

  // Add a record to the WAL
  addRecord: (record) => {
    set((state) => {
      const recordSize = getRecordSize(record.type);
      const newLsn = addToLsn(state.currentLsn, recordSize);
      
      // Check if we need a new segment
      const currentSegment = state.segments[state.segments.length - 1];
      const segmentEndLsn = formatLsn(parseLsn(currentSegment.startLsn).timeline, SEGMENT_SIZE);
      
      let newSegments = [...state.segments];
      let targetSegment = currentSegment;
      
      if (compareLsn(newLsn, segmentEndLsn) > 0) {
        // Create new segment
        const newSegmentStartLsn = formatLsn(parseLsn(currentSegment.startLsn).timeline, 
          Math.floor(parseLsn(newLsn).offset / SEGMENT_SIZE) * SEGMENT_SIZE);
        const newSegment: WALSegment = {
          name: getSegmentName(newSegmentStartLsn),
          timeline: currentSegment.timeline,
          startLsn: newSegmentStartLsn,
          endLsn: formatLsn(parseLsn(newSegmentStartLsn).timeline, 
            parseLsn(newSegmentStartLsn).offset + SEGMENT_SIZE),
          records: [],
        };
        newSegments = [...newSegments, newSegment];
        targetSegment = newSegment;
      }
      
      // Add record to target segment
      const segmentIndex = newSegments.findIndex(s => s.name === targetSegment.name);
      newSegments[segmentIndex] = {
        ...targetSegment,
        records: [...targetSegment.records, record],
        endLsn: newLsn,
      };
      
      // Update type counts
      const newRecordsByType = {
        ...state.recordsByType,
        [record.type]: state.recordsByType[record.type] + 1,
      };
      
      return {
        segments: newSegments,
        currentLsn: newLsn,
        totalRecords: state.totalRecords + 1,
        recordsByType: newRecordsByType,
      };
    });
  },

  // Generate workload
  generateWorkload: (count, pattern = 'MIXED') => {
    const { generateRecord, addRecord } = get();
    
    const patterns: Record<WorkloadPattern, WALRecordType[]> = {
      OLTP: ['INSERT', 'INSERT', 'INSERT', 'UPDATE', 'COMMIT', 'INSERT', 'DELETE', 'COMMIT'],
      OLAP: ['INSERT', 'INSERT', 'INSERT', 'INSERT', 'INSERT', 'INSERT', 'INSERT', 'CHECKPOINT'],
      MIXED: ['INSERT', 'UPDATE', 'INSERT', 'DELETE', 'COMMIT', 'CHECKPOINT', 'INSERT', 'ABORT'],
    };
    
    const typePattern = patterns[pattern];
    let currentXid = get().currentXid;
    
    for (let i = 0; i < count; i++) {
      const type = typePattern[i % typePattern.length];
      
      // Start new transaction for certain operations
      if (type === 'INSERT' && Math.random() > 0.7) {
        currentXid++;
      }
      
      const affectedPage = Math.floor(Math.random() * 100);
      const record = generateRecord(type, currentXid, affectedPage);
      addRecord(record);
    }
    
    set({ currentXid });
  },

  // Set crash point
  crashAt: (lsn) => {
    set({ 
      crashPointLsn: lsn,
      isInRecovery: true,
    });
  },

  // Clear crash point
  clearCrashPoint: () => {
    set({
      crashPointLsn: null,
      isInRecovery: false,
      recoveryOperations: [],
      recoveredPages: [],
    });
  },

  // Perform REDO recovery
  recover: () => {
    const state = get();
    if (!state.crashPointLsn) return;
    
    const operations: RecoveryOperation[] = [];
    const recoveredPages: number[] = [];
    let opId = 0;
    
    // Find the checkpoint before crash point
    let checkpointLsn = INITIAL_LSN;
    for (const segment of state.segments) {
      for (const record of segment.records) {
        if (compareLsn(record.lsn, state.crashPointLsn) >= 0) break;
        if (record.type === 'CHECKPOINT') {
          checkpointLsn = record.lsn;
        }
      }
    }
    
    // REDO: Replay all records from checkpoint to crash point
    for (const segment of state.segments) {
      for (const record of segment.records) {
        const recordLsnCompare = compareLsn(record.lsn, state.crashPointLsn);
        
        if (recordLsnCompare >= 0) {
          // Beyond crash point, stop
          break;
        }
        
        if (compareLsn(record.lsn, checkpointLsn) >= 0) {
          // This record needs to be checked for REDO
          const needsRedo = record.type !== 'ABORT' && record.type !== 'CHECKPOINT';
          
          operations.push({
            id: opId++,
            lsn: record.lsn,
            type: needsRedo ? 'REDO' : 'SKIP',
            description: `${record.type} record at ${record.lsn} (xid: ${record.xid})`,
            affectedPage: record.affectedPage,
            applied: needsRedo,
          });
          
          if (needsRedo && record.affectedPage !== undefined) {
            if (!recoveredPages.includes(record.affectedPage)) {
              recoveredPages.push(record.affectedPage);
            }
          }
        }
      }
    }
    
    set({
      recoveryOperations: operations,
      recoveredPages,
      isInRecovery: false,
    });
  },

  // Playback controls
  step: () => {
    set((state) => {
      const allRecords = state.segments.flatMap(s => s.records);
      const nextIndex = state.currentRecordIndex + 1;
      
      if (nextIndex < allRecords.length) {
        return { currentRecordIndex: nextIndex };
      }
      return { isPlaying: false };
    });
  },

  play: () => {
    set({ isPlaying: true });
    
    const playLoop = () => {
      const state = get();
      if (!state.isPlaying) return;
      
      const allRecords = state.segments.flatMap(s => s.records);
      if (state.currentRecordIndex >= allRecords.length - 1) {
        set({ isPlaying: false });
        return;
      }
      
      state.step();
      
      setTimeout(playLoop, state.playbackSpeed);
    };
    
    setTimeout(playLoop, get().playbackSpeed);
  },

  pause: () => {
    set({ isPlaying: false });
  },

  setPlaybackSpeed: (speed) => {
    set({ playbackSpeed: speed });
  },

  reset: () => {
    set({
      ...initialState,
      segments: [createInitialSegment()],
    });
  },

  // Selection
  selectRecord: (record) => {
    set({ selectedRecord: record });
  },

  // Computed helpers
  getCurrentSegment: () => {
    const state = get();
    return state.segments[state.segments.length - 1] || null;
  },

  getRecordByLsn: (lsn) => {
    const state = get();
    for (const segment of state.segments) {
      const record = segment.records.find(r => r.lsn === lsn);
      if (record) return record;
    }
    return undefined;
  },

  getRecordsInRange: (startLsn, endLsn) => {
    const state = get();
    const records: WALRecord[] = [];
    
    for (const segment of state.segments) {
      for (const record of segment.records) {
        if (compareLsn(record.lsn, startLsn) >= 0 && compareLsn(record.lsn, endLsn) <= 0) {
          records.push(record);
        }
      }
    }
    
    return records;
  },

  compareLsn,

  getSegmentForLsn: (lsn) => {
    const state = get();
    return state.segments.find(s => 
      compareLsn(lsn, s.startLsn) >= 0 && compareLsn(lsn, s.endLsn) < 0
    ) || null;
  },
}));

export default useWALStore;
