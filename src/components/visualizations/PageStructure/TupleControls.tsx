import { useState } from 'react'
import { usePageStore } from '../../../stores/pageStore'
import { motion } from 'framer-motion'

export function TupleControls() {
  const [tupleData, setTupleData] = useState('')
  const { addTuple, removeTuple, compactPage, page, selectedTupleId, selectTuple } = usePageStore()

  const handleAddTuple = () => {
    if (tupleData.trim()) {
      addTuple(tupleData)
      setTupleData('')
    }
  }

  const handleRemoveSelected = () => {
    if (selectedTupleId !== null) {
      removeTuple(selectedTupleId)
      selectTuple(null)
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
        튜플 관리
      </h4>
      
      {/* Add Tuple */}
      <div className="space-y-2 mb-4">
        <label className="text-xs text-gray-600 dark:text-gray-400">
          새 튜플 데이터:
        </label>
        <input
          type="text"
          value={tupleData}
          onChange={(e) => setTupleData(e.target.value)}
          placeholder="예: 사용자 데이터"
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          onKeyDown={(e) => e.key === 'Enter' && handleAddTuple()}
        />
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAddTuple}
          disabled={!tupleData.trim()}
          className="w-full px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md
                     hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600
                     disabled:cursor-not-allowed transition-colors"
        >
          튜플 추가
        </motion.button>
      </div>

      {/* Remove Selected */}
      {selectedTupleId !== null && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-4"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRemoveSelected}
            className="w-full px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-md
                       hover:bg-red-600 transition-colors"
          >
            선택된 튜플 삭제
          </motion.button>
        </motion.div>
      )}

      {/* Compact Page */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={compactPage}
          disabled={page.linePointers.every(lp => lp.flags !== 0)}
          className="w-full px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-md
                     hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-gray-600
                     disabled:cursor-not-allowed transition-colors"
        >
          페이지 압축 (Compact)
        </motion.button>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          삭제된 튜플을 제거하고 공간을 재정렬합니다
        </p>
      </div>
    </div>
  )
}
