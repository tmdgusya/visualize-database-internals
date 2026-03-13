import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBTreeStore } from '../../../stores/btreeStore';
import { Plus, Trash2, Search, Shuffle, Trash, History } from 'lucide-react';

interface BTreeOperationsProps {
  compact?: boolean;
}

export function BTreeOperations({ compact = false }: BTreeOperationsProps) {
  const [insertValue, setInsertValue] = useState('');
  const [deleteValue, setDeleteValue] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [randomCount, setRandomCount] = useState(5);
  const { insert, delete: deleteKey, search, generateRandom, clear, operationLog, resetAnimation } = useBTreeStore();

  const handleInsert = () => {
    const key = parseInt(insertValue, 10);
    if (!isNaN(key)) {
      insert(key);
      setInsertValue('');
    }
  };

  const handleDelete = () => {
    const key = parseInt(deleteValue, 10);
    if (!isNaN(key)) {
      deleteKey(key);
      setDeleteValue('');
    }
  };

  const handleSearch = () => {
    const key = parseInt(searchValue, 10);
    if (!isNaN(key)) {
      search(key);
      setSearchValue('');
    }
  };

  const handleGenerateRandom = () => {
    generateRandom(randomCount, 1, 100);
  };

  const handleClear = () => {
    clear();
    resetAnimation();
  };

  if (compact) {
    return (
      <div className="space-y-3">
        {/* Quick Insert */}
        <div className="flex gap-2">
          <input
            type="number"
            value={insertValue}
            onChange={(e) => setInsertValue(e.target.value)}
            placeholder="Key..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            onKeyDown={(e) => e.key === 'Enter' && handleInsert()}
          />
          <button
            onClick={handleInsert}
            className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Delete */}
        <div className="flex gap-2">
          <input
            type="number"
            value={deleteValue}
            onChange={(e) => setDeleteValue(e.target.value)}
            placeholder="Delete key..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
            onKeyDown={(e) => e.key === 'Enter' && handleDelete()}
          />
          <button
            onClick={handleDelete}
            className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Search */}
        <div className="flex gap-2">
          <input
            type="number"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search key..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Insert Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-green-500" />
          Insert Key
        </h4>
        <div className="flex gap-2">
          <input
            type="number"
            value={insertValue}
            onChange={(e) => setInsertValue(e.target.value)}
            placeholder="Enter key value..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            onKeyDown={(e) => e.key === 'Enter' && handleInsert()}
          />
          <button
            onClick={handleInsert}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-md transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Insert
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Inserts a key into the B-Tree. If the node is full, a split operation will occur.
        </p>
      </div>

      {/* Delete Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-red-500" />
          Delete Key
        </h4>
        <div className="flex gap-2">
          <input
            type="number"
            value={deleteValue}
            onChange={(e) => setDeleteValue(e.target.value)}
            placeholder="Enter key to delete..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
            onKeyDown={(e) => e.key === 'Enter' && handleDelete()}
          />
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-md transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Deletes a key from the B-Tree. May trigger redistribute or merge operations.
        </p>
      </div>

      {/* Search Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Search className="w-4 h-4 text-blue-500" />
          Search Key
        </h4>
        <div className="flex gap-2">
          <input
            type="number"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Enter key to search..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Searches for a key and highlights the path from root to leaf.
        </p>
      </div>

      {/* Generate Random Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Shuffle className="w-4 h-4 text-purple-500" />
          Generate Random Keys
        </h4>
        <div className="flex gap-2">
          <input
            type="number"
            value={randomCount}
            onChange={(e) => setRandomCount(parseInt(e.target.value) || 1)}
            min={1}
            max={20}
            className="w-20 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            onClick={handleGenerateRandom}
            className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-md transition-colors flex items-center gap-2 justify-center"
          >
            <Shuffle className="w-4 h-4" />
            Generate
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Generates random keys between 1-100 and inserts them with animation.
        </p>
      </div>

      {/* Clear Tree Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Trash className="w-4 h-4 text-gray-500" />
          Clear Tree
        </h4>
        <button
          onClick={handleClear}
          className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-md transition-colors flex items-center gap-2 justify-center"
        >
          <Trash className="w-4 h-4" />
          Clear Tree
        </button>
        <p className="text-xs text-gray-500 mt-2">
          Removes all keys and resets the tree to empty state.
        </p>
      </div>

      {/* Operation Log */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <History className="w-4 h-4 text-gray-500" />
          Operation Log
        </h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          <AnimatePresence>
            {operationLog.slice(0, 20).map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className={`text-xs p-2 rounded flex items-center justify-between ${
                  entry.operation === 'insert'
                    ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    : entry.operation === 'delete'
                    ? 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    : entry.operation === 'search'
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                    : entry.operation === 'split'
                    ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                    : entry.operation === 'merge'
                    ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                }`}
              >
                <span>{entry.details}</span>
                <span className="text-gray-400 text-[10px]">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          {operationLog.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No operations yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
