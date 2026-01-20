'use client';

import type { NodeType, WorkflowNodeData } from '@genfeedai/types';
import { NODE_DEFINITIONS } from '@genfeedai/types';
import { Download, X, ZoomIn, ZoomOut } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getMediaFromNode } from '@/lib/utils/mediaExtraction';
import { useUIStore } from '@/store/uiStore';
import { useWorkflowStore } from '@/store/workflowStore';

export function NodeDetailModal() {
  const { activeModal, nodeDetailNodeId, closeNodeDetailModal } = useUIStore();
  const { getNodeById } = useWorkflowStore();

  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Get the node being displayed
  const node = useMemo(() => {
    if (!nodeDetailNodeId) return null;
    return getNodeById(nodeDetailNodeId);
  }, [nodeDetailNodeId, getNodeById]);

  // Get media info
  const mediaInfo = useMemo(() => {
    if (!node) return { url: null, type: null };
    return getMediaFromNode(node.type as NodeType, node.data as WorkflowNodeData);
  }, [node]);

  // Get node definition
  const nodeDef = useMemo(() => {
    if (!node) return null;
    return NODE_DEFINITIONS[node.type as NodeType];
  }, [node]);

  // Reset zoom and pan when node changes
  useEffect(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeModal !== 'nodeDetail') return;

      if (e.key === 'Escape') {
        closeNodeDetailModal();
      }
      if (e.key === '+' || e.key === '=') {
        setZoomLevel((prev) => Math.min(prev + 0.25, 4));
      }
      if (e.key === '-') {
        setZoomLevel((prev) => Math.max(prev - 0.25, 0.25));
      }
      if (e.key === '0') {
        setZoomLevel(1);
        setPanOffset({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, closeNodeDetailModal]);

  // Pan handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (zoomLevel > 1) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      }
    },
    [zoomLevel, panOffset]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setPanOffset({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
      }
    },
    [isPanning, panStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Download handler
  const handleDownload = useCallback(() => {
    if (!mediaInfo.url) return;

    const link = document.createElement('a');
    link.href = mediaInfo.url;
    link.download = `${node?.data.label || 'output'}.${mediaInfo.type === 'video' ? 'mp4' : 'png'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [mediaInfo, node]);

  if (activeModal !== 'nodeDetail' || !node || !nodeDef) {
    return null;
  }

  const nodeData = node.data as WorkflowNodeData;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/80" onClick={closeNodeDetailModal} />

      {/* Modal */}
      <div className="fixed inset-4 z-50 flex flex-col bg-card rounded-lg border border-border shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-medium text-foreground">{nodeData.label}</h2>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
              {nodeDef.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {mediaInfo.url && (
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            )}
            <button
              onClick={closeNodeDetailModal}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div
            className="relative w-full h-full flex items-center justify-center bg-background overflow-hidden"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: zoomLevel > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
          >
            {mediaInfo.url ? (
              <div
                className="transition-transform duration-100"
                style={{
                  transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
                }}
              >
                {mediaInfo.type === 'image' && (
                  <Image
                    src={mediaInfo.url}
                    alt={nodeData.label}
                    width={800}
                    height={600}
                    className="max-h-[calc(100vh-200px)] max-w-[calc(100vw-100px)] object-contain rounded-lg"
                    unoptimized
                  />
                )}
                {mediaInfo.type === 'video' && (
                  <video
                    src={mediaInfo.url}
                    controls
                    autoPlay
                    loop
                    className="max-h-[calc(100vh-200px)] max-w-[calc(100vw-100px)] rounded-lg"
                  />
                )}
              </div>
            ) : (
              <div className="text-muted-foreground text-center">
                <p className="text-lg">No preview available</p>
                <p className="text-sm mt-2">Generate content to see the preview</p>
              </div>
            )}

            {/* Zoom controls */}
            {mediaInfo.url && mediaInfo.type === 'image' && (
              <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-card border border-border rounded-lg p-1">
                <button
                  onClick={() => setZoomLevel((prev) => Math.max(prev - 0.25, 0.25))}
                  className="p-2 hover:bg-secondary rounded transition-colors"
                  title="Zoom out (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs text-muted-foreground w-12 text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel((prev) => Math.min(prev + 0.25, 4))}
                  className="p-2 hover:bg-secondary rounded transition-colors"
                  title="Zoom in (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setZoomLevel(1);
                    setPanOffset({ x: 0, y: 0 });
                  }}
                  className="px-2 py-1 text-xs hover:bg-secondary rounded transition-colors"
                  title="Reset zoom (0)"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
