import { motion } from 'framer-motion';
import { useJoinAlgorithmStore } from '../../../stores/joinAlgorithmStore';
import { TableView } from './TableView';
import { ArrowRight, RotateCw } from 'lucide-react';

export function NestedLoopAnimation() {
  const {
    outerTable,
    innerTable,
    currentStep,
    animationSteps,
    results,
  } = useJoinAlgorithmStore();

  const currentStepData = animationSteps[currentStep];
  
  // Determine highlighted indices based on current step
  const outerHighlightedIndex = currentStepData?.outerIndex;
  const innerHighlightedIndex = currentStepData?.innerIndex;
  
  // Find matched indices for highlighting
  const matchedOuterIndices = results.map(r => 
    outerTable.rows.findIndex(row => row.id === r.outerRow.id)
  ).filter(i => i >= 0);
  
  const matchedInnerIndices = results.map(r => 
    innerTable.rows.findIndex(row => row.id === r.innerRow.id)
  ).filter(i => i >= 0);

  return (
    <div className="space-y-6">
      {/* Algorithm Title */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
          <RotateCw className="w-5 h-5 text-pink-600 dark:text-pink-400" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white">
            Nested Loop Join
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            O(N × M) — For each outer row, scan all inner rows
          </p>
        </div>
      </div>

      {/* Tables Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TableView
          name="Outer Table (N)"
          rows={outerTable.rows}
          highlightedIndex={outerHighlightedIndex}
          matchedIndices={matchedOuterIndices}
        />
        <TableView
          name="Inner Table (M)"
          rows={innerTable.rows}
          highlightedIndex={innerHighlightedIndex}
          matchedIndices={matchedInnerIndices}
        />
      </div>

      {/* Loop Visualization */}
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center gap-4">
          <motion.div
            animate={{
              x: currentStepData?.type === 'advance_outer' ? [0, -10, 0] : 0,
            }}
            transition={{ duration: 0.3 }}
            className="px-4 py-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg border-2 border-pink-300 dark:border-pink-700"
          >
            <span className="text-sm font-semibold text-pink-700 dark:text-pink-300">
              Outer Loop
            </span>
          </motion.div>
          
          <ArrowRight className="w-5 h-5 text-gray-400" />
          
          <motion.div
            animate={{
              x: currentStepData?.type === 'compare' ? [0, 10, 0] : 0,
            }}
            transition={{ duration: 0.2, repeat: currentStepData?.type === 'compare' ? 2 : 0 }}
            className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg border-2 border-purple-300 dark:border-purple-700"
          >
            <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
              Inner Loop
            </span>
          </motion.div>
        </div>

        {/* Comparison Counter */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">Comparisons:</span>
            <motion.span
              key={currentStep}
              initial={{ scale: 1.5, color: '#f59e0b' }}
              animate={{ scale: 1, color: '#111827' }}
              className="text-lg font-bold text-gray-900 dark:text-white"
            >
              {useJoinAlgorithmStore.getState().comparisons}
            </motion.span>
            <span className="text-sm text-gray-400">/</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {outerTable.rows.length * innerTable.rows.length} max
            </span>
          </div>
        </div>
      </div>

      {/* Results Preview */}
      {results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800"
        >
          <h5 className="text-sm font-semibold text-green-900 dark:text-green-200 mb-2">
            Join Results ({results.length} matches)
          </h5>
          <div className="flex flex-wrap gap-2">
            {results.slice(-5).map((result, idx) => (
              <motion.div
                key={idx}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-xs font-mono border border-green-200 dark:border-green-800"
              >
                <span className="text-pink-600">{result.outerRow.value}</span>
                <span className="text-gray-400 mx-1">=</span>
                <span className="text-purple-600">{result.innerRow.value}</span>
              </motion.div>
            ))}
            {results.length > 5 && (
              <span className="px-3 py-1 text-xs text-gray-500">
                +{results.length - 5} more
              </span>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
