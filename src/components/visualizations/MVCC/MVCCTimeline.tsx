import { useState } from 'react';
import { useMVCCStore } from '../../../stores/mvccStore';
import { TransactionTimeline } from './TransactionTimeline';
import { TupleVersionChain } from './TupleVersionChain';
import { VisibilityCalculator } from './VisibilityCalculator';
import { SnapshotView } from './SnapshotView';
import { MVCCOperations } from './MVCCOperations';
import { CLOGView } from './CLOGView';
import { GitBranch, Eye, Link2, History, Activity } from 'lucide-react';

export function MVCCTimeline() {
  const [activeTab, setActiveTab] = useState<'timeline' | 'visibility' | 'version_chain'>('timeline');
  const {
    tupleVersions,
    currentTime,
    nextXid,
    getActiveTransactions,
    getFrozenXid,
  } = useMVCCStore();

  const activeTransactions = getActiveTransactions();
  const frozenXid = getFrozenXid();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <GitBranch className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                MVCC (Multi-Version Concurrency Control)
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                PostgreSQL의 다중 버전 동시성 제어 메커니즘 시각화
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-6 py-3 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-100 dark:border-purple-800">
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-gray-600 dark:text-gray-400">Active Transactions:</span>
            <span className="font-mono font-medium text-purple-600 dark:text-purple-400">
              {activeTransactions.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-gray-600 dark:text-gray-400">Total Versions:</span>
            <span className="font-mono font-medium text-blue-600 dark:text-blue-400">
              {tupleVersions.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">Current XID:</span>
            <span className="font-mono font-medium text-green-600 dark:text-green-400">
              {nextXid}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">Frozen XID:</span>
            <span className="font-mono font-medium text-orange-600 dark:text-orange-400">
              {frozenXid}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">Simulated Time:</span>
            <span className="font-mono font-medium text-gray-600 dark:text-gray-400">
              T{currentTime}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 pt-4">
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'timeline'
                ? 'bg-purple-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <History className="w-4 h-4" />
            Timeline
          </button>
          <button
            onClick={() => setActiveTab('visibility')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'visibility'
                ? 'bg-purple-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Eye className="w-4 h-4" />
            Visibility
          </button>
          <button
            onClick={() => setActiveTab('version_chain')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'version_chain'
                ? 'bg-purple-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Link2 className="w-4 h-4" />
            Version Chain
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {activeTab === 'timeline' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <TransactionTimeline />
              <CLOGView />
            </div>
            <div className="space-y-4">
              <MVCCOperations />
              <SnapshotView />
            </div>
          </div>
        )}

        {activeTab === 'visibility' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <VisibilityCalculator />
            <div className="space-y-4">
              <SnapshotView />
              <MVCCOperations />
            </div>
          </div>
        )}

        {activeTab === 'version_chain' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <TupleVersionChain />
            </div>
            <div className="space-y-4">
              <MVCCOperations />
              <SnapshotView />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
