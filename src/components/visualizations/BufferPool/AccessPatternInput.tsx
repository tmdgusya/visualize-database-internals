import { useState } from 'react';
import { motion } from 'framer-motion';
import { useBufferPoolStore } from '../../../stores/bufferPoolStore';
import { Play, RotateCcw, Zap } from 'lucide-react';

const PRESET_PATTERNS = [
  { name: 'Sequential', pattern: '1,2,3,4,5,6,7,8,9,10' },
  { name: 'Random', pattern: '5,2,8,1,9,3,7,4,6,10' },
  { name: 'Repeated', pattern: '1,2,3,1,2,3,1,2,3,1' },
  { name: 'Loop', pattern: '1,2,3,4,5,1,2,3,4,5' },
];

export function AccessPatternInput() {
  const [input, setInput] = useState('1,2,3,4,5,1,2,3,4,5');
  const [error, setError] = useState('');
  const { accessPages, accessPage, resetPool, isAnimating } = useBufferPoolStore();

  const parsePattern = (value: string): number[] | null => {
    try {
      const trimmed = value.trim();
      if (!trimmed) return null;

      const parts = trimmed.split(/[,\s]+/);
      const numbers = parts
        .map((p) => parseInt(p.trim(), 10))
        .filter((n) => !isNaN(n));

      if (numbers.length === 0) return null;
      if (numbers.some((n) => n < 0)) return null;

      return numbers;
    } catch {
      return null;
    }
  };

  const handleRun = () => {
    const pattern = parsePattern(input);
    if (!pattern) {
      setError('Please enter valid block numbers (e.g., 1,2,3,4,5)');
      return;
    }
    setError('');
    accessPages(pattern);
  };

  const handleStep = () => {
    const pattern = parsePattern(input);
    if (!pattern || pattern.length === 0) {
      setError('Please enter valid block numbers');
      return;
    }
    setError('');

    // Access just the first page in the pattern
    accessPage(pattern[0]);

    // Remove the first element from input
    const remaining = pattern.slice(1);
    setInput(remaining.join(','));
  };

  const handleReset = () => {
    resetPool();
    setError('');
  };

  const applyPreset = (pattern: string) => {
    setInput(pattern);
    setError('');
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          Access Pattern Simulation
        </h4>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Pool
          </button>
        </div>
      </div>

      {/* Preset Patterns */}
      <div className="flex flex-wrap gap-2 mb-4">
        {PRESET_PATTERNS.map((preset) => (
          <button
            key={preset.name}
            onClick={() => applyPreset(preset.pattern)}
            className="px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-full transition-colors"
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Block Access Sequence (comma-separated)
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError('');
            }}
            placeholder="e.g., 1,2,3,2,4,1"
            className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
            disabled={isAnimating}
          />
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-red-500 mt-1"
            >
              {error}
            </motion.p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleRun}
            disabled={isAnimating}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Play className="w-4 h-4" />
            {isAnimating ? 'Running...' : 'Run Simulation'}
          </button>
          <button
            onClick={handleStep}
            disabled={isAnimating}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Zap className="w-4 h-4" />
            Step
          </button>
        </div>
      </div>

      {/* Hint */}
      <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
        Enter block numbers separated by commas. The simulator will show hit/miss behavior
        using the Clock Sweep algorithm.
      </p>
    </div>
  );
}
