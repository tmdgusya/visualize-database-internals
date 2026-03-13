import { useState } from 'react'
import { usePageStore } from '../../../stores/pageStore'
import { PageSizeSelector } from './PageSizeSelector'
import { PageView } from './PageView'
import { TupleControls } from './TupleControls'
import { HeaderInfo } from './HeaderInfo'
import { ByteView } from './ByteView'

export function PageStructureVisualizer() {
  const [activeTab, setActiveTab] = useState<'visual' | 'byte'>('visual')
  const { page, freeSpace, totalTupleSize, isByteView, toggleByteView } = usePageStore()

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              PostgreSQL Page Structure
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              PostgreSQL의 8KB 페이지 낶부 구조를 시각화합니다
            </p>
          </div>
          <PageSizeSelector />
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">페이지 크기:</span>
            <span className="font-mono font-medium text-blue-600 dark:text-blue-400">
              {page.size.toLocaleString()} bytes
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">남은 공간:</span>
            <span className="font-mono font-medium text-green-600 dark:text-green-400">
              {freeSpace.toLocaleString()} bytes
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">튜플 수:</span>
            <span className="font-mono font-medium text-purple-600 dark:text-purple-400">
              {page.tuples.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">총 튜플 크기:</span>
            <span className="font-mono font-medium text-orange-600 dark:text-orange-400">
              {totalTupleSize.toLocaleString()} bytes
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 pt-4">
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('visual')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'visual'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            시각화 뷰
          </button>
          <button
            onClick={() => setActiveTab('byte')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'byte'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            바이트 뷰
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Visualization */}
          <div className="lg:col-span-2">
            {activeTab === 'visual' ? <PageView /> : <ByteView />}
          </div>

          {/* Right: Controls & Info */}
          <div className="space-y-4">
            <TupleControls />
            <HeaderInfo />
          </div>
        </div>
      </div>
    </div>
  )
}
