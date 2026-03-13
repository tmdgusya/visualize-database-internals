import { motion } from 'framer-motion';
import { useJoinAlgorithmStore } from '../../../stores/joinAlgorithmStore';
import { AlgorithmSelector } from './AlgorithmSelector';
import { NestedLoopAnimation } from './NestedLoopAnimation';
import { HashJoinAnimation } from './HashJoinAnimation';
import { MergeJoinAnimation } from './MergeJoinAnimation';
import { ComparisonDashboard } from './ComparisonDashboard';
import { JoinControls } from './JoinControls';
import { GitMerge, BarChart3, Activity } from 'lucide-react';

export function JoinAlgorithmAnimator() {
  const { algorithm, currentStep, animationSteps, results, comparisons, isPlaying } = useJoinAlgorithmStore();

  const currentStepData = animationSteps[currentStep];
  const progress = animationSteps.length > 0 ? (currentStep / (animationSteps.length - 1)) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <GitMerge className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Join Algorithm Animator
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Visualize how PostgreSQL executes different join algorithms
            </p>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Activity className="w-4 h-4" />}
            label="Current Step"
            value={`${currentStep} / ${animationSteps.length > 0 ? animationSteps.length - 1 : 0}`}
            color="indigo"
          />
          <StatCard
            icon={<BarChart3 className="w-4 h-4" />}
            label="Comparisons"
            value={comparisons.toString()}
            color="blue"
          />
          <StatCard
            icon={<GitMerge className="w-4 h-4" />}
            label="Results"
            value={results.length.toString()}
            color="green"
          />
          <StatCard
            icon={<Activity className="w-4 h-4" />}
            label="Status"
            value={isPlaying ? 'Playing' : currentStep === 0 ? 'Ready' : 'Paused'}
            color={isPlaying ? 'green' : currentStep === 0 ? 'gray' : 'yellow'}
          />
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-indigo-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Algorithm Selector */}
      <AlgorithmSelector />

      {/* Animation Area */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        {algorithm === 'NestedLoop' && <NestedLoopAnimation />}
        {algorithm === 'HashJoin' && <HashJoinAnimation />}
        {algorithm === 'MergeJoin' && <MergeJoinAnimation />}
      </div>

      {/* Current Step Message */}
      {currentStepData && (
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800"
        >
          <p className="text-indigo-900 dark:text-indigo-200 font-medium">
            {currentStepData.message}
          </p>
        </motion.div>
      )}

      {/* Controls */}
      <JoinControls />

      {/* Comparison Dashboard */}
      <ComparisonDashboard />
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'indigo' | 'blue' | 'green' | 'yellow' | 'gray';
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    gray: 'bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400',
  };

  return (
    <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-medium opacity-80">{label}</span>
      </div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}
