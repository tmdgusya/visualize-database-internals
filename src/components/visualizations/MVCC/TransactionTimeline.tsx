import { motion } from 'framer-motion';
import { useMVCCStore } from '../../../stores/mvccStore';
import { Clock, Play, CheckCircle, XCircle } from 'lucide-react';

export function TransactionTimeline() {
  const {
    transactions,
    currentTime,
    selectedTransaction,
    selectTransaction,
  } = useMVCCStore();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'bg-yellow-500';
      case 'committed':
        return 'bg-green-500';
      case 'aborted':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Play className="w-3 h-3" />;
      case 'committed':
        return <CheckCircle className="w-3 h-3" />;
      case 'aborted':
        return <XCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'In Progress';
      case 'committed':
        return 'Committed';
      case 'aborted':
        return 'Aborted';
      default:
        return status;
    }
  };

  // Calculate timeline scale
  const maxTime = Math.max(currentTime, ...transactions.map((t) => t.endTime || currentTime), 10);
  const timeScale = 100 / maxTime; // percentage per time unit

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          Transaction Timeline
        </h4>
      </div>

      {/* Timeline Header */}
      <div className="flex items-center mb-2 text-xs text-gray-500 dark:text-gray-400">
        <div className="w-20">XID</div>
        <div className="flex-1 relative h-6">
          {/* Time markers */}
          {Array.from({ length: Math.min(maxTime + 1, 11) }, (_, i) => (
            <div
              key={i}
              className="absolute transform -translate-x-1/2"
              style={{ left: `${(i / maxTime) * 100}%` }}
            >
              <span className="font-mono">T{i}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Current Time Indicator */}
      <div className="relative mb-4">
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
          style={{ left: `${(currentTime / maxTime) * 100}%` }}
        >
          <div className="absolute -top-1 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full" />
          <div className="absolute -top-6 -translate-x-1/2 text-xs font-mono text-red-500 whitespace-nowrap">
            Now (T{currentTime})
          </div>
        </div>
      </div>

      {/* Transaction Bars */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {transactions.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            No transactions yet. Start a transaction to see it here.
          </p>
        ) : (
          transactions.map((transaction) => {
            const startPos = transaction.startTime * timeScale;
            const endPos = (transaction.endTime || currentTime) * timeScale;
            const width = Math.max(endPos - startPos, 2); // Minimum width for visibility

            return (
              <motion.div
                key={transaction.xid}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center group cursor-pointer ${
                  selectedTransaction === transaction.xid
                    ? 'bg-purple-100 dark:bg-purple-900/30 rounded'
                    : ''
                }`}
                onClick={() => selectTransaction(transaction.xid)}
              >
                {/* XID Label */}
                <div className="w-20 flex items-center gap-2">
                  <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
                    {transaction.xid}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      transaction.isolationLevel === 'serializable'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        : transaction.isolationLevel === 'repeatable_read'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {transaction.isolationLevel === 'read_committed'
                      ? 'RC'
                      : transaction.isolationLevel === 'repeatable_read'
                      ? 'RR'
                      : 'SER'}
                  </span>
                </div>

                {/* Timeline Bar */}
                <div className="flex-1 relative h-8 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                  {/* Transaction bar */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${width}%` }}
                    transition={{ duration: 0.5 }}
                    className={`absolute top-1 bottom-1 rounded ${getStatusColor(
                      transaction.status
                    )} opacity-80 group-hover:opacity-100`}
                    style={{ left: `${startPos}%` }}
                  >
                    {/* Status indicator */}
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 text-white">
                      {getStatusIcon(transaction.status)}
                    </div>
                  </motion.div>

                  {/* Start marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-gray-400 dark:bg-gray-600"
                    style={{ left: `${startPos}%` }}
                  >
                    <div className="absolute -top-1 -translate-x-1/2 w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full" />
                  </div>

                  {/* End marker (if committed/aborted) */}
                  {transaction.endTime && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-gray-400 dark:bg-gray-600"
                      style={{ left: `${endPos}%` }}
                    >
                      <div className="absolute -top-1 -translate-x-1/2 w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full" />
                    </div>
                  )}
                </div>

                {/* Status Text */}
                <div className="w-24 text-right">
                  <span
                    className={`text-xs font-medium ${
                      transaction.status === 'in_progress'
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : transaction.status === 'committed'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {getStatusText(transaction.status)}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-500 rounded" />
          <span className="text-gray-600 dark:text-gray-400">In Progress</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span className="text-gray-600 dark:text-gray-400">Committed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded" />
          <span className="text-gray-600 dark:text-gray-400">Aborted</span>
        </div>
        <div className="flex items-center gap-1 ml-4">
          <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            RC
          </span>
          <span className="text-gray-600 dark:text-gray-400">Read Committed</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
            RR
          </span>
          <span className="text-gray-600 dark:text-gray-400">Repeatable Read</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
            SER
          </span>
          <span className="text-gray-600 dark:text-gray-400">Serializable</span>
        </div>
      </div>
    </div>
  );
}
