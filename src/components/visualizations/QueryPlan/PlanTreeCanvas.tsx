import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useQueryPlanStore, PlanNode, PlanNodeType } from '../../../stores/queryPlanStore';
import { ZoomIn, ZoomOut, Maximize, Move } from 'lucide-react';

// Node colors by type
const NODE_COLORS: Record<PlanNodeType, { bg: string; border: string; text: string }> = {
  SeqScan: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  IndexScan: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  IndexOnlyScan: { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
  BitmapScan: { bg: '#e0e7ff', border: '#6366f1', text: '#3730a3' },
  NestedLoop: { bg: '#fce7f3', border: '#ec4899', text: '#9d174d' },
  HashJoin: { bg: '#f3e8ff', border: '#a855f7', text: '#6b21a8' },
  MergeJoin: { bg: '#ccfbf1', border: '#14b8a6', text: '#0f766e' },
  Sort: { bg: '#ffedd5', border: '#f97316', text: '#9a3412' },
  Aggregate: { bg: '#fecaca', border: '#ef4444', text: '#991b1b' },
  Limit: { bg: '#e5e7eb', border: '#6b7280', text: '#374151' },
};

// Dark mode colors
const NODE_COLORS_DARK: Record<PlanNodeType, { bg: string; border: string; text: string }> = {
  SeqScan: { bg: '#78350f', border: '#f59e0b', text: '#fef3c7' },
  IndexScan: { bg: '#1e3a8a', border: '#3b82f6', text: '#dbeafe' },
  IndexOnlyScan: { bg: '#064e3b', border: '#10b981', text: '#d1fae5' },
  BitmapScan: { bg: '#312e81', border: '#6366f1', text: '#e0e7ff' },
  NestedLoop: { bg: '#831843', border: '#ec4899', text: '#fce7f3' },
  HashJoin: { bg: '#581c87', border: '#a855f7', text: '#f3e8ff' },
  MergeJoin: { bg: '#134e4a', border: '#14b8a6', text: '#ccfbf1' },
  Sort: { bg: '#7c2d12', border: '#f97316', text: '#ffedd5' },
  Aggregate: { bg: '#7f1d1d', border: '#ef4444', text: '#fecaca' },
  Limit: { bg: '#374151', border: '#9ca3af', text: '#e5e7eb' },
};

// Node shape (simplified representation)
const NODE_WIDTH = 140;
const NODE_HEIGHT = 70;
const LEVEL_HEIGHT = 120;

export function PlanTreeCanvas() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { planTree, selectedNode, currentNodeId, selectNode, showCosts } = useQueryPlanStore();
  const [zoom, setZoom] = useState(1);
  const [transform, setTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check for dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Convert tree to D3 hierarchy
  const treeToHierarchy = useCallback((node: PlanNode): d3.HierarchyNode<PlanNode> => {
    return d3.hierarchy(node, (d) => d.children);
  }, []);

  // Render tree
  useEffect(() => {
    if (!svgRef.current || !planTree) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const hierarchy = treeToHierarchy(planTree);
    const nodeCount = hierarchy.descendants().length;
    const treeWidth = Math.max(800, nodeCount * 160);
    const treeHeight = (hierarchy.height + 1) * LEVEL_HEIGHT + 100;

    // Create tree layout
    const treeLayout = d3.tree<PlanNode>().size([treeWidth, treeHeight]);
    treeLayout(hierarchy);

    // Create main group with zoom transform
    const g = svg.append('g').attr('transform', transform.toString());

    // Draw links (edges)
    const links = hierarchy.links();
    g.selectAll('.link')
      .data(links)
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr(
        'd',
        d3
          .linkVertical<d3.HierarchyLink<PlanNode>, d3.HierarchyPointNode<PlanNode>>()
          .x((d) => d.x)
          .y((d) => d.y)
      )
      .attr('fill', 'none')
      .attr('stroke', isDarkMode ? '#4b5563' : '#d1d5db')
      .attr('stroke-width', 2);

    // Draw nodes
    const nodes = g
      .selectAll('.node')
      .data(hierarchy.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${d.x},${d.y})`)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        selectNode(d.data.id);
      });

    const colors = isDarkMode ? NODE_COLORS_DARK : NODE_COLORS;

    // Node rectangles
    nodes
      .append('rect')
      .attr('width', NODE_WIDTH)
      .attr('height', NODE_HEIGHT)
      .attr('x', -NODE_WIDTH / 2)
      .attr('y', -NODE_HEIGHT / 2)
      .attr('rx', 8)
      .attr('ry', 8)
      .attr('fill', (d) => colors[d.data.type].bg)
      .attr('stroke', (d) => {
        if (d.data.id === currentNodeId) return '#22c55e'; // Green for current execution
        if (d.data.id === selectedNode) return '#6366f1'; // Indigo for selected
        return colors[d.data.type].border;
      })
      .attr('stroke-width', (d) => {
        if (d.data.id === currentNodeId || d.data.id === selectedNode) return 3;
        return 2;
      })
      .style('filter', (d) => {
        if (d.data.id === currentNodeId) return 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.5))';
        return 'none';
      });

    // Node type label
    nodes
      .append('text')
      .attr('dy', -15)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .style('fill', (d) => colors[d.data.type].text)
      .text((d) => d.data.type);

    // Table/index label
    nodes
      .append('text')
      .attr('dy', 0)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('fill', (d) => colors[d.data.type].text)
      .style('opacity', 0.8)
      .text((d) => {
        if (d.data.table) return d.data.table;
        if (d.data.joinType) return `${d.data.joinType} JOIN`;
        return '';
      });

    // Cost label
    if (showCosts) {
      nodes
        .append('text')
        .attr('dy', 18)
        .attr('text-anchor', 'middle')
        .style('font-size', '9px')
        .style('font-family', 'monospace')
        .style('fill', (d) => colors[d.data.type].text)
        .style('opacity', 0.7)
        .text((d) => `cost=${d.data.cost.total.toFixed(2)}`);
    }

    // Rows label
    nodes
      .append('text')
      .attr('dy', showCosts ? 30 : 18)
      .attr('text-anchor', 'middle')
      .style('font-size', '9px')
      .style('font-family', 'monospace')
      .style('fill', (d) => colors[d.data.type].text)
      .style('opacity', 0.7)
      .text((d) => `rows=${d.data.rows}`);

    // Click on background to deselect
    svg.on('click', () => selectNode(null));
  }, [planTree, selectedNode, currentNodeId, selectNode, showCosts, transform, isDarkMode, treeToHierarchy]);

  // Zoom controls
  const handleZoomIn = () => {
    const newZoom = Math.min(zoom * 1.2, 3);
    setZoom(newZoom);
    setTransform(d3.zoomIdentity.scale(newZoom));
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom / 1.2, 0.3);
    setZoom(newZoom);
    setTransform(d3.zoomIdentity.scale(newZoom));
  };

  const handleResetZoom = () => {
    setZoom(1);
    setTransform(d3.zoomIdentity);
  };

  if (!planTree) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-50 dark:bg-gray-900/50">
        <p className="text-gray-500 dark:text-gray-400">No plan to display</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          onClick={handleResetZoom}
          className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Reset Zoom"
        >
          <Maximize className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-3 z-10">
        <div className="flex items-center gap-2 mb-2">
          <Move className="w-3 h-3 text-gray-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Pan & Zoom</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          {Object.entries(isDarkMode ? NODE_COLORS_DARK : NODE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: color.bg, border: `1px solid ${color.border}` }}
              />
              <span className="text-gray-600 dark:text-gray-400">{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        className="w-full h-[500px] cursor-grab active:cursor-grabbing"
        style={{ minHeight: '500px' }}
      />
    </div>
  );
}
