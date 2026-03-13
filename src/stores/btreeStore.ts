import { create } from 'zustand';

// B-Tree Node Types
export interface BTreeNode {
  id: string;
  keys: number[];
  children: string[];
  isLeaf: boolean;
  parent: string | null;
  next: string | null; // For leaf node sibling links
  isRoot?: boolean;
}

export interface BTree {
  rootId: string;
  nodes: Map<string, BTreeNode>;
  order: number; // Fanout - max children per node
}

export interface OperationLogEntry {
  id: number;
  operation: 'insert' | 'delete' | 'search' | 'split' | 'merge' | 'redistribute' | string;
  key?: number;
  details: string;
  timestamp: number;
}

export interface AnimationState {
  isAnimating: boolean;
  currentStep: number;
  totalSteps: number;
  highlightedNodes: string[];
  highlightedPath: string[];
  splitAnimation: {
    sourceNode: string | null;
    newNode: string | null;
    promotedKey: number | null;
  } | null;
  mergeAnimation: {
    sourceNode: string | null;
    targetNode: string | null;
  } | null;
}

export interface BTreeState {
  // Tree structure
  tree: BTree;
  
  // UI State
  selectedNode: string | null;
  animation: AnimationState;
  operationLog: OperationLogEntry[];
  
  // Settings
  animationSpeed: number;
  showLinePointers: boolean;
  showTidPointers: boolean;
}

export interface BTreeActions {
  // Tree management
  createTree: (order: number) => void;
  clear: () => void;

  // Operations
  insert: (key: number) => void;
  delete: (key: number) => void;
  search: (key: number) => { found: boolean; path: string[] };
  generateRandom: (count: number, min?: number, max?: number) => void;

  // Internal operations (used by the store internally)
  splitLeaf: (leafId: string, newKey: number) => void;
  splitInternalNode: (nodeId: string, newKey: number, newChildId: string, childIndex: number) => void;
  insertIntoParent: (leftChildId: string, key: number, rightChildId: string) => void;
  handleDeleteUnderFlow: (nodeId: string, keyToDelete: number) => void;
  redistributeOrMerge: (nodeId: string) => void;
  redistributeFromLeft: (nodeId: string, leftSiblingId: string) => void;
  redistributeFromRight: (nodeId: string, rightSiblingId: string) => void;
  mergeWithLeft: (nodeId: string, leftSiblingId: string) => void;
  mergeWithRight: (nodeId: string, rightSiblingId: string) => void;

  // Node selection
  selectNode: (nodeId: string | null) => void;

  // Settings
  setAnimationSpeed: (speed: number) => void;
  setShowLinePointers: (show: boolean) => void;
  setShowTidPointers: (show: boolean) => void;

  // Animation control
  setAnimationState: (state: Partial<AnimationState>) => void;
  resetAnimation: () => void;

  // Computed helpers
  getNode: (nodeId: string) => BTreeNode | undefined;
  getTreeHeight: () => number;
  getNodeCount: () => number;
  getKeyCount: () => number;
  findLeafForKey: (key: number, startingNode?: string) => string;
}

// Helper to generate unique node IDs
let nodeIdCounter = 0;
const generateNodeId = (): string => `node-${Date.now()}-${nodeIdCounter++}`;

// Create an empty node
const createEmptyNode = (isLeaf: boolean = true, parent: string | null = null): BTreeNode => ({
  id: generateNodeId(),
  keys: [],
  children: [],
  isLeaf,
  parent,
  next: null,
});

// Calculate max and min keys per node
const getMaxKeys = (order: number): number => order - 1;
const getMinKeys = (order: number): number => Math.ceil(order / 2) - 1;

