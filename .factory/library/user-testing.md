# User Testing

PostgreSQL Internals Visualizer의 사용자 테스트 전략과 발견사항.

**What belongs here:** 테스트 표면, 리소스 비용 분류, 고립 전략, 런타임 발견사항.
**What does NOT belong here:** 서비스 포트/명령어 (services.yaml).

---

## Validation Surface

### Primary Surface: Web Browser

**Tools:**
- `agent-browser` for E2E testing
- Chrome DevTools for performance profiling
- React DevTools for component inspection

**Test Scenarios:**
1. **Initial Load**: 페이지 로드, 모든 시각화 모듈 렌더링
2. **Interactions**: 슬라이더, 버튼, 입력 필드 인터랙션
3. **Animations**: 애니메이션 재생, 일시정지, 단계별 진행
4. **Navigation**: 모듈 간 이동, 뒤로가기/앞으로가기
5. **Responsive**: 다양한 뷰포트 크기에서의 렌더링

### Entry Points

1. **Landing Page** (`/`): 모든 시각화 모듈 목록
2. **Direct Module Access** (`/page-structure`, `/buffer-pool`, etc.)
3. **End-to-End Flow** (`/end-to-end`): 통합 뷰

### Authentication
- 인증 없음 (개인 학습용)

## Resource Cost Classification

### Machine Resources
- **Total RAM**: 18 GB (estimated)
- **CPU Cores**: 12 (estimated)
- **Baseline Usage**: ~6 GB
- **Available Headroom**: ~12 GB
- **Usable (70%)**: ~8.4 GB

### Per-Validator Cost (agent-browser)

| Component | Memory | Notes |
|-----------|--------|-------|
| Browser instance | ~300 MB | Chrome headless |
| Dev server | ~200 MB | Vite dev server |
| Per-tab overhead | ~100 MB | Each visualization module |

**Max Concurrent Validators: 5**

Calculation:
- 5 validators × 300 MB = 1.5 GB
- 1 dev server × 200 MB = 0.2 GB
- Total: 1.7 GB (well within 8.4 GB budget)

### Isolation Strategy

**State Partitioning:**
- 각 시각화 모듈은 독립적인 Zustand store 사용
- localStorage 미사용 (테스트 간 간섭 방지)
- URL 기반 네비게이션으로 모듈 고립

**Resource Isolation:**
- 각 validator는 별도의 브라우저 컨텍스트 사용
- 쿠키/캐시 분리

## Testing Data

### Fixtures

**Page Structure:**
```typescript
const defaultPage = {
  size: 8192,  // 8KB
  headerSize: 24,
  tuples: [],
  linePointers: []
};
```

**B-Tree:**
```typescript
const sampleBTree = {
  order: 4,
  keys: [10, 20, 30, 40, 50],
  structure: 'balanced'
};
```

### Seeding Strategy
- 각 테스트는 독립적인 초기 상태로 시작
- `beforeEach`에서 store reset
- 테스트 데이터는 `__fixtures__` 폴더에 저장

## Known Constraints

### Browser Support
- **Target**: Chrome 110+, Safari 16+, Firefox 110+
- **Not Supported**: IE, old Edge

### Performance Limits
- **Max Tuples Displayed**: 1000 (Canvas 최적화)
- **Animation Duration**: 최대 30초 (메모리 누수 방지)
- **Concurrent Animations**: 최대 3개

### Accessibility
- 키보드 네비게이션 필수
- 스크린 리더 지원 (ARIA labels)
- 색상 대비 4.5:1 이상

## Runtime Findings

### Phase 1 (Foundation) Discoveries
- TBD

### Phase 2 (Storage & Indexing) Discoveries
- TBD

### Phase 3 (Advanced Internals) Discoveries
- TBD

### Phase 4 (Integration) Discoveries
- TBD
