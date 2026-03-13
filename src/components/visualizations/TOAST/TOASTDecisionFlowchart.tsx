import { motion } from 'framer-motion';
import { useToastStore, TOAST_TUPLE_THRESHOLD, TOAST_TUPLE_TARGET } from '../../../stores/toastStore';
import { ArrowDown, CheckCircle, XCircle, Database, FileArchive, ExternalLink, Home } from 'lucide-react';

interface FlowNodeProps {
  title: string;
  description: string;
  isActive: boolean;
  isYes?: boolean;
  icon?: React.ReactNode;
  delay?: number;
}

function FlowNode({ title, description, isActive, isYes, icon, delay = 0 }: FlowNodeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
      className={`relative p-4 rounded-lg border-2 transition-all duration-300 ${
        isActive
          ? isYes === true
            ? 'bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-400'
            : isYes === false
            ? 'bg-red-100 dark:bg-red-900/30 border-red-500 dark:border-red-400'
            : 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400'
          : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
      }`}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div className={`p-2 rounded-lg ${
            isActive
              ? isYes === true
                ? 'bg-green-200 dark:bg-green-800'
                : isYes === false
                ? 'bg-red-200 dark:bg-red-800'
                : 'bg-blue-200 dark:bg-blue-800'
              : 'bg-gray-200 dark:bg-gray-700'
          }`}>
            {icon}
          </div>
        )}
        <div>
          <h4 className={`font-semibold ${
            isActive ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
          }`}>
            {title}
          </h4>
          <p className={`text-sm mt-1 ${
            isActive ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'
          }`}>
            {description}
          </p>
        </div>
      </div>
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute -right-2 top-1/2 -translate-y-1/2"
        >
          {isYes === true && <CheckCircle className="w-5 h-5 text-green-500" />}
          {isYes === false && <XCircle className="w-5 h-5 text-red-500" />}
        </motion.div>
      )}
    </motion.div>
  );
}

function ArrowConnector({ isActive, label }: { isActive: boolean; label?: string }) {
  return (
    <div className="flex flex-col items-center py-2">
      <motion.div
        animate={isActive ? { y: [0, 5, 0] } : {}}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <ArrowDown className={`w-6 h-6 ${
          isActive ? 'text-blue-500' : 'text-gray-300 dark:text-gray-600'
        }`} />
      </motion.div>
      {label && (
        <span className={`text-xs mt-1 font-medium ${
          isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
        }`}>
          {label}
        </span>
      )}
    </div>
  );
}

