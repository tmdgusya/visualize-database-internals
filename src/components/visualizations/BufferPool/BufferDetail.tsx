import { motion } from 'framer-motion';
import { useBufferPoolStore } from '../../../stores/bufferPoolStore';
import { Pin, PinOff, Save, Trash2 } from 'lucide-react';

interface BufferDetailProps {
  bufferId: number;
}

export function BufferDetail({ bufferId }: BufferDetailProps) {
  const { buffers, pinBuffer, unpinBuffer, toggleDirty, selectBuffer } = useBufferPoolStore();
  const buffer = buffers[bufferId];

  if (!buffer) return null;

  const getStateBadgeColor = () => {
    switch (buffer.state) {
      case 'empty':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
      case 'clean':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'dirty':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'pinned':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      default:
        return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          Buffer Details
        </h4>
        <button
          onClick={() => selectBuffer(null)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {/* Buffer ID */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Buffer ID</span>
          <span className="font-mono font-medium text-gray-900 dark:text-white">
            #{buffer.bufferId}
          </span>
        </div>

        {/* State */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">State</span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStateBadgeColor()}`}
          >
            {buffer.state.toUpperCase()}
          </span>
        </div>

        {/* Block Number */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Block Number</span>
          <span className="font-mono font-medium text-gray-900 dark:text-white">
            {buffer.blocknum === -1 ? 'N/A' : buffer.blocknum}
          </span>
        </div>

        {/* Relfilenode */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Relfilenode</span>
          <span className="font-mono font-medium text-gray-900 dark:text-white">
            {buffer.relfilenode || 'N/A'}
          </span>
        </div>

        {/* Fork Number */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Fork Number</span>
          <span className="font-mono font-medium text-gray-900 dark:text-white">
            {buffer.forknum}
          </span>
        </div>

        {/* Usage Count */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Usage Count</span>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-4 rounded-sm ${
                    i < buffer.usageCount
                      ? 'bg-yellow-400 dark:bg-yellow-500'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              ))}
            </div>
            <span className="font-mono text-sm text-gray-900 dark:text-white">
              {buffer.usageCount}
            </span>
          </div>
        </div>

        {/* Pin Count */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Pin Count</span>
          <span className="font-mono font-medium text-gray-900 dark:text-white">
            {buffer.pinCount}
          </span>
        </div>

        {/* Dirty Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Dirty</span>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              buffer.isDirty
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
            }`}
          >
            {buffer.isDirty ? 'YES' : 'NO'}
          </span>
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => pinBuffer(bufferId)}
              disabled={buffer.state === 'empty'}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Pin className="w-4 h-4" />
              Pin
            </button>
            <button
              onClick={() => unpinBuffer(bufferId)}
              disabled={buffer.pinCount === 0}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <PinOff className="w-4 h-4" />
              Unpin
            </button>
          </div>
          <button
            onClick={() => toggleDirty(bufferId)}
            disabled={buffer.state === 'empty'}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              buffer.isDirty
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
            } disabled:bg-gray-300 dark:disabled:bg-gray-700`}
          >
            <Save className="w-4 h-4" />
            {buffer.isDirty ? 'Mark Clean' : 'Mark Dirty'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
