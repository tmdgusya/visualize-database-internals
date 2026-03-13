import { useQueryPlanStore } from '../../../stores/queryPlanStore';
import { Activity, Database, Filter, Gauge, Layers, Table2, Hash, ArrowRight } from 'lucide-react';

interface PlanNodeDetailProps {
  nodeId: string;
}

export function PlanNodeDetail({ nodeId }: PlanNodeDetailProps) {
  const { getNodeById, showActuals, executionLog } = useQueryPlanStore();
  const node = getNodeById(nodeId);

  if (!node) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400">Node not found</p>
      </div>
    );
  }

  // Find execution log for this node
  const nodeExecution = executionLog.find((log) => log.nodeId === nodeId);

  // Node type descriptions
  const nodeDescriptions: Record<string, string> = {
    SeqScan: 'Sequential table scan - reads all rows from the table',
    IndexScan: 'Index scan - uses index to find rows, then fetches from heap',
    IndexOnlyScan: 'Index-only scan - reads only from index (covering index)',
    BitmapScan: 'Bitmap index scan - builds bitmap of matching rows, then fetches from heap',
    NestedLoop: 'Nested loop join - iterates outer relation, scans inner for each row',
    HashJoin: 'Hash join - builds hash table on inner relation, probes with outer',
    MergeJoin: 'Merge join - sorts both inputs and merges them',
    Sort: 'Sort operation - sorts rows based on specified keys',
    Aggregate: 'Aggregate - computes aggregate functions (COUNT, SUM, AVG, etc.)',
    Limit: 'Limit - restricts the number of rows returned',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-indigo-50 dark:bg-indigo-900/20">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{node.type}</h4>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{nodeDescriptions[node.type]}</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Table/Index Info */}
        {(node.table || node.index) && (
          <div className="space-y-2">
            {node.table && (
              <div className="flex items-center gap-2 text-sm">
                <Table2 className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">Table:</span>
                <span className="font-mono text-gray-900 dark:text-white">{node.table}</span>
              </div>
            )}
            {node.index && (
              <div className="flex items-center gap-2 text-sm">
                <Database className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">Index:</span>
                <span className="font-mono text-gray-900 dark:text-white">{node.index}</span>
              </div>
            )}
          </div>
        )}

        {/* Cost Information */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Cost</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Startup:</span>
              <span className="ml-2 font-mono text-gray-900 dark:text-white">{node.cost.startup.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Total:</span>
              <span className="ml-2 font-mono text-gray-900 dark:text-white">{node.cost.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Rows Information */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Rows</span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Estimated:</span>
              <span className="font-mono text-gray-900 dark:text-white">{node.rows.toLocaleString()}</span>
            </div>
            {showActuals && nodeExecution && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Actual:</span>
                <span className="font-mono text-green-600 dark:text-green-400">
                  {nodeExecution.rows.toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Width:</span>
              <span className="font-mono text-gray-900 dark:text-white">{node.width} bytes</span>
            </div>
          </div>
        </div>

        {/* Conditions */}
        {(node.condition || node.filter || node.indexCond) && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Conditions</span>
            </div>
            {node.condition && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded p-2 text-xs font-mono text-yellow-800 dark:text-yellow-200 break-all">
                {node.condition}
              </div>
            )}
            {node.filter && (
              <div className="flex items-start gap-2">
                <span className="text-xs text-gray-500">Filter:</span>
                <span className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">{node.filter}</span>
              </div>
            )}
            {node.indexCond && (
              <div className="flex items-start gap-2">
                <span className="text-xs text-gray-500">Index Cond:</span>
                <span className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">{node.indexCond}</span>
              </div>
            )}
          </div>
        )}

        {/* Join Information */}
        {node.joinType && (
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <ArrowRight className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Join</span>
            </div>
            <div className="text-sm text-purple-800 dark:text-purple-200">{node.joinType} JOIN</div>
            {node.hashCond && (
              <div className="text-xs font-mono text-purple-700 dark:text-purple-300 mt-1">Hash: {node.hashCond}</div>
            )}
            {node.mergeCond && (
              <div className="text-xs font-mono text-purple-700 dark:text-purple-300 mt-1">
                Merge: {node.mergeCond}
              </div>
            )}
          </div>
        )}

        {/* Sort Information */}
        {node.sortKeys && node.sortKeys.length > 0 && (
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span className="text-xs font-medium text-orange-700 dark:text-orange-300">Sort Keys</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {node.sortKeys.map((key, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-orange-100 dark:bg-orange-800 rounded text-xs font-mono text-orange-800 dark:text-orange-200"
                >
                  {key}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Group Keys */}
        {node.groupKeys && node.groupKeys.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-xs font-medium text-red-700 dark:text-red-300">Group By</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {node.groupKeys.map((key, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-red-100 dark:bg-red-800 rounded text-xs font-mono text-red-800 dark:text-red-200"
                >
                  {key}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Execution Info */}
        {nodeExecution && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium text-green-700 dark:text-green-300">Execution</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700 dark:text-green-300">Action:</span>
                <span className="font-mono text-green-800 dark:text-green-200">{nodeExecution.action}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700 dark:text-green-300">Time:</span>
                <span className="font-mono text-green-800 dark:text-green-200">{nodeExecution.time.toFixed(2)} ms</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
