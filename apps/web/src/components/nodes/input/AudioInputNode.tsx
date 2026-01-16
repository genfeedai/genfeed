'use client';

import type { AudioInputNodeData } from '@genfeedai/types';
import type { NodeProps } from '@xyflow/react';
import { Upload, X } from 'lucide-react';
import { memo, useCallback, useRef } from 'react';
import { useWorkflowStore } from '@/store/workflowStore';
import { BaseNode } from '../BaseNode';

function AudioInputNodeComponent(props: NodeProps) {
  const { id, data } = props;
  const nodeData = data as AudioInputNodeData;
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const audio = document.createElement('audio');
        audio.onloadedmetadata = () => {
          updateNodeData<AudioInputNodeData>(id, {
            audio: event.target?.result as string,
            filename: file.name,
            duration: audio.duration,
            source: 'upload',
          });
        };
        audio.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    },
    [id, updateNodeData]
  );

  const handleRemoveAudio = useCallback(() => {
    updateNodeData<AudioInputNodeData>(id, {
      audio: null,
      filename: null,
      duration: null,
    });
  }, [id, updateNodeData]);

  const handleUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateNodeData<AudioInputNodeData>(id, {
        url: e.target.value,
        source: 'url',
      });
    },
    [id, updateNodeData]
  );

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <BaseNode {...props}>
      <div className="space-y-2">
        {nodeData.audio ? (
          <div className="relative">
            <audio src={nodeData.audio} controls className="w-full h-10" />
            <button
              onClick={handleRemoveAudio}
              className="absolute -top-1 -right-1 p-1 bg-[var(--destructive)] rounded-full hover:opacity-80 transition"
            >
              <X className="w-3 h-3" />
            </button>
            <div className="mt-1 text-xs text-[var(--muted-foreground)] truncate">
              {nodeData.filename}
              {nodeData.duration && ` • ${formatDuration(nodeData.duration)}`}
            </div>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-20 border-2 border-dashed border-[var(--border)] rounded flex flex-col items-center justify-center gap-1 hover:border-[var(--primary)] transition"
          >
            <Upload className="w-5 h-5 text-[var(--muted-foreground)]" />
            <span className="text-xs text-[var(--muted-foreground)]">Upload Audio</span>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="text-xs text-[var(--muted-foreground)]">Or paste URL:</div>
        <input
          type="url"
          value={nodeData.url || ''}
          onChange={handleUrlChange}
          placeholder="https://..."
          className="w-full px-2 py-1.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
        />
      </div>
    </BaseNode>
  );
}

export const AudioInputNode = memo(AudioInputNodeComponent);
