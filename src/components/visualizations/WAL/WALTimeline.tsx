import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWALStore, type WALRecord, type WALRecordType } from '../../../stores/walStore';
import { ZoomIn, ZoomOut, AlertTriangle } from 'lucide-react';

// Color mapping for record types
const typeColors: Record<WALRecordType, { bg: string; border: string; text: string; darkBg: string; darkBorder: string; darkText: string }> = {
  INSERT: {
    bg: 'bg-green-100',
    border: 'border-green-300',
    text: 'text-green-800',
    darkBg: 'dark:bg-green-900/30',
    darkBorder: 'dark:border-green-700',
    darkText: 'dark:text-green-300',
  },
  UPDATE: {
    bg: 'bg-yellow-100',
    border: 'border-yellow-300',
    text: 'text-yellow-800',
    darkBg: 'dark:bg-yellow-900/30',
    darkBorder: 'dark:border-yellow-700',
    darkText: 'dark:text-yellow-300',
  },
  DELETE: {
    bg: 'bg-red-100',
    border: 'border-red-300',
    text: 'text-red-800',
    darkBg: 'dark:bg-red-900/30',
    darkBorder: 'dark:border-red-700',
    darkText: 'dark:text-red-300',
  },
  COMMIT: {
    bg: 'bg-blue-100',
    border: 'border-blue-300',
    text: 'text-blue-800',
    darkBg: 'dark:bg-blue-900/30',
    darkBorder: 'dark:border-blue-700',
    darkText: 'dark:text-blue-300',
  },
  CHECKPOINT: {
    bg: 'bg-purple-100',
    border: 'border-purple-300',
    text: 'text-purple-800',
    darkBg: 'dark:bg-purple-900/30',
    darkBorder: 'dark:border-purple-700',
    darkText: 'dark:text-purple-300',
  },
  ABORT: {
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    text: 'text-gray-800',
    darkBg: 'dark:bg-gray-700/50',
    darkBorder: 'dark:border-gray-600',
    darkText: 'dark:text-gray-300',
  },
};

// Record card component
function RecordCard({
  record,
  isSelected,
  isCrashPoint,
  onClick,
  zoom,
}: {
  record: WALRecord;
  isSelected: boolean;
  isCrashPoint: boolean;
  onClick: () => void;
  zoom: number;
}) {
  const colors = typeColors[record.type];
  const width = Math.max(80, 120 * zoom);
  const height = Math.max(40, 60 * zoom);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      onClick={onClick}
      className={`
        relative flex-shrink-0 rounded-lg border-2 cursor-pointer transition-all
        ${colors.bg} ${colors.border} ${colors.text}
        ${colors.darkBg} ${colors.darkBorder} ${colors.darkText}
        ${isSelected ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-gray-800' : ''}
        ${isCrashPoint ? 'ring-2 ring-red-500 ring-offset-2 dark:ring-offset-gray-800' : ''}
      `}
      style={{ width, minHeight: height }}
    >
      {/* Crash indicator */}
      {isCrashPoint && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
        </div>
      )}

      <div className="p-2 flex flex-col h-full justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold">{record.type}</span>
          <span className="text-[10px] font-mono opacity-75">xid:{record.xid}</span>
        </div>
        <div className="text-[10px] font-mono truncate opacity-75">{record.lsn}</div>
        {zoom > 0.8 && record.affectedPage !== undefined && (
          <div className="text-[10px] opacity-60">Page {record.affectedPage}</div>
        )}
      </div>
    </motion.div>
  );
}

// Segment marker component
function SegmentMarker({ segment }: { segment: { name: string; startLsn: string } }) {
  return (
    <div className="flex flex-col items-center border-l-2 border-gray-300 dark:border-gray-600 pl-2 ml-2">
      <div className="text-xs font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">
        {segment.name.slice(0, 8)}...{segment.name.slice(-8)}
      </div>
      <div className="text-[10px] text-gray-400 dark:text-gray-500">{segment.startLsn}</div>
    </div>
  );
}

export function WALTimeline() {
  const {
    segments,
    selectedRecord,
    crashPointLsn,
    selectRecord,
  } = useWALStore();

  const [zoom, setZoom] = useState(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to end when new records are added
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [segments]);

  // Flatten all records from all segments
  const allRecords = segments.flatMap((segment) =>
    segment.records.map((record) => ({
      ...record,
      segmentName: segment.name,
    }))
  );

  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.2, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z / 1.2, 0.5));

  // Group records by segment for display
  const recordsBySegment = segments.map((segment) => ({
    segment,
    records: segment.records,
  }));

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          WAL Timeline
        </h4>
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(typeColors) as WALRecordType[]).map((type) => {
          const colors = typeColors[type];
          return (
            <div
              key={type}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${colors.bg} ${colors.text} ${colors.darkBg} ${colors.darkText}`}
            >
              <div className={`w-2 h-2 rounded-full ${colors.bg.replace('bg-', 'bg-').replace('100', '500')}`} />
              {type}
            </div>
          );
        })}
      </div>

      {/* Timeline */}
      {allRecords.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-sm">No WAL records yet</p>
          <p className="text-xs mt-1">Generate a workload to see records</p>
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto pb-4"
          style={{ scrollbarWidth: 'thin' }}
        >
          <div className="flex items-start gap-1 min-w-max">
            {recordsBySegment.map(({ segment, records }) => (
              <div key={segment.name} className="flex items-start">
                {/* Segment marker */}
                <SegmentMarker segment={segment} />

                {/* Records in segment */}
                <div className="flex gap-1 ml-2">
                  {records.map((record) => (
                    <RecordCard
                      key={record.lsn}
                      record={record}
                      isSelected={selectedRecord?.lsn === record.lsn}
                      isCrashPoint={crashPointLsn === record.lsn}
                      onClick={() => selectRecord(record)}
                      zoom={zoom}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Timeline axis */}
          <div className="mt-4 border-t border-gray-300 dark:border-gray-600 pt-2">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 font-mono">
              <span>{segments[0]?.startLsn || '0/00000000'}</span>
              {segments.length > 1 && (
                <span>...{segments.length} segments...</span>
              )}
              <span>{segments[segments.length - 1]?.endLsn || '0/00000000'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      {allRecords.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
            {(Object.keys(typeColors) as WALRecordType[]).map((type) => {
              const count = allRecords.filter((r) => r.type === type).length;
              return (
                <div key={type} className="text-center">
                  <div className="text-gray-500 dark:text-gray-400">{type}</div>
                  <div className="font-mono font-medium text-gray-900 dark:text-white">{count}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
