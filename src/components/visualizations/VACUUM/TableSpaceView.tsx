import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVacuumStore, type TupleState } from '../../../stores/vacuumStore';
import { Database, ChevronLeft, ChevronRight, Info } from 'lucide-react';

export function TableSpaceView() {
  const { pages, selectedPage, selectPage, getPage } = useVacuumStore();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const selectedPageData = selectedPage ? getPage(selectedPage) : null;

  const getTupleColor = (state: TupleState) => {
    switch (state) {
      case 'live':
        return 'bg-green-500';
      case 'dead':
        return 'bg-red-500';
      case 'frozen':
        return 'bg-blue-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getTupleBorderColor = (state: TupleState) => {
    switch (state) {
      case 'live':
        return 'border-green-600';
      case 'dead':
        return 'border-red-600';
      case 'frozen':
        return 'border-blue-600';
      default:
        return 'border-gray-500';
    }
  };

  const goToPreviousPage = () => {
    setCurrentPageIndex(prev => Math.max(0, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPageIndex(prev => Math.min(pages.length - 1, prev + 1));
  };

  // Calculate bloat for a page
  const getPageBloat = (page: typeof pages[0]) => {
    const liveTuples = page.tuples.filter(t => t.state === 'live' || t.state === 'frozen').length;
    const totalTuples = page.tuples.length;
    if (totalTuples === 0) return 0;
    return ((totalTuples - liveTuples) / totalTuples) * 100;
  };

  return (
    <div className="space-y-4">
      {/* Page Grid Overview */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Database className="w-4 h-4" />
            Table Pages ({pages.length})
          </h4>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-gray-600 dark:text-gray-400">Live</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-gray-600 dark:text-gray-400">Dead</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-gray-600 dark:text-gray-400">Frozen</span>
            </div>
          </div>
        </div>

        {pages.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No pages yet. Insert some tuples to get started.
          </div>
        ) : (
          <div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-16 lg:grid-cols-20 gap-1">
            {pages.map((page) => {
              const bloat = getPageBloat(page);

              return (
                <motion.button
                  key={page.id}
                  onClick={() => selectPage(page.id)}
                  className={`aspect-square rounded border-2 transition-all ${
                    selectedPage === page.id
                      ? 'border-orange-500 ring-2 ring-orange-500/50'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-full h-full flex flex-col p-0.5">
                    {/* Mini visualization of page contents */}
                    <div className="flex-1 grid grid-cols-3 gap-px">
                      {Array.from({ length: 9 }).map((_, i) => {
                        const tuple = page.tuples[i];
                        return (
                          <div
                            key={i}
                            className={`rounded-sm ${
                              tuple
                                ? getTupleColor(tuple.state)
                                : 'bg-gray-100 dark:bg-gray-800'
                            }`}
                          />
                        );
                      })}
                    </div>
                    {/* Bloat indicator */}
                    {bloat > 20 && (
                      <div
                        className={`h-0.5 mt-0.5 rounded-full ${
                          bloat > 50 ? 'bg-red-500' : 'bg-yellow-500'
                        }`}
                      />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Page Detail */}
      <AnimatePresence mode="wait">
        {selectedPageData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Page {selectedPageData.id} Details
              </h4>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>Free Space: {selectedPageData.freeSpace} bytes</span>
                <span>•</span>
                <span>{selectedPageData.tuples.length} tuples</span>
              </div>
            </div>

            {/* Tuples Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {selectedPageData.tuples.map((tuple) => (
                <motion.div
                  key={tuple.id}
                  layout
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`p-2 rounded border-2 ${getTupleBorderColor(tuple.state)} ${getTupleColor(
                    tuple.state
                  )} bg-opacity-20`}
                >
                  <div className="text-xs font-mono text-center">
                    <div className="font-semibold text-gray-700 dark:text-gray-300">
                      #{tuple.id}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-[10px]">
                      xmin:{tuple.xmin}
                    </div>
                    {tuple.xmax && (
                      <div className="text-red-600 dark:text-red-400 text-[10px]">
                        xmax:{tuple.xmax}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {/* Empty slots */}
              {Array.from({
                length: Math.max(0, selectedPageData.maxTuples - selectedPageData.tuples.length),
              }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="p-2 rounded border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                >
                  <div className="text-xs text-center text-gray-400 dark:text-gray-600">
                    Empty
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-500/20 border border-green-600" />
                <span className="text-gray-600 dark:text-gray-400">Live</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-500/20 border border-red-600" />
                <span className="text-gray-600 dark:text-gray-400">Dead</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-blue-500/20 border border-blue-600" />
                <span className="text-gray-600 dark:text-gray-400">Frozen</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Navigation */}
      {pages.length > 0 && (
        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
          <button
            onClick={goToPreviousPage}
            disabled={currentPageIndex === 0}
            className="flex items-center gap-1 px-3 py-1 text-sm rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPageIndex + 1} of {pages.length}
          </span>
          <button
            onClick={goToNextPage}
            disabled={currentPageIndex >= pages.length - 1}
            className="flex items-center gap-1 px-3 py-1 text-sm rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Info Panel */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">About Table Pages</p>
            <p>
              PostgreSQL stores data in 8KB pages. Each page contains tuples (rows).
              Dead tuples (red) are created by UPDATE or DELETE operations and need
              to be cleaned up by VACUUM. Frozen tuples (blue) have been frozen to
              prevent XID wraparound issues.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
