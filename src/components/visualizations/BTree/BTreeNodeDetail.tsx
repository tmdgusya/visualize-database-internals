import { motion } from 'framer-motion';
import { useBTreeStore } from '../../../stores/btreeStore';
import { Hash, Link2, FileText, Layers, ArrowRight } from 'lucide-react';

interface BTreeNodeDetailProps {
  nodeId: string;
}

export function BTreeNodeDetail({ nodeId }: BTreeNodeDetailProps) {
  const { getNode, tree } = useBTreeStore();
  const node = getNode(nodeId);

  if (!node) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400">Node not found</p>
      </div>
    );
  }

  const parentNode = node.parent ? tree.nodes.get(node.parent) : null;
  const childNodes = node.children.map(childId => tree.nodes.get(childId)).filter(Boolean);
  const nextNode = node.next ? tree.nodes.get(node.next) : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-2 rounded-lg ${node.isLeaf ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
          {node.isLeaf ? (
            <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          )}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            {node.isRoot ? 'Root Node' : node.isLeaf ? 'Leaf Node' : 'Internal Node'}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{node.id}</p>
        </div>
      </div>

      {/* Keys Section */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Hash className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Keys</span>
          <span className="text-xs text-gray-500">({node.keys.length} / {tree.order - 1})</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {node.keys.length > 0 ? (
            node.keys.map((key, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-sm font-mono text-gray-700 dark:text-gray-300"
              >
                {key}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-400 italic">Empty</span>
          )}
        </div>
      </div>

      {/* High Keys Display (PostgreSQL specific) */}
      {node.keys.length > 0 && (
        <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">PostgreSQL High Keys</p>
          <div className="space-y-1">
            {node.keys.map((key, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span className="font-mono text-gray-600 dark:text-gray-400">Item {index + 1}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-blue-600 dark:text-blue-400">Key: {key}</span>
                  {node.isLeaf && (
                    <span className="font-mono text-green-600 dark:text-green-400">TID: ({key},1)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parent Link */}
      {parentNode && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <Link2 className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Parent</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
            <span className="text-xs font-mono text-gray-600 dark:text-gray-400">{parentNode.id.slice(0, 20)}...</span>
            <span className="text-xs text-gray-500">[{parentNode.keys.join(', ')}]</span>
          </div>
        </div>
      )}

      {/* Children Links */}
      {childNodes.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Children</span>
            <span className="text-xs text-gray-500">({childNodes.length})</span>
          </div>
          <div className="space-y-1">
            {childNodes.map((child, index) => (
              <div
                key={child!.id}
                className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600"
              >
                <span className="text-xs text-gray-500">Child {index}</span>
                <span className="text-xs font-mono text-gray-600 dark:text-gray-400">[{child!.keys.join(', ')}]</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Sibling (Leaf Links) */}
      {node.isLeaf && nextNode && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <ArrowRight className="w-4 h-4 text-green-500" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Next Leaf (Range Scan)</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
            <span className="text-xs font-mono text-green-700 dark:text-green-400">[{nextNode.keys.join(', ')}]</span>
          </div>
        </div>
      )}

      {/* Node Statistics */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Node Statistics</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Fill Factor:</span>
            <span className="font-mono">{Math.round((node.keys.length / (tree.order - 1)) * 100)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Is Full:</span>
            <span className={node.keys.length >= tree.order - 1 ? 'text-red-500' : 'text-green-500'}>
              {node.keys.length >= tree.order - 1 ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Min Keys:</span>
            <span className={node.keys.length < Math.ceil(tree.order / 2) - 1 ? 'text-red-500' : ''}>
              {Math.ceil(tree.order / 2) - 1}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Current:</span>
            <span className="font-mono">{node.keys.length}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
