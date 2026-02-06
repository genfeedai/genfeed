'use client';

import { useUIStore } from '../stores/uiStore';
import { Keyboard, Search, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

interface ShortcutItem {
  keys: string;
  description: string;
  category: string;
}

const SHORTCUTS: ShortcutItem[] = [
  // Navigation
  { keys: 'Scroll', description: 'Pan canvas', category: 'Navigation' },
  { keys: 'Ctrl + Scroll', description: 'Zoom in/out', category: 'Navigation' },
  { keys: 'F', description: 'Fit view to selection (or all)', category: 'Navigation' },
  { keys: 'M', description: 'Toggle sidebar', category: 'Navigation' },

  // Selection
  { keys: 'Click', description: 'Select node', category: 'Selection' },
  { keys: 'Shift + Click', description: 'Add to selection', category: 'Selection' },
  { keys: 'Drag', description: 'Marquee select', category: 'Selection' },
  { keys: 'Ctrl + A', description: 'Select all nodes', category: 'Selection' },
  { keys: 'Ctrl + F', description: 'Search nodes', category: 'Selection' },

  // Editing
  { keys: 'Ctrl + Z', description: 'Undo', category: 'Editing' },
  { keys: 'Ctrl + Shift + Z', description: 'Redo', category: 'Editing' },
  { keys: 'Ctrl + C', description: 'Copy', category: 'Editing' },
  { keys: 'Ctrl + X', description: 'Cut', category: 'Editing' },
  { keys: 'Ctrl + V', description: 'Paste', category: 'Editing' },
  { keys: 'Ctrl + D', description: 'Duplicate', category: 'Editing' },
  { keys: 'Delete / Backspace', description: 'Delete selected', category: 'Editing' },

  // Nodes
  { keys: 'Shift + I', description: 'Add Image Gen node', category: 'Nodes' },
  { keys: 'Shift + V', description: 'Add Video Gen node', category: 'Nodes' },
  { keys: 'Shift + P', description: 'Add Prompt node', category: 'Nodes' },
  { keys: 'Shift + L', description: 'Add LLM node', category: 'Nodes' },

  // Organization
  { keys: 'L', description: 'Toggle lock on selected', category: 'Organization' },
  { keys: 'Ctrl + G', description: 'Group selected nodes', category: 'Organization' },
  { keys: 'Ctrl + Shift + G', description: 'Ungroup', category: 'Organization' },
  { keys: 'Ctrl + Shift + L', description: 'Unlock all nodes', category: 'Organization' },

  // Help
  { keys: '?', description: 'Show this help', category: 'Help' },
];

const CATEGORIES = ['Navigation', 'Selection', 'Editing', 'Nodes', 'Organization', 'Help'];

export function ShortcutHelpModal() {
  const { activeModal, closeModal } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');
  const backdropRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isOpen = activeModal === 'shortcutHelp';

  const filteredShortcuts = useMemo(() => {
    if (!searchQuery.trim()) return SHORTCUTS;

    const query = searchQuery.toLowerCase();
    return SHORTCUTS.filter(
      (shortcut) =>
        shortcut.keys.toLowerCase().includes(query) ||
        shortcut.description.toLowerCase().includes(query) ||
        shortcut.category.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const groupedShortcuts = useMemo(() => {
    const grouped: Record<string, ShortcutItem[]> = {};
    for (const category of CATEGORIES) {
      const items = filteredShortcuts.filter((s) => s.category === category);
      if (items.length > 0) {
        grouped[category] = items;
      }
    }
    return grouped;
  }, [filteredShortcuts]);

  const handleClose = () => {
    closeModal();
    setSearchQuery('');
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div
        className="bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-xl w-full max-w-2xl"
        role="dialog"
        aria-label="Keyboard Shortcuts"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-[var(--muted-foreground)]" />
            <span className="text-sm font-medium">Keyboard Shortcuts</span>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-[var(--secondary)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search shortcuts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-md outline-none focus:ring-1 focus:ring-[var(--ring)]"
              autoFocus
            />
          </div>

          <div className="max-h-[60vh] overflow-y-auto space-y-6 pr-2">
            {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">{category}</h3>
                <div className="space-y-1">
                  {shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.keys}
                      className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-secondary/50"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <kbd className="px-2 py-1 text-xs font-mono bg-secondary rounded border border-border">
                        {shortcut.keys}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {filteredShortcuts.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No shortcuts found for &quot;{searchQuery}&quot;
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
