import { usePageStore } from '../../../stores/pageStore'
import { motion } from 'framer-motion'

const HEADER_FIELDS = [
  { key: 'pd_lsn', label: 'pd_lsn', desc: 'WAL 위치 (LSN)' },
  { key: 'pd_checksum', label: 'pd_checksum', desc: '페이지 체크섬' },
  { key: 'pd_flags', label: 'pd_flags', desc: '플래그' },
  { key: 'pd_lower', label: 'pd_lower', desc: '여유 공간 시작' },
  { key: 'pd_upper', label: 'pd_upper', desc: '여유 공간 끝' },
  { key: 'pd_special', label: 'pd_special', desc: '특수 공간 시작' },
]

export function PageView() {
  const { page, selectedTupleId, selectTuple, setHoveredHeaderField } = usePageStore()
  
  const headerHeight = 60
  const linePointerHeight = 20
  const scale = Math.min(1, 600 / page.size * 100)

  return (
    <div className="space-y-4">
      {/* Page Container */}
      <div 
        className="relative border-2 border-gray-400 dark:border-gray-500 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900"
        style={{ height: '500px' }}
      >
        {/* Page Header */}
        <motion.div 
          className="absolute top-0 left-0 right-0 bg-blue-100 dark:bg-blue-900/30 border-b-2 border-blue-300 dark:border-blue-700 p-3"
          style={{ height: headerHeight }}
          initial={false}
        >
          <div className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-1">
            Page Header (24 bytes)
          </div>
          <div className="flex flex-wrap gap-1">
            {HEADER_FIELDS.map((field) => (
              <motion.div
                key={field.key}
                className="px-2 py-0.5 bg-blue-200 dark:bg-blue-800 rounded text-xs cursor-help
                           hover:bg-blue-300 dark:hover:bg-blue-700 transition-colors"
                onMouseEnter={() => setHoveredHeaderField(field.key)}
                onMouseLeave={() => setHoveredHeaderField(null)}
                title={`${field.label}: ${field.desc}`}
                whileHover={{ scale: 1.05 }}
              >
                {field.label}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Line Pointer Array */}
        <div 
          className="absolute left-0 right-0 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800"
          style={{ 
            top: headerHeight, 
            height: Math.max(20, page.linePointers.length * linePointerHeight + 10)
          }}
        >
          <div className="text-xs font-semibold text-green-700 dark:text-green-300 px-3 py-1">
            Line Pointer Array ({page.linePointers.length}개)
          </div>
          <div className="px-3 space-y-1">
            {page.linePointers.map((lp, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-xs"
              >
                <span className="w-6 text-right text-gray-500">#{index + 1}</span>
                <div className="flex-1 h-4 bg-green-200 dark:bg-green-800 rounded flex items-center px-2">
                  <span className="text-green-800 dark:text-green-200">
                    offset: {lp.offset}, len: {lp.length}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Free Space */}
        <div 
          className="absolute left-0 right-0 bg-gray-100 dark:bg-gray-800/50 border-y-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center"
          style={{ 
            top: headerHeight + Math.max(20, page.linePointers.length * linePointerHeight + 10),
            bottom: (page.size - page.header.pd_upper) / page.size * 100 + '%'
          }}
        >
          <div className="text-center">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Free Space
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              {page.header.pd_upper - page.header.pd_lower} bytes
            </div>
          </div>
        </div>

        {/* Tuples (from bottom) */}
        <div className="absolute bottom-0 left-0 right-0">
          {page.tuples.map((tuple, index) => {
            const linePointer = page.linePointers[index]
            if (!linePointer || linePointer.flags === 0) return null
            
            return (
              <motion.div
                key={tuple.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mx-3 mb-2 p-2 rounded border-2 cursor-pointer transition-colors ${
                  selectedTupleId === tuple.id
                    ? 'bg-purple-200 dark:bg-purple-800 border-purple-400 dark:border-purple-600'
                    : 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50'
                }`}
                onClick={() => selectTuple(tuple.id)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                    Tuple #{index + 1}
                  </span>
                  <span className="text-xs text-purple-500 dark:text-purple-400">
                    {tuple.length} bytes
                  </span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {tuple.data}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">Header</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">Line Pointers</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">Free Space</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">Tuples</span>
        </div>
      </div>
    </div>
  )
}
