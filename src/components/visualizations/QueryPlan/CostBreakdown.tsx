import { useMemo } from 'react';
import { useQueryPlanStore } from '../../../stores/queryPlanStore';
import { PieChart, BarChart3, DollarSign, Clock, Database, Cpu } from 'lucide-react';

interface CostBreakdownProps {
  compact?: boolean;
}

export function CostBreakdown({ compact = false }: CostBreakdownProps) {
  const { planTree, getTotalCost } = useQueryPlanStore();

  const costData = useMemo(() => {
    if (!planTree) return null;

    const nodes: Array<{
      id: string;
      type: string;
      cost: number;
      startup: number;
      ioCost: number;
      cpuCost: number;
    }> = [];

    const traverse = (node: typeof planTree) => {
      // Estimate I/O cost (higher for scans, lower for in-memory operations)
      let ioCost = 0;
      let cpuCost = 0;

      if (node.type.includes('Scan')) {
        ioCost = node.cost.total * 0.7; // Scans are I/O heavy
        cpuCost = node.cost.total * 0.3;
      } else if (node.type.includes('Join')) {
        ioCost = node.cost.total * 0.3; // Joins are CPU heavy
        cpuCost = node.cost.total * 0.7;
      } else if (node.type === 'Sort') {
        ioCost = node.cost.total * 0.2; // Sort is mostly CPU/memory
        cpuCost = node.cost.total * 0.8;
      } else {
        ioCost = node.cost.total * 0.4;
        cpuCost = node.cost.total * 0.6;
      }

      nodes.push({
        id: node.id,
        type: node.type,
        cost: node.cost.total,
        startup: node.cost.startup,
        ioCost,
        cpuCost,
      });

      node.children.forEach(traverse);
    };

    traverse(planTree);

    const totalCost = nodes.reduce((sum, n) => sum + n.cost, 0);
    const totalIO = nodes.reduce((sum, n) => sum + n.ioCost, 0);
    const totalCPU = nodes.reduce((sum, n) => sum + n.cpuCost, 0);
    const totalStartup = nodes.reduce((sum, n) => sum + n.startup, 0);

    return {
      nodes,
      totalCost,
      totalIO,
      totalCPU,
      totalStartup,
      ioPercentage: totalCost > 0 ? (totalIO / totalCost) * 100 : 0,
      cpuPercentage: totalCost > 0 ? (totalCPU / totalCost) * 100 : 0,
    };
  }, [planTree]);

  if (!costData || !planTree) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-4">
        No cost data available
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-3">
        {/* I/O vs CPU */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <Database className="w-3 h-3" />
              I/O Cost
            </span>
            <span className="font-mono text-gray-900 dark:text-white">
              {costData.ioPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500"
              style={{ width: `${costData.ioPercentage}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <Cpu className="w-3 h-3" />
              CPU Cost
            </span>
            <span className="font-mono text-gray-900 dark:text-white">
              {costData.cpuPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500"
              style={{ width: `${costData.cpuPercentage}%` }}
            />
          </div>
        </div>

        {/* Startup vs Total */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <Clock className="w-3 h-3" />
              Startup Cost
            </span>
            <span className="font-mono text-gray-900 dark:text-white">
              {costData.totalCost > 0
                ? ((costData.totalStartup / costData.totalCost) * 100).toFixed(1)
                : 0}
              %
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-500"
              style={{
                width: `${
                  costData.totalCost > 0
                    ? (costData.totalStartup / costData.totalCost) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Full view
  return (
    <div className="space-y-6">
      {/* Cost Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs text-blue-700 dark:text-blue-300">Total Cost</span>
          </div>
          <div className="text-xl font-mono font-bold text-blue-900 dark:text-blue-100">
            {costData.totalCost.toFixed(2)}
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-xs text-green-700 dark:text-green-300">I/O Cost</span>
          </div>
          <div className="text-xl font-mono font-bold text-green-900 dark:text-green-100">
            {costData.totalIO.toFixed(2)}
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs text-purple-700 dark:text-purple-300">CPU Cost</span>
          </div>
          <div className="text-xl font-mono font-bold text-purple-900 dark:text-purple-100">
            {costData.totalCPU.toFixed(2)}
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            <span className="text-xs text-yellow-700 dark:text-yellow-300">Startup Cost</span>
          </div>
          <div className="text-xl font-mono font-bold text-yellow-900 dark:text-yellow-100">
            {costData.totalStartup.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Cost Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* I/O vs CPU Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-indigo-500" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Cost Distribution
            </h4>
          </div>
          <div className="flex items-center gap-6">
            <SimplePieChart ioPercentage={costData.ioPercentage} cpuPercentage={costData.cpuPercentage} />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  I/O ({costData.ioPercentage.toFixed(1)}%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  CPU ({costData.cpuPercentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Node Cost Bar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Cost by Node</h4>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {costData.nodes
              .sort((a, b) => b.cost - a.cost)
              .map((node) => (
                <div key={node.id} className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400 w-24 truncate">
                    {node.type}
                  </span>
                  <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500"
                      style={{
                        width: `${costData.totalCost > 0 ? (node.cost / costData.totalCost) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-mono text-gray-900 dark:text-white w-16 text-right">
                    {node.cost.toFixed(1)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Cost Constants Reference */}
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          PostgreSQL Cost Constants
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">seq_page_cost:</span>
            <span className="font-mono text-gray-900 dark:text-white">1.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">random_page_cost:</span>
            <span className="font-mono text-gray-900 dark:text-white">4.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">cpu_tuple_cost:</span>
            <span className="font-mono text-gray-900 dark:text-white">0.01</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">cpu_index_tuple_cost:</span>
            <span className="font-mono text-gray-900 dark:text-white">0.005</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">cpu_operator_cost:</span>
            <span className="font-mono text-gray-900 dark:text-white">0.0025</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple SVG Pie Chart Component
function SimplePieChart({
  ioPercentage,
  cpuPercentage,
}: {
  ioPercentage: number;
  cpuPercentage: number;
}) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const ioOffset = circumference - (ioPercentage / 100) * circumference;

  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      {/* Background circle */}
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="12"
      />
      {/* I/O segment */}
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="12"
        strokeDasharray={circumference}
        strokeDashoffset={ioOffset}
        transform="rotate(-90 50 50)"
      />
      {/* CPU segment */}
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="#22c55e"
        strokeWidth="12"
        strokeDasharray={circumference}
        strokeDashoffset={circumference - (cpuPercentage / 100) * circumference}
        transform={`rotate(${-90 + (ioPercentage / 100) * 360} 50 50)`}
      />
    </svg>
  );
}
