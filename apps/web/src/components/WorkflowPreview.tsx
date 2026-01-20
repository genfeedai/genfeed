'use client';

import type { NodeType, WorkflowEdge, WorkflowNode } from '@genfeedai/types';
import { NODE_DEFINITIONS } from '@genfeedai/types';
import { ReactFlow, ReactFlowProvider } from '@xyflow/react';
import { CATEGORY_COLORS, DEFAULT_NODE_COLOR } from '@/lib/constants/colors';
import '@xyflow/react/dist/style.css';
import { memo, useMemo } from 'react';

interface PreviewNodeProps {
  data: { nodeType: NodeType };
}

function PreviewNodeComponent({ data }: PreviewNodeProps) {
  const category = NODE_DEFINITIONS[data.nodeType]?.category ?? 'input';
  const color = CATEGORY_COLORS[category] ?? DEFAULT_NODE_COLOR;

  return (
    <div
      className="rounded"
      style={{
        width: 60,
        height: 24,
        backgroundColor: color,
        opacity: 0.9,
      }}
    />
  );
}

const previewNodeTypes = {
  audioInput: PreviewNodeComponent,
  imageInput: PreviewNodeComponent,
  videoInput: PreviewNodeComponent,
  prompt: PreviewNodeComponent,
  template: PreviewNodeComponent,
  imageGen: PreviewNodeComponent,
  videoGen: PreviewNodeComponent,
  llm: PreviewNodeComponent,
  lipSync: PreviewNodeComponent,
  voiceChange: PreviewNodeComponent,
  textToSpeech: PreviewNodeComponent,
  transcribe: PreviewNodeComponent,
  resize: PreviewNodeComponent,
  animation: PreviewNodeComponent,
  annotation: PreviewNodeComponent,
  imageGridSplit: PreviewNodeComponent,
  videoStitch: PreviewNodeComponent,
  videoTrim: PreviewNodeComponent,
  videoFrameExtract: PreviewNodeComponent,
  lumaReframeImage: PreviewNodeComponent,
  lumaReframeVideo: PreviewNodeComponent,
  topazImageUpscale: PreviewNodeComponent,
  topazVideoUpscale: PreviewNodeComponent,
  subtitle: PreviewNodeComponent,
  output: PreviewNodeComponent,
  preview: PreviewNodeComponent,
};

interface WorkflowPreviewProps {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

function WorkflowPreviewInner({ nodes, edges }: WorkflowPreviewProps) {
  const previewNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: { ...node.data, nodeType: node.type as NodeType },
      })),
    [nodes]
  );

  const previewEdges = useMemo(
    () =>
      edges.map((edge) => ({
        ...edge,
        style: { stroke: '#525252', strokeWidth: 1 },
      })),
    [edges]
  );

  if (nodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-xs text-[var(--muted-foreground)]">Empty</span>
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={previewNodes}
      edges={previewEdges}
      nodeTypes={previewNodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      nodesDraggable={false}
      nodesConnectable={false}
      nodesFocusable={false}
      edgesFocusable={false}
      elementsSelectable={false}
      panOnDrag={false}
      zoomOnScroll={false}
      zoomOnDoubleClick={false}
      zoomOnPinch={false}
      preventScrolling={false}
      proOptions={{ hideAttribution: true }}
      style={{ background: 'transparent' }}
    />
  );
}

export const WorkflowPreview = memo(function WorkflowPreview(props: WorkflowPreviewProps) {
  return (
    <ReactFlowProvider>
      <WorkflowPreviewInner {...props} />
    </ReactFlowProvider>
  );
});
