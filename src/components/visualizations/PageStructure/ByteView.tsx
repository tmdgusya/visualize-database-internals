import { usePageStore } from '../../../stores/pageStore'

const BYTES_PER_ROW = 16

export function ByteView() {
  const { page } = usePageStore()

  // Generate byte representation
  const bytes: { offset: number; value: number; region: string }[] = []
  
  // Header (24 bytes)
  for (let i = 0; i < 24; i++) {
    bytes.push({ offset: i, value: Math.floor(Math.random() * 256), region: 'header' })
  }
  
  // Line pointers (4 bytes each)
  for (let i = 0; i < page.linePointers.length; i++) {
    for (let j = 0; j < 4; j++) {
      bytes.push({ 
        offset: 24 + i * 4 + j, 
        value: Math.floor(Math.random() * 256), 
        region: 'linepointer' 
      })
    }
  }
  
  // Free space (empty)
  const freeSpaceStart = 24 + page.linePointers.length * 4
  const freeSpaceEnd = page.header.pd_upper
  for (let i = freeSpaceStart; i < freeSpaceEnd; i++) {
    bytes.push({ offset: i, value: 0, region: 'freespace' })
  }

  const rows = Math.ceil(page.size / BYTES_PER_ROW)

  const getRegionColor = (region: string) => {
    switch (region) {
      case 'header':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
      case 'linepointer':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
      case 'freespace':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
      default:
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200'
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        페이지의 바이트 단위 메모리 맵을 보여줍니다.
      </div>
      
      <div className="font-mono text-xs overflow-x-auto">
        <div className="grid grid-cols-[auto_repeat(16,1fr)] gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
          {/* Header row */}
          <div className="bg-gray-100 dark:bg-gray-800 p-2 text-gray-500 dark:text-gray-400">Offset</div>
          {Array.from({ length: BYTES_PER_ROW }, (_, i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-800 p-2 text-center text-gray-500 dark:text-gray-400">
              {i.toString(16).toUpperCase().padStart(2, '0')}
            </div>
          ))}
          
          {/* Data rows */}
          {Array.from({ length: Math.min(rows, 32) }, (_, rowIndex) => {
            const rowOffset = rowIndex * BYTES_PER_ROW
            return (
              <>
                <div key={`offset-${rowIndex}`} className="bg-gray-50 dark:bg-gray-900 p-2 text-gray-500 dark:text-gray-400">
                  {rowOffset.toString(16).toUpperCase().padStart(4, '0')}
                </div>
                {Array.from({ length: BYTES_PER_ROW }, (_, colIndex) => {
                  const offset = rowOffset + colIndex
                  const byte = bytes.find(b => b.offset === offset)
                  return (
                    <div 
                      key={`byte-${offset}`}
                      className={`p-2 text-center ${byte ? getRegionColor(byte.region) : 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-600'}`}
                      title={byte ? `${byte.region} (offset: ${offset})` : `Unused (offset: ${offset})`}
                    >
                      {byte ? byte.value.toString(16).toUpperCase().padStart(2, '0') : '00'}
                    </div>
                  )
                })}
              </>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900/30 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">Header (24 bytes)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">Line Pointers (4 bytes each)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 dark:bg-gray-800 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">Free Space</span>
        </div>
      </div>
    </div>
  )
}
