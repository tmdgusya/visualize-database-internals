import { useState } from 'react';
import { motion } from 'framer-motion';
import { useBTreeStore } from '../../../stores/btreeStore';
import { BTreeCanvas } from './BTreeCanvas';
import { BTreeNodeDetail } from './BTreeNodeDetail';
import { BTreeOperations } from './BTreeOperations';
import { BTreeSettings } from './BTreeSettings';
import { TreePine, BarChart3, Settings, Layers } from 'lucide-react';

export function BTreeVisualizer() {
  const [activeTab, setActiveTab] = useState<'tree' | 'operations' | 'settings'>('tree');
  const {
    tree,
    selectedNode,
    getTreeHeight,
    getNodeCount,
    getKeyCount,
  } = useBTreeStore();

  const height = getTreeHeight();
  const nodeCount = getNodeCount();
  const keyCount = getKeyCount();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TreePine className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                B-Tree Index
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                PostgreSQL B-Tree 인덱스 구조와 연산 시각화
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-6 py-3 bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800">
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">Tree Height:</span>
            <span className="font-mono font-medium text-green-600 dark:text-green-400">
              {height}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">Node Count:</span>
            <span className="font-mono font-medium text-blue-600 dark:text-blue-400">
              {nodeCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">Key Count:</span>
            <span className="font-mono font-medium text-purple-600 dark:text-purple-400">
              {keyCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">Order (Fanout):</span>
            <span className="font-mono font-medium text-orange-600 dark:text-orange-400">
              {tree.order}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">Max Keys/Node:</span>
            <span className="font-mono font-medium text-gray-600 dark:text-gray-400">
              {tree.order - 1}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">Min Keys/Node:</span>
            <span className="font-mono font-medium text-gray-600 dark:text-gray-400">
              {Math.ceil(tree.order / 2) - 1}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 pt-4">
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('tree')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'tree'
                ? 'bg-green-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            Tree
          </button>
          <button
            onClick={() => setActiveTab('operations')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'operations'
                ? 'bg-green-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Operations
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'settings'
                ? 'bg-green-500 text-white'
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
        {activeTab === 'tree' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left: Tree Visualization */}
            <div className="xl:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <BTreeCanvas />
              </motion.div>
            </div>

            {/* Right: Node Details */}
            <div className="space-y-4">
              {selectedNode ? (
                <BTreeNodeDetail nodeId={selectedNode} />
              ) : (
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700 text-center">
                  <TreePine className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Click on a node to view its details
                  </p>
                </div>
              )}
              
              {/* Quick Operations */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Quick Operations
                </h4>
                <BTreeOperations compact />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'operations' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <BTreeOperations />
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                B-Tree Properties
              </h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  <span>All leaf nodes are at the same depth</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  <span>Each node has at most {tree.order - 1} keys</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  <span>Each non-root node has at least {Math.ceil(tree.order / 2) - 1} keys</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  <span>Internal nodes have (keys + 1) children</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  <span>Leaf nodes are linked for range scans</span>
                </li>
              </ul>
            </div>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <BTreeSettings />
          </motion.div>
        )}
      </div>
    </div>
  );
}
