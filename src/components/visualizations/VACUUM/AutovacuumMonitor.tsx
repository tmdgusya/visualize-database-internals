import { useVacuumStore } from '../../../stores/vacuumStore'

export function AutovacuumMonitor() {
  const { deadTupleCount, autovacuumThreshold } = useVacuumStore()

  const percentage = Math.min(100, (deadTupleCount / autovacuumThreshold) * 100)

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Autovacuum은 dead tuple이 일정 수준 이상 쌓이면 자동으로 VACUUM을 실행합니다.
      </div>

      <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600 dark:text-gray-400">Dead Tuples</span>
          <span className="font-mono">{deadTupleCount} / {autovacuumThreshold}</span>
        </div>

        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              percentage >= 100 ? 'bg-red-500' : 'bg-green-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="mt-2 text-xs text-gray-500">
          {percentage >= 100
            ? 'Autovacuum triggered!'
            : `${Math.round(percentage)}% of threshold`}
        </div>
      </div>
    </div>
  )
}
