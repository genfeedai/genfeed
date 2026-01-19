'use client';

import { ArrowLeft, ImageIcon, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { GalleryGrid } from '@/components/gallery/GalleryGrid';
import { LightboxModal } from '@/components/gallery/LightboxModal';
import type { GalleryItem, GalleryResponse } from '@/lib/gallery/types';

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const selectedItem = selectedIndex !== null ? items[selectedIndex] : null;

  const fetchGallery = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch('/api/gallery', { signal });
      if (!response.ok) throw new Error('Failed to load gallery');
      const data: GalleryResponse = await response.json();
      setItems(data.items);
      setError(null);
    } catch (err) {
      if (signal?.aborted) return;
      setError(err instanceof Error ? err.message : 'Failed to load gallery');
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      await fetchGallery(controller.signal);
      setIsLoading(false);
    }

    load();
    return () => controller.abort();
  }, [fetchGallery]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchGallery();
    setIsRefreshing(false);
  }, [fetchGallery]);

  const handleSelect = useCallback(
    (item: GalleryItem) => {
      const index = items.findIndex((i) => i.id === item.id);
      setSelectedIndex(index >= 0 ? index : null);
    },
    [items]
  );

  const handlePrev = useCallback(() => {
    if (selectedIndex === null || items.length === 0) return;
    setSelectedIndex(selectedIndex > 0 ? selectedIndex - 1 : items.length - 1);
  }, [selectedIndex, items.length]);

  const handleNext = useCallback(() => {
    if (selectedIndex === null || items.length === 0) return;
    setSelectedIndex(selectedIndex < items.length - 1 ? selectedIndex + 1 : 0);
  }, [selectedIndex, items.length]);

  const handleDelete = useCallback(
    async (item: GalleryItem) => {
      try {
        const response = await fetch(`/api/gallery/${item.path}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete file');

        // Remove from local state
        setItems((prev) => prev.filter((i) => i.id !== item.id));

        // Move to next item or close if last
        if (selectedIndex !== null) {
          const newItems = items.filter((i) => i.id !== item.id);
          if (newItems.length === 0) {
            setSelectedIndex(null);
          } else if (selectedIndex >= newItems.length) {
            setSelectedIndex(newItems.length - 1);
          }
        }
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to delete file');
      }
    },
    [items, selectedIndex]
  );

  const handleClose = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-lg hover:bg-[var(--secondary)] transition">
              <ArrowLeft className="w-5 h-5 text-[var(--muted-foreground)]" />
            </Link>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <h1 className="text-xl font-semibold text-[var(--foreground)]">Gallery</h1>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm text-[var(--muted-foreground)]">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </p>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 transition disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 text-[var(--foreground)] ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-[var(--secondary)] text-[var(--foreground)] rounded-lg hover:opacity-90 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && items.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--secondary)] flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-[var(--muted-foreground)]" />
            </div>
            <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No assets yet</h3>
            <p className="text-[var(--muted-foreground)] mb-6">
              Generated images, videos, and audio will appear here
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition"
            >
              Go to Dashboard
            </Link>
          </div>
        )}

        {/* Gallery grid */}
        {!isLoading && !error && items.length > 0 && (
          <GalleryGrid items={items} onSelect={handleSelect} />
        )}
      </main>

      {/* Lightbox modal */}
      <LightboxModal
        item={selectedItem}
        onClose={handleClose}
        onPrev={items.length > 1 ? handlePrev : undefined}
        onNext={items.length > 1 ? handleNext : undefined}
        onDelete={handleDelete}
      />
    </div>
  );
}
