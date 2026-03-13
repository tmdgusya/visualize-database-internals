import { motion } from 'framer-motion';
import { useMVCCStore } from '../../../stores/mvccStore';
import { Database, ArrowRight, Flame, Trash2, Plus } from 'lucide-react';

export function TupleVersionChain() {
  const {
    tupleVersions,
    selectedTuple,
    selectTuple,
    getTupleVersions,
    getTransactionStatus,
  } = useMVCCStore();

  // Group versions by their original tuple (follow t_ctid chain)
  const getRootTuples = () => {
    const roots = new Set<number>();
    const hasParent = new Set<number>();

    tupleVersions.forEach((tuple) => {
      // Find if this tuple has a parent (is pointed to by t_ctid)
      tupleVersions.forEach((t) => {
        if (t.t_ctid === tuple.id) {
          hasParent.add(tuple.id);
        }
      });
    });

    // Root tuples are those without parents
    tupleVersions.forEach((tuple) => {
      if (!hasParent.has(tuple.id)) {
        roots.add(tuple.id);
      }
    });

    return Array.from(roots);
  };

  const rootTuples = getRootTuples();

  const getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case 'committed':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'in_progress':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
      case 'aborted':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800';
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          Tuple Version Chains
        </h4>
      </div>

      {tupleVersions.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
          No tuples yet. Insert a tuple to see version chains.
        </p>
      ) : (
        <div className="space-y-6">
          {rootTuples.map((rootId) => {
            const chain = getTupleVersions(rootId);

            return (
              <motion.div
                key={rootId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
              >
                {/* Chain Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Row ID: {rootId}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {chain.length} version{chain.length > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Version Chain */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {chain.map((tuple, index) => {
                    const xminStatus = getTransactionStatus(tuple.xmin);
                    const xmaxStatus = tuple.xmax ? getTransactionStatus(tuple.xmax) : null;
                    const isDeleted = tuple.xmax !== null;
                    const isLast = index === chain.length - 1;

                    return (
                      <div key={tuple.id} className="flex items-center gap-2">
                        {/* Version Card */}
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          onClick={() => selectTuple(tuple.id)}
                          className={`relative min-w-[140px] p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedTuple === tuple.id
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                              : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700'
                          }`}
                        >
                          {/* HOT indicator */}
                          {tuple.isHot && (
                            <div className="absolute -top-2 -right-2 p-1 bg-orange-500 rounded-full">
                              <Flame className="w-3 h-3 text-white" />
                            </div>
                          )}

                          {/* Version ID */}
                          <div className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-1">
                            v{tuple.id}
                          </div>

                          {/* Data */}
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {tuple.data}
                          </div>

                          {/* xmin */}
                          <div className="mt-2 flex items-center gap-1">
                            <Plus className="w-3 h-3 text-green-500" />
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded ${getStatusColor(
                                xminStatus
                              )}`}
                            >
                              xmin: {tuple.xmin}
                            </span>
                          </div>

                          {/* xmax */}
                          <div className="mt-1 flex items-center gap-1">
                            <Trash2 className="w-3 h-3 text-red-500" />
                            {tuple.xmax ? (
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded ${getStatusColor(
                                  xmaxStatus
                                )}`}
                              >
                                xmax: {tuple.xmax}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                xmax: null
                              </span>
                            )}
                          </div>

                          {/* Status Badge */}
                          <div className="mt-2">
                            {isDeleted ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                                Deleted
                              </span>
                            ) : isLast ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                Current
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                                Superseded
                              </span>
                            )}
                          </div>
                        </motion.div>

                        {/* Arrow to next version */}
                        {!isLast && (
                          <div className="flex items-center text-gray-400 dark:text-gray-500">
                            <ArrowRight className="w-5 h-5" />
                            <span className="text-xs font-mono ml-1">ctid</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="p-0.5 bg-orange-500 rounded-full">
            <Flame className="w-3 h-3 text-white" />
          </div>
          <span className="text-gray-600 dark:text-gray-400">HOT Update</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-500" />
          <span className="text-gray-600 dark:text-gray-400">Current</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-100 dark:bg-red-900/30 border border-red-500" />
          <span className="text-gray-600 dark:text-gray-400">Deleted</span>
        </div>
        <div className="flex items-center gap-1">
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600 dark:text-gray-400">t_ctid pointer</span>
        </div>
      </div>
    </div>
  );
}
