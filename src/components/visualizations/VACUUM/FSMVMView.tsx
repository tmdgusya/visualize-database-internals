import { useVacuumStore } from '../../../stores/vacuumStore'

export function FSMVMView() {
  const { fsm, vm } = useVacuumStore()

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Free Space Map (FSM)
        </h4>
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
          각 페이지의 여유 공간을 추적합니다.
        </div>
        <div className="grid grid-cols-8 gap-1">
          {fsm.slice(0, 32).map((space, i) => (
            <div
              key={i}
              className={`h-8 rounded flex items-center justify-center text-xs font-mono ${
                space > 4000
                  ? 'bg-green-200 dark:bg-green-800'
                  : space > 2000
                  ? 'bg-yellow-200 dark:bg-yellow-800'
                  : 'bg-red-200 dark:bg-red-800'
              }`}
              title={`Page ${i}: ${space} bytes free`}
            >
              {Math.round(space / 1000)}K
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Visibility Map (VM)
        </h4>
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
          모든 튜플이 visible한 페이지를 표시합니다.
        </div>
        <div className="grid grid-cols-16 gap-1">
          {vm.slice(0, 64).map((visible, i) => (
            <div
              key={i}
              className={`h-6 rounded ${
                visible
                  ? 'bg-green-400 dark:bg-green-600'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
              title={`Page ${i}: ${visible ? 'All Visible' : 'May have dead tuples'}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
