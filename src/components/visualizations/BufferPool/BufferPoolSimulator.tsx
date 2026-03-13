import { useState } from 'react';
import { motion } from 'framer-motion';
import { useBufferPoolStore } from '../../../stores/bufferPoolStore';
import { BufferGrid } from './BufferGrid';
import { ClockSweepAnimation } from './ClockSweepAnimation';
import { BufferDetail } from './BufferDetail';
import { AccessPatternInput } from './AccessPatternInput';
import { PoolControls } from './PoolControls';
import { Database, BarChart3, Settings } from 'lucide-react';

export function BufferPoolSimulator() {
  const [activeTab, setActiveTab] = useState<'visual' | 'settings'>('visual');
  const {
    size,
    accessCount,

    accessLog,
    selectedBufferId,
    getHitRate,
    getMissRate,
    getDirtyCount,
    getPinnedCount,
  } = useBufferPoolStore();

  const hitRate = getHitRate();
  const missRate = getMissRate();
  const dirtyCount = getDirtyCount();
  const pinnedCount = getPinnedCount();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Buffer Pool (Shared Buffers)
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                PostgreSQL의 공유 버퍼 풀과 Clock Sweep 알고리즘 시각화
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">Pool Size:</span>
            <span className="font-mono font-medium text-blue-600 dark:text-blue-400">
              {size} buffers
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">Hit Rate:</span>
            <span className="font-mono font-medium text-green-600 dark:text-green-400">
              {hitRate.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">Miss Rate:</span>
            <span className="font-mono font-medium text-red-600 dark:text-red-400">
              {missRate.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">Dirty Pages:</span>
            <span className="font-mono font-medium text-orange-600 dark:text-orange-400">
              {dirtyCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">Pinned Pages:</span>
            <span className="font-mono font-medium text-purple-600 dark:text-purple-400">
              {pinnedCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">Total Access:</span>
            <span className="font-mono font-medium text-gray-600 dark:text-gray-400">
              {accessCount}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 pt-4">
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('visual')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'visual'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Visual
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'settings'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {activeTab === 'visual' ? (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left: Buffer Grid */}
            <div className="xl:col-span-2 space-y-6">
              <div className="relative">
                <BufferGrid />
                <ClockSweepAnimation />
              </div>
              <AccessPatternInput />
            </div>

            {/* Right: Controls & Details */}
            <div className="space-y-4">
              <PoolControls />
              {selectedBufferId !== null && <BufferDetail bufferId={selectedBufferId} />}

              {/* Access Log */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Recent Access Log
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {accessLog.slice(0, 10).map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center justify-between text-xs p-2 rounded ${
                        entry.result === 'hit'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                      }`}
                    >
                      <span>Block {entry.blocknum}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">Buffer {entry.bufferId}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-medium ${
                            entry.result === 'hit'
                              ? 'bg-green-200 dark:bg-green-800'
                              : 'bg-red-200 dark:bg-red-800'
                          }`}
                        >
                          {entry.result.toUpperCase()}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                  {accessLog.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      No access records yet
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl">
            <PoolControls showAll />
          </div>
        )}
      </div>
    </div>
  );
}
