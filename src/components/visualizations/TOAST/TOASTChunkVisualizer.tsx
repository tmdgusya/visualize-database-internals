import { motion } from 'framer-motion';
import { useToastStore, TOAST_MAX_CHUNK_SIZE } from '../../../stores/toastStore';
import { Database, FileArchive, Layers, ArrowRight, Hash, FileText } from 'lucide-react';

export function TOASTChunkVisualizer() {
  const { chunks, dataSize, compression, getCompressedSize, mainTablePointer } = useToastStore();

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const compressedSize = getCompressedSize();
  const compressionRatio = dataSize > 0 ? (compressedSize / dataSize) * 100 : 100;

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        TOAST Chunk Visualization
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        How large values are broken into ~2KB chunks for out-of-line storage
      </p>

      {chunks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Database className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            No TOAST Chunks
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Current data size and strategy do not require out-of-line storage.
            Data is stored inline in the main table.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Data Flow Diagram */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Data Flow</h4>
            <div className="flex flex-wrap items-center gap-4">
              {/* Original Data */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg"
              >
                <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Original Data</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{formatBytes(dataSize)}</p>
                </div>
              </motion.div>

              <ArrowRight className="w-6 h-6 text-gray-400" />

              {/* Compression (if applicable) */}
              {compression !== 'NONE' && (
                <>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-3 p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg"
                  >
                    <FileArchive className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {compression} Compression
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {formatBytes(compressedSize)} ({compressionRatio.toFixed(1)}%)
                      </p>
                    </div>
                  </motion.div>

                  <ArrowRight className="w-6 h-6 text-gray-400" />
                </>
              )}

              {/* Chunks */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-3 p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg"
              >
                <Layers className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {chunks.length} Chunk{chunks.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    ~{formatBytes(TOAST_MAX_CHUNK_SIZE)} each
                  </p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Chunk Grid */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">TOAST Table Chunks</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {chunks.map((chunk, index) => (
                <motion.div
                  key={chunk.chunk_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden"
                >
                  {/* Chunk Header */}
                  <div className="bg-gray-100 dark:bg-gray-600 px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-xs font-mono text-gray-600 dark:text-gray-300">
                        Seq: {chunk.chunk_seq}
                      </span>
                    </div>
                    {chunk.compressed && (
                      <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs rounded">
                        Compressed
                      </span>
                    )}
                  </div>

                  {/* Chunk Content */}
                  <div className="p-3 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Chunk ID:</span>
                      <span className="font-mono text-gray-700 dark:text-gray-300">
                        {chunk.chunk_id}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Size:</span>
                      <span className="font-mono text-gray-700 dark:text-gray-300">
                        {formatBytes(chunk.size)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Percentage:</span>
                      <span className="font-mono text-gray-700 dark:text-gray-300">
                        {((chunk.size / compressedSize) * 100).toFixed(1)}%
                      </span>
                    </div>

                    {/* Data Preview */}
                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Data Preview:</p>
                      <code className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                        {chunk.chunk_data}
                      </code>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="px-3 pb-3">
                    <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(chunk.size / TOAST_MAX_CHUNK_SIZE) * 100}%` }}
                        transition={{ delay: index * 0.05 + 0.3, duration: 0.5 }}
                        className="h-full bg-orange-500"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* TOAST Table Structure */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">TOAST Table Structure</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">
                      Column
                    </th>
                    <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">
                      Type
                    </th>
                    <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-2 px-3 font-mono text-xs text-blue-600 dark:text-blue-400">
                      chunk_id
                    </td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-300">oid</td>
                    <td className="py-2 px-3 text-gray-600 dark:text-gray-400">
                      OID of the TOAST table
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-2 px-3 font-mono text-xs text-blue-600 dark:text-blue-400">
                      chunk_seq
                    </td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-300">int</td>
                    <td className="py-2 px-3 text-gray-600 dark:text-gray-400">
                      Sequence number within the value (0, 1, 2, ...)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-xs text-blue-600 dark:text-blue-400">
                      chunk_data
                    </td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-300">bytea</td>
                    <td className="py-2 px-3 text-gray-600 dark:text-gray-400">
                      Actual chunk data (compressed if applicable)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Original Size</p>
              <p className="text-lg font-mono font-medium text-blue-600 dark:text-blue-400">
                {formatBytes(dataSize)}
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Compressed Size</p>
              <p className="text-lg font-mono font-medium text-purple-600 dark:text-purple-400">
                {formatBytes(compressedSize)}
              </p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Chunks</p>
              <p className="text-lg font-mono font-medium text-orange-600 dark:text-orange-400">
                {chunks.length}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Main Table Size</p>
              <p className="text-lg font-mono font-medium text-green-600 dark:text-green-400">
                {formatBytes(mainTablePointer.size)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
