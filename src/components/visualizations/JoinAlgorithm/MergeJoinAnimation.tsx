import { motion } from 'framer-motion';
import { useJoinAlgorithmStore } from '../../../stores/joinAlgorithmStore';
import { TableView } from './TableView';
import { ArrowLeftRight, ArrowUpDown, GitCompare } from 'lucide-react';

export function MergeJoinAnimation() {
  const {
    outerTable,
    innerTable,
    currentStep,
    animationSteps,
    results,
  } = useJoinAlgorithmStore();

  const currentStepData = animationSteps[currentStep];
  
  // Determine phase based on step message
  const isSortPhase = currentStepData?.message?.includes('SORT') || 
                      currentStepData?.message?.includes('sort') ||
                      currentStepData?.type === 'sort';
  const isMergePhase = currentStepData?.message?.includes('MERGE') || 
                       currentStepData?.message?.includes('merge') ||
                       currentStepData?.type === 'compare' ||
                       currentStepData?.type === 'advance_outer' ||
                       currentStepData?.type === 'advance_inner' ||
                       currentStepData?.type === 'advance_both';

  // Get sorted versions of tables
  const sortedOuter = [...outerTable.rows].sort((a, b) => a.value - b.value);
  const sortedInner = [...innerTable.rows].sort((a, b) => a.value - b.value);

  // Get current cursor positions
  const outerCursor = currentStepData?.outerIndex ?? -1;
  const innerCursor = currentStepData?.innerIndex ?? -1;

  return (
    <div className="space-y-6">
      {/* Algorithm Title */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
          <ArrowLeftRight className="w-5 h-5 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white">
            Merge Join
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            O(N log N + M log M) — Sort both, then merge
          </p>
        </div>
      </div>

      {/* Phase Indicator */}
      <div className="flex items-center justify-center gap-4">
        <PhaseIndicator 
          icon={<ArrowUpDown className="w-4 h-4" />}
          label="Sort Phase"
          isActive={isSortPhase}
          color="teal"
        />
        <div className="w-8 h-0.5 bg-gray-300 dark:bg-gray-600" />
        <PhaseIndicator 
          icon={<GitCompare className="w-4 h-4" />}
          label="Merge Phase"
          isActive={isMergePhase}
          color="indigo"
        />
      </div>

      {/* Tables Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TableView
          name="Outer Table (Sorted)"
          rows={sortedOuter}
          highlightedIndex={outerCursor >= 0 ? outerCursor : undefined}
          isSorted={true}
          cursorPosition="top"
        />
        <TableView
          name="Inner Table (Sorted)"
          rows={sortedInner}
          highlightedIndex={innerCursor >= 0 ? innerCursor : undefined}
          isSorted={true}
          cursorPosition="top"
        />
      </div>

      {/* Cursor Visualization */}
      {isMergePhase && (
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center gap-8">
            {/* Outer Cursor */}
            <div className="text-center">
              <motion.div
                animate={{
                  y: currentStepData?.type === 'advance_outer' || currentStepData?.type === 'advance_both' ? [0, -5, 0] : 0,
                }}
                className="mb-2"
              >
                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
                  Outer Cursor
                </span>
              </motion.div>
              <div className="text-2xl font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {outerCursor >= 0 ? outerCursor : '-'}
              </div>
              {outerCursor >= 0 && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  value: {sortedOuter[outerCursor]?.value ?? '-'}
                </div>
              )}
            </div>

            {/* Comparison Indicator */}
            <motion.div
              animate={{
                scale: currentStepData?.type === 'compare' ? [1, 1.2, 1] : 1,
              }}
              className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg"
            >
              <span className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                {outerCursor >= 0 && innerCursor >= 0
                  ? sortedOuter[outerCursor]?.value === sortedInner[innerCursor]?.value
                    ? '='
                    : sortedOuter[outerCursor]?.value < sortedInner[innerCursor]?.value
                    ? '<'
                    : '>'
                  : '?'}
              </span>
            </motion.div>

            {/* Inner Cursor */}
            <div className="text-center">
              <motion.div
                animate={{
                  y: currentStepData?.type === 'advance_inner' || currentStepData?.type === 'advance_both' ? [0, -5, 0] : 0,
                }}
                className="mb-2"
              >
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                  Inner Cursor
                </span>
              </motion.div>
              <div className="text-2xl font-mono font-bold text-purple-600 dark:text-purple-400">
                {innerCursor >= 0 ? innerCursor : '-'}
              </div>
              {innerCursor >= 0 && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  value: {sortedInner[innerCursor]?.value ?? '-'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                <span className="text-indigo-600">{result.outerRow.value}</span>
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

interface PhaseIndicatorProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  color: 'teal' | 'indigo';
}

function PhaseIndicator({ icon, label, isActive, color }: PhaseIndicatorProps) {
  const colorClasses = {
    teal: {
      active: 'bg-teal-500 text-white shadow-lg',
      inactive: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
    },
    indigo: {
      active: 'bg-indigo-500 text-white shadow-lg',
      inactive: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
    },
  };

  return (
    <motion.div
      animate={{
        scale: isActive ? 1.05 : 1,
      }}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
        ${colorClasses[color][isActive ? 'active' : 'inactive']}
      `}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </motion.div>
  );
}
