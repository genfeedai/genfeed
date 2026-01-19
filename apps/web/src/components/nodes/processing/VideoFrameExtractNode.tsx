'use client';

import type { FrameSelectionMode, VideoFrameExtractNodeData } from '@genfeedai/types';
import type { NodeProps } from '@xyflow/react';
import { Film, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { memo, useCallback } from 'react';
import { useExecutionStore } from '@/store/executionStore';
import { useWorkflowStore } from '@/store/workflowStore';
import { BaseNode } from '../BaseNode';

const SELECTION_MODES: { value: FrameSelectionMode; label: string }[] = [
  { value: 'last', label: 'Last Frame' },
  { value: 'first', label: 'First Frame' },
];

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function VideoFrameExtractNodeComponent(props: NodeProps) {
  const { id, data } = props;
  const nodeData = data as VideoFrameExtractNodeData;
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const executeNode = useExecutionStore((state) => state.executeNode);

  const handleModeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value as FrameSelectionMode;
      updateNodeData<VideoFrameExtractNodeData>(id, { selectionMode: value });
    },
    [id, updateNodeData]
  );

  const handleProcess = useCallback(() => {
    executeNode(id);
  }, [id, executeNode]);

  return (
    <BaseNode {...props}>
      <div className="space-y-3">
        {/* Duration Info */}
        <div className="text-xs text-[var(--muted-foreground)]">
          {nodeData.videoDuration
            ? `Source: ${formatTime(nodeData.videoDuration)}`
            : 'Connect video to extract frame'}
        </div>

        {/* Selection Mode */}
        <div>
          <label className="text-xs text-[var(--muted-foreground)] block mb-1">
            Frame Selection
          </label>
          <select
            value={nodeData.selectionMode}
            onChange={handleModeChange}
            className="w-full px-2 py-1.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          >
            {SELECTION_MODES.map((mode) => (
              <option key={mode.value} value={mode.value}>
                {mode.label}
              </option>
            ))}
          </select>
        </div>

        {/* Output Preview */}
        {nodeData.outputImage && (
          <div className="relative">
            <Image
              src={nodeData.outputImage}
              alt="Extracted frame"
              width={200}
              height={120}
              className="w-full h-20 object-cover rounded"
            />
            <button
              type="button"
              onClick={handleProcess}
              disabled={nodeData.status === 'processing'}
              className="absolute top-1 right-1 p-1 bg-black/50 rounded-full hover:bg-black/70 transition disabled:opacity-50"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Process Button */}
        {!nodeData.outputImage && nodeData.status !== 'processing' && (
          <button
            type="button"
            onClick={handleProcess}
            disabled={!nodeData.inputVideo}
            className="w-full py-2 bg-[var(--primary)] text-white rounded text-sm font-medium hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Film className="w-4 h-4" />
            Extract Frame
          </button>
        )}
      </div>
    </BaseNode>
  );
}

export const VideoFrameExtractNode = memo(VideoFrameExtractNodeComponent);
