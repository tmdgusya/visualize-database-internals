import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVacuumStore } from '../../../stores/vacuumStore';
import { CheckCircle, Database, Trash2, Eye, LayoutGrid } from 'lucide-react';

export function VacuumAnimation() {
  const {
    pages,
    isVacuumRunning,
    vacuumProgress,
    currentVacuumPage,
    vacuumHistory,
    fsm,
    vm,
  } = useVacuumStore();

  const [selectedVacuumType, setSelectedVacuumType] = useState<'vacuum' | 'vacuum_full'>('vacuum');

  const getTupleColor = (state: string) => {
    switch (state) {
      case 'live':
        return 'bg-green-500';
      case 'dead':
        return 'bg-red-500';
      case 'frozen':
        return 'bg-blue-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="space-y-4">
      {/* VACUUM Type Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedVacuumType('vacuum')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
            selectedVacuumType === 'vacuum'
              ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
              : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
          }`}
        >
          <Trash2 className="w-5 h-5" />
          <div className="text-left">
            <div className="font-medium">VACUUM</div>
            <div className="text-xs opacity-70">Standard cleanup</div>
          </div>
        </button>
        <button
          onClick={() => setSelectedVacuumType('vacuum_full')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
            selectedVacuumType === 'vacuum_full'
              ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
              : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
          }`}
        >
          <Database className="w-5 h-5" />
          <div className="text-left">
            <div className="font-medium">VACUUM FULL</div>
            <div className="text-xs opacity-70">Compact & rewrite</div>
          </div>
        </button>
      </div>

      {/* Progress Bar */}
      {isVacuumRunning && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {selectedVacuumType === 'vacuum' ? 'Scanning pages...' : 'Rewriting table...'}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round(vacuumProgress)}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-orange-500"
              initial={{ width: 0 }}
              animate={{ width: `${vacuumProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Page {currentVacuumPage} of {pages.length}
          </div>
        </div>
      )}

      {/* Animation Area */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 min-h-[300px]">
        {pages.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
            No data to vacuum. Insert some tuples first.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Page Scanning Animation */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {pages.map((page, index) => {
                const isScanning = isVacuumRunning && index === currentVacuumPage - 1;
                const isScanned = isVacuumRunning && index < currentVacuumPage - 1;
                const hasDeadTuples = page.tuples.some(t => t.state === 'dead');

                return (
                  <motion.div
                    key={page.id}
                    className={`relative p-2 rounded border-2 ${
                      isScanning
                        ? 'border-orange-500 ring-2 ring-orange-500/50'
                        : isScanned
                        ? 'border-green-500'
                        : hasDeadTuples
                        ? 'border-red-300 dark:border-red-700'
                        : 'border-gray-200 dark:border-gray-700'
                    } bg-white dark:bg-gray-800`}
                    animate={isScanning ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                  >
                    {/* Scanning indicator */}
                    {isScanning && (
                      <motion.div
                        className="absolute inset-0 bg-orange-500/10 rounded"
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ repeat: Infinity, duration: 0.5 }}
                      />
                    )}

                    <div className="text-xs font-medium text-center mb-1">
                      Page {page.id}
                    </div>

                    {/* Tuple visualization */}
                    <div className="grid grid-cols-3 gap-px">
                      {page.tuples.slice(0, 9).map((tuple, i) => (
                        <motion.div
                          key={tuple.id}
                          className={`aspect-square rounded-sm ${getTupleColor(tuple.state)}`}
                          animate={
                            isScanning && tuple.state === 'dead'
                              ? { opacity: [1, 0.3, 1], scale: [1, 0.8, 1] }
                              : {}
                          }
                          transition={{ delay: i * 0.05 }}
                        />
                      ))}
                      {Array.from({ length: Math.max(0, 9 - page.tuples.length) }).map((_, i) => (
                        <div
                          key={`empty-${i}`}
                          className="aspect-square rounded-sm bg-gray-100 dark:bg-gray-700"
                        />
                      ))}
                    </div>

                    {/* Status indicator */}
                    {isScanned && (
                      <div className="absolute -top-1 -right-1">
                        <CheckCircle className="w-4 h-4 text-green-500 bg-white dark:bg-gray-800 rounded-full" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* FSM Update Visualization */}
            {isVacuumRunning && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <LayoutGrid className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Free Space Map (FSM) Update
                  </span>
                </div>
                <div className="flex gap-1">
                  {fsm.slice(0, 16).map((space, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 h-8 rounded bg-gradient-to-t from-blue-500 to-blue-300"
                      initial={{ opacity: 0.3 }}
                      animate={
                        i === currentVacuumPage - 1
                          ? { opacity: 1, scaleY: [0.5, 1, 0.5] }
                          : { opacity: 0.6 }
                      }
                      style={{ opacity: space / 8192 }}
                    />
                  ))}
                </div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-center">
                  Free space per page (darker = more free space)
                </div>
              </div>
            )}

            {/* VM Update Visualization */}
            {isVacuumRunning && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Visibility Map (VM) Update
                  </span>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {vm.slice(0, 32).map((flags, i) => (
                    <motion.div
                      key={i}
                      className={`w-6 h-6 rounded border ${
                        flags.allFrozen
                          ? 'bg-blue-500 border-blue-600'
                          : flags.allVisible
                          ? 'bg-green-500 border-green-600'
                          : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                      }`}
                      animate={
                        i === currentVacuumPage - 1
                          ? { scale: [1, 1.2, 1] }
                          : {}
                      }
                    />
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-green-500 border border-green-600" />
                    <span className="text-gray-600 dark:text-gray-400">All Visible</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-blue-500 border border-blue-600" />
                    <span className="text-gray-600 dark:text-gray-400">All Frozen</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600" />
                    <span className="text-gray-600 dark:text-gray-400">Not All Visible</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Before/After Comparison - Disabled */}
      <AnimatePresence>
        {false && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800"
          >
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="font-medium text-green-800 dark:text-green-200">
                VACUUM Complete!
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Pages Scanned:</span>
                <span className="ml-2 font-mono font-medium">
                  {vacuumHistory[vacuumHistory.length - 1]?.pagesScanned || 0}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Pages Vacuumed:</span>
                <span className="ml-2 font-mono font-medium">
                  {vacuumHistory[vacuumHistory.length - 1]?.pagesVacuumed || 0}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Dead Tuples Removed:</span>
                <span className="ml-2 font-mono font-medium text-green-600 dark:text-green-400">
                  {vacuumHistory[vacuumHistory.length - 1]?.deadTuplesRemoved || 0}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                <span className="ml-2 font-mono font-medium">
                  {vacuumHistory[vacuumHistory.length - 1]
                    ? `${(vacuumHistory[vacuumHistory.length - 1].endTime - vacuumHistory[vacuumHistory.length - 1].startTime)}ms`
                    : '0ms'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {vacuumHistory.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Vacuum History
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {vacuumHistory.slice(-5).reverse().map((run) => (
              <div
                key={run.id}
                className="flex items-center justify-between text-sm p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-2">
                  {run.type === 'vacuum' ? (
                    <Trash2 className="w-4 h-4 text-orange-500" />
                  ) : (
                    <Database className="w-4 h-4 text-blue-500" />
                  )}
                  <span className="font-medium">
                    {run.type === 'vacuum' ? 'VACUUM' : 'VACUUM FULL'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                  <span>{run.deadTuplesRemoved} dead tuples</span>
                  <span>{run.pagesVacuumed} pages</span>
                  <span>{run.endTime - run.startTime}ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
