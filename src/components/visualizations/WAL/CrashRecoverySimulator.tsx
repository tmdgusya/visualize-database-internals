import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWALStore, compareLsn, parseLsn } from '../../../stores/walStore';
import { AlertTriangle, Play, RotateCcw, CheckCircle, XCircle, Database, Activity } from 'lucide-react';

export function CrashRecoverySimulator() {
  const {
    segments,
    crashPointLsn,
    recoveryOperations,
    recoveredPages,
    isInRecovery,
    crashAt,
    recover,
    clearCrashPoint,
  } = useWALStore();

  const [sliderValue, setSliderValue] = useState(0);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);

  // Get all records for the slider
  const allRecords = segments.flatMap((s) => s.records);
  
  // Calculate max value for slider based on total WAL bytes
  const getSliderMax = () => {
    if (allRecords.length === 0) return 100;
    const lastRecord = allRecords[allRecords.length - 1];
    const parsed = parseLsn(lastRecord.lsn);
    return parsed.offset;
  };

  // Convert slider value to LSN
  const sliderToLsn = (value: number): string => {
    return `0/${value.toString(16).padStart(8, '0')}`;
  };

  // Handle slider change
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setSliderValue(value);
    const lsn = sliderToLsn(value);
    crashAt(lsn);
  };

  // Handle recovery
  const handleRecover = () => {
    recover();
    setShowBeforeAfter(true);
  };

  // Handle reset
  const handleReset = () => {
    clearCrashPoint();
    setSliderValue(0);
    setShowBeforeAfter(false);
  };

  // Find checkpoint before crash point
  const findLastCheckpoint = () => {
    let lastCheckpoint = '0/00000000';
    for (const segment of segments) {
      for (const record of segment.records) {
        if (crashPointLsn && compareLsn(record.lsn, crashPointLsn) >= 0) break;
        if (record.type === 'CHECKPOINT') {
          lastCheckpoint = record.lsn;
        }
      }
    }
    return lastCheckpoint;
  };

  const lastCheckpoint = findLastCheckpoint();
  const redoCount = recoveryOperations.filter((op) => op.type === 'REDO').length;
  const skipCount = recoveryOperations.filter((op) => op.type === 'SKIP').length;

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-red-500" />
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          Crash Recovery Simulator
        </h4>
      </div>

      {/* Crash Point Slider */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Set Crash Point
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={0}
            max={getSliderMax()}
            value={sliderValue}
            onChange={handleSliderChange}
            disabled={allRecords.length === 0}
            className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
          />
          <span className="font-mono text-sm text-red-600 dark:text-red-400 min-w-[100px]">
            {crashPointLsn || 'Not Set'}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Drag to set the point where a crash occurs
        </p>
      </div>

      {/* Recovery Controls */}
      {crashPointLsn && (
        <div className="flex gap-2 mb-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRecover}
            disabled={isInRecovery}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            {isInRecovery ? 'Recovering...' : 'Start REDO Recovery'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </motion.button>
        </div>
      )}

      {/* Recovery Info */}
      {crashPointLsn && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">Crash Point</div>
            <div className="font-mono text-sm text-red-600 dark:text-red-400">{crashPointLsn}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">Last Checkpoint</div>
            <div className="font-mono text-sm text-purple-600 dark:text-purple-400">{lastCheckpoint}</div>
          </div>
        </div>
      )}

      {/* Recovery Operations */}
      {recoveryOperations.length > 0 && (
        <div className="mb-6">
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Recovery Operations
          </h5>
          
          {/* Stats */}
          <div className="flex gap-4 mb-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-gray-600 dark:text-gray-400">REDO:</span>
              <span className="font-mono font-medium text-green-600 dark:text-green-400">{redoCount}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <XCircle className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">SKIP:</span>
              <span className="font-mono font-medium text-gray-600 dark:text-gray-400">{skipCount}</span>
            </div>
          </div>

          {/* Operations List */}
          <div className="max-h-48 overflow-y-auto space-y-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2">
            <AnimatePresence>
              {recoveryOperations.map((op, index) => (
                <motion.div
                  key={op.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center gap-2 p-2 rounded text-xs ${
                    op.type === 'REDO'
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  {op.type === 'REDO' ? (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  ) : (
                    <XCircle className="w-3 h-3 text-gray-400" />
                  )}
                  <span className="font-mono text-gray-500 dark:text-gray-400">{op.lsn}</span>
                  <span className={op.type === 'REDO' ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'}>
                    {op.type}
                  </span>
                  {op.affectedPage !== undefined && (
                    <span className="text-xs text-blue-600 dark:text-blue-400 ml-auto">
                      Page {op.affectedPage}
                    </span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Recovered Pages */}
      {recoveredPages.length > 0 && (
        <div className="mb-6">
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Recovered Pages ({recoveredPages.length})
            </div>
          </h5>
          <div className="flex flex-wrap gap-2">
            {recoveredPages.map((page) => (
              <motion.div
                key={page}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-mono"
              >
                Page {page}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Before/After Comparison */}
      {showBeforeAfter && recoveredPages.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Recovery Result
          </h5>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
              <div className="text-xs font-medium text-red-700 dark:text-red-300 mb-2">
                Before Recovery
              </div>
              <div className="text-xs text-red-600 dark:text-red-400">
                <div className="flex items-center gap-1 mb-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Crash at {crashPointLsn}</span>
                </div>
                <div>{recoveredPages.length} pages may be inconsistent</div>
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
              <div className="text-xs font-medium text-green-700 dark:text-green-300 mb-2">
                After Recovery
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">
                <div className="flex items-center gap-1 mb-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>REDO completed</span>
                </div>
                <div>{recoveredPages.length} pages recovered</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {allRecords.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Generate a workload first</p>
          <p className="text-xs mt-1">Use the Workload Generator to create WAL records</p>
        </div>
      )}
    </div>
  );
}
