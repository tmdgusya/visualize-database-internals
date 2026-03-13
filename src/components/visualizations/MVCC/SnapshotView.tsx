import { motion } from 'framer-motion';
import { useMVCCStore } from '../../../stores/mvccStore';
import { Camera, Users, Clock } from 'lucide-react';

export function SnapshotView() {
  const { snapshots, transactions, selectedTransaction, selectTransaction } = useMVCCStore();

  const getTransaction = (xid: number) => transactions.find((t) => t.xid === xid);

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'committed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-yellow-500';
      case 'aborted':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <Camera className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Snapshots</h4>
      </div>

      {snapshots.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No snapshots created yet.
        </p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {snapshots.map((snapshot, index) => {
            const isSelected = selectedTransaction === snapshot.xid;

            return (
              <motion.div
                key={snapshot.xid}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => selectTransaction(snapshot.xid)}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                {/* Snapshot Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Snapshot #{index + 1}
                    </span>
                    <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
                      by XID {snapshot.xid}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                    <Clock className="w-3 h-3" />
                    T{snapshot.createdAt}
                  </div>
                </div>

                {/* Snapshot Structure */}
                <div className="space-y-2">
                  {/* xmin */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400 w-12">xmin:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium">{snapshot.xmin}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        (oldest active)
                      </span>
                    </div>
                  </div>

                  {/* xmax */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400 w-12">xmax:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium">{snapshot.xmax}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        (next XID)
                      </span>
                    </div>
                  </div>

                  {/* xip_list */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-3 h-3 text-gray-400" />
                      <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                        xip_list (active transactions):
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 pl-5">
                      {snapshot.xipList.length === 0 ? (
                        <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                          No active transactions
                        </span>
                      ) : (
                        snapshot.xipList.map((xid) => {
                          const tx = getTransaction(xid);
                          return (
                            <span
                              key={xid}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono ${
                                tx?.status === 'committed'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                  : tx?.status === 'in_progress'
                                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${getStatusColor(
                                  tx?.status
                                )}`}
                              />
                              {xid}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Visual Representation */}
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Transaction Visibility Range
                  </div>
                  <div className="relative h-6 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                    {/* Range bar */}
                    <div
                      className="absolute top-1 bottom-1 bg-indigo-200 dark:bg-indigo-900/50 rounded"
                      style={{
                        left: `${(snapshot.xmin / snapshot.xmax) * 100}%`,
                        right: '4px',
                      }}
                    />
                    {/* xmin marker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-green-500"
                      style={{ left: `${(snapshot.xmin / snapshot.xmax) * 100}%` }}
                    >
                      <div className="absolute -top-1 -translate-x-1/2 text-[10px] text-green-600 dark:text-green-400 font-mono">
                        xmin
                      </div>
                    </div>
                    {/* xmax marker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-blue-500"
                      style={{ left: '98%' }}
                    >
                      <div className="absolute -top-1 -translate-x-1/2 text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                        xmax
                      </div>
                    </div>
                    {/* Active transactions markers */}
                    {snapshot.xipList.map((xid) => (
                      <div
                        key={xid}
                        className="absolute top-0 bottom-0 w-1 bg-yellow-500"
                        style={{
                          left: `${Math.min((xid / snapshot.xmax) * 100, 95)}%`,
                        }}
                      >
                        <div className="absolute -bottom-1 -translate-x-1/2 w-2 h-2 bg-yellow-500 rounded-full" />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                    <span>0</span>
                    <span>{snapshot.xmax}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* CLOG Comparison Note */}
      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <h5 className="text-xs font-medium text-amber-900 dark:text-amber-300 mb-1">
          Snapshot vs CLOG
        </h5>
        <p className="text-xs text-amber-800 dark:text-amber-200">
          Snapshot captures transaction status at a point in time. CLOG (Commit Log) tracks the
          current status. A snapshot may show a transaction as active (in xip_list) even if it has
          since committed.
        </p>
      </div>
    </div>
  );
}
