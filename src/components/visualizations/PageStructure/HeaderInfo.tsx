import { usePageStore } from '../../../stores/pageStore'

const HEADER_FIELD_DETAILS: Record<string, { label: string; desc: string; size: string }> = {
  pd_lsn: { label: 'pd_lsn', desc: 'WAL (Write-Ahead Log) 위치. 페이지가 마지막으로 수정된 WAL 레코드의 LSN입니다.', size: '8 bytes' },
  pd_checksum: { label: 'pd_checksum', desc: '페이지 데이터의 체크섬. 데이터 무결성을 검증하는 데 사용됩니다.', size: '2 bytes' },
  pd_flags: { label: 'pd_flags', desc: '페이지 상태 플래그 (예: 전체 페이지 쓰기 여부).', size: '2 bytes' },
  pd_lower: { label: 'pd_lower', desc: '여유 공간의 시작 위치 (Line Pointer Array의 끝).', size: '2 bytes' },
  pd_upper: { label: 'pd_upper', desc: '여유 공간의 끝 위치 (마지막 튜플의 시작).', size: '2 bytes' },
  pd_special: { label: 'pd_special', desc: '특수 공간의 시작 위치 (인덱스에서 사용).', size: '2 bytes' },
  pd_pagesize_version: { label: 'pd_pagesize_version', desc: '페이지 크기와 레이아웃 버전 정보.', size: '2 bytes' },
  pd_prune_xid: { label: 'pd_prune_xid', desc: '이 페이지에서 가장 오래된 삭제되지 않은 XID.', size: '4 bytes' },
}

export function HeaderInfo() {
  const { page, hoveredHeaderField } = usePageStore()

  const field = hoveredHeaderField ? HEADER_FIELD_DETAILS[hoveredHeaderField] : null

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
        페이지 헤더 정보
      </h4>

      {field ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {field.label}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {field.size}
            </span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {field.desc}
          </p>
          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs font-mono text-blue-800 dark:text-blue-200">
            현재 값: {hoveredHeaderField ? String((page.header as unknown as Record<string, string | number>)[hoveredHeaderField]) : ''}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            페이지 헤더 필드 위에 마우스를 올려 상세 정보를 확인하세요.
          </p>
          
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">pd_lower:</span>
              <span className="font-mono text-gray-700 dark:text-gray-300">{page.header.pd_lower}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">pd_upper:</span>
              <span className="font-mono text-gray-700 dark:text-gray-300">{page.header.pd_upper}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">여유 공간:</span>
              <span className="font-mono text-green-600 dark:text-green-400">
                {page.header.pd_upper - page.header.pd_lower} bytes
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
