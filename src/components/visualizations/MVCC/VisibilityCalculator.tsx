import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMVCCStore } from '../../../stores/mvccStore';
import { Eye, CheckCircle, XCircle, Calculator } from 'lucide-react';

export function VisibilityCalculator() {
  const {
    transactions,
    tupleVersions,
    snapshots,
    checkVisibility,
    getTransactionStatus,
    visibilityResult,
  } = useMVCCStore();

  const [selectedXid, setSelectedXid] = useState<number | ''>('');
  const [selectedTupleId, setSelectedTupleId] = useState<number | ''>('');
  const [selectedSnapshotXid, setSelectedSnapshotXid] = useState<number | ''>('');

  const handleCheckVisibility = () => {
    if (selectedXid && selectedTupleId) {
      const snapshotXid = selectedSnapshotXid || undefined;
      checkVisibility(Number(selectedXid), Number(selectedTupleId), snapshotXid);
    }
  };

  const getTuple = (id: number) => tupleVersions.find((t) => t.id === id);
  const getSnapshot = (xid: number) => snapshots.find((s) => s.xid === xid);

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-5 h-5 text-green-600 dark:text-green-400" />
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          Visibility Calculator
        </h4>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Transaction ID (XID)
          </label>
          <select
            value={selectedXid}
            onChange={(e) => setSelectedXid(Number(e.target.value))}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Select XID</option>
            {transactions.map((t) => (
              <option key={t.xid} value={t.xid}>
                {t.xid} ({t.status})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tuple ID
          </label>
          <select
            value={selectedTupleId}
            onChange={(e) => setSelectedTupleId(Number(e.target.value))}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Select Tuple</option>
            {tupleVersions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.id}: {t.data.substring(0, 20)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Snapshot (optional)
          </label>
          <select
            value={selectedSnapshotXid}
            onChange={(e) => setSelectedSnapshotXid(Number(e.target.value))}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Auto-create</option>
            {snapshots.map((s) => (
              <option key={s.xid} value={s.xid}>
                Snapshot from XID {s.xid}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Check Button */}
      <button
        onClick={handleCheckVisibility}
        disabled={!selectedXid || !selectedTupleId}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
      >
        <Calculator className="w-4 h-4" />
        Check Visibility
      </button>

      {/* Selected Tuple Info */}
      {selectedTupleId && (
        <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Selected Tuple Info
          </h5>
          {(() => {
            const tuple = getTuple(Number(selectedTupleId));
            if (!tuple) return null;
            return (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">ID:</span>{' '}
                  <span className="font-mono">{tuple.id}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Data:</span>{' '}
                  <span className="font-medium">{tuple.data}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">xmin:</span>{' '}
                  <span className="font-mono">{tuple.xmin}</span>
                  <span
                    className={`ml-1 px-1 rounded text-xs ${
                      getTransactionStatus(tuple.xmin) === 'committed'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : getTransactionStatus(tuple.xmin) === 'in_progress'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    }`}
                  >
                    {getTransactionStatus(tuple.xmin)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">xmax:</span>{' '}
                  <span className="font-mono">{tuple.xmax ?? 'null'}</span>
                  {tuple.xmax && (
                    <span
                      className={`ml-1 px-1 rounded text-xs ${
                        getTransactionStatus(tuple.xmax) === 'committed'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : getTransactionStatus(tuple.xmax) === 'in_progress'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      }`}
                    >
                      {getTransactionStatus(tuple.xmax)}
                    </span>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Selected Snapshot Info */}
      {selectedSnapshotXid && (
        <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Snapshot Info
          </h5>
          {(() => {
            const snapshot = getSnapshot(Number(selectedSnapshotXid));
            if (!snapshot) return null;
            return (
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">xmin:</span>{' '}
                  <span className="font-mono">{snapshot.xmin}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">xmax:</span>{' '}
                  <span className="font-mono">{snapshot.xmax}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">xip_list:</span>{' '}
                  <span className="font-mono">[{snapshot.xipList.join(', ')}]</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Result */}
      <AnimatePresence>
        {visibilityResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-4"
          >
            {/* Final Result */}
            <div
              className={`p-4 rounded-lg border-2 ${
                visibilityResult.visible
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-500'
              }`}
            >
              <div className="flex items-center gap-3">
                {visibilityResult.visible ? (
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                )}
                <div>
                  <div className="text-lg font-bold">
                    {visibilityResult.visible ? 'VISIBLE' : 'NOT VISIBLE'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {visibilityResult.reason}
                  </div>
                </div>
              </div>
            </div>

            {/* Step-by-Step Rules */}
            <div className="mt-4 space-y-2">
              <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Visibility Rules Applied:
              </h5>
              {visibilityResult.steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-3 rounded-lg border ${
                    step.result
                      ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {step.result ? (
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
                    )}
                    <div>
                      <div className="text-sm font-medium">{step.rule}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {step.explanation}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visibility Rules Reference */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h5 className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-2">
          Visibility Rules Reference
        </h5>
        <ol className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
          <li>
            xmin is <strong>committed</strong> and (xmin {'<'} snapshot.xmin OR xmin in
            xip_list) → visible
          </li>
          <li>
            xmin is <strong>in_progress</strong> → not visible
          </li>
          <li>
            xmax is <strong>committed</strong> and xmax {'<'} snapshot.xmin → not visible
          </li>
          <li>
            xmax is <strong>in_progress</strong> or <strong>aborted</strong> → visible
          </li>
          <li>
            xmax is <strong>committed</strong> after snapshot → visible
          </li>
        </ol>
      </div>
    </div>
  );
}
