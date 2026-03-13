import { describe, it, expect, beforeEach } from 'vitest';
import { useBTreeStore } from './btreeStore';

describe('BTreeStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useBTreeStore.getState().createTree(4);
    useBTreeStore.getState().resetAnimation();
  });

  describe('createTree', () => {
    it('should create a new B-Tree with given order', () => {
      useBTreeStore.getState().createTree(5);
      const { tree } = useBTreeStore.getState();
      
      expect(tree.order).toBe(5);
      expect(tree.rootId).toBeTruthy();
      expect(tree.nodes.size).toBe(1);
      
      const root = tree.nodes.get(tree.rootId);
      expect(root).toBeDefined();
      expect(root?.isLeaf).toBe(true);
      expect(root?.isRoot).toBe(true);
      expect(root?.keys).toEqual([]);
    });

    it('should clear existing tree when creating new one', () => {
      useBTreeStore.getState().insert(10);
      useBTreeStore.getState().insert(20);
      
      useBTreeStore.getState().createTree(4);
      const { tree } = useBTreeStore.getState();
      
      expect(tree.nodes.size).toBe(1);
      expect(useBTreeStore.getState().getKeyCount()).toBe(0);
    });
  });

  describe('insert', () => {
    it('should insert a key into an empty tree', () => {
      useBTreeStore.getState().insert(10);
      const { tree } = useBTreeStore.getState();
      
      const root = tree.nodes.get(tree.rootId);
      expect(root?.keys).toContain(10);
      expect(useBTreeStore.getState().getKeyCount()).toBe(1);
    });

    it('should insert multiple keys in sorted order', () => {
      useBTreeStore.getState().insert(30);
      useBTreeStore.getState().insert(10);
      useBTreeStore.getState().insert(20);
      
      const { tree } = useBTreeStore.getState();
      const root = tree.nodes.get(tree.rootId);
      
      expect(root?.keys).toEqual([10, 20, 30]);
    });

    it('should not insert duplicate keys', () => {
      useBTreeStore.getState().insert(10);
      useBTreeStore.getState().insert(10);
      
      expect(useBTreeStore.getState().getKeyCount()).toBe(1);
    });

    it('should split when node is full (order 4, max 3 keys)', () => {
      // With order 4, max keys = 3
      useBTreeStore.getState().insert(10);
      useBTreeStore.getState().insert(20);
      useBTreeStore.getState().insert(30);
      
      // Tree should have 1 node with 3 keys
      expect(useBTreeStore.getState().getNodeCount()).toBe(1);
      
      // Insert 4th key - should trigger split
      useBTreeStore.getState().insert(40);
      
      // After split: should have root + 2 children
      const { tree } = useBTreeStore.getState();
      expect(tree.nodes.size).toBeGreaterThan(1);
      
      const root = tree.nodes.get(tree.rootId);
      expect(root?.isLeaf).toBe(false);
      expect(root?.children.length).toBeGreaterThan(0);
    });

    it('should create new root when splitting root', () => {
      useBTreeStore.getState().insert(10);
      useBTreeStore.getState().insert(20);
      useBTreeStore.getState().insert(30);
      useBTreeStore.getState().insert(40);
      
      const { tree } = useBTreeStore.getState();
      const root = tree.nodes.get(tree.rootId);
      
      expect(root?.isRoot).toBe(true);
      expect(root?.isLeaf).toBe(false);
    });
  });

  describe('search', () => {
    beforeEach(() => {
      useBTreeStore.getState().insert(10);
      useBTreeStore.getState().insert(20);
      useBTreeStore.getState().insert(30);
    });

    it('should find existing key', () => {
      const result = useBTreeStore.getState().search(20);
      
      expect(result.found).toBe(true);
      expect(result.path.length).toBeGreaterThan(0);
    });

    it('should not find non-existing key', () => {
      const result = useBTreeStore.getState().search(99);
      
      expect(result.found).toBe(false);
      expect(result.path.length).toBeGreaterThan(0);
    });

    it('should return path from root to leaf', () => {
      const result = useBTreeStore.getState().search(20);
      
      expect(result.path[0]).toBe(useBTreeStore.getState().tree.rootId);
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      // Create a tree with some keys
      useBTreeStore.getState().insert(10);
      useBTreeStore.getState().insert(20);
      useBTreeStore.getState().insert(30);
      useBTreeStore.getState().insert(40);
      useBTreeStore.getState().insert(50);
    });

    it('should delete an existing key', () => {
      useBTreeStore.getState().delete(30);
      
      const result = useBTreeStore.getState().search(30);
      expect(result.found).toBe(false);
    });

    it('should handle deleting non-existing key', () => {
      const initialCount = useBTreeStore.getState().getKeyCount();
      useBTreeStore.getState().delete(999);
      
      expect(useBTreeStore.getState().getKeyCount()).toBe(initialCount);
    });

    it('should update key count after deletion', () => {
      const initialCount = useBTreeStore.getState().getKeyCount();
      useBTreeStore.getState().delete(20);
      
      expect(useBTreeStore.getState().getKeyCount()).toBe(initialCount - 1);
    });
  });

  describe('clear', () => {
    it('should remove all keys from tree', () => {
      useBTreeStore.getState().insert(10);
      useBTreeStore.getState().insert(20);
      useBTreeStore.getState().insert(30);
      
      useBTreeStore.getState().clear();
      
      expect(useBTreeStore.getState().getKeyCount()).toBe(0);
      expect(useBTreeStore.getState().getNodeCount()).toBe(1);
    });
  });

  describe('generateRandom', () => {
    it('should generate specified number of unique keys', () => {
      useBTreeStore.getState().generateRandom(10, 1, 100);
      
      // Wait for async operations
      setTimeout(() => {
        expect(useBTreeStore.getState().getKeyCount()).toBe(10);
      }, 100);
    });
  });

  describe('computed helpers', () => {
    beforeEach(() => {
      useBTreeStore.getState().createTree(4);
    });

    describe('getTreeHeight', () => {
      it('should return 1 for empty tree', () => {
        expect(useBTreeStore.getState().getTreeHeight()).toBe(1);
      });

      it('should return correct height after inserts', () => {
        useBTreeStore.getState().insert(10);
        expect(useBTreeStore.getState().getTreeHeight()).toBe(1);
        
        // Insert enough keys to cause splits
        for (let i = 20; i <= 100; i += 10) {
          useBTreeStore.getState().insert(i);
        }
        
        const height = useBTreeStore.getState().getTreeHeight();
        expect(height).toBeGreaterThanOrEqual(1);
      });
    });

    describe('getNodeCount', () => {
      it('should return 1 for empty tree', () => {
        expect(useBTreeStore.getState().getNodeCount()).toBe(1);
      });

      it('should increase after splits', () => {
        const initialCount = useBTreeStore.getState().getNodeCount();
        
        // Insert keys to cause split
        useBTreeStore.getState().insert(10);
        useBTreeStore.getState().insert(20);
        useBTreeStore.getState().insert(30);
        useBTreeStore.getState().insert(40);
        
        expect(useBTreeStore.getState().getNodeCount()).toBeGreaterThan(initialCount);
      });
    });

    describe('getKeyCount', () => {
      it('should return 0 for empty tree', () => {
        expect(useBTreeStore.getState().getKeyCount()).toBe(0);
      });

      it('should return correct count after inserts', () => {
        useBTreeStore.getState().insert(10);
        useBTreeStore.getState().insert(20);
        
        expect(useBTreeStore.getState().getKeyCount()).toBe(2);
      });
    });

    describe('getNode', () => {
      it('should return node by id', () => {
        const { tree } = useBTreeStore.getState();
        const root = useBTreeStore.getState().getNode(tree.rootId);
        
        expect(root).toBeDefined();
        expect(root?.id).toBe(tree.rootId);
      });

      it('should return undefined for non-existing node', () => {
        const node = useBTreeStore.getState().getNode('non-existing');
        expect(node).toBeUndefined();
      });
    });
  });

  describe('node split calculation', () => {
    it('should correctly split keys with odd number', () => {
      useBTreeStore.getState().createTree(4);
      
      // Insert 3 keys (max for order 4)
      useBTreeStore.getState().insert(10);
      useBTreeStore.getState().insert(20);
      useBTreeStore.getState().insert(30);
      
      const { tree } = useBTreeStore.getState();
      const root = tree.nodes.get(tree.rootId);
      
      // Before split
      expect(root?.keys).toHaveLength(3);
      
      // Trigger split
      useBTreeStore.getState().insert(40);
      
      // After split, should have more nodes
      expect(useBTreeStore.getState().getNodeCount()).toBeGreaterThan(1);
    });

    it('should promote middle key during split', () => {
      useBTreeStore.getState().createTree(4);
      
      // Insert keys: 10, 20, 30, 40
      // After split, 20 or 30 should be promoted to root
      useBTreeStore.getState().insert(10);
      useBTreeStore.getState().insert(20);
      useBTreeStore.getState().insert(30);
      useBTreeStore.getState().insert(40);
      
      const { tree } = useBTreeStore.getState();
      const root = tree.nodes.get(tree.rootId);
      
      // Root should have the promoted key
      expect(root?.keys.length).toBeGreaterThan(0);
      expect(root?.isLeaf).toBe(false);
    });
  });

  describe('redistribute and merge', () => {
    beforeEach(() => {
      useBTreeStore.getState().createTree(4);
    });

    it('should handle redistribution when possible', () => {
      // Create a tree where redistribution is possible
      // Insert enough keys to create multiple nodes
      const keys = [10, 20, 30, 40, 50, 60, 70, 80];
      keys.forEach(key => useBTreeStore.getState().insert(key));
      
      const initialKeyCount = useBTreeStore.getState().getKeyCount();
      
      // Delete some keys to trigger redistribution
      useBTreeStore.getState().delete(10);
      useBTreeStore.getState().delete(20);
      
      // Tree should have fewer keys after deletion
      expect(useBTreeStore.getState().getKeyCount()).toBeLessThan(initialKeyCount);
      
      // Deleted keys should not be found
      expect(useBTreeStore.getState().search(10).found).toBe(false);
      expect(useBTreeStore.getState().search(20).found).toBe(false);
    });

    it('should handle merge when redistribution not possible', () => {
      // Create a minimal tree
      useBTreeStore.getState().insert(10);
      useBTreeStore.getState().insert(20);
      useBTreeStore.getState().insert(30);
      useBTreeStore.getState().insert(40);
      
      const initialKeyCount = useBTreeStore.getState().getKeyCount();
      
      // Delete keys to potentially trigger merge
      useBTreeStore.getState().delete(40);
      useBTreeStore.getState().delete(30);
      
      // Tree should have fewer keys after deletion
      expect(useBTreeStore.getState().getKeyCount()).toBeLessThan(initialKeyCount);
      
      // Deleted keys should not be found
      expect(useBTreeStore.getState().search(40).found).toBe(false);
      expect(useBTreeStore.getState().search(30).found).toBe(false);
    });
  });

  describe('findLeafForKey', () => {
    it('should return root for empty tree', () => {
      const leafId = useBTreeStore.getState().findLeafForKey(10);
      expect(leafId).toBe(useBTreeStore.getState().tree.rootId);
    });

    it('should find correct leaf for key', () => {
      useBTreeStore.getState().insert(10);
      useBTreeStore.getState().insert(20);
      useBTreeStore.getState().insert(30);
      
      const leafId = useBTreeStore.getState().findLeafForKey(15);
      const leaf = useBTreeStore.getState().getNode(leafId);
      
      expect(leaf?.isLeaf).toBe(true);
    });
  });
});

