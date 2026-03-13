import { motion } from 'framer-motion';
import { useJoinAlgorithmStore, getAlgorithmComplexity, getAlgorithmDescription, type JoinAlgorithmType } from '../../../stores/joinAlgorithmStore';
import { Repeat, Database, ArrowLeftRight, Check } from 'lucide-react';

const algorithms: { type: JoinAlgorithmType; name: string; icon: React.ReactNode; color: string }[] = [
  {
    type: 'NestedLoop',
    name: 'Nested Loop Join',
    icon: <Repeat className="w-6 h-6" />,
    color: 'pink',
  },
  {
    type: 'HashJoin',
    name: 'Hash Join',
    icon: <Database className="w-6 h-6" />,
    color: 'purple',
  },
  {
    type: 'MergeJoin',
    name: 'Merge Join',
    icon: <ArrowLeftRight className="w-6 h-6" />,
    color: 'teal',
  },
];

const colorClasses: Record<string, { bg: string; border: string; text: string; selected: string }> = {
  pink: {
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    border: 'border-pink-200 dark:border-pink-800',
    text: 'text-pink-600 dark:text-pink-400',
    selected: 'ring-2 ring-pink-500 border-pink-500',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-600 dark:text-purple-400',
    selected: 'ring-2 ring-purple-500 border-purple-500',
  },
  teal: {
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    border: 'border-teal-200 dark:border-teal-800',
    text: 'text-teal-600 dark:text-teal-400',
    selected: 'ring-2 ring-teal-500 border-teal-500',
  },
};

export function AlgorithmSelector() {
  const { algorithm: selectedAlgorithm, setAlgorithm } = useJoinAlgorithmStore();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {algorithms.map((algo) => {
        const isSelected = selectedAlgorithm === algo.type;
        const colors = colorClasses[algo.color];
        const complexity = getAlgorithmComplexity(algo.type);
        const description = getAlgorithmDescription(algo.type);

        return (
          <motion.button
            key={algo.type}
            onClick={() => setAlgorithm(algo.type)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative p-4 rounded-lg border-2 text-left transition-all duration-200
              ${colors.bg} ${colors.border}
              ${isSelected ? colors.selected : 'hover:border-opacity-70'}
            `}
          >
            {/* Selected Indicator */}
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`absolute top-2 right-2 p-1 rounded-full bg-${algo.color}-500`}
              >
                <Check className="w-3 h-3 text-white" />
              </motion.div>
            )}

            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg bg-white dark:bg-gray-800 ${colors.text}`}>
                {algo.icon}
              </div>
              <div className="flex-1">
                <h4 className={`font-semibold ${colors.text}`}>
                  {algo.name}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {description}
                </p>
                <div className={`inline-block mt-2 px-2 py-1 rounded text-xs font-mono font-medium bg-white dark:bg-gray-800 ${colors.text}`}>
                  {complexity}
                </div>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
