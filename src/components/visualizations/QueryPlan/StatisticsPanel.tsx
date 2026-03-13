import { useMemo } from 'react';
import { useQueryPlanStore } from '../../../stores/queryPlanStore';
import {
  BarChart3,
  Clock,
  Database,
  Layers,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

export function StatisticsPanel() {
  const { planTree, executionLog } = useQueryPlanStore();

  const stats = useMemo(() => {
    if (!planTree) return null;

    const nodes: Array<{
      id: string;
      type: string;
      estimatedRows: number;
      actualRows: number;
      cost: number;
      time: number;
      width: number;
    }> = [];

    const traverse = (node: typeof planTree) => {
      const execution = executionLog.find((log) => log.nodeId === node.id);

      nodes.push({
        id: node.id,
        type: node.type,
        estimatedRows: node.rows,
        actualRows: execution?.rows || 0,
        cost: node.cost.total,
        time: execution?.time || 0,
        width: node.width,
      });

      node.children.forEach(traverse);
    };

    traverse(planTree);

    const totalEstimated = nodes.reduce((sum, n) => sum + n.estimatedRows, 0);
    const totalActual = nodes.reduce((sum, n) => sum + n.actualRows, 0);
    const totalTime = nodes.reduce((sum, n) => sum + n.time, 0);
    const maxTime = Math.max(...nodes.map((n) => n.time), 1);

    // Calculate accuracy
    const accuracy =
      totalEstimated > 0
        ? 100 - Math.min(100, Math.abs(totalActual - totalEstimated) / totalEstimated * 100)
        : 100;

    return {
      nodes,
      totalEstimated,
      totalActual,
      totalTime,
      maxTime,
      accuracy,
      nodeCount: nodes.length,
    };
  }, [planTree, executionLog]);

  if (!stats) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
        <BarChart3 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">No statistics available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Total Nodes</span>
          </div>
          <div className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
            {stats.nodeCount}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Est. Rows</span>
          </div>
          <div className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
            {stats.totalEstimated.toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Actual Rows</span>
          </div>
          <div className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
            {executionLog.length > 0 ? stats.totalActual.toLocaleString() : '-'}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Total Time</span>
          </div>
          <div className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
            {executionLog.length > 0 ? `${stats.totalTime.toFixed(2)}ms` : '-'}
          </div>
        </div>
      </div>

      {/* Estimation Accuracy */}
      {executionLog.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Estimation Accuracy
              </h4>
            </div>
            <span
              className={`text-lg font-mono font-bold ${
                stats.accuracy >= 90
                  ? 'text-green-600 dark:text-green-400'
                  : stats.accuracy >= 70
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
              }`}
            >
              {stats.accuracy.toFixed(1)}%
            </span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                stats.accuracy >= 90
                  ? 'bg-green-500'
                  : stats.accuracy >= 70
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${stats.accuracy}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Compares estimated rows vs actual rows processed during execution
          </p>
        </div>
      )}

      {/* Node Statistics Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            Node Statistics
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400">
                  Node Type
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-400">
                  Est. Rows
                </th>
                {executionLog.length > 0 && (
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-400">
                    Actual Rows
                  </th>
                )}
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-400">
                  Cost
                </th>
                {executionLog.length > 0 && (
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-400">
                    Time (ms)
                  </th>
                )}
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-400">
                  Width
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {stats.nodes.map((node) => (
                <tr
                  key={node.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                >
                  <td className="px-4 py-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {node.type}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-gray-600 dark:text-gray-400">
                    {node.estimatedRows.toLocaleString()}
                  </td>
                  {executionLog.length > 0 && (
                    <td className="px-4 py-2 text-right font-mono">
                      {node.actualRows > 0 ? (
                        <span
                          className={
                            Math.abs(node.actualRows - node.estimatedRows) /
                              Math.max(node.estimatedRows, 1) >
                            0.5
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-green-600 dark:text-green-400'
                          }
                        >
                          {node.actualRows.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-2 text-right font-mono text-gray-600 dark:text-gray-400">
                    {node.cost.toFixed(2)}
                  </td>
                  {executionLog.length > 0 && (
                    <td className="px-4 py-2 text-right font-mono">
                      {node.time > 0 ? (
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500"
                              style={{ width: `${(node.time / stats.maxTime) * 100}%` }}
                            />
                          </div>
                          <span className="text-gray-600 dark:text-gray-400">
                            {node.time.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-2 text-right font-mono text-gray-600 dark:text-gray-400">
                    {node.width}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Buffer Usage (Simulated) */}
      {executionLog.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-4 h-4 text-blue-500" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Buffer Usage (Simulated)
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm text-green-800 dark:text-green-200">
                  Shared Hit
                </span>
              </div>
              <div className="text-xl font-mono font-bold text-green-900 dark:text-green-100">
                {Math.floor(stats.totalActual * 0.7).toLocaleString()}
              </div>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                Blocks found in buffer cache
              </p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm text-yellow-800 dark:text-yellow-200">
                  Shared Read
                </span>
              </div>
              <div className="text-xl font-mono font-bold text-yellow-900 dark:text-yellow-100">
                {Math.floor(stats.totalActual * 0.3).toLocaleString()}
              </div>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                Blocks read from disk
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Execution Flow */}
      {executionLog.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-4">
            <ArrowRight className="w-4 h-4 text-indigo-500" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Execution Flow
            </h4>
          </div>
          <div className="space-y-2">
            {executionLog.map((log, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
              >
                <span className="text-xs font-mono text-gray-500 w-6">
                  {index + 1}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {log.action}
                </span>
                <span className="text-xs text-gray-500">
                  ({log.rows.toLocaleString()} rows)
                </span>
                <span className="text-xs font-mono text-gray-400 ml-auto">
                  {log.time.toFixed(2)}ms
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
