import { motion, AnimatePresence } from 'framer-motion';
import { useJoinAlgorithmStore } from '../../../stores/joinAlgorithmStore';
import { TableView } from './TableView';
import { Database, Search, Hammer } from 'lucide-react';

export function HashJoinAnimation() {
  const {
    outerTable,
    innerTable,
    currentStep,
    animationSteps,
    results,
  } = useJoinAlgorithmStore();

  const currentStepData = animationSteps[currentStep];
  
  // Determine phase based on step message
  const isBuildPhase = currentStepData?.message?.includes('BUILD') || 
                       currentStepData?.message?.includes('build') ||
                       currentStepData?.type === 'hash_build';
  const isProbePhase = currentStepData?.message?.includes('PROBE') || 
                       currentStepData?.message?.includes('probe') ||
                       currentStepData?.type === 'hash_probe';

  // Calculate hash table from inner table rows
  const hashTable = new Map<number, typeof innerTable.rows>();
  innerTable.rows.forEach(row => {
    const existing = hashTable.get(row.value) || [];
    existing.push(row);
    hashTable.set(row.value, existing);
  });

  // Get currently probed/processing value
  const currentValue = currentStepData?.outerIndex !== undefined 
    ? outerTable.rows[currentStepData.outerIndex]?.value
    : currentStepData?.innerIndex !== undefined
    ? innerTable.rows[currentStepData.innerIndex]?.value
    : null;

  return (
    <div className="space-y-6">
      {/* Algorithm Title */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
          <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white">
            Hash Join
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            O(N + M) — Build hash table, then probe
          </p>
        </div>
      </div>

      {/* Phase Indicator */}
      <div className="flex items-center justify-center gap-4">
        <PhaseIndicator 
          icon={<Hammer className="w-4 h-4" />}
          label="Build Phase"
          isActive={isBuildPhase}
          color="purple"
        />
        <div className="w-8 h-0.5 bg-gray-300 dark:bg-gray-600" />
        <PhaseIndicator 
          icon={<Search className="w-4 h-4" />}
          label="Probe Phase"
          isActive={isProbePhase}
          color="blue"
        />
      </div>

      {/* Tables and Hash Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Outer Table */}
        <TableView
          name="Outer Table (Probe)"
          rows={outerTable.rows}
          highlightedIndex={isProbePhase ? currentStepData?.outerIndex : undefined}
        />

        {/* Hash Table Visualization */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-2 bg-purple-50 dark:bg-purple-900/30 border-b border-purple-200 dark:border-purple-800">
            <h5 className="text-sm font-semibold text-purple-900 dark:text-purple-200">
              Hash Table
            </h5>
          </div>
          <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
            {Array.from(hashTable.entries())
              .sort((a, b) => a[0] - b[0])
              .map(([key, rows]) => {
                const isHighlighted = currentValue === key;
                return (
                  <motion.div
                    key={key}
                    animate={{
                      backgroundColor: isHighlighted ? '#c084fc' : '#f3f4f6',
                      scale: isHighlighted ? 1.02 : 1,
                    }}
                    className={`
                      px-3 py-2 rounded text-sm
                      ${isHighlighted ? 'text-white shadow-md' : 'text-gray-700 dark:text-gray-300'}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold">Bucket[{key}]</span>
                      <span className="text-xs opacity-80">{rows.length} row(s)</span>
                    </div>
                    <div className="mt-1 text-xs opacity-90">
                      {rows.map(r => `id:${r.id}`).join(', ')}
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </div>

        {/* Inner Table */}
        <TableView
          name="Inner Table (Build)"
          rows={innerTable.rows}
          highlightedIndex={isBuildPhase ? currentStepData?.innerIndex : undefined}
        />
      </div>

      {/* Operation Visualization */}
      <AnimatePresence mode="wait">
        {isBuildPhase && (
          <motion.div
            key="build"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Hammer className="w-5 h-5 text-white" />
              </div>
              <div>
                <h5 className="font-semibold text-purple-900 dark:text-purple-200">
                  Build Phase
                </h5>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Hashing inner table rows into buckets based on join key
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {isProbePhase && (
          <motion.div
            key="probe"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Search className="w-5 h-5 text-white" />
              </div>
              <div>
                <h5 className="font-semibold text-blue-900 dark:text-blue-200">
                  Probe Phase
                </h5>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Scanning outer table and looking up matching buckets
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                <span className="text-blue-600">{result.outerRow.value}</span>
                <span className="text-gray-400 mx-1">↔</span>
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
  color: 'purple' | 'blue';
}

function PhaseIndicator({ icon, label, isActive, color }: PhaseIndicatorProps) {
  const colorClasses = {
    purple: {
      active: 'bg-purple-500 text-white shadow-lg',
      inactive: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
    },
    blue: {
      active: 'bg-blue-500 text-white shadow-lg',
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
