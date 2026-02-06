'use client';

import type { ImageInputNodeData } from '@genfeedai/types';
import type { NodeProps } from '@xyflow/react';
import { Expand, ImageIcon, Link, Loader2, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { memo, useCallback, useMemo } from 'react';
import { BaseNode } from '../BaseNode';
import { Button } from '../../ui/button';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { getImageDimensions } from '@/lib/utils/media';
import { useUIStore } from '../../stores/uiStore';

function ImageInputNodeComponent(props: NodeProps) {
  const { id, data } = props;
  const nodeData = data as ImageInputNodeData;
  const openNodeDetailModal = useUIStore((state) => state.openNodeDetailModal);

  const {
    fileInputRef,
    showUrlInput,
    setShowUrlInput,
    urlValue,
    setUrlValue,
    isUploading,
    handleFileSelect,
    handleRemove,
    handleUrlSubmit,
    handleUrlKeyDown,
  } = useMediaUpload<ImageInputNodeData>({
    nodeId: id,
    mediaType: 'image',
    initialUrl: nodeData.url || '',
    getMetadata: async (src) => {
      const dims = await getImageDimensions(src);
      return dims;
    },
    buildUploadUpdate: (url, filename, metadata) => ({
      image: url,
      filename,
      dimensions: metadata as { width: number; height: number },
      source: 'upload' as const,
    }),
    buildUrlUpdate: (url, metadata) => ({
      image: url,
      filename: url.split('/').pop() || 'url-image',
      dimensions: metadata as { width: number; height: number } | null,
      source: 'url' as const,
      url,
    }),
    buildRemoveUpdate: () => ({
      image: null,
      filename: null,
      dimensions: null,
      url: undefined,
    }),
  });

  const handleExpand = useCallback(() => {
    openNodeDetailModal(id, 'preview');
  }, [id, openNodeDetailModal]);

  // Header actions - Upload, Link, and Expand buttons
  const headerActions = useMemo(
    () => (
      <div className="flex items-center gap-1">
        {nodeData.image && (
          <Button variant="ghost" size="icon-sm" onClick={handleExpand} title="Expand preview">
            <Expand className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => fileInputRef.current?.click()}
          title="Upload image"
        >
          <Upload className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setShowUrlInput(!showUrlInput)}
          title="Paste URL"
        >
          <Link className="h-3.5 w-3.5" />
        </Button>
      </div>
    ),
    [nodeData.image, handleExpand, fileInputRef, showUrlInput, setShowUrlInput]
  );

  return (
    <BaseNode {...props} headerActions={headerActions}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* URL Input (shown when link button clicked) */}
      {showUrlInput && (
        <div className="mb-3 flex gap-2">
          <input
            type="url"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            onKeyDown={handleUrlKeyDown}
            placeholder="https://..."
            className="flex-1 h-7 px-2 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleUrlSubmit}
            disabled={!urlValue.trim()}
            className="h-7 px-2 text-xs"
          >
            Load
          </Button>
        </div>
      )}

      {/* Image Preview or Empty State */}
      {nodeData.image ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-black/20">
          <Image
            src={nodeData.image}
            alt={nodeData.filename || 'Image'}
            fill
            sizes="300px"
            className="object-contain cursor-pointer"
            unoptimized
          />
          <Button
            variant="secondary"
            size="icon-sm"
            onClick={handleRemove}
            className="absolute right-1.5 top-1.5 h-5 w-5"
          >
            <X className="h-3 w-3" />
          </Button>
          {nodeData.dimensions && (
            <div className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px]">
              {nodeData.dimensions.width}x{nodeData.dimensions.height}
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex flex-1 min-h-16 w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border/50 bg-secondary/20 transition-colors hover:border-primary/50 hover:bg-secondary/40 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-5 w-5 text-muted-foreground/50 animate-spin" />
              <span className="text-[10px] text-muted-foreground/70">Uploading...</span>
            </>
          ) : (
            <>
              <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
              <span className="text-[10px] text-muted-foreground/70">Drop or click</span>
            </>
          )}
        </button>
      )}
    </BaseNode>
  );
}

export const ImageInputNode = memo(ImageInputNodeComponent);
