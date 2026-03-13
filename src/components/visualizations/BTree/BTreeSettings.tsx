import { useBTreeStore } from '../../../stores/btreeStore';
import { Settings2, Zap, Eye, Database } from 'lucide-react';

export function BTreeSettings() {
  const {
    tree,
    animationSpeed,
    showLinePointers,
    showTidPointers,
    createTree,
    setAnimationSpeed,
    setShowLinePointers,
    setShowTidPointers,
  } = useBTreeStore();

  const handleOrderChange = (newOrder: number) => {
    if (newOrder >= 2 && newOrder <= 8) {
      createTree(newOrder);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Order (Fanout) Setting */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Order (Fanout)
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Maximum number of children per node
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={2}
              max={8}
              value={tree.order}
              onChange={(e) => handleOrderChange(parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-lg font-mono font-medium text-blue-600 dark:text-blue-400 w-12 text-center">
              {tree.order}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded">
              <span className="text-gray-500">Max Keys per Node:</span>
              <span className="ml-2 font-mono font-medium">{tree.order - 1}</span>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded">
              <span className="text-gray-500">Min Keys per Node:</span>
              <span className="ml-2 font-mono font-medium">{Math.ceil(tree.order / 2) - 1}</span>
            </div>
          </div>

          <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded">
            <strong>Warning:</strong> Changing the order will reset the tree and remove all keys.
          </div>
        </div>
      </div>

      {/* Animation Speed Setting */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Animation Speed
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Speed of insert/delete animations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500">Fast</span>
          <input
            type="range"
            min={100}
            max={1000}
            step={100}
            value={1100 - animationSpeed} // Invert so right is faster
            onChange={(e) => setAnimationSpeed(1100 - parseInt(e.target.value))}
            className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <span className="text-xs text-gray-500">Slow</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Current: {animationSpeed}ms between operations
        </p>
      </div>

      {/* Display Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Eye className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Display Options
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Toggle visualization features
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <div className="flex items-center gap-3">
              <Settings2 className="w-4 h-4 text-gray-500" />
              <div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Show Leaf Links</span>
                <p className="text-xs text-gray-500">
                  Display sibling pointers between leaf nodes
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={showLinePointers}
              onChange={(e) => setShowLinePointers(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-green-500 focus:ring-green-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 text-gray-500" />
              <div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Show TID Pointers</span>
                <p className="text-xs text-gray-500">
                  Display Tuple ID pointers (PostgreSQL specific)
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={showTidPointers}
              onChange={(e) => setShowTidPointers(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-green-500 focus:ring-green-500"
            />
          </label>
        </div>
      </div>

      {/* B-Tree Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          About B-Trees in PostgreSQL
        </h4>
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <p>
            PostgreSQL uses B-Trees (specifically B+ Trees) as the default index type.
            They provide efficient O(log n) operations for equality and range queries.
          </p>
          <ul className="space-y-2 ml-4">
            <li className="flex items-start gap-2">
              <span className="text-green-500">•</span>
              <span>
                <strong>Order {tree.order}:</strong> Each node can have up to {tree.order} children
                and {tree.order - 1} keys.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">•</span>
              <span>
                <strong>Split:</strong> When a node is full, it splits into two nodes and
                promotes the middle key to the parent.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">•</span>
              <span>
                <strong>Merge:</strong> When a node underflows, it may merge with a sibling
                or redistribute keys.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">•</span>
              <span>
                <strong>Leaf Links:</strong> All leaf nodes are linked together for efficient
                range scans.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
