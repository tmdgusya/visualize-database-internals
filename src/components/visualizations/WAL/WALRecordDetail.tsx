import { motion, AnimatePresence } from 'framer-motion';
import { useWALStore, generateXLogHeader, type XLogRecordHeader } from '../../../stores/walStore';
import { FileText, Binary, Clock, Hash, Database, AlertCircle } from 'lucide-react';

// Format bytes as hex dump
function formatHexDump(data: string, bytesPerLine: number = 16): string[] {
  const lines: string[] = [];
  const hexBytes = data.match(/.{1,2}/g) || [];
  
  for (let i = 0; i < hexBytes.length; i += bytesPerLine) {
    const lineBytes = hexBytes.slice(i, i + bytesPerLine);
    const offset = i.toString(16).padStart(4, '0');
    const hex = lineBytes.join(' ').padEnd(bytesPerLine * 3 - 1);
    const ascii = lineBytes
      .map((b) => {
        const charCode = parseInt(b, 16);
        return charCode >= 32 && charCode < 127 ? String.fromCharCode(charCode) : '.';
      })
      .join('');
    lines.push(`${offset}  ${hex}  |${ascii}|`);
  }
  
  return lines;
}

// XLogRecord Header Display
function XLogHeaderDisplay({ header }: { header: XLogRecordHeader }) {
  return (
    <div className="space-y-2">
      <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
        XLogRecord Header (24 bytes)
      </h5>
      <div className="grid grid-cols-1 gap-1 text-xs font-mono">
        <div className="flex justify-between py-1 px-2 bg-gray-100 dark:bg-gray-800 rounded">
          <span className="text-gray-500 dark:text-gray-400">xl_prev (8 bytes)</span>
          <span className="text-blue-600 dark:text-blue-400">{header.xl_prev}</span>
        </div>
        <div className="flex justify-between py-1 px-2 bg-gray-50 dark:bg-gray-800/50 rounded">
          <span className="text-gray-500 dark:text-gray-400">xl_xid (4 bytes)</span>
          <span className="text-green-600 dark:text-green-400">{header.xl_xid}</span>
        </div>
        <div className="flex justify-between py-1 px-2 bg-gray-100 dark:bg-gray-800 rounded">
          <span className="text-gray-500 dark:text-gray-400">xl_tot_len (4 bytes)</span>
          <span className="text-purple-600 dark:text-purple-400">{header.xl_tot_len}</span>
        </div>
        <div className="flex justify-between py-1 px-2 bg-gray-50 dark:bg-gray-800/50 rounded">
          <span className="text-gray-500 dark:text-gray-400">xl_info (1 byte)</span>
          <span className="text-amber-600 dark:text-amber-400">0x{header.xl_info.toString(16).padStart(2, '0')}</span>
        </div>
        <div className="flex justify-between py-1 px-2 bg-gray-100 dark:bg-gray-800 rounded">
          <span className="text-gray-500 dark:text-gray-400">xl_rmid (1 byte)</span>
          <span className="text-red-600 dark:text-red-400">0x{header.xl_rmid.toString(16).padStart(2, '0')}</span>
        </div>
      </div>
    </div>
  );
}

// Binary structure visualization
function BinaryStructure({ record }: { record: { type: string; data: string } }) {
  const headerSize = 24;
  const dataSize = record.data.length / 2;
  const totalSize = headerSize + dataSize;
  
  return (
    <div className="space-y-3">
      <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
        Binary Structure ({totalSize} bytes total)
      </h5>
      
      {/* Visual representation */}
      <div className="relative h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
        {/* Header portion */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(headerSize / totalSize) * 100}%` }}
          className="absolute left-0 top-0 h-full bg-blue-500 flex items-center justify-center"
        >
          <span className="text-[10px] text-white font-medium">Header ({headerSize}B)</span>
        </motion.div>
        
        {/* Data portion */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(dataSize / totalSize) * 100}%` }}
          className="absolute right-0 top-0 h-full bg-green-500 flex items-center justify-center"
        >
          <span className="text-[10px] text-white font-medium">Data ({dataSize}B)</span>
        </motion.div>
      </div>
      
      {/* Legend */}
      <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span className="text-gray-600 dark:text-gray-400">XLogRecord Header</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-gray-600 dark:text-gray-400">Record Data</span>
        </div>
      </div>
    </div>
  );
}

export function WALRecordDetail() {
  const { selectedRecord, segments } = useWALStore();
  
  if (!selectedRecord) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5 text-gray-400" />
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Record Details
          </h4>
        </div>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Select a record from the timeline</p>
          <p className="text-xs mt-1">Click on any WAL record to view details</p>
        </div>
      </div>
    );
  }
  
  const header = generateXLogHeader(selectedRecord);
  const hexDump = formatHexDump(selectedRecord.data.slice(0, 64)); // Limit display
  
  // Find which segment this record belongs to
  const containingSegment = segments.find(
    (s) => s.records.some((r) => r.lsn === selectedRecord.lsn)
  );
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={selectedRecord.lsn}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-500" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Record Details
            </h4>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${
              selectedRecord.type === 'INSERT'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : selectedRecord.type === 'UPDATE'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                : selectedRecord.type === 'DELETE'
                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                : selectedRecord.type === 'COMMIT'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                : selectedRecord.type === 'CHECKPOINT'
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {selectedRecord.type}
          </span>
        </div>
        
        {/* Basic Info */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Hash className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">LSN:</span>
            <span className="font-mono text-gray-900 dark:text-white">{selectedRecord.lsn}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Database className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">XID:</span>
            <span className="font-mono text-gray-900 dark:text-white">{selectedRecord.xid}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">Timestamp:</span>
            <span className="font-mono text-gray-900 dark:text-white">
              {new Date(selectedRecord.timestamp).toLocaleTimeString()}
            </span>
          </div>
          
          {selectedRecord.affectedPage !== undefined && (
            <div className="flex items-center gap-2 text-sm">
              <Database className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">Affected Page:</span>
              <span className="font-mono text-blue-600 dark:text-blue-400">
                {selectedRecord.affectedPage}
              </span>
            </div>
          )}
          
          {containingSegment && (
            <div className="flex items-center gap-2 text-sm">
              <Binary className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">Segment:</span>
              <span className="font-mono text-xs text-gray-900 dark:text-white truncate">
                {containingSegment.name}
              </span>
            </div>
          )}
        </div>
        
        {/* Binary Structure */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
          <BinaryStructure record={selectedRecord} />
        </div>
        
        {/* XLogRecord Header */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
          <XLogHeaderDisplay header={header} />
        </div>
        
        {/* Data Preview */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Data Preview (first 32 bytes)
          </h5>
          <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
            <pre className="text-[10px] font-mono text-green-400">
              {hexDump.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </pre>
          </div>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2">
            {selectedRecord.data.length / 2 > 32 && 
              `... and ${(selectedRecord.data.length / 2 - 32).toLocaleString()} more bytes`}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
