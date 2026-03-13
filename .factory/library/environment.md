# Environment

Environment variables, external dependencies, and setup notes.

**What belongs here:** Required env vars, external API keys/services, dependency quirks, platform-specific notes.
**What does NOT belong here:** Service ports/commands (use `.factory/services.yaml`).

---

## Required Environment Variables

```bash
# Development
NODE_ENV=development
VITE_DEV_SERVER_PORT=3100

# Preview/Production
VITE_PREVIEW_PORT=3101
```

## Optional Environment Variables

```bash
# Feature flags
VITE_ENABLE_PERF_MONITORING=true
VITE_DEBUG_ANIMATIONS=false

# Analytics (optional)
VITE_ANALYTICS_ID=
```

## External Dependencies

### Runtime Dependencies
- None (정적 웹 앱)

### Development Dependencies
- Node.js 18+
- pnpm 8+

### Optional External Services
- PostgreSQL (localhost:5432) - 참조용, 직접 연결하지 않음

## Platform-Specific Notes

### macOS
- Xcode Command Line Tools 필요 (node-gyp 등)

### Linux
- `libpixman-1-dev`, `libcairo2-dev` 등 (Canvas 렌더링용)

### Windows
- WSL2 권장
- Native Windows 지원은 제한적

## Dependency Quirks

### D3.js
- v7 사용 (모듈 시스템 개선)
- TypeScript 타입은 `@types/d3` 별도 설치

### Canvas API
- Node.js 환경에서 테스트 시 `canvas` 패키지 필요 (선택적)

### Framer Motion
- React 18 Concurrent Features와 완벽 호환
