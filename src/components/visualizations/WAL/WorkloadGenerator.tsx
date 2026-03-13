import { useState } from 'react';
import { motion } from 'framer-motion';
import { useWALStore, type WorkloadPattern } from '../../../stores/walStore';
import { Play, Settings, Database, BarChart3, Layers, AlertCircle } from 'lucide-react';

interface PresetPattern {
  name: string;
  pattern: WorkloadPattern;
  description: string;
  icon: React.ReactNode;
  defaultCount: number;
}

const presets: PresetPattern[] = [
  {
    name: 'OLTP',
    pattern: 'OLTP',
    description: 'Many small transactions (INSERT, UPDATE, COMMIT)',
    icon: <Database className="w-4 h-4" />,
    defaultCount: 50,
  },
  {
    name: 'OLAP',
    pattern: 'OLAP',
    description: 'Few large transactions with checkpoints',
    icon: <BarChart3 className="w-4 h-4" />,
    defaultCount: 30,
  },
  {
    name: 'Mixed',
    pattern: 'MIXED',
    description: 'Balanced mix of all operation types',
    icon: <Layers className="w-4 h-4" />,
    defaultCount: 40,
  },
];

export function WorkloadGenerator() {
  const { generateWorkload, totalRecords } = useWALStore();
  const [selectedPattern, setSelectedPattern] = useState<WorkloadPattern>('MIXED');
  const [recordCount, setRecordCount] = useState(40);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    // Small delay for visual feedback
    await new Promise((resolve) => setTimeout(resolve, 100));
    
    generateWorkload(recordCount, selectedPattern);
    setIsGenerating(false);
  };

  const handlePresetSelect = (preset: PresetPattern) => {
    setSelectedPattern(preset.pattern);
    setRecordCount(preset.defaultCount);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-gray-500" />
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          Workload Generator
        </h4>
      </div>

      {/* Preset Patterns */}
      <div className="space-y-2 mb-4">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
          Preset Pattern
        </label>
        <div className="grid grid-cols-3 gap-2">
          {presets.map((preset) => (
            <motion.button
              key={preset.name}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePresetSelect(preset)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                selectedPattern === preset.pattern
                  ? 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {preset.icon}
              <span className="text-xs font-medium">{preset.name}</span>
            </motion.button>
          ))}
        </div>
        <p className="text-[10px] text-gray-500 dark:text-gray-400">
          {presets.find((p) => p.pattern === selectedPattern)?.description}
        </p>
      </div>

      {/* Record Count */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Record Count
          </label>
          <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
            {recordCount} records
          </span>
        </div>
        <input
          type="range"
          min={10}
          max={200}
          step={10}
          value={recordCount}
          onChange={(e) => setRecordCount(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between text-[10px] text-gray-400">
          <span>10</span>
          <span>100</span>
          <span>200</span>
        </div>
      </div>

      {/* Custom Count Input */}
      <div className="flex gap-2 mb-4">
        <input
          type="number"
          min={1}
          max={1000}
          value={recordCount}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10);
            if (!isNaN(value) && value > 0 && value <= 1000) {
              setRecordCount(value);
            }
          }}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Custom count"
        />
      </div>

      {/* Generate Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            Generate Workload
          </>
        )}
      </motion.button>

      {/* Current Stats */}
      {totalRecords > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-green-500" />
            <span className="text-gray-600 dark:text-gray-400">
              Total Records:
            </span>
            <span className="font-mono font-medium text-gray-900 dark:text-white">
              {totalRecords}
            </span>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
        <p className="text-[10px] text-blue-700 dark:text-blue-300">
          <strong>Tip:</strong> Generated records will appear in the timeline. 
          Use the Crash Recovery tab to simulate crashes and test REDO recovery.
        </p>
      </div>
    </div>
  );
}
