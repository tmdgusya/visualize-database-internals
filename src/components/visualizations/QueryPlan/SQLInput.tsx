import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQueryPlanStore, PRESET_QUERIES } from '../../../stores/queryPlanStore';
import { Play, FileCode, Sparkles, Trash2 } from 'lucide-react';

export function SQLInput() {
  const { sql, parseSQL, clearPlan, planTree } = useQueryPlanStore();
  const [localSQL, setLocalSQL] = useState(sql);
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  const handleParse = () => {
    parseSQL(localSQL);
  };

  const handlePresetChange = (presetKey: string) => {
    setSelectedPreset(presetKey);
    if (presetKey && PRESET_QUERIES[presetKey as keyof typeof PRESET_QUERIES]) {
      const newSQL = PRESET_QUERIES[presetKey as keyof typeof PRESET_QUERIES];
      setLocalSQL(newSQL);
      parseSQL(newSQL);
    }
  };

  const handleClear = () => {
    setLocalSQL('');
    setSelectedPreset('');
    clearPlan();
  };

  // Simple syntax highlighting (very basic)
  const highlightSQL = (text: string): string => {
    const keywords = [
      'SELECT',
      'FROM',
      'WHERE',
      'JOIN',
      'INNER',
      'LEFT',
      'RIGHT',
      'FULL',
      'ON',
      'GROUP',
      'BY',
      'ORDER',
      'HAVING',
      'LIMIT',
      'OFFSET',
      'UNION',
      'ALL',
      'DISTINCT',
      'AS',
      'AND',
      'OR',
      'NOT',
      'NULL',
      'IS',
      'IN',
      'EXISTS',
      'BETWEEN',
      'LIKE',
      'COUNT',
      'SUM',
      'AVG',
      'MIN',
      'MAX',
      'INSERT',
      'UPDATE',
      'DELETE',
    ];

    let highlighted = text;
    keywords.forEach((keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      highlighted = highlighted.replace(regex, `<span class="text-purple-600 dark:text-purple-400 font-semibold">${keyword}</span>`);
    });

    // Highlight strings
    highlighted = highlighted.replace(
      /'[^']*'/g,
      '<span class="text-green-600 dark:text-green-400">$&</span>'
    );

    // Highlight numbers
    highlighted = highlighted.replace(
      /\b\d+\b/g,
      '<span class="text-blue-600 dark:text-blue-400">$&</span>'
    );

    // Highlight comments
    highlighted = highlighted.replace(
      /--.*$/gm,
      '<span class="text-gray-500 dark:text-gray-500 italic">$&</span>'
    );

    return highlighted;
  };

  return (
    <div className="space-y-4">
      {/* Preset Queries */}
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <FileCode className="w-4 h-4 text-indigo-500" />
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Preset Queries</h4>
        </div>
        <select
          value={selectedPreset}
          onChange={(e) => handlePresetChange(e.target.value)}
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Select a preset query...</option>
          <option value="simple">Simple SELECT</option>
          <option value="join">JOIN Query</option>
          <option value="aggregate">Aggregate with GROUP BY</option>
          <option value="subquery">Subquery</option>
          <option value="index">Index Scan Example</option>
          <option value="complex">Complex Query</option>
        </select>
      </div>

      {/* SQL Input */}
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">SQL Query</h4>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClear}
              disabled={!localSQL && !planTree}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
            <button
              onClick={handleParse}
              disabled={!localSQL.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-3.5 h-3.5" />
              Parse
            </button>
          </div>
        </div>

        {/* Textarea with syntax highlighting overlay */}
        <div className="relative">
          <textarea
            value={localSQL}
            onChange={(e) => {
              setLocalSQL(e.target.value);
              setSelectedPreset('');
            }}
            placeholder="Enter your SQL query here..."
            className="w-full h-48 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            spellCheck={false}
          />
        </div>

        {/* SQL Tips */}
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          <p className="mb-1">
            <span className="font-semibold">Tips:</span> Try queries with WHERE clauses for index
            scans, JOINs for join operations, GROUP BY for aggregates, and ORDER BY for sorts.
          </p>
        </div>
      </div>

      {/* Current SQL Display (if parsed) */}
      {planTree && sql && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800"
        >
          <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
            Parsed Query
          </h4>
          <pre
            className="text-xs font-mono text-indigo-800 dark:text-indigo-200 whitespace-pre-wrap overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: highlightSQL(sql) }}
          />
        </motion.div>
      )}

      {/* Query Examples */}
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Query Examples
        </h4>
        <div className="space-y-2 text-xs">
          <button
            onClick={() => {
              const example = `SELECT * FROM users WHERE age > 25 AND status = 'active'`;
              setLocalSQL(example);
              setSelectedPreset('');
              parseSQL(example);
            }}
            className="w-full text-left p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
          >
            <span className="font-mono text-indigo-600 dark:text-indigo-400">SELECT</span>
            <span className="text-gray-600 dark:text-gray-400 ml-2">
              Filter users with conditions
            </span>
          </button>
          <button
            onClick={() => {
              const example = `SELECT u.name, COUNT(o.id) FROM users u JOIN orders o ON u.id = o.user_id GROUP BY u.name`;
              setLocalSQL(example);
              setSelectedPreset('');
              parseSQL(example);
            }}
            className="w-full text-left p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
          >
            <span className="font-mono text-indigo-600 dark:text-indigo-400">JOIN + GROUP BY</span>
            <span className="text-gray-600 dark:text-gray-400 ml-2">
              Join tables and aggregate
            </span>
          </button>
          <button
            onClick={() => {
              const example = `SELECT * FROM products ORDER BY price DESC LIMIT 10`;
              setLocalSQL(example);
              setSelectedPreset('');
              parseSQL(example);
            }}
            className="w-full text-left p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
          >
            <span className="font-mono text-indigo-600 dark:text-indigo-400">ORDER + LIMIT</span>
            <span className="text-gray-600 dark:text-gray-400 ml-2">Sort and limit results</span>
          </button>
        </div>
      </div>
    </div>
  );
}
