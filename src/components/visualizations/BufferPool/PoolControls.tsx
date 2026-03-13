import { useBufferPoolStore } from '../../../stores/bufferPoolStore';
import { Save, RotateCcw } from 'lucide-react';

const POOL_SIZES = [16, 32, 64, 128, 256];

interface PoolControlsProps {
  showAll?: boolean;
}

export function PoolControls({ showAll = false }: PoolControlsProps) {
  const {
    size,
    setPoolSize,
    checkpoint,
    resetPool,
    animationSpeed,
    setAnimationSpeed,
  } = useBufferPoolStore();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
        Pool Configuration
      </h4>

      {/* Pool Size Slider */}
      <div>
        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">
          Buffer Pool Size: <span className="font-mono font-medium text-blue-600 dark:text-blue-400">{size}</span> buffers
        </label>
        <div className="flex flex-wrap gap-2">
          {POOL_SIZES.map((poolSize) => (
            <button
              key={poolSize}
              onClick={() => setPoolSize(poolSize)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                size === poolSize
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {poolSize}
            </button>
          ))}
        </div>
      </div>

      {/* Animation Speed */}
      {showAll && (
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">
            Animation Speed: <span className="font-mono font-medium text-blue-600 dark:text-blue-400">{animationSpeed}ms</span>
          </label>
          <input
            type="range"
            min="100"
            max="2000"
            step="100"
            value={animationSpeed}
            onChange={(e) => setAnimationSpeed(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 mt-1">
            <span>Fast (100ms)</span>
            <span>Slow (2000ms)</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <button
          onClick={checkpoint}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Save className="w-4 h-4" />
          Checkpoint (Flush Dirty)
        </button>
        <button
          onClick={resetPool}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Pool
        </button>
      </div>

      {/* Info */}
      {showAll && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-xs text-blue-800 dark:text-blue-300">
          <p className="font-medium mb-1">About Buffer Pool</p>
          <ul className="space-y-1 text-blue-700 dark:text-blue-400">
            <li>• Each buffer holds one 8KB page</li>
            <li>• Clock Sweep evicts pages with usage_count = 0</li>
            <li>• Pinned buffers cannot be evicted</li>
            <li>• Dirty pages are written on checkpoint</li>
          </ul>
        </div>
      )}
    </div>
  );
}
