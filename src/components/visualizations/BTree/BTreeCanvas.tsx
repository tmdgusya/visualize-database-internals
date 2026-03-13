import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { useBTreeStore } from '../../../stores/btreeStore';

interface TreeNodeData {
  id: string;
  keys: number[];
  isLeaf: boolean;
  isRoot: boolean;
  x: number;
  y: number;
  children?: TreeNodeData[];
}

export function BTreeCanvas() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    tree,
    selectedNode,
    animation,
    selectNode,
  } = useBTreeStore();

  // Convert B-Tree to D3 hierarchy
  const buildHierarchy = useCallback((): TreeNodeData | null => {
    if (!tree.rootId) return null;

    const buildNode = (nodeId: string): TreeNodeData | null => {
      const node = tree.nodes.get(nodeId);
      if (!node) return null;

      const children: TreeNodeData[] = [];
      if (!node.isLeaf && node.children) {
        node.children.forEach(childId => {
          const child = buildNode(childId);
          if (child) children.push(child);
        });
      }

      return {
        id: node.id,
        keys: node.keys,
        isLeaf: node.isLeaf,
        isRoot: node.isRoot || false,
        x: 0,
        y: 0,
        children: children.length > 0 ? children : undefined,
      };
    };

    return buildNode(tree.rootId);
  }, [tree]);

  // Render the tree
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 500;

    svg.attr('width', width).attr('height', height);
    svg.selectAll('*').remove();

    const rootData = buildHierarchy();
    if (!rootData) return;

    // Create hierarchy
    const root = d3.hierarchy<TreeNodeData>(rootData);

    // Tree layout
    const treeLayout = d3.tree<TreeNodeData>().size([width - 100, height - 150]);
    treeLayout(root);

    // Center the tree
    const g = svg.append('g').attr('transform', 'translate(50, 50)');

    // Draw links
    g.selectAll('.link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', (d: d3.HierarchyLink<TreeNodeData>) => {
        const source = d.source as d3.HierarchyPointNode<TreeNodeData>;
        const target = d.target as d3.HierarchyPointNode<TreeNodeData>;
        return `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
      })
      .attr('fill', 'none')
      .attr('stroke', '#9CA3AF')
      .attr('stroke-width', 2);

    // Draw leaf node links (sibling pointers)
    if (useBTreeStore.getState().showLinePointers) {
      const leafNodes: d3.HierarchyPointNode<TreeNodeData>[] = [];
      root.descendants().forEach((node) => {
        if (node.data.isLeaf) {
          leafNodes.push(node as d3.HierarchyPointNode<TreeNodeData>);
        }
      });

      // Sort by x position
      leafNodes.sort((a, b) => a.x - b.x);

      // Draw horizontal lines between adjacent leaf nodes
      for (let i = 0; i < leafNodes.length - 1; i++) {
        const current = leafNodes[i];
        const next = leafNodes[i + 1];

        g.append('path')
          .attr('d', `M ${current.x + 40} ${current.y} L ${next.x - 40} ${next.y}`)
          .attr('fill', 'none')
          .attr('stroke', '#10B981')
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '5,5')
          .attr('opacity', 0.6);

        // Arrow head
        g.append('polygon')
          .attr('points', `${next.x - 45},${next.y} ${next.x - 55},${next.y - 5} ${next.x - 55},${next.y + 5}`)
          .attr('fill', '#10B981')
          .attr('opacity', 0.6);
      }
    }

    // Draw nodes
    const nodes = g.selectAll('.node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x}, ${d.y})`)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        selectNode(d.data.id);
      });

    // Node rectangle
    const nodeWidth = 80;
    const nodeHeight = 40;

    nodes.each(function(d) {
      const node = d3.select(this);
      const isHighlighted = animation.highlightedNodes.includes(d.data.id);
      const isInPath = animation.highlightedPath.includes(d.data.id);
      const isSelected = selectedNode === d.data.id;

      // Determine colors
      let fillColor = d.data.isLeaf ? '#D1FAE5' : '#DBEAFE'; // Green for leaf, blue for internal
      let strokeColor = d.data.isLeaf ? '#10B981' : '#3B82F6';
      let strokeWidth = 2;

      if (isSelected) {
        fillColor = '#FEF3C7'; // Yellow
        strokeColor = '#F59E0B';
        strokeWidth = 3;
      } else if (isHighlighted) {
        fillColor = '#FCD34D'; // Amber
        strokeColor = '#F59E0B';
        strokeWidth = 3;
      } else if (isInPath) {
        fillColor = '#C7D2FE'; // Indigo
        strokeColor = '#6366F1';
        strokeWidth = 2;
      }

      // Dark mode colors
      const isDark = document.documentElement.classList.contains('dark');
      if (isDark) {
        if (d.data.isLeaf) fillColor = isSelected ? '#78350F' : isHighlighted ? '#92400E' : '#064E3B';
        else fillColor = isSelected ? '#78350F' : isHighlighted ? '#92400E' : '#1E3A8A';
      }

      // Node background
      node.append('rect')
        .attr('x', -nodeWidth / 2)
        .attr('y', -nodeHeight / 2)
        .attr('width', nodeWidth)
        .attr('height', nodeHeight)
        .attr('rx', 6)
        .attr('fill', fillColor)
        .attr('stroke', strokeColor)
        .attr('stroke-width', strokeWidth)
        .attr('class', 'transition-all duration-300');

      // Root indicator
      if (d.data.isRoot) {
        node.append('circle')
          .attr('cx', -nodeWidth / 2 + 8)
          .attr('cy', -nodeHeight / 2 + 8)
          .attr('r', 4)
          .attr('fill', '#F59E0B');
      }

      // Keys text
      const keysText = d.data.keys.length > 0 ? `[${d.data.keys.join(', ')}]` : '[]';
      node.append('text')
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .attr('class', 'text-xs font-mono font-medium')
        .attr('fill', isDark ? '#E5E7EB' : '#1F2937')
        .text(keysText);

      // Node type label
      node.append('text')
        .attr('dy', nodeHeight / 2 + 14)
        .attr('text-anchor', 'middle')
        .attr('class', 'text-[10px] text-gray-500 dark:text-gray-400')
        .text(d.data.isLeaf ? 'Leaf' : 'Internal');
    });

    // Split animation overlay
    if (animation.splitAnimation) {
      const { sourceNode, promotedKey } = animation.splitAnimation;
      
      // Find positions
      root.descendants().forEach((d) => {
        const node = d as d3.HierarchyPointNode<TreeNodeData>;
        if (d.data.id === sourceNode) {
          g.append('circle')
            .attr('cx', node.x ?? 0)
            .attr('cy', node.y ?? 0)
            .attr('r', 50)
            .attr('fill', 'none')
            .attr('stroke', '#F59E0B')
            .attr('stroke-width', 3)
            .attr('opacity', 0.8)
            .attr('class', 'animate-pulse');
        }
      });

      // Promoted key indicator
      if (promotedKey !== null) {
        g.append('text')
          .attr('x', width / 2)
          .attr('y', 20)
          .attr('text-anchor', 'middle')
          .attr('class', 'text-sm font-semibold fill-amber-500')
          .text(`Split: Key ${promotedKey} promoted`);
      }
    }

    // Merge animation overlay
    if (animation.mergeAnimation) {
      const { targetNode } = animation.mergeAnimation;
      
      root.descendants().forEach((d) => {
        const node = d as d3.HierarchyPointNode<TreeNodeData>;
        if (d.data.id === targetNode) {
          g.append('circle')
            .attr('cx', node.x ?? 0)
            .attr('cy', node.y ?? 0)
            .attr('r', 55)
            .attr('fill', 'none')
            .attr('stroke', '#EF4444')
            .attr('stroke-width', 3)
            .attr('opacity', 0.8)
            .attr('class', 'animate-pulse');
        }
      });

      g.append('text')
        .attr('x', width / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .attr('class', 'text-sm font-semibold fill-red-500')
        .text('Merge: Nodes combined');
    }

    // Click on background to deselect
    svg.on('click', () => {
      selectNode(null);
    });

  }, [tree, selectedNode, animation, buildHierarchy, selectNode]);

  return (
    <div ref={containerRef} className="w-full overflow-x-auto">
      <svg
        ref={svgRef}
        className="w-full min-h-[500px]"
        style={{ minWidth: '600px' }}
      />
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 px-4 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-200 dark:bg-blue-900 border border-blue-400" />
          <span>Internal Node</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-200 dark:bg-green-900 border border-green-400" />
          <span>Leaf Node</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-200 dark:bg-yellow-900 border-2 border-yellow-400" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-indigo-200 dark:bg-indigo-900 border border-indigo-400" />
          <span>Search Path</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-green-500" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #10B981 0, #10B981 5px, transparent 5px, transparent 10px)' }} />
          <span>Leaf Link</span>
        </div>
      </div>
    </div>
  );
}
