import { PageStructureVisualizer } from './components/visualizations/PageStructure/PageStructureVisualizer'
import { BufferPoolSimulator } from './components/visualizations/BufferPool/BufferPoolSimulator'
import { WALExplorer } from './components/visualizations/WAL/WALExplorer'
import { BTreeVisualizer } from './components/visualizations/BTree'
import { TOASTDemonstrator } from './components/visualizations/TOAST'
import { MVCCTimeline } from './components/visualizations/MVCC'
import { QueryPlanVisualizer } from './components/visualizations/QueryPlan'
import { JoinAlgorithmAnimator } from './components/visualizations/JoinAlgorithm'
import { VacuumSimulator } from './components/visualizations/VACUUM'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            PostgreSQL Internals Visualizer
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            데이터베이스 낶부 구조 시각화 학습 플랫폼
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              1. Page Structure (페이지 구조)
            </h2>
            <PageStructureVisualizer />
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              2. Buffer Pool (버퍼 풀)
            </h2>
            <BufferPoolSimulator />
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              3. WAL (Write-Ahead Log)
            </h2>
            <WALExplorer />
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              4. B-Tree Index (B-트리 인덱스)
            </h2>
            <BTreeVisualizer />
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              5. TOAST (Oversized-Attribute Storage)
            </h2>
            <TOASTDemonstrator />
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              6. MVCC (Multi-Version Concurrency Control)
            </h2>
            <MVCCTimeline />
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              7. Query Execution Plan (쿼리 실행 계획)
            </h2>
            <QueryPlanVisualizer />
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              8. Join Algorithms (조인 알고리즘)
            </h2>
            <JoinAlgorithmAnimator />
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              9. VACUUM
            </h2>
            <VacuumSimulator />
          </section>
        </div>
      </main>
    </div>
  )
}

export default App
