// PostgreSQL Page Structure Types

export type PageSize = 4096 | 8192 | 16384 | 32768;

export interface PageHeader {
  pd_lsn: string;        // WAL reference
  pd_checksum: number;
  pd_flags: number;
  pd_lower: number;      // offset to start of free space
  pd_upper: number;      // offset to end of free space
  pd_special: number;    // offset to start of special space
  pd_pagesize_version: number;
  pd_prune_xid: number;
}

export interface LinePointer {
  offset: number;
  length: number;
  flags: number;
}

export interface Tuple {
  id: number;
  data: string;
  length: number;
  t_xmin: number;        // creating transaction
  t_xmax: number;        // deleting transaction
  t_cid: number;         // command id
  t_ctid: [number, number]; // current TID
}

export interface Page {
  size: PageSize;
  header: PageHeader;
  linePointers: LinePointer[];
  tuples: Tuple[];
}

// Buffer Pool Types

export type BufferState = 'empty' | 'clean' | 'dirty' | 'pinned';

export interface BufferDescriptor {
  bufferId: number;
  relfilenode: number;
  forknum: number;
  blocknum: number;
  usageCount: number;
  pinCount: number;
  isDirty: boolean;
  state: BufferState;
}

export interface BufferPool {
  size: number;
  buffers: BufferDescriptor[];
  clockHand: number;
}

// WAL Types

export type WALRecordType = 'INSERT' | 'UPDATE' | 'DELETE' | 'COMMIT' | 'CHECKPOINT' | 'ABORT';

export interface WALRecord {
  lsn: string;
  type: WALRecordType;
  xid: number;
  data: Uint8Array;
  timestamp: number;
}

export interface WALSegment {
  name: string;
  startLsn: string;
  endLsn: string;
  records: WALRecord[];
}

// B-Tree Types

export interface BTreeNode {
  id: string;
  keys: number[];
  children: string[];
  isLeaf: boolean;
  parent?: string;
  next?: string;         // for leaf nodes
}

export interface BTree {
  rootId: string;
  nodes: Map<string, BTreeNode>;
  order: number;
}

// MVCC Types

export type TransactionStatus = 'in_progress' | 'committed' | 'aborted';

export interface Transaction {
  xid: number;
  startTime: number;
  endTime?: number;
  status: TransactionStatus;
}

export interface Snapshot {
  xmin: number;
  xmax: number;
  xipList: number[];     // in-progress transactions
}

// Query Plan Types

export type PlanNodeType = 'SeqScan' | 'IndexScan' | 'IndexOnlyScan' | 'BitmapScan' | 'NestedLoop' | 'HashJoin' | 'MergeJoin' | 'Sort' | 'Aggregate';

export interface PlanNode {
  id: string;
  type: PlanNodeType;
  table?: string;
  index?: string;
  condition?: string;
  children: PlanNode[];
  cost: {
    startup: number;
    total: number;
  };
  rows: number;
  width: number;
}

// Utility Types

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
