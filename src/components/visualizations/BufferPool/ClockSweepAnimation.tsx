import { motion } from 'framer-motion';
import { useBufferPoolStore } from '../../../stores/bufferPoolStore';

export function ClockSweepAnimation() {
  const { clockHand, size, buffers, isAnimating } = useBufferPoolStore();

  // Calculate grid dimensions
  const getGridCols = () => {
    if (size <= 16) return 4;
    if (size <= 32) return 8;
    if (size <= 64) return 8;
    return 16;
  };

  const cols = getGridCols();
  const rows = Math.ceil(size / cols);

  // Calculate position of clock hand
  const row = Math.floor(clockHand / cols);
  const col = clockHand % cols;

  // Cell dimensions (approximate based on grid)
  const cellWidth = 100 / cols;
  const cellHeight = 100 / rows;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Clock hand indicator */}
      <motion.div
        className="absolute"
        initial={false}
        animate={{
          left: `${col * cellWidth + cellWidth / 2}%`,
          top: `${row * cellHeight + cellHeight / 2}%`,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
        style={{
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Pulsing ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-yellow-400 dark:border-yellow-500"
          animate={{
            scale: isAnimating ? [1, 1.2, 1] : 1,
            opacity: isAnimating ? [1, 0.5, 1] : 1,
          }}
          transition={{
            duration: 0.5,
            repeat: isAnimating ? Infinity : 0,
          }}
          style={{
            width: '40px',
            height: '40px',
            transform: 'translate(-50%, -50%)',
            left: '50%',
            top: '50%',
          }}
        />

        {/* Clock hand arrow */}
        <motion.div
          className="absolute w-0 h-0"
          style={{
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderBottom: '16px solid #fbbf24',
            transform: 'translate(-50%, -50%) rotate(0deg)',
            left: '50%',
            top: '50%',
          }}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* Center dot */}
        <div
          className="absolute w-3 h-3 bg-yellow-500 rounded-full"
          style={{
            transform: 'translate(-50%, -50%)',
            left: '50%',
            top: '50%',
          }}
        />
      </motion.div>

      {/* Usage count indicator for current buffer */}
      {buffers[clockHand] && buffers[clockHand].usageCount > 0 && (
        <motion.div
          className="absolute bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 text-xs font-bold px-2 py-1 rounded shadow-lg"
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: 1,
            scale: 1,
            left: `${col * cellWidth + cellWidth / 2}%`,
            top: `${row * cellHeight + cellHeight / 2 + 10}%`,
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
          }}
          style={{
            transform: 'translateX(-50%)',
          }}
        >
          usage_count: {buffers[clockHand].usageCount}
          {isAnimating && (
            <motion.span
              className="ml-1 text-red-500"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              → {buffers[clockHand].usageCount - 1}
            </motion.span>
          )}
        </motion.div>
      )}

      {/* Clock sweep info */}
      <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-600 dark:text-gray-400">
          Clock Hand Position
        </div>
        <div className="text-lg font-mono font-bold text-yellow-600 dark:text-yellow-400">
          Buffer {clockHand}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          {buffers[clockHand]?.usageCount === 0
            ? 'Can be replaced (usage_count = 0)'
            : `Second chance (usage_count = ${buffers[clockHand]?.usageCount})`}
        </div>
      </div>
    </div>
  );
}
