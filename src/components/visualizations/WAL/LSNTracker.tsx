import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useWALStore, parseLsn, formatLsn, compareLsn } from '../../../stores/walStore';
import { Activity, ArrowRight, Layers } from 'lucide-react';

// Constants
const SEGMENT_SIZE = 16 * 1024 * 1024; // 16MB

// Format bytes to human readable
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// LSN Progress Bar Component
function LSNProgressBar({
  currentLsn,
  segments,
  selectedRecord,
}: {
  currentLsn: string;
  segments: { name: string; startLsn: string; endLsn: string }[];
  selectedRecord: { lsn: string } | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const currentParsed = parseLsn(currentLsn);
  const totalBytes = Math.max(SEGMENT_SIZE, currentParsed.offset);
  const progressPercent = (currentParsed.offset / totalBytes) * 100;

  // Calculate segment boundaries
  const segmentBoundaries = segments.map((seg) => {
    const startParsed = parseLsn(seg.startLsn);
    const endParsed = parseLsn(seg.endLsn);
    return {
      name: seg.name,
      startPercent: (startParsed.offset / totalBytes) * 100,
      endPercent: (endParsed.offset / totalBytes) * 100,
    };
  });

  // Selected record position
  const selectedPercent = selectedRecord
    ? (parseLsn(selectedRecord.lsn).offset / totalBytes) * 100
    : null;

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Main Progress Bar */}
      <div className="relative h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
        {/* Segment backgrounds */}
        {segmentBoundaries.map((seg, index) => (
          <div
            key={seg.name}
            className={`absolute top-0 h-full ${
              index % 2 === 0
                ? 'bg-gray-100 dark:bg-gray-600/30'
                : 'bg-gray-50 dark:bg-gray-600/10'
            }`}
            style={{
              left: `${seg.startPercent}%`,
              width: `${seg.endPercent - seg.startPercent}%`,
            }}
            title={`Segment ${seg.name}`}
          />
        ))}

        {/* Progress fill */}
        <motion.div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-500 to-purple-600"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.3 }}
        />

        {/* Selected record marker */}
        {selectedPercent !== null && (
          <motion.div
            className="absolute top-0 h-full w-0.5 bg-yellow-400 z-10"
            style={{ left: `${selectedPercent}%` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-yellow-400 rounded-full" />
          </motion.div>
        )}

        {/* Percentage label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 px-2 py-0.5 rounded">
            {progressPercent.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-purple-500" />
          <span className="text-gray-600 dark:text-gray-400">Current LSN</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-yellow-400" />
          <span className="text-gray-600 dark:text-gray-400">Selected Record</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-600" />
          <span className="text-gray-600 dark:text-gray-400">Segment Boundary</span>
        </div>
      </div>

      {/* Segment markers */}
      <div className="relative h-6">
        {segmentBoundaries.map((seg) => (
          <div
            key={seg.name}
            className="absolute top-0 transform -translate-x-1/2"
            style={{ left: `${seg.startPercent}%` }}
          >
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-2 bg-gray-400" />
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                {seg.name.slice(-8)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// LSN Value Display
function LSNValueDisplay({
  label,
  lsn,
  bytes,
  color = 'purple',
}: {
  label: string;
  lsn: string;
  bytes: number;
  color?: 'purple' | 'blue' | 'green' | 'amber';
}) {
  const colorClasses = {
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-purple-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
  };

  return (
    <div className={`rounded-lg p-3 border ${colorClasses[color]}`}>
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className="font-mono text-sm text-gray-900 dark:text-white">{lsn}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {formatBytes(bytes)} offset
      </div>
    </div>
  );
}

// Generate correlated pages based on selected record
function generateCorrelatedPages(selectedRecord: { lsn: string; affectedPage?: number } | null) {
  if (!selectedRecord) return [];

  const pages: { page: number; lsn: string; status: 'current' | 'behind' | 'ahead' }[] = [];
  const selectedLsnParsed = parseLsn(selectedRecord.lsn);

  // Generate some correlated pages
  for (let i = 0; i < 5; i++) {
    const pageNum = selectedRecord.affectedPage ? selectedRecord.affectedPage + i - 2 : i * 10;
    if (pageNum < 0) continue;

    // Use deterministic offset based on page number for stability
    const offset = (pageNum * 1234 % 10000) - 5000;
    const pageLsnOffset = Math.max(0, selectedLsnParsed.offset + offset);
    const pageLsn = formatLsn(selectedLsnParsed.timeline, Math.floor(pageLsnOffset));

    let status: 'current' | 'behind' | 'ahead';
    if (Math.abs(offset) < 1000) {
      status = 'current';
    } else if (offset < 0) {
      status = 'behind';
    } else {
      status = 'ahead';
    }

    pages.push({ page: pageNum, lsn: pageLsn, status });
  }

  return pages.sort((a, b) => compareLsn(a.lsn, b.lsn));
}

// Page LSN Correlation
function PageLSNCorrelation() {
  const { selectedRecord } = useWALStore();
  const correlatedPages = generateCorrelatedPages(selectedRecord);

  if (!selectedRecord) {
    return (
      <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
        Select a record to see page LSN correlation
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
        Page LSN Correlation (pd_lsn)
      </h5>
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {correlatedPages.map(({ page, lsn, status }) => (
          <div
            key={page}
            className={`flex items-center justify-between p-2 rounded text-xs ${
              status === 'current'
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : status === 'behind'
                ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <Layers className="w-3 h-3 text-gray-400" />
              <span className="font-mono">Page {page}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-gray-500 dark:text-gray-400">{lsn}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded ${
                  status === 'current'
                    ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                    : status === 'behind'
                    ? 'bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
                }`}
              >
                {status}
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-gray-500 dark:text-gray-400">
        Pages with pd_lsn behind the WAL record need recovery
      </p>
    </div>
  );
}

export function LSNTracker() {
  const { currentLsn, segments, selectedRecord, recordsByType, totalRecords } = useWALStore();
  const currentParsed = parseLsn(currentLsn);

  // Calculate statistics
  const segmentCount = segments.length;
  const currentSegment = segments[segments.length - 1];
  const segmentProgress = currentSegment
    ? ((currentParsed.offset % SEGMENT_SIZE) / SEGMENT_SIZE) * 100
    : 0;

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-blue-500" />
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          LSN Progression Tracker
        </h4>
      </div>

      {/* LSN Progress Bar */}
      <div className="mb-6">
        <LSNProgressBar
          currentLsn={currentLsn}
          segments={segments}
          selectedRecord={selectedRecord}
        />
      </div>

      {/* LSN Values */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <LSNValueDisplay
          label="Current LSN"
          lsn={currentLsn}
          bytes={currentParsed.offset}
          color="purple"
        />
        <LSNValueDisplay
          label="Segment Start"
          lsn={currentSegment?.startLsn || '0/00000000'}
          bytes={currentSegment ? parseLsn(currentSegment.startLsn).offset : 0}
          color="blue"
        />
      </div>

      {/* Segment Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Current Segment</span>
          <span className="text-xs font-mono text-gray-700 dark:text-gray-300">
            {currentSegment?.name.slice(0, 8)}...{currentSegment?.name.slice(-8)}
          </span>
        </div>
        <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="absolute left-0 top-0 h-full bg-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${segmentProgress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mt-1">
          <span>0 MB</span>
          <span>{segmentProgress.toFixed(1)}%</span>
          <span>16 MB</span>
        </div>
      </div>

      {/* Page LSN Correlation */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
        <PageLSNCorrelation />
      </div>

      {/* Statistics */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">
          WAL Statistics
        </h5>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">Total Records</div>
            <div className="font-mono text-lg text-gray-900 dark:text-white">{totalRecords}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">Segments</div>
            <div className="font-mono text-lg text-gray-900 dark:text-white">{segmentCount}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {Object.entries(recordsByType).map(([type, count]) => (
            <div
              key={type}
              className="bg-white dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-700 text-center"
            >
              <div className="text-[10px] text-gray-500 dark:text-gray-400">{type}</div>
              <div className="font-mono text-sm text-gray-900 dark:text-white">{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* LSN Format Info */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
        <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
          LSN Format
        </h5>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 font-mono text-xs">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <span className="text-blue-600 dark:text-blue-400">Timeline</span>
            <ArrowRight className="w-3 h-3" />
            <span className="text-green-600 dark:text-green-400">Offset</span>
          </div>
          <div className="mt-1 text-gray-900 dark:text-white">{currentLsn}</div>
          <div className="mt-2 text-[10px] text-gray-500 dark:text-gray-400">
            Timeline: {currentParsed.timeline} | Offset: {currentParsed.offset.toLocaleString()} bytes
          </div>
        </div>
      </div>
    </div>
  );
}
