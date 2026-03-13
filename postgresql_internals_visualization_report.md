# PostgreSQL Internals Visualization Learning Platform
## Research Report: Visualization Specifications by Milestone

---

## Milestone 1: Foundation (기초)

### 1.1 Page Structure

#### Key Concepts for Visualization
- **Page Layout (8KB default)**: Header (24 bytes), Line Pointer Array, Free Space, Heap Tuples
- **Page Header Fields**: pd_lsn (WAL reference), pd_checksum, pd_lower/pd_upper (free space boundaries), pd_special
- **Line Pointers (ItemIdData)**: 4-byte pointers to heap tuples, forming a slot array
- **Tuple Identification (TID)**: Block number + Offset number pair
- **Slotted Page Architecture**: Growing line pointer array from top, heap tuples from bottom

#### User Interactions
1. **Interactive Page Explorer**
   - Slider to adjust page size (4KB, 8KB, 16KB, 32KB)
   - Click to add/remove tuples and see line pointer allocation
   - Drag to resize tuples and observe free space changes
   - Hover over header fields to see descriptions

2. **TID Navigation Game**
   - Given a TID (block_number, offset_number), user must locate the tuple
   - Visual feedback showing the path: File → Page → Line Pointer → Tuple

3. **Page Defragmentation Simulator**
   - Show fragmentation after updates/deletes
   - User triggers compaction to see pd_lower/pd_upper changes

#### User-Controllable Inputs
- Page size configuration
- Number and size of tuples to insert
- Update/delete operations to simulate fragmentation
- Header field values (checksum, flags)

#### Expected Visual Outputs
- **2D Block Diagram**: Visual representation of page layout with color-coded regions
- **Memory Map**: Byte-level view showing offsets and boundaries
- **Animation**: Tuple insertion showing line pointer array growth and tuple stacking
- **Fragmentation Heatmap**: Visual indicator of free space holes

---

### 1.2 Buffer Pool (Shared Buffers)

#### Key Concepts for Visualization
- **Buffer Cache Architecture**: Shared memory segment divided into fixed-size buffers
- **Buffer Descriptor**: Buffer ID, page ID (relfilenode, forknum, blocknum), usage count, pin count, dirty flag
- **Clock Sweep Algorithm**: LRU approximation using usage_count and reference bits
- **Buffer States**: Empty, Clean, Dirty, Being Read/Written
- **Buffer Table**: Hash table for fast buffer lookup by page ID

#### User Interactions
1. **Buffer Pool Simulator**
   - Visual grid representing buffer pool (e.g., 100 buffers)
   - Different colors for buffer states
   - Clock hand animation showing sweep algorithm
   - Click on buffer to see descriptor details

2. **Cache Hit/Miss Playground**
   - User enters sequence of page access requests
   - Visual animation showing buffer allocation
   - Statistics: hit rate, miss rate, eviction count

3. **Dirty Page Management**
   - Trigger checkpoints to see dirty page flushing
   - Visualize WAL dependency (pd_lsn) for each dirty page
   - Simulate backend writer activity

#### User-Controllable Inputs
- Buffer pool size (number of buffers)
- Page access pattern (sequential, random, hot spot)
- Clock sweep speed
- Checkpoint frequency
- Write strategy (fsync, async)

#### Expected Visual Outputs
- **Buffer Grid**: Color-coded buffer states (empty=gray, clean=green, dirty=red, pinned=blue)
- **Clock Hand Animation**: Visual sweep through buffers
- **Access Pattern Graph**: Line chart showing hit/miss over time
- **Dirty Page Queue**: Visual queue of pages waiting to be flushed
- **Statistics Dashboard**: Real-time metrics

---

### 1.3 Write-Ahead Logging (WAL)

#### Key Concepts for Visualization
- **WAL Purpose**: Durability, crash recovery, replication foundation
- **LSN (Log Sequence Number)**: Byte offset in WAL stream (XLogRecPtr)
- **WAL Records**: Header (XLogRecord) + data, variable length
- **WAL Segment Files**: 16MB default, named by timeline and LSN
- **WAL Writer Process**: Background process flushing WAL buffers
- **Checkpoint Records**: Full page writes, recovery points

