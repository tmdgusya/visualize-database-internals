import { useState } from 'react';
import { motion } from 'framer-motion';
import { useWALStore } from '../../../stores/walStore';
import { WALTimeline } from './WALTimeline';
import { WALRecordDetail } from './WALRecordDetail';
import { CrashRecoverySimulator } from './CrashRecoverySimulator';
import { LSNTracker } from './LSNTracker';
import { WorkloadGenerator } from './WorkloadGenerator';
import { FileText, Play, Pause, StepForward, RotateCcw, Activity } from 'lucide-react';

export function WALExplorer() {
  const [activeTab, setActiveTab] = useState<'timeline' | 'recovery' | 'lsn'>('timeline');
  const {
    currentLsn,
    totalRecords,
    segments,
    crashPointLsn,
    isPlaying,
    play,
    pause,
    step,
    reset,
  } = useWALStore();

  const segmentCount = segments.length;

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                WAL (Write-Ahead Log)
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                PostgreSQL의 Write-Ahead Log 구조와 Crash Recovery 시각화
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-6 py-3 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-100 dark:border-purple-800">
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">Current LSN:</span>
            <span className="font-mono font-medium text-purple-600 dark:text-purple-400">
              {currentLsn}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">Segment Count:</span>
            <span className="font-mono font-medium text-blue-600 dark:text-blue-400">
              {segmentCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">Record Count:</span>
            <span className="font-mono font-medium text-green-600 dark:text-green-400">
              {totalRecords}
            </span>
          </div>
          {crashPointLsn && (
            <div className="flex items-center gap-2">
              <span className="text-gray-600 dark:text-gray-400">Crash Point:</span>
              <span className="font-mono font-medium text-red-600 dark:text-red-400">
                {crashPointLsn}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Playback Controls */}
      <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePlayPause}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isPlaying
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50'
                  : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Play
                </>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={step}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
            >
              <StepForward className="w-4 h-4" />
              Step
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </motion.button>
          </div>

          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {isPlaying ? 'Playing...' : 'Paused'}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 pt-4">
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'timeline'
                ? 'bg-purple-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            Timeline
          </button>
          <button
            onClick={() => setActiveTab('recovery')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'recovery'
                ? 'bg-red-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Activity className="w-4 h-4" />
            Crash Recovery
          </button>
          <button
            onClick={() => setActiveTab('lsn')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'lsn'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Activity className="w-4 h-4" />
            LSN Tracker
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left/Top: Main Visualization */}
          <div className="xl:col-span-2 space-y-6">
            {activeTab === 'timeline' && <WALTimeline />}
            {activeTab === 'recovery' && <CrashRecoverySimulator />}
            {activeTab === 'lsn' && <LSNTracker />}
          </div>

          {/* Right/Bottom: Controls & Details */}
          <div className="space-y-4">
            <WorkloadGenerator />
            <WALRecordDetail />
          </div>
        </div>
      </div>
    </div>
  );
}