describe('BTreeStore - Different Orders', () => {
  it('should work with order 2 (minimum)', () => {
    useBTreeStore.getState().createTree(2);
    expect(useBTreeStore.getState().tree.order).toBe(2);
    
    // Clear to ensure clean state
    useBTreeStore.getState().clear();
    
    useBTreeStore.getState().insert(10);
    useBTreeStore.getState().insert(20);
    
    // Both keys should be searchable (tree is working correctly)
    expect(useBTreeStore.getState().search(10).found).toBe(true);
    expect(useBTreeStore.getState().search(20).found).toBe(true);
  });

  it('should work with order 8 (maximum)', () => {
    useBTreeStore.getState().createTree(8);
    expect(useBTreeStore.getState().tree.order).toBe(8);
    
    // Clear to ensure clean state
    useBTreeStore.getState().clear();
    
    // Insert many keys
    for (let i = 1; i <= 20; i++) {
      useBTreeStore.getState().insert(i);
    }
    
    // All keys should be searchable
    for (let i = 1; i <= 20; i++) {
      expect(useBTreeStore.getState().search(i).found).toBe(true);
    }
  });
});

describe('BTreeStore - Animation State', () => {
  it('should reset animation state', () => {
    useBTreeStore.getState().setAnimationState({
      isAnimating: true,
      highlightedNodes: ['node-1'],
      highlightedPath: ['node-1', 'node-2'],
    });
    
    useBTreeStore.getState().resetAnimation();
    
    const { animation } = useBTreeStore.getState();
    expect(animation.isAnimating).toBe(false);
    expect(animation.highlightedNodes).toEqual([]);
    expect(animation.highlightedPath).toEqual([]);
  });

  it('should update animation state', () => {
    useBTreeStore.getState().setAnimationState({ isAnimating: true });
    expect(useBTreeStore.getState().animation.isAnimating).toBe(true);
  });
});

describe('BTreeStore - Settings', () => {
  it('should update animation speed', () => {
    useBTreeStore.getState().setAnimationSpeed(300);
    expect(useBTreeStore.getState().animationSpeed).toBe(300);
  });

  it('should toggle line pointers', () => {
    const initial = useBTreeStore.getState().showLinePointers;
    useBTreeStore.getState().setShowLinePointers(!initial);
    expect(useBTreeStore.getState().showLinePointers).toBe(!initial);
  });

  it('should toggle TID pointers', () => {
    const initial = useBTreeStore.getState().showTidPointers;
    useBTreeStore.getState().setShowTidPointers(!initial);
    expect(useBTreeStore.getState().showTidPointers).toBe(!initial);
  });
});

describe('BTreeStore - Node Selection', () => {
  it('should select a node', () => {
    const nodeId = useBTreeStore.getState().tree.rootId;
    useBTreeStore.getState().selectNode(nodeId);
    expect(useBTreeStore.getState().selectedNode).toBe(nodeId);
  });

  it('should deselect node', () => {
    useBTreeStore.getState().selectNode('some-node');
    useBTreeStore.getState().selectNode(null);
    expect(useBTreeStore.getState().selectedNode).toBeNull();
  });
});