#### User Interactions
1. **WAL Stream Visualizer**
   - Horizontal timeline showing WAL records
   - Zoom in to see individual record structure
   - Filter by record type (INSERT, UPDATE, DELETE, COMMIT, CHECKPOINT)
   - Click record to see binary structure

2. **Crash Recovery Simulator**
   - Simulate a crash at any point
   - Visual replay of REDO operations
   - Show which pages are recovered from WAL
   - Compare with and without full page writes

3. **LSN Tracker**
   - Track LSN progression through operations
   - Show relation between page pd_lsn and WAL records
   - Visualize checkpoint creation and recycling

#### User-Controllable Inputs
- WAL segment size
- Checkpoint interval (time and WAL size based)
- Full page write toggle
- Synchronous commit settings
- Workload type (OLTP vs OLAP)
- Crash point selection

#### Expected Visual Outputs
- **WAL Timeline**: Horizontal scrollable view of WAL records
- **Record Detail View**: Binary breakdown of WAL record fields
- **Recovery Animation**: Step-through of crash recovery process
- **LSN Correlation Map**: Show which WAL records affect which pages
- **Segment File View**: Visual representation of 16MB segments

---

## Milestone 2: Storage & Indexing (중급)

### 2.1 B-Tree Indexes

#### Key Concepts for Visualization
- **B-Tree Structure**: Multi-level tree, root → internal nodes → leaf pages
- **Page Layout in B-Tree**: High keys, item pointers, index tuples
- **Index Tuple Structure**: Index key values + TID pointer to heap tuple
- **B-Tree Operations**: Search, Insert (with splits), Delete (with merges)
- **Deduplication**: Posting lists for duplicate keys (v13+)
- **Bottom-up Deletion**: Marking dead tuples during index scans

#### User Interactions
1. **Interactive B-Tree Builder**
   - Insert keys one by one, watch tree growth
   - Visual split animation when page fills
   - Show tree rebalancing
   - Compare with binary search tree

2. **Index Scan Simulator**
   - Visual path from root to leaf for a given key
   - Show index-only scan vs index + heap access
   - Demonstrate covering index benefits

3. **B-Tree vs Sequential Scan Comparison**
   - Same query, different access methods
   - Visual I/O count comparison
   - Cost model visualization

#### User-Controllable Inputs
- Fanout (order) of B-Tree
- Key insertion sequence (sorted vs random)
- Page fill factor
- Deduplication toggle
- Query range (point query vs range scan)

#### Expected Visual Outputs
- **Tree Diagram**: Hierarchical visualization of B-Tree nodes
- **Page Detail View**: Internal layout of index pages
- **Search Path Animation**: Highlighted path from root to target
- **Split Animation**: Visual demonstration of page splitting
- **I/O Counter**: Blocks read for each operation

---

### 2.2 TOAST (The Oversized-Attribute Storage Technique)

#### Key Concepts for Visualization
- **TOAST Trigger**: Activated when tuple > 2KB (TOAST_TUPLE_THRESHOLD)
- **Storage Strategies**: PLAIN, EXTENDED (default), EXTERNAL, MAIN
- **Compression**: PGLZ or LZ4 compression of large values
- **Out-of-Line Storage**: Chunks stored in separate TOAST table
- **TOAST Table Structure**: chunk_id, chunk_seq, chunk_data
- **Pointer Structure**: 18-byte TOAST pointer in main table

#### User Interactions
1. **TOAST Decision Tree**
   - Input a value size and storage strategy
   - Visual flowchart showing TOAST decision process
   - Show resulting storage layout

2. **Chunk Visualizer**
   - Large value broken into ~2KB chunks
   - Visual representation of chunk distribution
   - Show chunk_id and chunk_seq organization

3. **Storage Strategy Comparison**
   - Same data stored with different strategies
   - Compare space usage and access patterns
   - Show substring operation performance difference

#### User-Controllable Inputs
- Data size (from small to >1GB)
- Storage strategy (PLAIN, EXTENDED, EXTERNAL, MAIN)
- Compression method (PGLZ, LZ4, none)
- TOAST_TUPLE_TARGET setting
- Access pattern (full fetch vs partial)

