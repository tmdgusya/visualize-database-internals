import { motion } from 'framer-motion';
import { useJoinAlgorithmStore } from '../../../stores/joinAlgorithmStore';
import { Play, Pause, SkipForward, RotateCcw, FastForward, Database } from 'lucide-react';

export function JoinControls() {
  const {
    isPlaying,
    currentStep,
    animationSteps,
    animationSpeed,
    tableSize,
    play,
    pause,
    step,
    reset,
    generateTables,
    setAnimationSpeed,
    setTableSize,
  } = useJoinAlgorithmStore();

  const isComplete = currentStep >= animationSteps.length - 1;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Playback Controls */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Playback:</span>
          
          {isPlaying ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={pause}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              <Pause className="w-4 h-4" />
              Pause
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={play}
              disabled={isComplete}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              {isComplete ? 'Finished' : 'Play'}
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={step}
            disabled={isComplete || isPlaying}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SkipForward className="w-4 h-4" />
            Step
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </motion.button>
        </div>

        <div className="hidden lg:block w-px bg-gray-200 dark:bg-gray-700" />

        {/* Speed Control */}
        <div className="flex items-center gap-3">
          <FastForward className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Speed:</span>
          <select
            value={animationSpeed}
            onChange={(e) => setAnimationSpeed(Number(e.target.value))}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value={1500}>Slow (1.5s)</option>
            <option value={800}>Normal (0.8s)</option>
            <option value={400}>Fast (0.4s)</option>
            <option value={200}>Very Fast (0.2s)</option>
          </select>
        </div>

        <div className="hidden lg:block w-px bg-gray-200 dark:bg-gray-700" />

        {/* Table Size Control */}
        <div className="flex items-center gap-3">
          <Database className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Table Size:</span>
          <input
            type="range"
            min="3"
            max="8"
            value={tableSize}
            onChange={(e) => setTableSize(Number(e.target.value))}
            className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <span className="text-sm font-mono text-gray-900 dark:text-white w-8">{tableSize}</span>
        </div>

        <div className="hidden lg:block w-px bg-gray-200 dark:bg-gray-700" />

        {/* Regenerate Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => generateTables()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Database className="w-4 h-4" />
          New Data
        </motion.button>
      </div>

      {/* Progress Info */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Step {currentStep} of {animationSteps.length > 0 ? animationSteps.length - 1 : 0}
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            {Math.round((currentStep / Math.max(1, animationSteps.length - 1)) * 100)}% complete
          </span>
        </div>
      </div>
    </div>
  );
}
