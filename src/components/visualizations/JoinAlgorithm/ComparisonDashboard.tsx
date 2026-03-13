import { motion } from 'framer-motion';
import { useJoinAlgorithmStore, getAlgorithmComplexity, type JoinAlgorithmType } from '../../../stores/joinAlgorithmStore';
import { Clock, Database, Zap, CheckCircle } from 'lucide-react';

interface AlgorithmInfo {
  type: JoinAlgorithmType;
  name: string;
  timeComplexity: string;
  spaceComplexity: string;
  bestFor: string;
  pros: string[];
  cons: string[];
}

const algorithmData: AlgorithmInfo[] = [
  {
    type: 'NestedLoop',
    name: 'Nested Loop Join',
    timeComplexity: 'O(N × M)',
    spaceComplexity: 'O(1)',
    bestFor: 'Small tables, indexed inner',
    pros: ['Simple implementation', 'No memory overhead', 'Works with any join condition'],
    cons: ['Very slow for large tables', 'Quadratic time complexity'],
  },
  {
    type: 'HashJoin',
    name: 'Hash Join',
    timeComplexity: 'O(N + M)',
    spaceComplexity: 'O(M)',
    bestFor: 'Large tables, equality joins',
    pros: ['Fastest for large datasets', 'Linear time complexity', 'Efficient for equality joins'],
    cons: ['Requires hash table memory', 'Only works with equality (=)', 'Hash collision overhead'],
  },
  {
    type: 'MergeJoin',
    name: 'Merge Join',
    timeComplexity: 'O(N log N + M log M)',
    spaceComplexity: 'O(N + M) or O(1)',
    bestFor: 'Pre-sorted data, range queries',
    pros: ['Good for sorted data', 'Can use indexes', 'Works with range conditions'],
    cons: ['Requires sorting first', 'More complex implementation', 'Sorting overhead if not pre-sorted'],
  },
];

export function ComparisonDashboard() {
  const { algorithm: currentAlgorithm, results, comparisons } = useJoinAlgorithmStore();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Algorithm Comparison
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {algorithmData.map((algo) => {
          const isSelected = currentAlgorithm === algo.type;
          
          return (
            <motion.div
              key={algo.type}
              animate={{
                scale: isSelected ? 1.02 : 1,
                borderColor: isSelected ? getBorderColor(algo.type) : 'transparent',
              }}
              className={`
                p-4 rounded-lg border-2 transition-colors
                ${isSelected ? 'bg-opacity-10' : 'bg-gray-50 dark:bg-gray-900/50'}
                ${isSelected ? getBgColor(algo.type) : ''}
              `}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-white">{algo.name}</h4>
                {isSelected && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="px-2 py-1 bg-green-500 text-white text-xs rounded-full"
                  >
                    Active
                  </motion.span>
                )}
              </div>

              {/* Complexity Metrics */}
              <div className="space-y-2 mb-4">
                <MetricRow
                  icon={<Clock className="w-4 h-4" />}
                  label="Time"
                  value={algo.timeComplexity}
                  highlight={isSelected}
                />
                <MetricRow
                  icon={<Database className="w-4 h-4" />}
                  label="Space"
                  value={algo.spaceComplexity}
                  highlight={isSelected}
                />
                <MetricRow
                  icon={<Zap className="w-4 h-4" />}
                  label="Best For"
                  value={algo.bestFor}
                  highlight={isSelected}
                />
              </div>

              {/* Pros */}
              <div className="mb-3">
                <h5 className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">
                  Pros
                </h5>
                <ul className="space-y-1">
                  {algo.pros.map((pro, idx) => (
                    <li key={idx} className="flex items-start gap-1 text-xs text-gray-600 dark:text-gray-400">
                      <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cons */}
              <div>
                <h5 className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">
                  Cons
                </h5>
                <ul className="space-y-1">
                  {algo.cons.map((con, idx) => (
                    <li key={idx} className="flex items-start gap-1 text-xs text-gray-600 dark:text-gray-400">
                      <span className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0">×</span>
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Performance Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Current Run Statistics
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBox
            label="Algorithm"
            value={algorithmData.find(a => a.type === currentAlgorithm)?.name || currentAlgorithm}
            color="indigo"
          />
          <StatBox
            label="Comparisons Made"
            value={comparisons.toString()}
            color="blue"
          />
          <StatBox
            label="Results Found"
            value={results.length.toString()}
            color="green"
          />
          <StatBox
            label="Complexity"
            value={getAlgorithmComplexity(currentAlgorithm)}
            color="purple"
          />
        </div>
      </div>
    </div>
  );
}

function getBorderColor(type: JoinAlgorithmType): string {
  switch (type) {
    case 'NestedLoop':
      return 'rgb(236, 72, 153)';
    case 'HashJoin':
      return 'rgb(168, 85, 247)';
    case 'MergeJoin':
      return 'rgb(20, 184, 166)';
    default:
      return 'rgb(99, 102, 241)';
  }
}

function getBgColor(type: JoinAlgorithmType): string {
  switch (type) {
    case 'NestedLoop':
      return 'bg-pink-100 dark:bg-pink-900/20';
    case 'HashJoin':
      return 'bg-purple-100 dark:bg-purple-900/20';
    case 'MergeJoin':
      return 'bg-teal-100 dark:bg-teal-900/20';
    default:
      return 'bg-indigo-100 dark:bg-indigo-900/20';
  }
}

interface MetricRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight: boolean;
}

function MetricRow({ icon, label, value, highlight }: MetricRowProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-400">{icon}</span>
      <span className="text-gray-500 dark:text-gray-400">{label}:</span>
      <span className={`font-mono font-medium ${highlight ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
        {value}
      </span>
    </div>
  );
}

interface StatBoxProps {
  label: string;
  value: string;
  color: 'indigo' | 'blue' | 'green' | 'purple';
}

function StatBox({ label, value, color }: StatBoxProps) {
  const colorClasses = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-900 dark:text-indigo-200',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-200',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-200',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-900 dark:text-purple-200',
  };

  return (
    <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
      <div className="text-xs opacity-80 mb-1">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}
