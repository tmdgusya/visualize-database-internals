import { usePageStore } from '../../../stores/pageStore'
import type { PageSize } from '../../../types'

const PAGE_SIZES: { value: PageSize; label: string }[] = [
  { value: 4096, label: '4 KB' },
  { value: 8192, label: '8 KB (기본)' },
  { value: 16384, label: '16 KB' },
  { value: 32768, label: '32 KB' },
]

export function PageSizeSelector() {
  const { page, setPageSize } = usePageStore()

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        페이지 크기:
      </label>
      <select
        value={page.size}
        onChange={(e) => setPageSize(Number(e.target.value) as PageSize)}
        className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md 
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {PAGE_SIZES.map((size) => (
          <option key={size.value} value={size.value}>
            {size.label}
          </option>
        ))}
      </select>
    </div>
  )
}
