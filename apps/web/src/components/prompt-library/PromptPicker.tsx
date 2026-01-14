'use client';

import type { IPromptLibraryItem } from '@content-workflow/types';
import { BookMarked, ChevronDown, Sparkles } from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { usePromptLibraryStore } from '@/store/promptLibraryStore';

interface PromptPickerProps {
  onSelect: (item: IPromptLibraryItem) => void;
}

function PromptPickerComponent({ onSelect }: PromptPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { items, featuredItems, isLoading, loadItems, loadFeatured, recordItemUsage } =
    usePromptLibraryStore();

  // Load items when dropdown opens
  useEffect(() => {
    if (isOpen) {
      const controller = new AbortController();
      Promise.all([loadItems({ limit: 10 }, controller.signal), loadFeatured(controller.signal)]);
      return () => controller.abort();
    }
  }, [isOpen, loadItems, loadFeatured]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    async (item: IPromptLibraryItem) => {
      await recordItemUsage(item._id);
      onSelect(item);
      setIsOpen(false);
    },
    [recordItemUsage, onSelect]
  );

  // Combine recent and featured, remove duplicates
  const displayItems = [
    ...items.slice(0, 5),
    ...featuredItems.filter((f) => !items.some((i) => i._id === f._id)),
  ].slice(0, 8);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 hover:bg-[var(--secondary)] rounded transition flex items-center gap-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        title="Load from library"
      >
        <BookMarked className="w-3.5 h-3.5" />
        <ChevronDown className="w-3 h-3" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-64 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="px-3 py-2 border-b border-[var(--border)] text-xs font-medium text-[var(--muted-foreground)]">
            Load from Library
          </div>

          {/* Content */}
          <div className="max-h-64 overflow-auto">
            {isLoading ? (
              <div className="p-4 flex items-center justify-center">
                <div className="animate-spin w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
              </div>
            ) : displayItems.length === 0 ? (
              <div className="p-4 text-center text-sm text-[var(--muted-foreground)]">
                No saved prompts yet
              </div>
            ) : (
              <div className="py-1">
                {displayItems.map((item) => (
                  <button
                    key={item._id}
                    onClick={() => handleSelect(item)}
                    className="w-full px-3 py-2 text-left hover:bg-[var(--secondary)] transition"
                  >
                    <div className="flex items-start gap-2">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt=""
                          className="w-8 h-8 rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-[var(--secondary)] flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-4 h-4 text-[var(--muted-foreground)]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{item.name}</div>
                        <div className="text-xs text-[var(--muted-foreground)] truncate">
                          {item.promptText}
                        </div>
                      </div>
                      {item.isFeatured && (
                        <span className="text-[9px] px-1 py-0.5 bg-amber-500/10 text-amber-500 rounded flex-shrink-0">
                          Featured
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export const PromptPicker = memo(PromptPickerComponent);
