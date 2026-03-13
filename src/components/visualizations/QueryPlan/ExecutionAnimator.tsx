
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryPlanStore } from '../../../stores/queryPlanStore';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  FastForward,
  Activity,
  Clock,
  Database,
} from 'lucide-react';

export function ExecutionAnimator() {
  const {
    planTree,
    executionState,
    currentStep,
    executionLog,
    currentNodeId,
    animationSpeed,
    startExecution,
    step,
    pause,
    reset,
    setAnimationSpeed,
    getNodeCount,
  } = useQueryPlanStore();

  const totalSteps = getNodeCount();
  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  if (!planTree) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
        <Activity className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">No query plan to execute</p>
      </div>
    );
  }

  const getStatusColor = () => {
    switch (executionState) {
      case 'running':
        return 'text-green-600 dark:text-green-400';
      case 'paused':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'completed':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusText = () => {
    switch (executionState) {
      case 'running':
        return 'Executing...';
      case 'paused':
        return 'Paused';
      case 'completed':
        return 'Completed';
      default:
        return 'Ready';
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Activity className={`w-6 h-6 ${getStatusColor()}`} />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Execution Control
              </h3>
              <p className={`text-sm ${getStatusColor()}`}>{getStatusText()}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
              {currentStep} / {totalSteps}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">steps</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-indigo-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span>0%</span>
            <span>{Math.round(progress)}%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {executionState === 'running' ? (
            <button
              onClick={pause}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              <Pause className="w-4 h-4" />
              Pause
            </button>
          ) : (
            <button
              onClick={startExecution}
              disabled={executionState === 'completed'}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              {executionState === 'completed' ? 'Finished' : 'Start'}
            </button>
          )}

          <button
            onClick={step}
            disabled={executionState === 'completed' || executionState === 'running'}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SkipForward className="w-4 h-4" />
            Step
          </button>

          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>

          <div className="flex-1" />

          {/* Speed Control */}
          <div className="flex items-center gap-2">
            <FastForward className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Speed:</span>
            <select
              value={animationSpeed}
              onChange={(e) => setAnimationSpeed(Number(e.target.value))}
              className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm"
            >
              <option value={1000}>Slow</option>
              <option value={500}>Normal</option>
              <option value={200}>Fast</option>
              <option value={50}>Very Fast</option>
            </select>
          </div>
        </div>
      </div>

      {/* Execution Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Node Visualization */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Current Operation
          </h4>

          <AnimatePresence mode="wait">
            {currentNodeId ? (
              <motion.div
                key={currentNodeId}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border-2 border-indigo-200 dark:border-indigo-800"
              >
                <CurrentNodeDisplay nodeId={currentNodeId} />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-8 text-center"
              >
                <Database className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  {executionState === 'idle'
                    ? 'Press Start to begin execution'
                    : executionState === 'completed'
                      ? 'Execution completed'
                      : 'Waiting...'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tuple Flow Animation */}
          {executionState === 'running' && currentNodeId && (
            <div className="mt-4">
              <TupleFlowAnimation />
            </div>
          )}
        </div>

        {/* Execution Log */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Execution Log
          </h4>

          <div className="h-64 overflow-y-auto space-y-2 pr-2">
            <AnimatePresence>
              {executionLog.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-gray-500 dark:text-gray-400 py-8"
                >
                  No execution steps yet
                </motion.div>
              ) : (
                executionLog.map((log, index) => (
                  <motion.div
                    key={`${log.nodeId}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-gray-500">#{index + 1}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                          {log.action}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                          <Database className="w-3 h-3" />
                          {log.rows.toLocaleString()} rows
                        </span>
                        <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                          <Clock className="w-3 h-3" />
                          {log.time.toFixed(2)}ms
                        </span>
                      </div>
                    </div>
                    {log.details && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{log.details}</p>
                    )}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Summary Stats */}
          {executionLog.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-mono font-bold text-gray-900 dark:text-white">
                    {executionLog.length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Operations</div>
                </div>
                <div>
                  <div className="text-lg font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {executionLog.reduce((sum, log) => sum + log.rows, 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Total Rows</div>
                </div>
                <div>
                  <div className="text-lg font-mono font-bold text-green-600 dark:text-green-400">
                    {executionLog.reduce((sum, log) => sum + log.time, 0).toFixed(2)}ms
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Total Time</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Current Node Display Component
function CurrentNodeDisplay({ nodeId }: { nodeId: string }) {
  const { getNodeById } = useQueryPlanStore();
  const node = getNodeById(nodeId);

  if (!node) return null;

  const nodeColors: Record<string, { bg: string; text: string }> = {
    SeqScan: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200' },
    IndexScan: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200' },
    IndexOnlyScan: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200' },
    BitmapScan: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-800 dark:text-indigo-200' },
    NestedLoop: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-800 dark:text-pink-200' },
    HashJoin: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-200' },
    MergeJoin: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-800 dark:text-teal-200' },
    Sort: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-200' },
    Aggregate: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200' },
    Limit: { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-800 dark:text-gray-200' },
  };

  const colors = nodeColors[node.type] || nodeColors.Limit;

  return (
    <div className="space-y-3">
      <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${colors.bg} ${colors.text}`}>
        {node.type}
      </div>

      {node.table && (
        <div className="text-sm">
          <span className="text-gray-500 dark:text-gray-400">Table:</span>{' '}
          <span className="font-mono text-gray-900 dark:text-white">{node.table}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-white dark:bg-gray-800 rounded p-2">
          <div className="text-gray-500 dark:text-gray-400 text-xs">Cost</div>
          <div className="font-mono text-gray-900 dark:text-white">{node.cost.total.toFixed(2)}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded p-2">
          <div className="text-gray-500 dark:text-gray-400 text-xs">Rows</div>
          <div className="font-mono text-gray-900 dark:text-white">{node.rows.toLocaleString()}</div>
        </div>
      </div>

      {node.condition && (
        <div className="text-xs">
          <span className="text-gray-500 dark:text-gray-400">Condition:</span>{' '}
          <span className="font-mono text-gray-700 dark:text-gray-300">{node.condition}</span>
        </div>
      )}
    </div>
  );
}

// Tuple Flow Animation Component
function TupleFlowAnimation() {
  return (
    <div className="relative h-8 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
      <motion.div
        className="absolute top-0 left-0 h-full w-20 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
        animate={{
          left: ['-20%', '120%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs text-gray-500 dark:text-gray-400">Processing tuples...</span>
      </div>
    </div>
  );
}
