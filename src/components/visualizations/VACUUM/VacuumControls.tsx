import { useVacuumStore } from '../../../stores/vacuumStore'
import { motion } from 'framer-motion'

export function VacuumControls() {
  const {
    insertTuple,
    updateTuple,
    deleteTuple,
    runVacuum,
    runVacuumFull,
    freeze,
    isVacuumRunning,
    generateWorkload,
    reset,
    currentXid,
  } = useVacuumStore()

  return (
    <div className="space-y-4">
      <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
        <div className="text-xs text-gray-500 mb-1">Current XID</div>
        <div className="font-mono text-lg font-medium">{currentXid}</div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Operations</h4>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => insertTuple(currentXid)}
          className="w-full px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600"
        >
          Insert Tuple
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => updateTuple(currentXid, 0)}
          className="w-full px-4 py-2 bg-yellow-500 text-white text-sm font-medium rounded-md hover:bg-yellow-600"
        >
          Update Tuple
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => deleteTuple(currentXid, 0)}
          className="w-full px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600"
        >
          Delete Tuple
        </motion.button>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">VACUUM</h4>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={runVacuum}
          disabled={isVacuumRunning}
          className="w-full px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-md hover:bg-green-600 disabled:opacity-50"
        >
          Run VACUUM
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={runVacuumFull}
          disabled={isVacuumRunning}
          className="w-full px-4 py-2 bg-purple-500 text-white text-sm font-medium rounded-md hover:bg-purple-600 disabled:opacity-50"
        >
          Run VACUUM FULL
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={freeze}
          className="w-full px-4 py-2 bg-cyan-500 text-white text-sm font-medium rounded-md hover:bg-cyan-600"
        >
          Freeze
        </motion.button>
      </div>

      <div className="space-y-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => generateWorkload(10, 5, 3)}
          className="w-full px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-600"
        >
          Generate Workload
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={reset}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Reset
        </motion.button>
      </div>
    </div>
  )
}
