import { motion } from 'framer-motion';
import { useToastStore, TOAST_TUPLE_THRESHOLD, type ToastStrategy, type CompressionType } from '../../../stores/toastStore';
import { Database, FileArchive, CheckCircle, XCircle } from 'lucide-react';

interface StrategyCardProps {
  strategy: ToastStrategy;
  isActive: boolean;
  compression: CompressionType;
  dataSize: number;
  delay?: number;
}

function StrategyCard({ strategy, isActive, compression, dataSize, delay = 0 }: StrategyCardProps) {
  // Calculate values for this strategy
  const getStrategyDetails = () => {
    const shouldToast = dataSize > TOAST_TUPLE_THRESHOLD;

    switch (strategy) {
      case 'PLAIN':
        return {
          allowsCompression: false,
          allowsOutOfLine: false,
          mainTableSize: dataSize,
          toastTableSize: 0,
          totalSize: dataSize,
          storageLocation: 'inline' as const,
          compressionUsed: false,
          description: 'No compression, no out-of-line storage. Must fit in page.',
          warning: shouldToast ? 'Data too large - will cause error!' : undefined
        };

      case 'EXTENDED': {
        const extCompressed = compression !== 'NONE';
        const extCompressionRatio = extCompressed ? 0.4 : 1.0;
        const extCompressedSize = Math.floor(dataSize * extCompressionRatio);
        const extFitsAfterCompression = extCompressedSize <= TOAST_TUPLE_THRESHOLD;

        if (!shouldToast) {
          return {
            allowsCompression: true,
            allowsOutOfLine: true,
            mainTableSize: dataSize,
            toastTableSize: 0,
            totalSize: dataSize,
            storageLocation: 'inline' as const,
            compressionUsed: false,
            description: 'Default strategy. Compression and out-of-line allowed.',
            warning: undefined
          };
        }

        if (extFitsAfterCompression && extCompressed) {
          return {
            allowsCompression: true,
            allowsOutOfLine: true,
            mainTableSize: extCompressedSize,
            toastTableSize: 0,
            totalSize: extCompressedSize,
            storageLocation: 'inline' as const,
            compressionUsed: true,
            description: 'Default strategy. Compression and out-of-line allowed.',
            warning: undefined
          };
        }

        return {
          allowsCompression: true,
          allowsOutOfLine: true,
          mainTableSize: 18, // TOAST pointer
          toastTableSize: extCompressedSize,
          totalSize: 18 + extCompressedSize,
          storageLocation: 'out-of-line' as const,
          compressionUsed: extCompressed,
          description: 'Default strategy. Compression and out-of-line allowed.',
          warning: undefined
        };
      }

      case 'EXTERNAL':
        if (!shouldToast) {
          return {
            allowsCompression: false,
            allowsOutOfLine: true,
            mainTableSize: dataSize,
            toastTableSize: 0,
            totalSize: dataSize,
            storageLocation: 'inline' as const,
            compressionUsed: false,
            description: 'No compression, out-of-line allowed.',
            warning: undefined
          };
        }

        return {
          allowsCompression: false,
          allowsOutOfLine: true,
          mainTableSize: 18, // TOAST pointer
          toastTableSize: dataSize,
          totalSize: 18 + dataSize,
          storageLocation: 'out-of-line' as const,
          compressionUsed: false,
          description: 'No compression, out-of-line allowed.',
          warning: undefined
        };

      case 'MAIN': {
        const mainCompressed = compression !== 'NONE';
        const mainCompressionRatio = mainCompressed ? 0.4 : 1.0;
        const mainCompressedSize = Math.floor(dataSize * mainCompressionRatio);
        const mainFitsAfterCompression = mainCompressedSize <= TOAST_TUPLE_THRESHOLD;

        if (!shouldToast) {
          return {
            allowsCompression: true,
            allowsOutOfLine: false,
            mainTableSize: dataSize,
            toastTableSize: 0,
            totalSize: dataSize,
            storageLocation: 'inline' as const,
            compressionUsed: false,
            description: 'Compression allowed, out-of-line only if needed.',
            warning: undefined
          };
        }

        if (mainFitsAfterCompression && mainCompressed) {
          return {
            allowsCompression: true,
            allowsOutOfLine: true,
            mainTableSize: mainCompressedSize,
            toastTableSize: 0,
            totalSize: mainCompressedSize,
            storageLocation: 'inline' as const,
            compressionUsed: true,
            description: 'Compression allowed, out-of-line only if needed.',
            warning: undefined
          };
        }

        return {
          allowsCompression: true,
          allowsOutOfLine: true,
          mainTableSize: 18, // TOAST pointer
          toastTableSize: mainCompressedSize,
          totalSize: 18 + mainCompressedSize,
          storageLocation: 'out-of-line' as const,
          compressionUsed: mainCompressed,
          description: 'Compression allowed, out-of-line only if needed.',
          warning: undefined
        };
      }

      default:
        return {
          allowsCompression: false,
          allowsOutOfLine: false,
          mainTableSize: dataSize,
          toastTableSize: 0,
          totalSize: dataSize,
          storageLocation: 'inline' as const,
          compressionUsed: false,
          description: '',
          warning: undefined
        };
    }
  };

  const details = getStrategyDetails();

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={`p-4 rounded-lg border-2 transition-all duration-300 ${
        isActive
          ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500 dark:border-orange-400'
          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className={`font-bold text-lg ${
          isActive ? 'text-orange-700 dark:text-orange-300' : 'text-gray-700 dark:text-gray-300'
        }`}>
          {strategy}
        </h4>
        {isActive && (
          <span className="px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded">
            Active
          </span>
        )}
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {details.description}
      </p>

      {/* Feature Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className={`flex items-center gap-2 p-2 rounded ${
          details.allowsCompression
            ? 'bg-green-100 dark:bg-green-900/30'
            : 'bg-red-100 dark:bg-red-900/30'
        }`}>
          {details.allowsCompression ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <XCircle className="w-4 h-4 text-red-600" />
          )}
          <span className="text-xs font-medium">Compression</span>
        </div>

        <div className={`flex items-center gap-2 p-2 rounded ${
          details.allowsOutOfLine
            ? 'bg-green-100 dark:bg-green-900/30'
            : 'bg-red-100 dark:bg-red-900/30'
        }`}>
          {details.allowsOutOfLine ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <XCircle className="w-4 h-4 text-red-600" />
          )}
          <span className="text-xs font-medium">Out-of-line</span>
        </div>
      </div>

      {/* Storage Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Database className="w-4 h-4 text-blue-500" />
          <span className="text-gray-600 dark:text-gray-400">Storage:</span>
          <span className={`font-medium ${
            details.storageLocation === 'inline'
              ? 'text-green-600 dark:text-green-400'
              : 'text-blue-600 dark:text-blue-400'
          }`}>
            {details.storageLocation === 'inline' ? 'Inline' : 'Out-of-line'}
          </span>
        </div>

        {details.compressionUsed && (
          <div className="flex items-center gap-2 text-sm">
            <FileArchive className="w-4 h-4 text-purple-500" />
            <span className="text-gray-600 dark:text-gray-400">Compression:</span>
            <span className="font-medium text-purple-600 dark:text-purple-400">
              {compression}
            </span>
          </div>
        )}
      </div>

      {/* Size Bars */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-600 dark:text-gray-400">Main Table</span>
            <span className="font-mono">{formatBytes(details.mainTableSize)}</span>
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((details.mainTableSize / dataSize) * 100, 100)}%` }}
              transition={{ delay: delay + 0.2, duration: 0.5 }}
              className={`h-full ${
                details.storageLocation === 'inline'
                  ? 'bg-green-500'
                  : 'bg-blue-500'
              }`}
            />
          </div>
        </div>

        {details.toastTableSize > 0 && (
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600 dark:text-gray-400">TOAST Table</span>
              <span className="font-mono">{formatBytes(details.toastTableSize)}</span>
            </div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((details.toastTableSize / dataSize) * 100, 100)}%` }}
                transition={{ delay: delay + 0.3, duration: 0.5 }}
                className="h-full bg-orange-500"
              />
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Total Size</span>
            <span className="font-mono font-medium">{formatBytes(details.totalSize)}</span>
          </div>
        </div>
      </div>

      {details.warning && (
        <div className="mt-4 p-2 bg-red-100 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-800">
          <p className="text-xs text-red-700 dark:text-red-300">{details.warning}</p>
        </div>
      )}
    </motion.div>
  );
}

export function TOASTComparison() {
  const { dataSize, compression, strategy } = useToastStore();

  const strategies: ToastStrategy[] = ['PLAIN', 'EXTENDED', 'EXTERNAL', 'MAIN'];

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Strategy Comparison
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Compare how different storage strategies handle the same data
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {strategies.map((s, index) => (
          <StrategyCard
            key={s}
            strategy={s}
            isActive={s === strategy}
            compression={compression}
            dataSize={dataSize}
            delay={index * 0.1}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span className="text-gray-600 dark:text-gray-400">Inline storage</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded" />
            <span className="text-gray-600 dark:text-gray-400">TOAST pointer</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded" />
            <span className="text-gray-600 dark:text-gray-400">TOAST data</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-gray-600 dark:text-gray-400">Feature enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
}