export function TOASTDecisionFlowchart() {
  const {
    dataSize,
    strategy,
    compression,
    chunks,
    getCompressedSize,
    getStorageLocation
  } = useToastStore();

  const shouldToast = dataSize > TOAST_TUPLE_THRESHOLD;
  const compressedSize = getCompressedSize();
  const storageLocation = getStorageLocation();
  const shouldCompress = compression !== 'NONE' &&
    (strategy === 'EXTENDED' || strategy === 'MAIN') &&
    compressedSize < dataSize;
  const fitsAfterCompression = compressedSize <= TOAST_TUPLE_TARGET;

  // Determine which path is active
  const step1Active = true;
  const step1Yes = shouldToast;

  const step2Active = shouldToast;
  const step2Yes = strategy === 'EXTENDED' || strategy === 'MAIN';

  const step3Active = step2Active && step2Yes;
  const step3Yes = shouldCompress;

  const step4Active = step3Active && step3Yes;
  const step4Yes = fitsAfterCompression;

  const step5Active = step4Active && !step4Yes;
  const step5Yes = true;

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        TOAST Decision Flowchart
      </h3>

      <div className="max-w-2xl mx-auto">
        {/* Step 1: Size Check */}
        <FlowNode
          title="Step 1: Data Size Check"
          description={`Is data size (${dataSize.toLocaleString()} bytes) > TOAST_TUPLE_THRESHOLD (${TOAST_TUPLE_THRESHOLD} bytes / 2KB)?`}
          isActive={step1Active}
          isYes={step1Yes}
          icon={<Database className="w-5 h-5" />}
          delay={0}
        />

        {!shouldToast && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-green-800 dark:text-green-200 font-medium">
                Store inline - No TOAST needed
              </span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300 mt-2">
              Data fits within the page. Stored directly in the heap tuple.
            </p>
          </div>
        )}

        {shouldToast && (
          <>
            <ArrowConnector isActive={step1Active} label="Yes" />

            {/* Step 2: Strategy Check */}
            <FlowNode
              title="Step 2: Storage Strategy"
              description={`Current strategy: ${strategy}. Is compression allowed (EXTENDED or MAIN)?`}
              isActive={step2Active}
              isYes={step2Yes}
              icon={<FileArchive className="w-5 h-5" />}
              delay={0.1}
            />

            {strategy === 'PLAIN' && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-800 dark:text-red-200 font-medium">
                    ERROR: Data too large for PLAIN strategy
                  </span>
                </div>
                <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                  PLAIN strategy requires data to fit in the page. Consider using EXTENDED strategy.
                </p>
              </div>
            )}

            {strategy === 'EXTERNAL' && (
              <>
                <ArrowConnector isActive={step2Active} label="No compression" />
                <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-5 h-5 text-orange-500" />
                    <span className="text-orange-800 dark:text-orange-200 font-medium">
                      Store out-of-line (no compression)
                    </span>
                  </div>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-2">
                    EXTERNAL strategy: Data stored in TOAST table without compression.
                  </p>
                </div>
              </>
            )}

            {(strategy === 'EXTENDED' || strategy === 'MAIN') && (
              <>
                <ArrowConnector isActive={step2Active} label="Yes" />

                {/* Step 3: Compression Check */}
                <FlowNode
                  title="Step 3: Compression Check"
                  description={`Should we compress using ${compression}? (Compressed size: ${compressedSize.toLocaleString()} bytes)`}
                  isActive={step3Active}
                  isYes={step3Yes}
                  icon={<FileArchive className="w-5 h-5" />}
                  delay={0.2}
                />

                {!shouldCompress && (
                  <>
                    <ArrowConnector isActive={step3Active} label="Skip compression" />
                    <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-center gap-2">
                        <ExternalLink className="w-5 h-5 text-yellow-600" />
                        <span className="text-yellow-800 dark:text-yellow-200 font-medium">
                          Store out-of-line (compression not beneficial)
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {shouldCompress && (
                  <>
                    <ArrowConnector isActive={step3Active} label="Yes" />

                    {/* Step 4: Size After Compression */}
                    <FlowNode
                      title="Step 4: Post-Compression Size Check"
                      description={`Does compressed data (${compressedSize.toLocaleString()} bytes) fit in TOAST_TUPLE_TARGET (${TOAST_TUPLE_TARGET} bytes)?`}
                      isActive={step4Active}
                      isYes={step4Yes}
                      icon={<Home className="w-5 h-5" />}
                      delay={0.3}
                    />

                    {fitsAfterCompression && (
                      <>
                        <ArrowConnector isActive={step4Active} label="Yes" />
                        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-green-800 dark:text-green-200 font-medium">
                              Store inline (compressed)
                            </span>
                          </div>
                          <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                            Data compressed successfully and fits inline. Saved {dataSize - compressedSize} bytes.
                          </p>
                        </div>
                      </>
                    )}

                    {!fitsAfterCompression && (
                      <>
                        <ArrowConnector isActive={step4Active} label="No" />

                        {/* Step 5: Out-of-line Storage */}
                        <FlowNode
                          title="Step 5: Out-of-line Storage"
                          description={`Store compressed data in TOAST table as ${chunks.length} chunk(s)`}
                          isActive={step5Active}
                          isYes={step5Yes}
                          icon={<ExternalLink className="w-5 h-5" />}
                          delay={0.4}
                        />

                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-2">
                            <ExternalLink className="w-5 h-5 text-blue-500" />
                            <span className="text-blue-800 dark:text-blue-200 font-medium">
                              Store out-of-line (compressed)
                            </span>
                          </div>
                          <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                            Data stored in TOAST table with {compression} compression.
                            Main table contains an 18-byte TOAST pointer.
                          </p>
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg"
        >
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Current Decision Path</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Storage Location:</span>
              <span className={`font-medium ${
                storageLocation === 'inline'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-blue-600 dark:text-blue-400'
              }`}>
                {storageLocation === 'inline' ? 'Inline (in heap tuple)' : 'Out-of-line (TOAST table)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Compression:</span>
              <span className={`font-medium ${
                shouldCompress
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {shouldCompress ? `Yes (${compression})` : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Main Table Size:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {storageLocation === 'inline'
                  ? `${shouldCompress ? compressedSize : dataSize} bytes`
                  : '18 bytes (TOAST pointer)'}
              </span>
            </div>
            {chunks.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">TOAST Table Chunks:</span>
                <span className="font-medium text-purple-600 dark:text-purple-400">
                  {chunks.length} chunk(s)
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