export const useBTreeStore = create<BTreeState & BTreeActions>((set, get) => ({
  // Initial state
  tree: {
    rootId: '',
    nodes: new Map(),
    order: 4,
  },
  selectedNode: null,
  animation: {
    isAnimating: false,
    currentStep: 0,
    totalSteps: 0,
    highlightedNodes: [],
    highlightedPath: [],
    splitAnimation: null,
    mergeAnimation: null,
  },
  operationLog: [],
  animationSpeed: 500,
  showLinePointers: true,
  showTidPointers: false,

  // Tree management
  createTree: (order: number) => {
    const root = createEmptyNode(true, null);
    root.isRoot = true;
    
    const nodes = new Map<string, BTreeNode>();
    nodes.set(root.id, root);
    
    set({
      tree: {
        rootId: root.id,
        nodes,
        order,
      },
      selectedNode: null,
      operationLog: [{
        id: Date.now(),
        operation: 'insert',
        details: `Created new B-Tree with order ${order}`,
        timestamp: Date.now(),
      }],
    });
  },

  clear: () => {
    const { tree } = get();
    get().createTree(tree.order);
    set({
      operationLog: [{
        id: Date.now(),
        operation: 'insert',
        details: 'Tree cleared',
        timestamp: Date.now(),
      }],
    });
  },

  // Find the leaf node where a key should be inserted
  findLeafForKey: (key: number, startingNode?: string): string => {
    const { tree } = get();
    let currentId = startingNode || tree.rootId;
    
    while (true) {
      const node = tree.nodes.get(currentId);
      if (!node) return currentId;
      
      if (node.isLeaf) {
        return currentId;
      }
      
      // Find the appropriate child
      let childIndex = 0;
      for (let i = 0; i < node.keys.length; i++) {
        if (key >= node.keys[i]) {
          childIndex = i + 1;
        } else {
          break;
        }
      }
      
      if (childIndex < node.children.length) {
        currentId = node.children[childIndex];
      } else {
        return currentId;
      }
    }
  },

  // Insert a key into the B-Tree
  insert: (key: number) => {
    const { tree, findLeafForKey } = get();
    const maxKeys = getMaxKeys(tree.order);
    
    // Check if key already exists
    const searchResult = get().search(key);
    if (searchResult.found) {
      const logEntry: OperationLogEntry = {
        id: Date.now(),
        operation: 'insert',
        key,
        details: `Key ${key} already exists in the tree`,
        timestamp: Date.now(),
      };
      set({
        operationLog: [logEntry, ...get().operationLog].slice(0, 50),
      });
      return;
    }
    
    // Find the leaf node
    const leafId = findLeafForKey(key);
    const leaf = tree.nodes.get(leafId);
    
    if (!leaf) return;
    
    // Insert into leaf if not full
    if (leaf.keys.length < maxKeys) {
      const newKeys = [...leaf.keys, key].sort((a, b) => a - b);
      const newNodes = new Map(tree.nodes);
      newNodes.set(leafId, { ...leaf, keys: newKeys });
      
      const logEntry: OperationLogEntry = {
        id: Date.now(),
        operation: 'insert',
        key,
        details: `Inserted key ${key} into leaf node`,
        timestamp: Date.now(),
      };
      
      set({
        tree: { ...tree, nodes: newNodes },
        operationLog: [logEntry, ...get().operationLog].slice(0, 50),
        animation: {
          ...get().animation,
          highlightedNodes: [leafId],
          highlightedPath: searchResult.path,
        },
      });
      return;
    }
    
    // Leaf is full, need to split
    get().splitLeaf(leafId, key);
  },

  // Split a leaf node
  splitLeaf: (leafId: string, newKey: number) => {
    const { tree } = get();
    const leaf = tree.nodes.get(leafId);
    if (!leaf) return;
    
    const allKeys = [...leaf.keys, newKey].sort((a, b) => a - b);
    
    // Find middle key to promote
    const midIndex = Math.floor(allKeys.length / 2);
    const promotedKey = allKeys[midIndex];
    
    // Create new right node
    const newNode = createEmptyNode(true, leaf.parent);
    newNode.keys = allKeys.slice(midIndex);
    
    // Update left node
    const updatedLeaf = { ...leaf, keys: allKeys.slice(0, midIndex) };
    
    // Update sibling links
    newNode.next = leaf.next;
    updatedLeaf.next = newNode.id;
    
    const newNodes = new Map(tree.nodes);
    newNodes.set(leafId, updatedLeaf);
    newNodes.set(newNode.id, newNode);
    
    set({
      tree: { ...tree, nodes: newNodes },
      animation: {
        ...get().animation,
        splitAnimation: {
          sourceNode: leafId,
          newNode: newNode.id,
          promotedKey,
        },
      },
    });
    
    // Insert promoted key into parent
    get().insertIntoParent(leafId, promotedKey, newNode.id);
  },

  // Insert a key into parent after split
  insertIntoParent: (leftChildId: string, key: number, rightChildId: string) => {
    const { tree } = get();
    const leftChild = tree.nodes.get(leftChildId);
    if (!leftChild) return;
    
    // If left child is root, create new root
    if (leftChild.parent === null) {
      const newRoot = createEmptyNode(false, null);
      newRoot.isRoot = true;
      newRoot.keys = [key];
      newRoot.children = [leftChildId, rightChildId];
      
      const newNodes = new Map(tree.nodes);
      newNodes.set(newRoot.id, newRoot);
      newNodes.set(leftChildId, { ...leftChild, parent: newRoot.id, isRoot: false });
      
      const rightChild = tree.nodes.get(rightChildId);
      if (rightChild) {
        newNodes.set(rightChildId, { ...rightChild, parent: newRoot.id });
      }
      
      set({
        tree: {
          ...tree,
          rootId: newRoot.id,
          nodes: newNodes,
        },
        operationLog: [{
          id: Date.now(),
          operation: 'split',
          key,
          details: `Split: Created new root with key ${key}`,
          timestamp: Date.now(),
        }, ...get().operationLog].slice(0, 50),
      });
      return;
    }
    
    // Insert into existing parent
    const parent = tree.nodes.get(leftChild.parent);
    if (!parent) return;
    
    const maxKeys = getMaxKeys(tree.order);
    
    // Find position to insert
    let insertIndex = 0;
    for (let i = 0; i < parent.keys.length; i++) {
      if (key > parent.keys[i]) {
        insertIndex = i + 1;
      } else {
        break;
      }
    }
    
    const newKeys = [...parent.keys];
    newKeys.splice(insertIndex, 0, key);
    
    const newChildren = [...parent.children];
    newChildren.splice(insertIndex + 1, 0, rightChildId);
    
    // If parent not full, just insert
    if (newKeys.length <= maxKeys) {
      const newNodes = new Map(tree.nodes);
      newNodes.set(parent.id, { ...parent, keys: newKeys, children: newChildren });
      newNodes.set(rightChildId, { ...tree.nodes.get(rightChildId)!, parent: parent.id });
      
      set({
        tree: { ...tree, nodes: newNodes },
        operationLog: [{
          id: Date.now(),
          operation: 'split',
          key,
          details: `Split: Promoted key ${key} to parent`,
          timestamp: Date.now(),
        }, ...get().operationLog].slice(0, 50),
      });
      return;
    }
    
    // Parent is full, need to split internal node
    get().splitInternalNode(parent.id, key, rightChildId, insertIndex);
  },

  // Split an internal node
  splitInternalNode: (nodeId: string, newKey: number, newChildId: string, childIndex: number) => {
    const { tree } = get();
    const node = tree.nodes.get(nodeId);
    if (!node) return;
    
    const allKeys = [...node.keys, newKey].sort((a, b) => a - b);
    const allChildren = [...node.children];
    allChildren.splice(childIndex + 1, 0, newChildId);
    
    // Find middle key to promote
    const midIndex = Math.floor(allKeys.length / 2);
    const promotedKey = allKeys[midIndex];
    
    // Create new right node
    const newNode = createEmptyNode(false, node.parent);
    newNode.keys = allKeys.slice(midIndex + 1);
    newNode.children = allChildren.slice(midIndex + 1);
    
    // Update children of new node to point to it as parent
    const newNodes = new Map(tree.nodes);
    newNode.children.forEach(childId => {
      const child = newNodes.get(childId);
      if (child) {
        newNodes.set(childId, { ...child, parent: newNode.id });
      }
    });
    
    // Update left node
    const updatedNode = {
      ...node,
      keys: allKeys.slice(0, midIndex),
      children: allChildren.slice(0, midIndex + 1),
    };
    
    newNodes.set(nodeId, updatedNode);
    newNodes.set(newNode.id, newNode);
    
    set({
      tree: { ...tree, nodes: newNodes },
      animation: {
        ...get().animation,
        splitAnimation: {
          sourceNode: nodeId,
          newNode: newNode.id,
          promotedKey,
        },
      },
    });
    
    // Recursively insert promoted key into parent
    get().insertIntoParent(nodeId, promotedKey, newNode.id);
  },

  // Delete a key from the B-Tree
  delete: (key: number) => {
    const { tree } = get();
    const searchResult = get().search(key);
    
    if (!searchResult.found) {
      set({
        operationLog: [{
          id: Date.now(),
          operation: 'delete',
          key,
          details: `Key ${key} not found in tree`,
          timestamp: Date.now(),
        }, ...get().operationLog].slice(0, 50),
      });
      return;
    }
    
    // Find the node containing the key
    const leafId = searchResult.path[searchResult.path.length - 1];
    const leaf = tree.nodes.get(leafId);
    if (!leaf) return;
    
    const minKeys = getMinKeys(tree.order);
    
    // If key is in a leaf and leaf has enough keys, just remove it
    if (leaf.isLeaf && leaf.keys.length > minKeys) {
      const newKeys = leaf.keys.filter(k => k !== key);
      const newNodes = new Map(tree.nodes);
      newNodes.set(leafId, { ...leaf, keys: newKeys });
      
      set({
        tree: { ...tree, nodes: newNodes },
        operationLog: [{
          id: Date.now(),
          operation: 'delete',
          key,
          details: `Deleted key ${key} from leaf`,
          timestamp: Date.now(),
        }, ...get().operationLog].slice(0, 50),
      });
      return;
    }
    
    // Handle underflow
    get().handleDeleteUnderFlow(leafId, key);
  },

  // Handle underflow after deletion
  handleDeleteUnderFlow: (nodeId: string, keyToDelete: number) => {
    const { tree } = get();
    const node = tree.nodes.get(nodeId);
    if (!node) return;
    
    const minKeys = getMinKeys(tree.order);
    
    // Remove the key first
    const newKeys = node.keys.filter(k => k !== keyToDelete);
    const newNodes = new Map(tree.nodes);
    newNodes.set(nodeId, { ...node, keys: newKeys });
    
    set({
      tree: { ...tree, nodes: newNodes },
    });
    
    // If node is root and empty, handle special case
    if (node.parent === null) {
      if (newKeys.length === 0 && !node.isLeaf) {
        // Make the only child the new root
        const childId = node.children[0];
        const child = newNodes.get(childId);
        if (child) {
          newNodes.set(childId, { ...child, parent: null, isRoot: true });
          set({
            tree: {
              ...tree,
              rootId: childId,
              nodes: newNodes,
            },
          });
        }
      }
      return;
    }
    
    // Check if underflow occurred
    if (newKeys.length >= minKeys) {
      set({
        operationLog: [{
          id: Date.now(),
          operation: 'delete',
          key: keyToDelete,
          details: `Deleted key ${keyToDelete}`,
          timestamp: Date.now(),
        }, ...get().operationLog].slice(0, 50),
      });
      return;
    }
    
    // Try to redistribute or merge
    get().redistributeOrMerge(nodeId);
  },

  // Try to redistribute keys from sibling, or merge
  redistributeOrMerge: (nodeId: string) => {
    const { tree } = get();
    const node = tree.nodes.get(nodeId);
    if (!node || node.parent === null) return;
    
    const parent = tree.nodes.get(node.parent);
    if (!parent) return;
    
    // Find the node's index in parent's children
    const nodeIndex = parent.children.indexOf(nodeId);
    if (nodeIndex === -1) return;
    
    // Try left sibling
    if (nodeIndex > 0) {
      const leftSiblingId = parent.children[nodeIndex - 1];
      const leftSibling = tree.nodes.get(leftSiblingId);
      if (leftSibling && leftSibling.keys.length > getMinKeys(tree.order)) {
        get().redistributeFromLeft(nodeId, leftSiblingId);
        return;
      }
    }
    
    // Try right sibling
    if (nodeIndex < parent.children.length - 1) {
      const rightSiblingId = parent.children[nodeIndex + 1];
      const rightSibling = tree.nodes.get(rightSiblingId);
      if (rightSibling && rightSibling.keys.length > getMinKeys(tree.order)) {
        get().redistributeFromRight(nodeId, rightSiblingId);
        return;
      }
    }
    
    // Must merge with a sibling
    if (nodeIndex > 0) {
      get().mergeWithLeft(nodeId, parent.children[nodeIndex - 1]);
    } else {
      get().mergeWithRight(nodeId, parent.children[nodeIndex + 1]);
    }
  },

  // Redistribute keys from left sibling
  redistributeFromLeft: (nodeId: string, leftSiblingId: string) => {
    const { tree } = get();
    const node = tree.nodes.get(nodeId);
    const leftSibling = tree.nodes.get(leftSiblingId);
    
    if (!node || !leftSibling || !node.parent) return;
    
    const parent = tree.nodes.get(node.parent);
    if (!parent) return;
    
    const nodeIndex = parent.children.indexOf(nodeId);
    if (nodeIndex <= 0) return;
    
    const parentKey = parent.keys[nodeIndex - 1];
    
    // Move last key from left sibling to node
    const lastKey = leftSibling.keys[leftSibling.keys.length - 1];
    const newLeftKeys = leftSibling.keys.slice(0, -1);
    const newNodeKeys = [parentKey, ...node.keys].sort((a, b) => a - b);
    
    // Update parent key
    const newParentKeys = [...parent.keys];
    newParentKeys[nodeIndex - 1] = lastKey;
    
    const newNodes = new Map(tree.nodes);
    newNodes.set(leftSiblingId, { ...leftSibling, keys: newLeftKeys });
    newNodes.set(nodeId, { ...node, keys: newNodeKeys });
    newNodes.set(parent.id, { ...parent, keys: newParentKeys });
    
    set({
      tree: { ...tree, nodes: newNodes },
      operationLog: [{
        id: Date.now(),
        operation: 'redistribute',
        details: `Redistributed keys from left sibling`,
        timestamp: Date.now(),
      }, ...get().operationLog].slice(0, 50),
    });
  },

  // Redistribute keys from right sibling
  redistributeFromRight: (nodeId: string, rightSiblingId: string) => {
    const { tree } = get();
    const node = tree.nodes.get(nodeId);
    const rightSibling = tree.nodes.get(rightSiblingId);
    
    if (!node || !rightSibling || !node.parent) return;
    
    const parent = tree.nodes.get(node.parent);
    if (!parent) return;
    
    const nodeIndex = parent.children.indexOf(nodeId);
    if (nodeIndex < 0 || nodeIndex >= parent.keys.length) return;
    
    const parentKey = parent.keys[nodeIndex];
    
    // Move first key from right sibling to node
    const firstKey = rightSibling.keys[0];
    const newRightKeys = rightSibling.keys.slice(1);
    const newNodeKeys = [...node.keys, parentKey].sort((a, b) => a - b);
    
    // Update parent key
    const newParentKeys = [...parent.keys];
    newParentKeys[nodeIndex] = firstKey;
    
    const newNodes = new Map(tree.nodes);
    newNodes.set(rightSiblingId, { ...rightSibling, keys: newRightKeys });
    newNodes.set(nodeId, { ...node, keys: newNodeKeys });
    newNodes.set(parent.id, { ...parent, keys: newParentKeys });
    
    set({
      tree: { ...tree, nodes: newNodes },
      operationLog: [{
        id: Date.now(),
        operation: 'redistribute',
        details: `Redistributed keys from right sibling`,
        timestamp: Date.now(),
      }, ...get().operationLog].slice(0, 50),
    });
  },

  // Merge with left sibling
  mergeWithLeft: (nodeId: string, leftSiblingId: string) => {
    const { tree } = get();
    const node = tree.nodes.get(nodeId);
    const leftSibling = tree.nodes.get(leftSiblingId);

    if (!node || !leftSibling || !node.parent) return;

    const parent = tree.nodes.get(node.parent);
    if (!parent) return;
    
    if (!node || !leftSibling || !parent) return;
    
    const nodeIndex = parent.children.indexOf(nodeId);
    const parentKey = parent.keys[nodeIndex - 1];
    
    // Merge keys
    const mergedKeys = [...leftSibling.keys, parentKey, ...node.keys].sort((a, b) => a - b);
    const mergedChildren = node.isLeaf 
      ? [] 
      : [...leftSibling.children, ...node.children];
    
    const newNodes = new Map(tree.nodes);
    
    // Update left sibling
    newNodes.set(leftSiblingId, {
      ...leftSibling,
      keys: mergedKeys,
      children: mergedChildren,
      next: node.next,
    });
    
    // Remove node and parent key
    newNodes.delete(nodeId);
    
    // Update parent
    const newParentKeys = parent.keys.filter((_, i) => i !== nodeIndex - 1);
    const newParentChildren = parent.children.filter((_, i) => i !== nodeIndex);
    
    newNodes.set(parent.id, {
      ...parent,
      keys: newParentKeys,
      children: newParentChildren,
    });
    
    set({
      tree: { ...tree, nodes: newNodes },
      animation: {
        ...get().animation,
        mergeAnimation: {
          sourceNode: nodeId,
          targetNode: leftSiblingId,
        },
      },
      operationLog: [{
        id: Date.now(),
        operation: 'merge',
        details: `Merged node with left sibling`,
        timestamp: Date.now(),
      }, ...get().operationLog].slice(0, 50),
    });
    
    // Check if parent needs to merge
    if (newParentKeys.length < getMinKeys(tree.order)) {
      const parentNode = tree.nodes.get(node.parent!);
      if (parentNode && !parentNode.isRoot) {
        get().redistributeOrMerge(parent.id);
      }
    }
  },

  // Merge with right sibling
  mergeWithRight: (nodeId: string, rightSiblingId: string) => {
    const { tree } = get();
    const node = tree.nodes.get(nodeId);
    const rightSibling = tree.nodes.get(rightSiblingId);

    if (!node || !rightSibling || !node.parent) return;

    const parent = tree.nodes.get(node.parent);
    if (!parent) return;
    
    if (!node || !rightSibling || !parent) return;
    
    const nodeIndex = parent.children.indexOf(nodeId);
    const parentKey = parent.keys[nodeIndex];
    
    // Merge keys
    const mergedKeys = [...node.keys, parentKey, ...rightSibling.keys].sort((a, b) => a - b);
    const mergedChildren = node.isLeaf 
      ? [] 
      : [...node.children, ...rightSibling.children];
    
    const newNodes = new Map(tree.nodes);
    
    // Update node
    newNodes.set(nodeId, {
      ...node,
      keys: mergedKeys,
      children: mergedChildren,
      next: rightSibling.next,
    });
    
    // Remove right sibling and parent key
    newNodes.delete(rightSiblingId);
    
    // Update parent
    const newParentKeys = parent.keys.filter((_, i) => i !== nodeIndex);
    const newParentChildren = parent.children.filter((_, i) => i !== nodeIndex + 1);
    
    newNodes.set(parent.id, {
      ...parent,
      keys: newParentKeys,
      children: newParentChildren,
    });
    
    set({
      tree: { ...tree, nodes: newNodes },
      animation: {
        ...get().animation,
        mergeAnimation: {
          sourceNode: rightSiblingId,
          targetNode: nodeId,
        },
      },
      operationLog: [{
        id: Date.now(),
        operation: 'merge',
        details: `Merged node with right sibling`,
        timestamp: Date.now(),
      }, ...get().operationLog].slice(0, 50),
    });
    
    // Check if parent needs to merge
    if (newParentKeys.length < getMinKeys(tree.order)) {
      const parentNode = tree.nodes.get(node.parent!);
      if (parentNode && !parentNode.isRoot) {
        get().redistributeOrMerge(parent.id);
      }
    }
  },

  // Search for a key in the B-Tree
  search: (key: number): { found: boolean; path: string[] } => {
    const { tree } = get();
    const path: string[] = [];
    let currentId = tree.rootId;
    
    while (currentId) {
      path.push(currentId);
      const node = tree.nodes.get(currentId);
      if (!node) break;
      
      // Check if key is in this node
      if (node.keys.includes(key)) {
        set({
          animation: {
            ...get().animation,
            highlightedPath: path,
            highlightedNodes: [currentId],
          },
        });
        return { found: true, path };
      }
      
      // If leaf and key not found, return not found
      if (node.isLeaf) {
        set({
          animation: {
            ...get().animation,
            highlightedPath: path,
            highlightedNodes: [],
          },
        });
        return { found: false, path };
      }
      
      // Find appropriate child
      let childIndex = 0;
      for (let i = 0; i < node.keys.length; i++) {
        if (key >= node.keys[i]) {
          childIndex = i + 1;
        } else {
          break;
        }
      }
      
      if (childIndex < node.children.length) {
        currentId = node.children[childIndex];
      } else {
        break;
      }
    }
    
    return { found: false, path };
  },

  // Generate random keys
  generateRandom: (count: number, min: number = 1, max: number = 100) => {
    const { tree } = get();
    const existingKeys = new Set<number>();
    
    // Collect existing keys
    tree.nodes.forEach(node => {
      node.keys.forEach(key => existingKeys.add(key));
    });
    
    const newKeys: number[] = [];
    while (newKeys.length < count) {
      const key = Math.floor(Math.random() * (max - min + 1)) + min;
      if (!existingKeys.has(key) && !newKeys.includes(key)) {
        newKeys.push(key);
      }
    }
    
    // Insert keys with delay
    newKeys.forEach((key, index) => {
      setTimeout(() => {
        get().insert(key);
      }, index * get().animationSpeed);
    });
    
    set({
      operationLog: [{
        id: Date.now(),
        operation: 'insert',
        details: `Generated ${count} random keys`,
        timestamp: Date.now(),
      }, ...get().operationLog].slice(0, 50),
    });
  },

  // Node selection
  selectNode: (nodeId: string | null) => {
    set({ selectedNode: nodeId });
  },

  // Settings
  setAnimationSpeed: (speed: number) => {
    set({ animationSpeed: speed });
  },

  setShowLinePointers: (show: boolean) => {
    set({ showLinePointers: show });
  },

  setShowTidPointers: (show: boolean) => {
    set({ showTidPointers: show });
  },

  // Animation control
  setAnimationState: (state: Partial<AnimationState>) => {
    set({ animation: { ...get().animation, ...state } });
  },

  resetAnimation: () => {
    set({
      animation: {
        isAnimating: false,
        currentStep: 0,
        totalSteps: 0,
        highlightedNodes: [],
        highlightedPath: [],
        splitAnimation: null,
        mergeAnimation: null,
      },
    });
  },

  // Computed helpers
  getNode: (nodeId: string) => {
    return get().tree.nodes.get(nodeId);
  },

  getTreeHeight: (): number => {
    const { tree } = get();
    let height = 0;
    let currentId = tree.rootId;
    
    while (currentId) {
      height++;
      const node = tree.nodes.get(currentId);
      if (!node || node.isLeaf || node.children.length === 0) break;
      currentId = node.children[0];
    }
    
    return height;
  },

  getNodeCount: (): number => {
    return get().tree.nodes.size;
  },

  getKeyCount: (): number => {
    let count = 0;
    get().tree.nodes.forEach(node => {
      count += node.keys.length;
    });
    return count;
  },
}));

// Initialize with a default tree
useBTreeStore.getState().createTree(4);