#### Expected Visual Outputs
- **Decision Flowchart**: Interactive TOAST processing flow
- **Chunk Map**: Visual grid showing chunk distribution
- **Storage Comparison**: Side-by-side space usage
- **Access Path Animation**: Show detoasting process
- **Size Breakdown**: Before/after compression ratios

---

### 2.3 MVCC (Multi-Version Concurrency Control) Basics

#### Key Concepts for Visualization
- **Tuple Header Fields**: xmin (creating transaction), xmax (deleting transaction)
- **Transaction IDs**: 32-bit wraparound, frozen XID
- **Visibility Rules**: Snapshot determines which tuple versions are visible
- **Row Versions**: Multiple versions of same logical row
- **Snapshot Structure**: xmin, xmax, xip_list (in-progress transactions)
- **Commit Log (CLOG)**: Transaction status tracking

#### User Interactions
1. **MVCC Timeline**
   - Horizontal timeline showing concurrent transactions
   - Visual representation of tuple versions
   - Show what each transaction sees at different points

2. **Visibility Calculator**
   - Input: Transaction ID, Snapshot, Tuple (xmin, xmax)
   - Output: Is tuple visible? (YES/NO with explanation)
   - Step-through visibility rules

3. **Version Chain Explorer**
   - Single row with multiple updates
   - Visual chain of tuple versions
   - Show HOT (Heap Only Tuple) updates
   - Demonstrate pointer chasing

#### User-Controllable Inputs
- Number of concurrent transactions
- Transaction isolation level
- Operation sequence (interleaved reads/writes)
- Snapshot timing
- Vacuum timing

#### Expected Visual Outputs
- **Transaction Timeline**: Gantt chart of transaction lifetimes
- **Tuple Version Chain**: Linked list visualization of row versions
- **Visibility Matrix**: Grid showing which versions each tx can see
- **Snapshot Detail**: xmin, xmax, xip_list display
- **CLOG Status**: Transaction status (in-progress, committed, aborted)

---

## Milestone 3: Advanced Internals (고급)

### 3.1 Query Execution

#### Key Concepts for Visualization
- **Query Processing Pipeline**: Parser → Analyzer → Rewriter → Planner → Executor
- **Plan Nodes**: SeqScan, IndexScan, IndexOnlyScan, BitmapScan
- **Plan Tree Structure**: Parent-child relationships between nodes
- **Executor Model**: Pull-based (demand-driven) pipeline
- **Node States**: Not started, In progress, Done
- **Tuple Flow**: Tuples moving up the plan tree

#### User Interactions
1. **Query Plan Animator**
   - Parse SQL and generate plan tree visualization
   - Step-through execution node by node
   - Show tuple flow between nodes
   - Highlight active nodes during execution

2. **Node Type Explorer**
   - Interactive catalog of plan node types
   - Compare SeqScan vs IndexScan vs BitmapScan
   - Show cost calculations for each node

3. **Plan Comparison Tool**
   - Side-by-side comparison of two query plans
   - Highlight differences in node types, costs
   - Show impact of indexes on plan selection

#### User-Controllable Inputs
- SQL query input
- Table statistics (row count, distinct values)
- Available indexes
- Cost parameters (seq_page_cost, random_page_cost, cpu_tuple_cost)
- Work_mem setting

#### Expected Visual Outputs
- **Plan Tree Diagram**: Hierarchical node visualization
- **Execution Animation**: Active node highlighting, tuple flow arrows
- **Cost Breakdown**: Pie/bar chart of cost components
- **Statistics Panel**: Rows in/out, time per node
- **SQL-to-Plan Mapping**: Highlight SQL parts corresponding to plan nodes

---

### 3.2 Join Algorithms

#### Key Concepts for Visualization
- **Nested Loop Join**: Outer table rows × Inner table access, O(N×M)
- **Hash Join**: Build hash table on smaller table, probe with larger
- **Merge Join**: Sort both inputs, merge scan, requires sorted input
- **Join Node Anatomy**: Left/Right child nodes, join condition
- **Memory Usage**: Hash table size, sort buffers
- **Spilling to Disk**: Work_mem exceeded behavior

#### User Interactions
1. **Join Algorithm Playground**
   - Same query, switch between join algorithms
   - Visual comparison of execution strategies
   - Step-through each algorithm's logic

