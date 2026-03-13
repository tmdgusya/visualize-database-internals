import { motion } from 'framer-motion';
import { useBufferPoolStore } from '../../../stores/bufferPoolStore';
import type { BufferState } from '../../../types';

const getStateColor = (state: BufferState): string => {
  switch (state) {
    case 'empty':
      return 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600';
    case 'clean':
      return 'bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700';
    case 'dirty':
      return 'bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-green-700';
    case 'pinned':
      return 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700';
    default:
      return 'bg-gray-200 dark:bg-gray-700';
  }
};

const getStateTextColor = (state: BufferState): string => {
  switch (state) {
    case 'empty':
      return 'text-gray-400 dark:text-gray-500';
    case 'clean':
      return 'text-green-700 dark:text-green-300';
    case 'dirty':
      return 'text-red-700 dark:text-red-300';
    case 'pinned':
      return 'text-blue-700 dark:text-blue-300';
    default:
      return 'text-gray-400';
  }
};

interface BufferCellProps {
  bufferId: number;
  blocknum: number;
  usageCount: number;
  pinCount: number;
  isDirty: boolean;
  state: BufferState;
  isSelected: boolean;
  onClick: () => void;
}

function BufferCell({
  bufferId,
  blocknum,
  usageCount,
  pinCount,
  isDirty,
  state,
  isSelected,
  onClick,
}: BufferCellProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        relative p-2 rounded-lg border-2 transition-all duration-200
        ${getStateColor(state)}
        ${isSelected ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-gray-800' : ''}
        min-h-[60px] flex flex-col items-center justify-center
      `}
      title={`Buffer ${bufferId}: Block ${blocknum !== -1 ? blocknum : 'Empty'}`}
    >
      <span className={`text-xs font-mono font-semibold ${getStateTextColor(state)}`}>
        #{bufferId}
      </span>
      {state !== 'empty' && (
        <>
          <span className={`text-xs ${getStateTextColor(state)}`}>
            B:{blocknum}
          </span>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[10px] opacity-75">
              U:{usageCount}
            </span>
            {pinCount > 0 && (
              <span className="text-[10px] bg-blue-500 text-white px-1 rounded">
                P:{pinCount}
              </span>
            )}
            {isDirty && (
              <span className="text-[10px] bg-red-500 text-white px-1 rounded">
                D
              </span>
            )}
          </div>
        </>
      )}
    </motion.button>
  );
}

export function BufferGrid() {
  const { buffers, selectedBufferId, selectBuffer, size } = useBufferPoolStore();

  // Calculate grid columns based on pool size
  const getGridCols = () => {
    if (size <= 16) return 'grid-cols-4';
    if (size <= 32) return 'grid-cols-8';
    if (size <= 64) return 'grid-cols-8';
    if (size <= 128) return 'grid-cols-16';
    return 'grid-cols-16';
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          Buffer Pool Grid
        </h4>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded" />
            <span className="text-gray-600 dark:text-gray-400">Empty</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-100 dark:bg-green-900/40 border border-green-300 dark:border-green-700 rounded" />
            <span className="text-gray-600 dark:text-gray-400">Clean</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700 rounded" />
            <span className="text-gray-600 dark:text-gray-400">Dirty</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-100 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700 rounded" />
            <span className="text-gray-600 dark:text-gray-400">Pinned</span>
          </div>
        </div>
      </div>

      <div className={`grid ${getGridCols()} gap-2`}>
        {buffers.map((buffer) => (
          <BufferCell
            key={buffer.bufferId}
            bufferId={buffer.bufferId}
            blocknum={buffer.blocknum}
            usageCount={buffer.usageCount}
            pinCount={buffer.pinCount}
            isDirty={buffer.isDirty}
            state={buffer.state}
            isSelected={selectedBufferId === buffer.bufferId}
            onClick={() => selectBuffer(buffer.bufferId)}
          />
        ))}
      </div>
    </div>
  );
}
