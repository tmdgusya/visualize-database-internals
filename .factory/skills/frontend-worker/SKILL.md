---
name: frontend-worker
description: Frontend React/TypeScript 개발자 - PostgreSQL Internals 시각화 컴포넌트 구현
---

# Frontend Worker

## When to Use This Skill

이 스킬은 PostgreSQL Internals Visualizer 프로젝트의 React/TypeScript 프론트엔드 컴포넌트를 구현할 때 사용됩니다:
- 시각화 컴포넌트 (Page Structure, Buffer Pool, WAL, B-Tree 등)
- 인터랙티브 UI 컴포넌트 (슬라이더, 애니메이션, 입력 폼)
- 상태 관리 (Zustand stores)
- 스타일링 (Tailwind CSS, shadcn/ui)
- D3.js/Canvas 기반 시각화

## Work Procedure

### 1. Setup & Analysis
- `mission.md`와 `AGENTS.md` 읽기
- 구현할 시각화 모듈의 요구사항 분석
- 기존 컴포넌트 구조 확인 (있는 경우)

### 2. Test-First Development (TDD)
**항상 테스트를 먼저 작성합니다 (Red → Green → Refactor)**

#### 2.1 Unit Tests (핵심 알고리즘)
```typescript
// 예: B-Tree insertion logic
describe('BTree insertion', () => {
  it('should split node when full', () => {
    // 테스트 작성
  });
  it('should maintain BST property after split', () => {
    // 테스트 작성
  });
});
```

#### 2.2 Component Tests (React Testing Library)
```typescript
// 예: PageStructure 컴포넌트
describe('PageStructure', () => {
  it('renders initial 8KB page layout', () => {
    // 테스트 작성
  });
  it('updates on page size slider change', async () => {
    // 테스트 작성
  });
});
```

### 3. Implementation
- TypeScript 타입 정의 먼저 작성
- 순수 함수/로직 구현 (테스트 통과)
- React 컴포넌트 구현
- 상태 관리 연결 (Zustand)
- 스타일링 (Tailwind + shadcn/ui)

### 4. Visualization Implementation
- **D3.js**: 복잡한 트리/그래프 구조 (B-Tree, Query Plan)
- **Canvas API**: 고성능 애니메이션 (Buffer Pool, WAL)
- **SVG + Framer Motion**: 인터랙티브 UI 요소
- **CSS Transitions**: 간단한 상태 변화

### 5. Manual Verification
**각 기능을 수동으로 테스트:**

```bash
# 개발 서버 시작
npm run dev

# 브라우저에서 검증
# - 모든 인터랙션 작동 확인
# - 애니메이션 60fps 확인
# - 반응형 레이아웃 확인
```

**interactiveChecks에 기록:**
```json
{
  "action": "Page size slider 8KB → 16KB",
  "observed": "Page layout updated, byte calculations refreshed, no console errors"
}
```

### 6. Accessibility Check
- 키보드 네비게이션 확인 (Tab, Enter, Arrow keys)
- ARIA 레이블 확인
- 색상 대비 확인

### 7. Performance Check
- Chrome DevTools Performance 탭에서 60fps 확인
- 불필요한 리렌더링 확인 (React DevTools Profiler)

### 8. Run Validators
```bash
npm run typecheck
npm run lint
npm run test
```

## Example Handoff

```json
{
  "salientSummary": "Implemented Page Structure visualizer with interactive 8KB page layout, tuple insertion animation, and header field tooltips. Added comprehensive tests for page calculations and component rendering.",
  "whatWasImplemented": "PageStructure component with: (1) Interactive page size slider (4KB-32KB), (2) Animated tuple insertion showing line pointer growth, (3) Header field hover tooltips, (4) TID navigation game, (5) Defragmentation simulator. Includes Zustand store for page state management and utility functions for page calculations.",
  "whatWasLeftUndone": "",
  "verification": {
    "commandsRun": [
      {"command": "npm run typecheck", "exitCode": 0, "observation": "No type errors"},
      {"command": "npm run lint", "exitCode": 0, "observation": "No lint errors"},
      {"command": "npm test -- PageStructure", "exitCode": 0, "observation": "6 tests passing"}
    ],
    "interactiveChecks": [
      {"action": "Page size slider 8KB → 16KB", "observed": "Layout updated correctly, byte calculations accurate"},
      {"action": "Click 'Add Tuple' 5 times", "observed": "Line pointers grow from top, tuples stack from bottom, animation smooth at 60fps"},
      {"action": "Hover over pd_lsn field", "observed": "Tooltip appears with description"},
      {"action": "TID navigation game - input (0,3)", "observed": "Correct path highlighted: File → Page → Line Pointer 3 → Tuple"},
      {"action": "Trigger defragmentation", "observed": "Animation shows compaction, pd_lower/pd_upper values update"}
    ]
  },
  "tests": {
    "added": [
      {"file": "src/components/PageStructure/PageStructure.test.tsx", "cases": [
        {"name": "renders initial 8KB page", "verifies": "VAL-PAGE-001"},
        {"name": "updates on page size change", "verifies": "VAL-PAGE-002"},
        {"name": "tuple insertion animation", "verifies": "VAL-PAGE-003"}
      ]},
      {"file": "src/utils/pageCalculations.test.ts", "cases": [
        {"name": "calculates free space correctly", "verifies": "Page math utilities"},
        {"name": "handles page size boundaries", "verifies": "Edge cases"}
      ]}
    ]
  },
  "discoveredIssues": []
}
```

## When to Return to Orchestrator

- **의존성 문제**: 필요한 데이터 모델이나 유틸리티가 아직 구현되지 않은 경우
- **성능 문제**: 60fps를 달성할 수 없는 복잡한 시각화의 경우
- **기술적 제약**: 요구사항을 구현하는 데 기술적 한계가 있는 경우
- **범위 확장**: 원래 범위를 벗어나는 추가 기능이 필요한 경우

## Coding Conventions

### TypeScript
- Strict mode 활성화
- 모든 함수/컴포넌트에 명시적 타입
- `interface` > `type` 선호
- `enum` 대신 union type 사용

### React
- Functional components + Hooks
- Props destructuring
- `useCallback`/`useMemo` for expensive calculations
- Custom hooks for reusable logic

### Styling
- Tailwind CSS utility classes
- shadcn/ui components 활용
- CSS-in-JS는 사용하지 않음
- 다크모드 지원 (class-based)

### State Management
- Zustand for global state
- React Query for server state (if applicable)
- Local state with useState for component-specific data

### Testing
- Vitest for unit tests
- React Testing Library for component tests
- Playwright for E2E tests
- Coverage > 80% for business logic
