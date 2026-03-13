import { create } from 'zustand';

export type ToastStrategy = 'PLAIN' | 'EXTENDED' | 'EXTERNAL' | 'MAIN';
export type CompressionType = 'NONE' | 'PGLZ' | 'LZ4';

export interface ToastChunk {
  chunk_id: number;
  chunk_seq: number;
  chunk_data: string;
  size: number;
  compressed: boolean;
}

export interface ToastTable {
  id: number;
  chunks: ToastChunk[];
}

export interface ToastPointer {
  size: number;
  pointer: string;
  va_rawsize: number;
  va_extsize: number;
  va_extinfo: number;
  va_oid: number;
}

// TOAST Thresholds (in bytes)
export const TOAST_TUPLE_THRESHOLD = 2048; // 2KB - trigger TOAST
export const TOAST_TUPLE_TARGET = 2048; // 2KB - target size after compression
export const TOAST_MAX_CHUNK_SIZE = 2048; // ~2KB per chunk

export interface ToastState {
  // Data configuration
  dataSize: number;
  data: string;
  strategy: ToastStrategy;
  compression: CompressionType;

  // Computed values
  compressionRatio: number;
  chunks: ToastChunk[];
  mainTablePointer: ToastPointer;

  // UI state
  activeTab: 'flowchart' | 'comparison' | 'chunks';
}

export interface ToastActions {
  // Configuration actions
  setDataSize: (size: number) => void;
  setStrategy: (strategy: ToastStrategy) => void;
  setCompression: (type: CompressionType) => void;
  setActiveTab: (tab: ToastState['activeTab']) => void;

  // Data actions
  generateRandomData: (size: number) => void;
  generateTextData: (size: number) => void;
  generateJSONData: (size: number) => void;
  generateImageMetadata: (size: number) => void;

  // Calculation actions
  calculateChunks: () => void;
  calculateCompressionRatio: () => number;

  // Computed helpers
  shouldToast: () => boolean;
  getCompressedSize: () => number;
  getStorageLocation: () => 'inline' | 'out-of-line';
  getEffectiveSize: () => number;
}

// Compression ratio estimations based on data type
const getCompressionRatio = (compression: CompressionType, dataType: string): number => {
  if (compression === 'NONE') return 1.0;

  // PGLZ compression ratios (approximate)
  const pglzRatios: Record<string, number> = {
    random: 1.0, // Random data doesn't compress well
    text: 0.4, // Text compresses well
    json: 0.3, // JSON has lots of repetition
    metadata: 0.5, // Image metadata
  };

  // LZ4 is faster but slightly less effective
  const lz4Ratios: Record<string, number> = {
    random: 1.0,
    text: 0.45,
    json: 0.35,
    metadata: 0.55,
  };

  if (compression === 'PGLZ') {
    return pglzRatios[dataType] ?? 0.5;
  }

  if (compression === 'LZ4') {
    return lz4Ratios[dataType] ?? 0.55;
  }

  return 1.0;
};

// Detect data type based on content
const detectDataType = (data: string): string => {
  if (data.startsWith('{') || data.startsWith('[')) return 'json';
  if (data.includes('base64') || data.includes('format') && data.includes('exif')) return 'metadata';
  // Check if data looks like text (mostly letters and spaces)
  const sample = data.substring(0, Math.min(100, data.length));
  const letterCount = (sample.match(/[a-zA-Z]/g) || []).length;
  const letterRatio = letterCount / sample.length;
  // If more than 80% letters, consider it text
  if (letterRatio > 0.8) return 'text';
  return 'random';
};

