import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMVCCStore } from '../../../stores/mvccStore';
import {
  Play,
  CheckCircle,
  XCircle,
  Plus,
  Edit3,
  Trash2,
  Camera,
  Eye,
  RefreshCw,
  BookOpen,
  Zap,
  Ghost,
  AlertTriangle,
  Clock,
} from 'lucide-react';

export function MVCCOperations() {
  const {
    transactions,
    selectedTransaction,
    selectedTuple,
    startTransaction,
    commitTransaction,
    abortTransaction,
    insertTuple,
    updateTuple,
    deleteTuple,
    createSnapshot,
    checkVisibility,
    advanceTime,
    reset,
    loadPresetScenario,
    selectTransaction,
  } = useMVCCStore();

  const [newTupleData, setNewTupleData] = useState('');
  const [updateData, setUpdateData] = useState('');
  const [isolationLevel, setIsolationLevel] = useState<'read_committed' | 'repeatable_read' | 'serializable'>('read_committed');

  const activeTransactions = transactions.filter((t) => t.status === 'in_progress');
  const canModify = selectedTransaction && activeTransactions.some((t) => t.xid === selectedTransaction);

  const handleStartTransaction = () => {
    const xid = startTransaction(isolationLevel);
    selectTransaction(xid);
  };

  const handleInsertTuple = () => {
    if (selectedTransaction && newTupleData) {
      insertTuple(selectedTransaction, newTupleData);
      setNewTupleData('');
    }
  };

  const handleUpdateTuple = () => {
    if (selectedTransaction && selectedTuple && updateData) {
      updateTuple(selectedTransaction, selectedTuple, updateData);
      setUpdateData('');
    }
  };

  const handleDeleteTuple = () => {
    if (selectedTransaction && selectedTuple) {
      deleteTuple(selectedTransaction, selectedTuple);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Operations</h4>
      </div>

      {/* Transaction Controls */}
      <div className="space-y-3 mb-4">
        <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400">Transaction</h5>

        {/* Isolation Level Selector */}
        <select
          value={isolationLevel}
          onChange={(e) => setIsolationLevel(e.target.value as typeof isolationLevel)}
          className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="read_committed">Read Committed</option>
          <option value="repeatable_read">Repeatable Read</option>
          <option value="serializable">Serializable</option>
        </select>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleStartTransaction}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs transition-colors"
          >
            <Play className="w-3 h-3" />
            Start
          </button>
          <button
            onClick={() => selectedTransaction && commitTransaction(selectedTransaction)}
            disabled={!canModify}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-xs transition-colors"
          >
            <CheckCircle className="w-3 h-3" />
            Commit
          </button>
          <button
            onClick={() => selectedTransaction && abortTransaction(selectedTransaction)}
            disabled={!canModify}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg text-xs transition-colors"
          >
            <XCircle className="w-3 h-3" />
            Abort
          </button>
        </div>
      </div>

      {/* Selected Transaction Info */}
      {selectedTransaction && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-4 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
        >
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Selected XID: <span className="font-mono font-medium text-purple-600 dark:text-purple-400">{selectedTransaction}</span>
          </div>
        </motion.div>
      )}

      {/* Tuple Operations */}
      <div className="space-y-3 mb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400">Tuple Operations</h5>

        {/* Insert */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newTupleData}
            onChange={(e) => setNewTupleData(e.target.value)}
            placeholder="Data to insert..."
            disabled={!canModify}
            className="flex-1 px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
          />
          <button
            onClick={handleInsertTuple}
            disabled={!canModify || !newTupleData}
            className="flex items-center gap-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg text-xs transition-colors"
          >
            <Plus className="w-3 h-3" />
            Insert
          </button>
        </div>

        {/* Update */}
        <div className="flex gap-2">
          <input
            type="text"
            value={updateData}
            onChange={(e) => setUpdateData(e.target.value)}
            placeholder="New data..."
            disabled={!canModify || !selectedTuple}
            className="flex-1 px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
          />
          <button
            onClick={handleUpdateTuple}
            disabled={!canModify || !selectedTuple || !updateData}
            className="flex items-center gap-1 px-3 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg text-xs transition-colors"
          >
            <Edit3 className="w-3 h-3" />
            Update
          </button>
        </div>

        {/* Delete */}
        <button
          onClick={handleDeleteTuple}
          disabled={!canModify || !selectedTuple}
          className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg text-xs transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          Delete Selected Tuple
        </button>

        {/* Selected Tuple Info */}
        {selectedTuple && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
          >
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Selected Tuple ID: <span className="font-mono font-medium text-blue-600 dark:text-blue-400">{selectedTuple}</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Snapshot & Visibility */}
      <div className="space-y-3 mb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400">Snapshot & Visibility</h5>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => selectedTransaction && createSnapshot(selectedTransaction)}
            disabled={!canModify}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-400 text-white rounded-lg text-xs transition-colors"
          >
            <Camera className="w-3 h-3" />
            Snapshot
          </button>
          <button
            onClick={() => selectedTransaction && selectedTuple && checkVisibility(selectedTransaction, selectedTuple)}
            disabled={!selectedTransaction || !selectedTuple}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white rounded-lg text-xs transition-colors"
          >
            <Eye className="w-3 h-3" />
            Check
          </button>
        </div>
      </div>

      {/* Time Control */}
      <div className="space-y-3 mb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400">Time Control</h5>
        <button
          onClick={advanceTime}
          className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs transition-colors"
        >
          <Clock className="w-3 h-3" />
          Advance Time
        </button>
      </div>

      {/* Preset Scenarios */}
      <div className="space-y-3 mb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400">Preset Scenarios</h5>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => loadPresetScenario('simple_read')}
            className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs transition-colors"
          >
            <BookOpen className="w-3 h-3" />
            Simple Read
          </button>
          <button
            onClick={() => loadPresetScenario('concurrent_updates')}
            className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs transition-colors"
          >
            <Zap className="w-3 h-3" />
            Concurrent
          </button>
          <button
            onClick={() => loadPresetScenario('phantom_read')}
            className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs transition-colors"
          >
            <Ghost className="w-3 h-3" />
            Phantom Read
          </button>
          <button
            onClick={() => loadPresetScenario('serialization_anomaly')}
            className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs transition-colors"
          >
            <AlertTriangle className="w-3 h-3" />
            Serialization
          </button>
        </div>
      </div>

      {/* Reset */}
      <button
        onClick={reset}
        className="w-full flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs transition-colors"
      >
        <RefreshCw className="w-3 h-3" />
        Reset All
      </button>
    </div>
  );
}
