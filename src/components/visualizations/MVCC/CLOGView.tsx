import { motion } from 'framer-motion';
import { useMVCCStore } from '../../../stores/mvccStore';
import { FileText, Play, CheckCircle, XCircle, HelpCircle } from 'lucide-react';

export function CLOGView() {
  const { clog, nextXid } = useMVCCStore();

  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case 'in_progress':
        return <Play className="w-3 h-3" />;
      case 'committed':
        return <CheckCircle className="w-3 h-3" />;
      case 'aborted':
        return <XCircle className="w-3 h-3" />;
      default:
        return <HelpCircle className="w-3 h-3" />;
    }
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'in_progress':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';
      case 'committed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700';
      case 'aborted':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600';
    }
  };

  const getStatusBg = (status: string | undefined) => {
    switch (status) {
      case 'in_progress':
        return 'bg-yellow-500';
      case 'committed':
        return 'bg-green-500';
      case 'aborted':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  // Get all XIDs that have entries in CLOG
  const clogEntries = Array.from(clog.entries()).sort((a, b) => a[0] - b[0]);

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          CLOG (Commit Log)
        </h4>
      </div>

      {clogEntries.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No transactions in CLOG yet.
        </p>
      ) : (
        <div className="space-y-4">
          {/* CLOG Entries Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {clogEntries.map(([xid, status], index) => (
              <motion.div
                key={xid}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
                className={`p-2 rounded-lg border ${getStatusColor(
                  status
                )} flex flex-col items-center gap-1`}
              >
                <span className="text-[10px] font-mono opacity-70">{xid}</span>
                <div className="flex items-center gap-1">
                  {getStatusIcon(status)}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Circular Buffer Visualization */}
          <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3">
              CLOG Buffer Visualization
            </h5>
            <div className="relative">
              {/* Buffer ring */}
              <div className="flex flex-wrap gap-1 justify-center">
                {clogEntries.map(([xid, status], index) => {
                  const isRecent = xid > nextXid - 20;
                  return (
                    <motion.div
                      key={xid}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.01 }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-mono ${getStatusBg(
                        status
                      )} text-white ${isRecent ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}
                      title={`XID ${xid}: ${status}`}
                    >
                      {xid % 100}
                    </motion.div>
                  );
                })}
              </div>

              {/* Next XID indicator */}
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>Next XID:</span>
                <span className="font-mono font-medium text-blue-600 dark:text-blue-400">
                  {nextXid}
                </span>
              </div>
            </div>
          </div>

          {/* CLOG Statistics */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 text-center">
              <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                {clogEntries.filter(([, s]) => s === 'in_progress').length}
              </div>
              <div className="text-[10px] text-yellow-700 dark:text-yellow-300">
                In Progress
              </div>
            </div>
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 text-center">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {clogEntries.filter(([, s]) => s === 'committed').length}
              </div>
              <div className="text-[10px] text-green-700 dark:text-green-300">
                Committed
              </div>
            </div>
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 text-center">
              <div className="text-lg font-bold text-red-600 dark:text-red-400">
                {clogEntries.filter(([, s]) => s === 'aborted').length}
              </div>
              <div className="text-[10px] text-red-700 dark:text-red-300">Aborted</div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-gray-600 dark:text-gray-400">In Progress</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-gray-600 dark:text-gray-400">Committed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-gray-600 dark:text-gray-400">Aborted</span>
        </div>
      </div>

      {/* CLOG Explanation */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h5 className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-1">
          About CLOG
        </h5>
        <p className="text-xs text-blue-800 dark:text-blue-200">
          CLOG (Commit Log) is a shared memory structure that tracks the status of all
          transactions. It uses a circular buffer and is crucial for visibility checks.
          Status can be: in_progress (0), committed (1), or aborted (2).
        </p>
      </div>
    </div>
  );
}
