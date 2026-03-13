# Architecture

PostgreSQL Internals Visualizer의 아키텍처 결정사항과 패턴들.

**What belongs here:** 컴포넌트 구조, 상태 관리 패턴, 시각화 라이브러리 선택, 성능 최적화 전략.
**What does NOT belong here:** 포트 정보 (services.yaml), 환경 변수 (environment.md).

---

## Component Structure

```
src/
├── components/           # 재사용 가능한 UI 컴포넌트
│   ├── ui/              # shadcn/ui 기본 컴포넌트
│   └── visualizations/  # 시각화 컴포넌트
│       ├── PageStructure/
│       ├── BufferPool/
│       ├── WAL/
│       ├── BTree/
│       ├── TOAST/
│       ├── MVCC/
│       ├── QueryExecution/
│       ├── JoinAlgorithms/
│       ├── Vacuum/
│       ├── EndToEndFlow/
│       └── PerformancePlayground/
├── hooks/               # Custom React hooks
├── stores/              # Zustand 상태 관리
├── utils/               # 순수 함수 유틸리티
├── types/               # TypeScript 타입 정의
└── lib/                 # 설정 및 유틸리티
```

## State Management Pattern

### Zustand Store Structure

```typescript
// stores/pageStore.ts
interface PageState {
  // State
  pageSize: number;        // 4KB, 8KB, 16KB, 32KB
  tuples: Tuple[];
  linePointers: LinePointer[];
  
  // Actions
  setPageSize: (size: number) => void;
  addTuple: (tuple: Tuple) => void;
  removeTuple: (id: number) => void;
  compactPage: () => void;
  
  // Computed
  freeSpace: number;
  fragmentation: number;
}
```

### Store 분리 원칙
- **Feature별 분리**: 각 시각화 모듈은 독립적인 store
- **공유 상태**: `useCommonStore` for navigation, theme, etc.
- **파생 상태**: `computed` 속성으로 캐싱

## Visualization Library Selection

| Use Case | Library | Reason |
|----------|---------|--------|
| B-Tree, Query Plan | D3.js | Hierarchical layouts, complex trees |
| Buffer Pool, WAL | Canvas API | High-performance animations, many objects |
| UI Animations | Framer Motion | React integration, gestures |
| Simple transitions | CSS/Tailwind | Lightweight, no JS overhead |

## Performance Optimization

### Rendering
- `React.memo` for pure visualization components
- `useMemo` for expensive calculations
- Virtualization for long lists (if applicable)
- `requestAnimationFrame` for smooth animations

### Canvas Optimization
- Object pooling for particles/buffers
- Dirty rectangle rendering
- Offscreen canvas for static backgrounds

### State Updates
- Batched updates for animations
- Throttle/debounce for slider inputs
- Selector optimization in Zustand

## Animation Patterns

### Framer Motion
```typescript
// AnimatePresence for enter/exit
<AnimatePresence>
  {tuples.map(tuple => (
    <motion.div
      key={tuple.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
    />
  ))}
</AnimatePresence>
```

### Canvas Animation Loop
```typescript
useEffect(() => {
  let animationId: number;
  
  const animate = () => {
    // Update state
    // Render frame
    animationId = requestAnimationFrame(animate);
  };
  
  animationId = requestAnimationFrame(animate);
  
  return () => cancelAnimationFrame(animationId);
}, []);
```

## TypeScript Patterns

### Discriminated Unions for Visualization States
```typescript
type VisualizationState = 
  | { type: 'idle' }
  | { type: 'animating'; progress: number }
  | { type: 'paused'; frame: number }
  | { type: 'completed' };
```

### Branded Types for IDs
```typescript
type TupleId = string & { __brand: 'TupleId' };
type PageId = string & { __brand: 'PageId' };
```
