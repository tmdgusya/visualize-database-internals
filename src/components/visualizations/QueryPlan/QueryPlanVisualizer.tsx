import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQueryPlanStore } from '../../../stores/queryPlanStore';
import { PlanTreeCanvas } from './PlanTreeCanvas';
import { PlanNodeDetail } from './PlanNodeDetail';
import { SQLInput } from './SQLInput';
import { ExecutionAnimator } from './ExecutionAnimator';
import { CostBreakdown } from './CostBreakdown';
import { StatisticsPanel } from './StatisticsPanel';
import { GitBranch, BarChart3, Code2, PlayCircle, PieChart, Activity } from 'lucide-react';

export function QueryPlanVisualizer() {
  const [activeTab, setActiveTab] = useState<'plan' | 'sql' | 'execution' | 'statistics'>('plan');
  const {
    planTree,
    selectedNode,
    getTotalCost,
    getTotalRows,
    getNodeCount,
    executionLog,
    executionState,
  } = useQueryPlanStore();

  const totalCost = getTotalCost();
  const totalRows = getTotalRows();
  const nodeCount = getNodeCount();

  // Calculate actual stats from execution log
  const actualRows = executionLog.reduce((sum, log) => sum + log.rows, 0);
  const executionTime = executionLog.reduce((sum, log) => sum + log.time, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <GitBranch className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Query Execution Plan
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                PostgreSQL 쿼리 플랜 트리 및 실행 시각화
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-6 py-3 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800">
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">Estimated Rows:</span>
            <span className="font-mono font-medium text-indigo-600 dark:text-indigo-400">
              {totalRows.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">Actual Rows:</span>
            <span className="font-mono font-medium text-green-600 dark:text-green-400">
              {executionState === 'idle' ? '-' : actualRows.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">Total Cost:</span>
            <span className="font-mono font-medium text-blue-600 dark:text-blue-400">
              {totalCost.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">Execution Time:</span>
            <span className="font-mono font-medium text-purple-600 dark:text-purple-400">
              {executionState === 'idle' ? '-' : `${executionTime.toFixed(2)} ms`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">Plan Nodes:</span>
            <span className="font-mono font-medium text-orange-600 dark:text-orange-400">
              {nodeCount}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 pt-4">
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('plan')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'plan'
                ? 'bg-indigo-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            Plan Tree
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'sql'
                ? 'bg-indigo-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Code2 className="w-4 h-4" />
            SQL
          </button>
          <button
            onClick={() => setActiveTab('execution')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'execution'
                ? 'bg-indigo-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <PlayCircle className="w-4 h-4" />
            Execution
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'statistics'
                ? 'bg-indigo-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Statistics
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {activeTab === 'plan' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 xl:grid-cols-3 gap-6"
          >
            {/* Left: Plan Tree Visualization */}
            <div className="xl:col-span-2">
              {planTree ? (
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <PlanTreeCanvas />
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
                  <GitBranch className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-2">
                    No query plan generated yet
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Enter a SQL query in the SQL tab to generate a plan
                  </p>
                </div>
              )}
            </div>

            {/* Right: Node Details */}
            <div className="space-y-4">
              {selectedNode ? (
                <PlanNodeDetail nodeId={selectedNode} />
              ) : (
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700 text-center">
                  <Activity className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Click on a plan node to view its details
                  </p>
                </div>
              )}

              {/* Cost Breakdown */}
              {planTree && (
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-3">
                    <PieChart className="w-4 h-4 text-indigo-500" />
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Cost Breakdown
                    </h4>
                  </div>
                  <CostBreakdown compact />
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'sql' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <SQLInput />
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Query Plan Types
                </h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500">•</span>
                    <span>
                      <strong>Seq Scan:</strong> Sequential table scan - reads all rows
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500">•</span>
                    <span>
                      <strong>Index Scan:</strong> Uses index to find rows, then fetches from heap
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500">•</span>
                    <span>
                      <strong>Index Only Scan:</strong> Reads only from index (covering index)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500">•</span>
                    <span>
                      <strong>Bitmap Scan:</strong> Builds bitmap of matching rows, then fetches
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500">•</span>
                    <span>
                      <strong>Nested Loop:</strong> Joins by iterating outer and inner relations
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500">•</span>
                    <span>
                      <strong>Hash Join:</strong> Builds hash table on inner, probes with outer
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500">•</span>
                    <span>
                      <strong>Merge Join:</strong> Sorts both inputs and merges them
                    </span>
                  </li>
                </ul>
              </div>

              {planTree && (
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Current Plan Summary
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Root Node:</span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400">
                        {planTree.type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Nodes:</span>
                      <span className="font-mono text-gray-900 dark:text-white">
                        {nodeCount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Plan Depth:</span>
                      <span className="font-mono text-gray-900 dark:text-white">
                        {useQueryPlanStore.getState().getMaxDepth()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Startup Cost:</span>
                      <span className="font-mono text-gray-900 dark:text-white">
                        {planTree.cost.startup.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Cost:</span>
                      <span className="font-mono text-gray-900 dark:text-white">
                        {planTree.cost.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'execution' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {planTree ? (
              <ExecutionAnimator />
            ) : (
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
                <PlayCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  No query plan to execute
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Generate a plan first by entering a SQL query
                </p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'statistics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {planTree ? (
              <StatisticsPanel />
            ) : (
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
                <BarChart3 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  No statistics available
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Generate a plan first to view statistics
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
