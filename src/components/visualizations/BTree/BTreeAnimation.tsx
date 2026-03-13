import { motion, AnimatePresence } from 'framer-motion';
import { useBTreeStore } from '../../../stores/btreeStore';
import { Split, Merge, ArrowUp, ArrowDown } from 'lucide-react';

export function BTreeAnimation() {
  const { animation, resetAnimation } = useBTreeStore();

  if (!animation.splitAnimation && !animation.mergeAnimation) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed bottom-4 right-4 z-50 max-w-sm"
      >
        {/* Split Animation Panel */}
        {animation.splitAnimation && (
          <div className="bg-amber-50 dark:bg-amber-900/90 border border-amber-200 dark:border-amber-700 rounded-lg shadow-lg p-4 mb-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-full">
                <Split className="w-5 h-5 text-amber-600 dark:text-amber-300" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                  Node Split
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  B-Tree split operation in progress
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {/* Split visualization */}
              <div className="flex items-center justify-center gap-4 py-2">
                {/* Original Node */}
                <motion.div
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="px-3 py-2 bg-amber-200 dark:bg-amber-700 rounded border-2 border-amber-400"
                >
                  <span className="text-xs font-mono text-amber-900 dark:text-amber-100">
                    Full Node
                  </span>
                </motion.div>

                <ArrowUp className="w-5 h-5 text-amber-500" />

                {/* Promoted Key */}
                <motion.div
                  initial={{ y: 0 }}
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="px-3 py-2 bg-green-200 dark:bg-green-700 rounded border-2 border-green-400"
                >
                  <span className="text-xs font-mono text-green-900 dark:text-green-100">
                    Key {animation.splitAnimation.promotedKey}
                  </span>
                </motion.div>

                <ArrowDown className="w-5 h-5 text-amber-500" />

                {/* New Node */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="px-3 py-2 bg-blue-200 dark:bg-blue-700 rounded border-2 border-blue-400"
                >
                  <span className="text-xs font-mono text-blue-900 dark:text-blue-100">
                    New Node
                  </span>
                </motion.div>
              </div>

              <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-800/50 rounded p-2">
                <p>1. Node is full (keys ≥ max)</p>
                <p>2. Split keys into two nodes</p>
                <p>3. Promote middle key to parent</p>
                <p>4. Update child pointers</p>
              </div>
            </div>

            <button
              onClick={resetAnimation}
              className="mt-3 w-full px-3 py-1.5 text-xs bg-amber-200 dark:bg-amber-700 hover:bg-amber-300 dark:hover:bg-amber-600 text-amber-900 dark:text-amber-100 rounded transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Merge Animation Panel */}
        {animation.mergeAnimation && (
          <div className="bg-purple-50 dark:bg-purple-900/90 border border-purple-200 dark:border-purple-700 rounded-lg shadow-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-full">
                <Merge className="w-5 h-5 text-purple-600 dark:text-purple-300" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                  Node Merge
                </h4>
                <p className="text-xs text-purple-700 dark:text-purple-300">
                  B-Tree merge operation in progress
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {/* Merge visualization */}
              <div className="flex items-center justify-center gap-4 py-2">
                {/* Underflow Node */}
                <motion.div
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 0.9, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="px-3 py-2 bg-red-200 dark:bg-red-700 rounded border-2 border-red-400"
                >
                  <span className="text-xs font-mono text-red-900 dark:text-red-100">
                    Underflow
                  </span>
                </motion.div>

                <Merge className="w-5 h-5 text-purple-500" />

                {/* Sibling Node */}
                <motion.div
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="px-3 py-2 bg-purple-200 dark:bg-purple-700 rounded border-2 border-purple-400"
                >
                  <span className="text-xs font-mono text-purple-900 dark:text-purple-100">
                    Sibling
                  </span>
                </motion.div>

                <ArrowUp className="w-5 h-5 text-purple-500" />

                {/* Parent Key */}
                <motion.div
                  initial={{ y: 0 }}
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="px-3 py-2 bg-amber-200 dark:bg-amber-700 rounded border-2 border-amber-400"
                >
                  <span className="text-xs font-mono text-amber-900 dark:text-amber-100">
                    Parent Key
                  </span>
                </motion.div>
              </div>

              <div className="text-xs text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-800/50 rounded p-2">
                <p>1. Node has too few keys (underflow)</p>
                <p>2. Sibling cannot redistribute</p>
                <p>3. Merge with sibling</p>
                <p>4. Move parent key down</p>
              </div>
            </div>

            <button
              onClick={resetAnimation}
              className="mt-3 w-full px-3 py-1.5 text-xs bg-purple-200 dark:bg-purple-700 hover:bg-purple-300 dark:hover:bg-purple-600 text-purple-900 dark:text-purple-100 rounded transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
