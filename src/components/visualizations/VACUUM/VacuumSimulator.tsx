import { useState } from 'react';
import { useVacuumStore } from '../../../stores/vacuumStore';
import { TableSpaceView } from './TableSpaceView';
import { VacuumAnimation } from './VacuumAnimation';
import { XIDWraparoundView } from './XIDWraparoundView';
import { AutovacuumMonitor } from './AutovacuumMonitor';
import { FSMVMView } from './FSMVMView';
import { VacuumControls } from './VacuumControls';
import { Trash2, Database, Activity, History, Settings } from 'lucide-react';

export function VacuumSimulator() {
  const [activeTab, setActiveTab] = useState<'table' | 'vacuum' | 'xid' | 'autovacuum'>('table');
  const {
    liveTupleCount,
    deadTupleCount,
    frozenTupleCount,
    bloatPercentage,
    getTableSize,
    pages,
  } = useVacuumStore();

  const tableSize = getTableSize();
  const totalTuples = liveTupleCount + deadTupleCount + frozenTupleCount;

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Trash2 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                VACUUM
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                PostgreSQL의 데드 튜플 정리 및 테이블 블로트 관리 시각화
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-6 py-3 bg-orange-50 dark:bg-orange-900/20 border-b border-orange-100 dark:border-orange-800">
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-gray-600 dark:text-gray-400">Live Tuples:</span>
            <span className="font-mono font-medium text-green-600 dark:text-green-400">
              {liveTupleCount.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-gray-600 dark:text-gray-400">Dead Tuples:</span>
            <span className="font-mono font-medium text-red-600 dark:text-red-400">
              {deadTupleCount.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span className="text-gray-600 dark:text-gray-400">Bloat:</span>
            <span className={`font-mono font-medium ${
              bloatPercentage > 50 
                ? 'text-red-600 dark:text-red-400' 
                : bloatPercentage > 20 
                  ? 'text-yellow-600 dark:text-yellow-400' 
                  : 'text-green-600 dark:text-green-400'
            }`}>
              {bloatPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">Table Size:</span>
            <span className="font-mono font-medium text-blue-600 dark:text-blue-400">
              {formatBytes(tableSize)} ({pages.length} pages)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">Total Tuples:</span>
            <span className="font-mono font-medium text-gray-600 dark:text-gray-400">
              {totalTuples.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 pt-4">
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('table')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'table'
                ? 'bg-orange-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Database className="w-4 h-4" />
            Table
          </button>
          <button
            onClick={() => setActiveTab('vacuum')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'vacuum'
                ? 'bg-orange-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            VACUUM
          </button>
          <button
            onClick={() => setActiveTab('xid')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'xid'
                ? 'bg-orange-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <History className="w-4 h-4" />
            XID
          </button>
          <button
            onClick={() => setActiveTab('autovacuum')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'autovacuum'
                ? 'bg-orange-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Settings className="w-4 h-4" />
            Autovacuum
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {activeTab === 'table' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <TableSpaceView />
            </div>
            <div className="space-y-4">
              <VacuumControls />
              <FSMVMView />
            </div>
          </div>
        )}

        {activeTab === 'vacuum' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <VacuumAnimation />
            </div>
            <div className="space-y-4">
              <VacuumControls />
              <FSMVMView />
            </div>
          </div>
        )}

        {activeTab === 'xid' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <XIDWraparoundView />
            </div>
            <div className="space-y-4">
              <VacuumControls />
            </div>
          </div>
        )}

        {activeTab === 'autovacuum' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <AutovacuumMonitor />
            </div>
            <div className="space-y-4">
              <VacuumControls />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
