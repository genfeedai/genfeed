'use client';

import type { RssInputNodeData } from '@genfeedai/types';
import type { NodeProps } from '@xyflow/react';
import { ChevronLeft, ChevronRight, Link, Loader2, Type } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { useWorkflowStore } from '@/store/workflowStore';
import { BaseNode } from '../BaseNode';

function RssInputNodeComponent(props: NodeProps) {
  const { id, data } = props;
  const nodeData = data as RssInputNodeData;
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const [isFetching, setIsFetching] = useState(false);

  const handleModeChange = useCallback(
    (mode: 'url' | 'text') => {
      updateNodeData<RssInputNodeData>(id, { inputMode: mode });
    },
    [id, updateNodeData]
  );

  const handleUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateNodeData<RssInputNodeData>(id, { feedUrl: e.target.value });
    },
    [id, updateNodeData]
  );

  const handleRawXmlChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateNodeData<RssInputNodeData>(id, { rawXml: e.target.value });
    },
    [id, updateNodeData]
  );

  const handleFetchFeed = useCallback(async () => {
    const url = nodeData.inputMode === 'url' ? nodeData.feedUrl : null;
    const xml = nodeData.inputMode === 'text' ? nodeData.rawXml : null;

    if (!url && !xml) return;

    setIsFetching(true);
    try {
      const response = await fetch('/api/rss/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, xml }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch feed');
      }

      const { feedTitle, items } = await response.json();
      updateNodeData<RssInputNodeData>(id, {
        feedTitle,
        feedItems: items,
        selectedItemIndex: 0,
        status: 'complete',
      });
    } catch (error) {
      updateNodeData<RssInputNodeData>(id, {
        error: error instanceof Error ? error.message : 'Failed to fetch',
        status: 'error',
      });
    } finally {
      setIsFetching(false);
    }
  }, [id, nodeData.feedUrl, nodeData.rawXml, nodeData.inputMode, updateNodeData]);

  const handlePrevItem = useCallback(() => {
    if (!nodeData.feedItems || nodeData.selectedItemIndex <= 0) return;
    updateNodeData<RssInputNodeData>(id, {
      selectedItemIndex: nodeData.selectedItemIndex - 1,
    });
  }, [id, nodeData.feedItems, nodeData.selectedItemIndex, updateNodeData]);

  const handleNextItem = useCallback(() => {
    if (!nodeData.feedItems || nodeData.selectedItemIndex >= nodeData.feedItems.length - 1) return;
    updateNodeData<RssInputNodeData>(id, {
      selectedItemIndex: nodeData.selectedItemIndex + 1,
    });
  }, [id, nodeData.feedItems, nodeData.selectedItemIndex, updateNodeData]);

  const selectedItem = nodeData.feedItems?.[nodeData.selectedItemIndex];

  return (
    <BaseNode {...props}>
      <div className="space-y-3">
        {/* Mode Toggle */}
        <div className="flex gap-1 p-1 bg-[var(--background)] rounded-lg">
          <button
            onClick={() => handleModeChange('url')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium transition ${
              nodeData.inputMode === 'url'
                ? 'bg-[var(--primary)] text-white'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            <Link className="w-3 h-3" />
            URL
          </button>
          <button
            onClick={() => handleModeChange('text')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium transition ${
              nodeData.inputMode === 'text'
                ? 'bg-[var(--primary)] text-white'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            <Type className="w-3 h-3" />
            XML
          </button>
        </div>

        {/* URL Input */}
        {nodeData.inputMode === 'url' && (
          <div className="space-y-2">
            <input
              type="url"
              value={nodeData.feedUrl || ''}
              onChange={handleUrlChange}
              placeholder="https://example.com/feed.xml"
              className="w-full px-2 py-1.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
            <button
              onClick={handleFetchFeed}
              disabled={!nodeData.feedUrl || isFetching}
              className="w-full py-1.5 bg-[var(--primary)] text-white rounded text-xs font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isFetching ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Fetching...
                </>
              ) : (
                'Fetch Feed'
              )}
            </button>
          </div>
        )}

        {/* Raw XML Input */}
        {nodeData.inputMode === 'text' && (
          <div className="space-y-2">
            <textarea
              value={nodeData.rawXml || ''}
              onChange={handleRawXmlChange}
              placeholder="Paste RSS XML here..."
              className="w-full h-20 px-2 py-1.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded resize-none focus:outline-none focus:ring-1 focus:ring-[var(--primary)] font-mono text-xs"
            />
            <button
              onClick={handleFetchFeed}
              disabled={!nodeData.rawXml || isFetching}
              className="w-full py-1.5 bg-[var(--primary)] text-white rounded text-xs font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isFetching ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Parsing...
                </>
              ) : (
                'Parse Feed'
              )}
            </button>
          </div>
        )}

        {/* Feed Preview */}
        {nodeData.feedItems && nodeData.feedItems.length > 0 && (
          <div className="p-2 bg-[var(--background)] border border-[var(--border)] rounded space-y-2">
            {/* Feed Title */}
            {nodeData.feedTitle && (
              <div className="text-xs text-[var(--muted-foreground)] font-medium">
                {nodeData.feedTitle}
              </div>
            )}

            {/* Item Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevItem}
                disabled={nodeData.selectedItemIndex <= 0}
                className="p-1 rounded hover:bg-[var(--border)] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-[var(--muted-foreground)]">
                {nodeData.selectedItemIndex + 1} / {nodeData.feedItems.length}
              </span>
              <button
                onClick={handleNextItem}
                disabled={nodeData.selectedItemIndex >= nodeData.feedItems.length - 1}
                className="p-1 rounded hover:bg-[var(--border)] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Selected Item */}
            {selectedItem && (
              <div className="space-y-1">
                <div className="text-sm font-medium text-[var(--foreground)] line-clamp-2">
                  {selectedItem.title}
                </div>
                <div className="text-xs text-[var(--muted-foreground)] line-clamp-3">
                  {selectedItem.description}
                </div>
                {selectedItem.pubDate && (
                  <div className="text-xs text-[var(--muted-foreground)]">
                    {new Date(selectedItem.pubDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </BaseNode>
  );
}

export const RssInputNode = memo(RssInputNodeComponent);