// Generate random string
const generateRandomString = (size: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < size; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Generate text-like data (more compressible)
const generateTextData = (size: number): string => {
  const words = [
    'PostgreSQL', 'database', 'storage', 'TOAST', 'compression', 'data',
    'table', 'index', 'query', 'performance', 'optimization', 'memory',
    'disk', 'page', 'tuple', 'attribute', 'column', 'row', 'schema'
  ];
  let result = '';
  while (result.length < size) {
    result += words[Math.floor(Math.random() * words.length)] + ' ';
  }
  return result.substring(0, size);
};

// Generate JSON-like data
const generateJSONData = (size: number): string => {
  const obj: Record<string, unknown> = {
    type: 'large_data_object',
    timestamp: new Date().toISOString(),
    items: []
  };

  let currentSize = JSON.stringify(obj).length;
  let itemCount = 0;

  while (currentSize < size) {
    const item = {
      id: itemCount++,
      name: `item_${itemCount}`,
      value: Math.random() * 1000,
      description: 'This is a sample data item for TOAST demonstration purposes',
      metadata: {
        created: new Date().toISOString(),
        tags: ['database', 'postgresql', 'storage'],
        properties: { compressed: false, chunked: false }
      }
    };
    (obj.items as unknown[]).push(item);
    currentSize = JSON.stringify(obj).length;
  }

  return JSON.stringify(obj).substring(0, size);
};

// Generate image metadata-like data
const generateImageMetadata = (size: number): string => {
  const metadata = {
    format: 'JPEG',
    width: 1920,
    height: 1080,
    colorSpace: 'sRGB',
    exif: {
      make: 'CameraCorp',
      model: 'ProShot 5000',
      exposure: '1/250',
      aperture: 'f/2.8',
      iso: 100,
      focalLength: '50mm',
      gps: { lat: 37.7749, lng: -122.4194 },
      timestamp: new Date().toISOString()
    },
    thumbnails: [],
    base64Data: ''
  };

  // Add base64-like data to reach size
  const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let base64Data = '';
  while (base64Data.length < size - JSON.stringify(metadata).length) {
    base64Data += base64Chars.charAt(Math.floor(Math.random() * base64Chars.length));
  }
  metadata.base64Data = base64Data;

  return JSON.stringify(metadata).substring(0, size);
};

// Generate TOAST pointer representation
const generateToastPointer = (
  rawSize: number,
  extSize: number,
  strategy: ToastStrategy,
  compressed: boolean
): ToastPointer => {
  // 18-byte TOAST pointer structure
  // va_rawsize: 4 bytes - original data size
  // va_extsize: 4 bytes - external size (compressed if applicable)
  // va_extinfo: 4 bytes - flags and info
  // va_oid: 6 bytes - OID of TOAST table

  const va_extinfo = (compressed ? 0x01 : 0x00) | (strategy === 'EXTERNAL' ? 0x02 : 0x00);

  return {
    size: 18,
    pointer: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
    va_rawsize: rawSize,
    va_extsize: extSize,
    va_extinfo,
    va_oid: Math.floor(Math.random() * 100000) + 10000
  };
};

// Calculate chunks for out-of-line storage
const calculateChunksData = (
  data: string,
  compression: CompressionType
): ToastChunk[] => {
  const chunks: ToastChunk[] = [];
  // Use full data length for chunking (simulating compressed size for display)
  const dataToChunk = data;
  const numChunks = Math.ceil(dataToChunk.length / TOAST_MAX_CHUNK_SIZE);

  for (let i = 0; i < numChunks; i++) {
    const start = i * TOAST_MAX_CHUNK_SIZE;
    const end = Math.min(start + TOAST_MAX_CHUNK_SIZE, dataToChunk.length);
    const chunkData = dataToChunk.substring(start, end);

    chunks.push({
      chunk_id: 1000 + Math.floor(Math.random() * 9000),
      chunk_seq: i,
      chunk_data: chunkData.substring(0, 50) + (chunkData.length > 50 ? '...' : ''),
      size: chunkData.length,
      compressed: compression !== 'NONE'
    });
  }

  return chunks;
};

export const useToastStore = create<ToastState & ToastActions>((set, get) => ({
  // Initial state
  dataSize: 5000,
  data: generateTextData(5000),
  strategy: 'EXTENDED',
  compression: 'PGLZ',
  compressionRatio: 0.4,
  chunks: [],
  mainTablePointer: generateToastPointer(5000, 2000, 'EXTENDED', true),
  activeTab: 'flowchart',

  // Configuration actions
  setDataSize: (size: number) => {
    set({ dataSize: size });
    get().calculateChunks();
  },

  setStrategy: (strategy: ToastStrategy) => {
    set({ strategy });
    get().calculateChunks();
  },

  setCompression: (type: CompressionType) => {
    set({ compression: type });
    get().calculateChunks();
  },

  setActiveTab: (tab: ToastState['activeTab']) => {
    set({ activeTab: tab });
  },

  // Data actions
  generateRandomData: (size: number) => {
    const data = generateRandomString(size);
    set({ data, dataSize: size });
    get().calculateChunks();
  },

  generateTextData: (size: number) => {
    const data = generateTextData(size);
    set({ data, dataSize: size });
    get().calculateChunks();
  },

  generateJSONData: (size: number) => {
    const data = generateJSONData(size);
    set({ data, dataSize: size });
    get().calculateChunks();
  },

  generateImageMetadata: (size: number) => {
    const data = generateImageMetadata(size);
    set({ data, dataSize: size });
    get().calculateChunks();
  },

  // Calculation actions
  calculateChunks: () => {
    const { data, dataSize, strategy, compression } = get();
    const dataType = detectDataType(data);
    const ratio = getCompressionRatio(compression, dataType);
    const compressedSize = Math.floor(dataSize * ratio);

    let chunks: ToastChunk[] = [];
    let mainTablePointer: ToastPointer;

    // Determine storage based on strategy and size
    const shouldToast = dataSize > TOAST_TUPLE_THRESHOLD;
    const shouldCompress = compression !== 'NONE' &&
      (strategy === 'EXTENDED' || strategy === 'MAIN') &&
      compressedSize < dataSize;

    if (strategy === 'PLAIN') {
      // PLAIN: No compression, no out-of-line
      // Must fit in page
      mainTablePointer = generateToastPointer(dataSize, dataSize, 'PLAIN', false);
    } else if (strategy === 'EXTERNAL') {
      // EXTERNAL: No compression, out-of-line allowed
      if (shouldToast) {
        chunks = calculateChunksData(data, 'NONE');
        mainTablePointer = generateToastPointer(dataSize, dataSize, 'EXTERNAL', false);
      } else {
        mainTablePointer = generateToastPointer(dataSize, dataSize, 'EXTERNAL', false);
      }
    } else if (strategy === 'EXTENDED') {
      // EXTENDED: Compression allowed, out-of-line allowed (default)
      if (shouldToast) {
        if (shouldCompress && compressedSize <= TOAST_TUPLE_TARGET) {
          // Compressed enough to fit inline
          mainTablePointer = generateToastPointer(dataSize, compressedSize, 'EXTENDED', true);
        } else {
          // Store out-of-line
          chunks = calculateChunksData(data, compression);
          mainTablePointer = generateToastPointer(dataSize, compressedSize, 'EXTENDED', shouldCompress);
        }
      } else {
        mainTablePointer = generateToastPointer(dataSize, dataSize, 'EXTENDED', false);
      }
    } else if (strategy === 'MAIN') {
      // MAIN: Compression allowed, out-of-line only if still doesn't fit
      if (shouldToast) {
        if (shouldCompress && compressedSize <= TOAST_TUPLE_TARGET) {
          // Compressed enough to fit inline
          mainTablePointer = generateToastPointer(dataSize, compressedSize, 'MAIN', true);
        } else {
          // Store out-of-line
          chunks = calculateChunksData(data, compression);
          mainTablePointer = generateToastPointer(dataSize, compressedSize, 'MAIN', shouldCompress);
        }
      } else {
        mainTablePointer = generateToastPointer(dataSize, dataSize, 'MAIN', false);
      }
    } else {
      mainTablePointer = generateToastPointer(dataSize, dataSize, 'EXTENDED', false);
    }

    set({
      compressionRatio: ratio,
      chunks,
      mainTablePointer
    });
  },

  calculateCompressionRatio: () => {
    const { compression, data } = get();
    const dataType = detectDataType(data);
    return getCompressionRatio(compression, dataType);
  },

  // Computed helpers
  shouldToast: () => {
    const { dataSize } = get();
    return dataSize > TOAST_TUPLE_THRESHOLD;
  },

  getCompressedSize: () => {
    const { dataSize, compression, data } = get();
    const dataType = detectDataType(data);
    const ratio = getCompressionRatio(compression, dataType);
    return Math.floor(dataSize * ratio);
  },

  getStorageLocation: (): 'inline' | 'out-of-line' => {
    const { dataSize, strategy } = get();
    const compressedSize = get().getCompressedSize();

    if (strategy === 'PLAIN') return 'inline';
    if (strategy === 'EXTERNAL' && dataSize > TOAST_TUPLE_THRESHOLD) return 'out-of-line';

    if (dataSize > TOAST_TUPLE_THRESHOLD) {
      if (compressedSize <= TOAST_TUPLE_TARGET) {
        return 'inline';
      }
      return 'out-of-line';
    }

    return 'inline';
  },

  getEffectiveSize: () => {
    const { dataSize, chunks } = get();
    if (chunks.length > 0) {
      // Out-of-line: 18 bytes for pointer
      return 18;
    }
    // Inline: actual size
    return dataSize;
  }
}));

// Initialize chunks on store creation
useToastStore.getState().calculateChunks();
