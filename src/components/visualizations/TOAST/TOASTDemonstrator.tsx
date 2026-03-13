import { motion } from 'framer-motion';
import { useToastStore } from '../../../stores/toastStore';
import { TOASTDecisionFlowchart } from './TOASTDecisionFlowchart';
import { TOASTComparison } from './TOASTComparison';
import { TOASTChunkVisualizer } from './TOASTChunkVisualizer';
import { TOASTPointerView } from './TOASTPointerView';
import { TOASTControls } from './TOASTControls';
import { Database, Layers, GitCompare, Grid3X3 } from 'lucide-react';

export function TOASTDemonstrator() {
  const {
    dataSize,
    strategy,
    compression,
    chunks,
    compressionRatio,
    mainTablePointer,
    activeTab,
    setActiveTab
  } = useToastStore();

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Database className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                TOAST (Oversized-Attribute Storage)
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                PostgreSQL의 대용량 데이터 저장 메커니즘 시각화
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-6 py-3 bg-orange-50 dark:bg-orange-900/20 border-b border-orange-100 dark:border-orange-800">
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">Data Size:</span>
            <span className="font-mono font-medium text-orange-600 dark:text-orange-400">
              {formatBytes(dataSize)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">Strategy:</span>
            <span className="font-mono font-medium text-blue-600 dark:text-blue-400">
              {strategy}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">Compression:</span>
            <span className="font-mono font-medium text-green-600 dark:text-green-400">
              {compression}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">Chunk Count:</span>
            <span className="font-mono font-medium text-purple-600 dark:text-purple-400">
              {chunks.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">Compression Ratio:</span>
            <span className="font-mono font-medium text-pink-600 dark:text-pink-400">
              {(compressionRatio * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">Main Table Size:</span>
            <span className="font-mono font-medium text-teal-600 dark:text-teal-400">
              {formatBytes(mainTablePointer.size)}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 pt-4">
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('flowchart')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'flowchart'
                ? 'bg-orange-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            Flowchart
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'comparison'
                ? 'bg-orange-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <GitCompare className="w-4 h-4" />
            Comparison
          </button>
          <button
            onClick={() => setActiveTab('chunks')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'chunks'
                ? 'bg-orange-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
            Chunks
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left: Main Visualization */}
          <div className="xl:col-span-2">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {activeTab === 'flowchart' && <TOASTDecisionFlowchart />}
              {activeTab === 'comparison' && <TOASTComparison />}
              {activeTab === 'chunks' && <TOASTChunkVisualizer />}
            </motion.div>
          </div>

          {/* Right: Controls & Details */}
          <div className="space-y-4">
            <TOASTControls />
            <TOASTPointerView />
          </div>
        </div>
      </div>
    </div>
  );
}
