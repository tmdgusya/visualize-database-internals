import { motion } from 'framer-motion';
import type { TableRow } from '../../../stores/joinAlgorithmStore';

interface TableViewProps {
  name: string;
  rows: TableRow[];
  highlightedIndex?: number;
  secondaryHighlightedIndex?: number;
  matchedIndices?: number[];
  isSorted?: boolean;
  cursorPosition?: 'top' | 'none';
}

export function TableView({
  name,
  rows,
  highlightedIndex,
  secondaryHighlightedIndex,
  matchedIndices = [],
  isSorted = false,
  cursorPosition = 'none',
}: TableViewProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Table Header */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h5 className="text-sm font-semibold text-gray-900 dark:text-white">{name}</h5>
          {isSorted && (
            <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded">
              Sorted
            </span>
          )}
        </div>
      </div>

      {/* Table Body */}
      <div className="p-2 space-y-1">
        {rows.map((row, index) => {
          const isHighlighted = index === highlightedIndex;
          const isSecondaryHighlighted = index === secondaryHighlightedIndex;
          const isMatched = matchedIndices.includes(index);

          return (
            <motion.div
              key={row.id}
              initial={false}
              animate={{
                scale: isHighlighted || isSecondaryHighlighted ? 1.05 : 1,
                backgroundColor: isHighlighted
                  ? '#818cf8'
                  : isSecondaryHighlighted
                  ? '#c084fc'
                  : isMatched
                  ? '#86efac'
                  : '#f3f4f6',
              }}
              className={`
                relative px-3 py-2 rounded text-sm font-mono
                ${isHighlighted
                  ? 'text-white shadow-lg'
                  : isSecondaryHighlighted
                  ? 'text-white shadow-lg'
                  : isMatched
                  ? 'text-green-900 dark:text-green-100'
                  : 'text-gray-700 dark:text-gray-300'
                }
                ${cursorPosition === 'top' && index === highlightedIndex ? 'ring-2 ring-indigo-500' : ''}
              `}
            >
              {/* Cursor Indicator */}
              {cursorPosition === 'top' && index === highlightedIndex && (
                <motion.div
                  layoutId="cursor"
                  className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-indigo-500"
                />
              )}

              <div className="flex items-center justify-between">
                <span>id: {row.id}</span>
                <span className="font-bold">value: {row.value}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Row Count */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        {rows.length} rows
      </div>
    </div>
  );
}