2. **Nested Loop Visualizer**
   - Show outer loop iterating through rows
   - For each outer row, show inner table access
   - Count and display total comparisons
   - Demonstrate index-assisted nested loop

3. **Hash Join Builder**
   - Visual hash table construction (build phase)
   - Hash function demonstration
   - Probe phase with bucket access
   - Show hash collisions and chaining

4. **Merge Join Sorter**
   - Show sorting of both inputs
   - Visual merge process with cursors
   - Demonstrate efficiency of sorted merge

#### User-Controllable Inputs
- Join algorithm selection (Nested Loop, Hash, Merge)
- Table sizes (outer and inner)
- Work_mem setting
- Join selectivity (matching rows percentage)
- Index availability on join columns
- Data distribution (sorted vs random)

#### Expected Visual Outputs
- **Algorithm Animation**: Step-by-step execution visualization
- **Comparison Dashboard**: Side-by-side metrics (time, I/O, memory)
- **Hash Table View**: Bucket visualization with collision chains
- **Merge Cursors**: Dual cursor tracking during merge
- **Performance Graph**: Cost vs table size for each algorithm

---

### 3.3 VACUUM

#### Key Concepts for Visualization
- **Dead Tuples**: Rows deleted or updated (old versions)
- **Table Bloat**: Accumulation of dead tuples increasing table size
- **VACUUM Process**: Scan table, remove dead tuples, update FSM/VM
- **VACUUM FULL**: Complete table rewrite with compaction
- **Autovacuum**: Automatic vacuum triggering based on thresholds
- **Freeze**: Marking old tuples with frozen XID to prevent wraparound
- **Visibility Map (VM)**: All-visible/all-frozen page tracking

#### User Interactions
1. **VACUUM Simulator**
   - Table with accumulating dead tuples over time
   - Trigger VACUUM and watch cleanup process
   - Show before/after space usage
   - Visualize FSM and VM updates

2. **Dead Tuple Accumulator**
   - Run simulated workload (inserts, updates, deletes)
   - Watch dead tuple count grow
   - Show impact on table size and query performance
   - Demonstrate autovacuum triggering

3. **Transaction ID Wraparound Visualizer**
   - Circular XID space visualization
   - Show freeze process preventing wraparound
   - Demonstrate urgency levels (multixact warning, shutdown)

#### User-Controllable Inputs
- Workload mix (INSERT/UPDATE/DELETE ratio)
- Table size and row count
- Autovacuum thresholds (autovacuum_vacuum_threshold, scale_factor)
- Vacuum cost limits (vacuum_cost_limit, delay)
- Freeze age settings
- VACUUM vs VACUUM FULL selection

#### Expected Visual Outputs
- **Table Space Visualization**: Live/dead tuple distribution
- **VACUUM Progress Animation**: Scanning, cleaning, updating maps
- **Bloat Gauge**: Visual indicator of table bloat percentage
- **XID Circle**: Circular visualization of XID space with freeze points
- **Autovacuum Trigger Graph**: Show when autovacuum fires
- **Performance Impact Chart**: Query slowdown as bloat increases

---

## Milestone 4: Integration (통합)

### 4.1 End-to-End Query Flow

#### Key Concepts for Visualization
- **Complete Pipeline**: SQL → Parse Tree → Query Tree → Plan Tree → Execution → Results
- **Frontend/Backend Protocol**: Query/Result message flow
- **Catalog Access**: pg_class, pg_attribute, pg_statistic usage
- **Statistics Collection**: ANALYZE, histograms, correlation
- **Parallel Query**: Gather nodes, background workers

#### User Interactions
1. **Query Journey Mapper**
   - Input any SQL query
   - Visual journey through all processing stages
   - Click each stage to see transformation details
   - Side-by-side SQL and internal representation

2. **PostgreSQL Architecture Explorer**
   - Interactive diagram of PostgreSQL processes
   - Show postmaster, backends, background writers
   - Demonstrate shared memory access
   - IPC and lock visualization

3. **Statistics Impact Analyzer**
   - Show how ANALYZE affects query plans
   - Demonstrate importance of up-to-date statistics
   - Visualize histograms and selectivity estimation

