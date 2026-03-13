import { useToastStore, type ToastStrategy, type CompressionType } from '../../../stores/toastStore';
import { Database, FileArchive, Shuffle, FileText, Code, Image, Settings2 } from 'lucide-react';

export function TOASTControls() {
  const {
    dataSize,
    strategy,
    compression,
    setDataSize,
    setStrategy,
    setCompression,
    generateRandomData,
    generateTextData,
    generateJSONData,
    generateImageMetadata
  } = useToastStore();

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const strategies: { value: ToastStrategy; label: string; description: string }[] = [
    {
      value: 'PLAIN',
      label: 'PLAIN',
      description: 'No compression, no out-of-line'
    },
    {
      value: 'EXTENDED',
      label: 'EXTENDED',
      description: 'Compression allowed, out-of-line allowed (default)'
    },
    {
      value: 'EXTERNAL',
      label: 'EXTERNAL',
      description: 'No compression, out-of-line allowed'
    },
    {
      value: 'MAIN',
      label: 'MAIN',
      description: 'Compression allowed, out-of-line only if needed'
    }
  ];

  const compressions: { value: CompressionType; label: string; description: string }[] = [
    {
      value: 'NONE',
      label: 'NONE',
      description: 'No compression'
    },
    {
      value: 'PGLZ',
      label: 'PGLZ',
      description: 'PostgreSQL default compression'
    },
    {
      value: 'LZ4',
      label: 'LZ4',
      description: 'Fast LZ4 compression'
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h4 className="font-semibold text-gray-900 dark:text-white">Configuration</h4>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Data Size Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Data Size
            </label>
            <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
              {formatBytes(dataSize)}
            </span>
          </div>
          <input
            type="range"
            min="100"
            max="10485760"
            step="100"
            value={dataSize}
            onChange={(e) => setDataSize(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 mt-1">
            <span>100 B</span>
            <span>2 KB (TOAST threshold)</span>
            <span>10 MB</span>
          </div>
        </div>

        {/* Strategy Selector */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
            <Database className="w-4 h-4" />
            Storage Strategy
          </label>
          <div className="space-y-2">
            {strategies.map((s) => (
              <label
                key={s.value}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                  strategy === s.value
                    ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
                    : 'bg-gray-50 dark:bg-gray-700/50 border border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="strategy"
                  value={s.value}
                  checked={strategy === s.value}
                  onChange={() => setStrategy(s.value)}
                  className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                />
                <div className="flex-1">
                  <span className={`text-sm font-medium ${
                    strategy === s.value
                      ? 'text-orange-700 dark:text-orange-300'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {s.label}
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {s.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Compression Selector */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
            <FileArchive className="w-4 h-4" />
            Compression Method
          </label>
          <div className="space-y-2">
            {compressions.map((c) => (
              <label
                key={c.value}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                  compression === c.value
                    ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800'
                    : 'bg-gray-50 dark:bg-gray-700/50 border border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="compression"
                  value={c.value}
                  checked={compression === c.value}
                  onChange={() => setCompression(c.value)}
                  className="w-4 h-4 text-purple-500 focus:ring-purple-500"
                />
                <div className="flex-1">
                  <span className={`text-sm font-medium ${
                    compression === c.value
                      ? 'text-purple-700 dark:text-purple-300'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {c.label}
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {c.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Preset Examples */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
            <Shuffle className="w-4 h-4" />
            Generate Sample Data
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => generateTextData(dataSize)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Text
            </button>
            <button
              onClick={() => generateJSONData(dataSize)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors"
            >
              <Code className="w-4 h-4" />
              JSON
            </button>
            <button
              onClick={() => generateImageMetadata(dataSize)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors"
            >
              <Image className="w-4 h-4" />
              Image Meta
            </button>
            <button
              onClick={() => generateRandomData(dataSize)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors"
            >
              <Shuffle className="w-4 h-4" />
              Random
            </button>
          </div>
        </div>

        {/* Quick Size Presets */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Quick Size Presets
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setDataSize(1000)}
              className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded text-xs text-blue-700 dark:text-blue-300 transition-colors"
            >
              1 KB
            </button>
            <button
              onClick={() => setDataSize(2048)}
              className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 rounded text-xs text-yellow-700 dark:text-yellow-300 transition-colors"
            >
              2 KB (Threshold)
            </button>
            <button
              onClick={() => setDataSize(5000)}
              className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 rounded text-xs text-orange-700 dark:text-orange-300 transition-colors"
            >
              5 KB
            </button>
            <button
              onClick={() => setDataSize(10240)}
              className="px-3 py-1 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded text-xs text-red-700 dark:text-red-300 transition-colors"
            >
              10 KB
            </button>
            <button
              onClick={() => setDataSize(1048576)}
              className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 rounded text-xs text-purple-700 dark:text-purple-300 transition-colors"
            >
              1 MB
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
