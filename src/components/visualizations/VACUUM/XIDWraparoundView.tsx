import { useVacuumStore } from '../../../stores/vacuumStore'

export function XIDWraparoundView() {
  const { currentXid, frozenXid } = useVacuumStore()

  const normalizeXid = (xid: number) => xid % 100

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        XID (Transaction ID)는 32비트 정수로, 최대 40억 개의 트랜잭션을 표현합니다.
        XID가 한계에 도달하면 wraparound가 발생합니다.
      </div>

      <div className="relative w-64 h-64 mx-auto">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
            className="dark:stroke-gray-700"
          />

          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="8"
            strokeDasharray={`${normalizeXid(currentXid) * 2.83} 283`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />

          <text x="50" y="45" textAnchor="middle" className="text-xs fill-gray-600 dark:fill-gray-400">
            Current XID
          </text>
          <text x="50" y="60" textAnchor="middle" className="text-sm font-bold fill-blue-600">
            {currentXid.toLocaleString()}
          </text>
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-gray-600 dark:text-gray-400">Current XID</div>
          <div className="font-mono font-medium text-blue-600">{currentXid}</div>
        </div>
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-gray-600 dark:text-gray-400">Frozen XID</div>
          <div className="font-mono font-medium text-green-600">{frozenXid}</div>
        </div>
      </div>
    </div>
  )
}
