import { motion } from 'framer-motion';
import { useToastStore } from '../../../stores/toastStore';
import { Pointer, Database, Info } from 'lucide-react';

export function TOASTPointerView() {
  const { mainTablePointer, dataSize, getStorageLocation } = useToastStore();

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const storageLocation = getStorageLocation();
  const isOutOfLine = storageLocation === 'out-of-line';

  // Parse va_extinfo bits
  const isCompressed = (mainTablePointer.va_extinfo & 0x01) !== 0;
  const isExternal = (mainTablePointer.va_extinfo & 0x02) !== 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center gap-2">
          <Pointer className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h4 className="font-semibold text-gray-900 dark:text-white">
            TOAST Pointer Structure
          </h4>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Comparison: With vs Without TOAST */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Storage Comparison
          </h5>
          <div className="grid grid-cols-2 gap-3">
            {/* Without TOAST */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
            >
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Without TOAST
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Main Table:</span>
                  <span className="font-mono">{formatBytes(dataSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">TOAST Table:</span>
                  <span className="font-mono">0 B</span>
                </div>
                <div className="pt-1 border-t border-blue-200 dark:border-blue-800 flex justify-between">
                  <span className="font-medium">Total:</span>
                  <span className="font-mono font-medium">{formatBytes(dataSize)}</span>
                </div>
              </div>
            </motion.div>

            {/* With TOAST */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className={`p-3 rounded-lg border ${
                isOutOfLine
                  ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                  : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Pointer className={`w-4 h-4 ${
                  isOutOfLine ? 'text-orange-600' : 'text-green-600'
                }`} />
                <span className={`text-sm font-medium ${
                  isOutOfLine
                    ? 'text-orange-800 dark:text-orange-200'
                    : 'text-green-800 dark:text-green-200'
                }`}>
                  With TOAST
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Main Table:</span>
                  <span className="font-mono">{formatBytes(mainTablePointer.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">TOAST Table:</span>
                  <span className="font-mono">
                    {isOutOfLine ? formatBytes(mainTablePointer.va_extsize) : '0 B'}
                  </span>
                </div>
                <div className={`pt-1 border-t flex justify-between ${
                  isOutOfLine
                    ? 'border-orange-200 dark:border-orange-800'
                    : 'border-green-200 dark:border-green-800'
                }`}>
                  <span className="font-medium">Total:</span>
                  <span className="font-mono font-medium">
                    {formatBytes(mainTablePointer.size + mainTablePointer.va_extsize)}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* 18-byte TOAST Pointer Structure */}
        <div>
          <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            18-Byte Pointer Structure
          </h5>

          {/* Visual representation */}
          <div className="space-y-2">
            {/* va_rawsize (4 bytes) */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3"
            >
              <div className="w-24 h-10 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center border border-blue-300 dark:border-blue-700">
                <span className="text-xs font-mono text-blue-700 dark:text-blue-300">4 bytes</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">va_rawsize</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Original (uncompressed) data size: {formatBytes(mainTablePointer.va_rawsize)}
                </p>
              </div>
            </motion.div>

            {/* va_extsize (4 bytes) */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex items-center gap-3"
            >
              <div className="w-24 h-10 bg-green-100 dark:bg-green-900/30 rounded flex items-center justify-center border border-green-300 dark:border-green-700">
                <span className="text-xs font-mono text-green-700 dark:text-green-300">4 bytes</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">va_extsize</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  External (compressed) size: {formatBytes(mainTablePointer.va_extsize)}
                </p>
              </div>
            </motion.div>

            {/* va_extinfo (4 bytes) */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-3"
            >
              <div className="w-24 h-10 bg-purple-100 dark:bg-purple-900/30 rounded flex items-center justify-center border border-purple-300 dark:border-purple-700">
                <span className="text-xs font-mono text-purple-700 dark:text-purple-300">4 bytes</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">va_extinfo</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Flags: {isCompressed ? 'Compressed' : 'Not compressed'}
                  {isExternal ? ', External' : ''}
                </p>
              </div>
            </motion.div>

            {/* va_oid (6 bytes) */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex items-center gap-3"
            >
              <div className="w-32 h-10 bg-orange-100 dark:bg-orange-900/30 rounded flex items-center justify-center border border-orange-300 dark:border-orange-700">
                <span className="text-xs font-mono text-orange-700 dark:text-orange-300">6 bytes</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">va_oid</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  TOAST table OID: {mainTablePointer.va_oid}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Total size indicator */}
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Info className="w-4 h-4" />
            <span>Total: 18 bytes (4 + 4 + 4 + 6)</span>
          </div>
        </div>

        {/* Pointer Value */}
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
          <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Pointer Value
          </h5>
          <code className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
            {mainTablePointer.pointer}
          </code>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-xs text-blue-800 dark:text-blue-200">
          <p className="flex items-start gap-2">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              The TOAST pointer is stored in the main table's heap tuple instead of the actual data.
              This keeps main table rows small and efficient while large data is stored separately.
              {isOutOfLine && (
                <>
                  {' '}
                  In this case, the main table uses only 18 bytes instead of {formatBytes(dataSize)}.
                </>
              )}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