#### User-Controllable Inputs
- SQL query complexity (simple SELECT to complex JOINs)
- Statistics freshness (stale vs current)
- Parallel worker count
- Connection pooling settings
- Workload concurrency

#### Expected Visual Outputs
- **Pipeline Flowchart**: End-to-end query processing stages
- **Process Diagram**: PostgreSQL architecture with data flow
- **Transformation Views**: Parse tree → Query tree → Plan tree
- **Statistics Visualizations**: Histograms, MCV lists
- **Timing Breakdown**: Time spent in each stage

---

### 4.2 Performance Playground

#### Key Concepts for Visualization
- **EXPLAIN ANALYZE**: Actual vs estimated rows, timing
- **Buffer Statistics**: Shared hit, shared read, local hit, local read
- **I/O Patterns**: Sequential vs random access
- **Memory Usage**: Work_mem, shared_buffers, temp files
- **Lock Waits**: Contention visualization
- **Index Effectiveness**: Index usage statistics

#### User Interactions
1. **Query Optimizer Sandbox**
   - Design tables, indexes, and queries
   - See real-time EXPLAIN output
   - Toggle indexes and see plan changes
   - Adjust parameters and observe impact

2. **Bottleneck Identifier**
   - Visual highlighting of expensive plan nodes
   - Color-coded by actual time percentage
   - Buffer usage heatmap
   - I/O pattern analysis

3. **What-If Analysis**
   - Change table sizes, see plan changes
   - Simulate adding indexes
   - Adjust PostgreSQL parameters
   - Predict performance impact

4. **Workload Simulator**
   - Mix of OLTP and OLAP queries
   - Visualize contention and lock waits
   - Buffer cache behavior under load
   - Connection pool saturation

#### User-Controllable Inputs
- Table schema designer (columns, types, constraints)
- Index designer (B-Tree, Hash, GiST, GIN)
- Query workload (read-heavy, write-heavy, mixed)
- PostgreSQL configuration (shared_buffers, work_mem, etc.)
- Concurrency level (number of simultaneous connections)
- Data distribution (uniform, skewed, correlated)

#### Expected Visual Outputs
- **Flame Graph**: Time spent in each plan node
- **Buffer Heatmap**: Page access frequency visualization
- **I/O Monitor**: Sequential vs random read graphs
- **Lock Wait Graph**: Visualization of blocking relationships
- **Performance Dashboard**: Real-time metrics (TPS, latency, hit ratio)
- **Plan Evolution Timeline**: How plans change with data growth

---

## Summary Table: Visualization Modules

| Module | Core Visual | Interactions | Key Metrics |
|--------|-------------|--------------|-------------|
| Page Structure | 2D block diagram | Add/remove tuples, defrag | Free space, fragmentation % |
| Buffer Pool | Buffer grid with clock hand | Access pattern input | Hit ratio, eviction rate |
| WAL | Timeline with records | Crash recovery sim | LSN progression, segment count |
| B-Tree | Hierarchical tree | Insert/delete keys | Tree height, node splits |
| TOAST | Decision flowchart | Strategy comparison | Compression ratio, chunk count |
| MVCC | Transaction timeline | Visibility calculator | Version count, snapshot age |
| Query Execution | Plan tree | Step-through execution | Rows in/out, node time |
| Join Algorithms | Algorithm animation | Algorithm switcher | Comparisons, memory usage |
| VACUUM | Table space view | Trigger vacuum | Dead tuple %, bloat factor |
| End-to-End Flow | Pipeline diagram | Stage drill-down | Stage timing |
| Performance Playground | Flame graph + heatmap | What-if analysis | TPS, latency, hit ratio |

---

## Recommended Implementation Priority

### Phase 1: Core Storage (Foundation)
1. Page Structure Explorer
2. Buffer Pool Simulator
3. WAL Timeline Visualizer

### Phase 2: Access Methods (Storage & Indexing)
4. B-Tree Interactive Builder
5. TOAST Decision Visualizer
6. MVCC Timeline

### Phase 3: Query Processing (Advanced)
7. Query Plan Animator
8. Join Algorithm Playground
9. VACUUM Simulator

### Phase 4: Integration
10. End-to-End Query Flow
11. Performance Playground Dashboard

---

*Report compiled from PostgreSQL official documentation, InterDB internals book, and community resources.*
