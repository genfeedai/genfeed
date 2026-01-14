'use client';

import {
  CATEGORY_LABELS,
  type IPromptLibraryItem,
  type PromptCategory,
} from '@content-workflow/types';
import { BookMarked, Copy, MoreVertical, Plus, Search, Sparkles, Trash2, X } from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { usePromptLibraryStore } from '@/store/promptLibraryStore';
import { useUIStore } from '@/store/uiStore';
import { CreatePromptModal } from './CreatePromptModal';

interface PromptCardProps {
  item: IPromptLibraryItem;
  onSelect: (item: IPromptLibraryItem) => void;
  onEdit: (item: IPromptLibraryItem) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

function PromptCard({ item, onSelect, onEdit, onDuplicate, onDelete }: PromptCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      className="group relative p-4 bg-[var(--background)] border border-[var(--border)] rounded-lg hover:border-[var(--primary)] transition cursor-pointer"
      onClick={() => onSelect(item)}
    >
      {/* Thumbnail or placeholder */}
      {item.thumbnail ? (
        <img
          src={item.thumbnail}
          alt={item.name}
          className="w-full h-24 object-cover rounded mb-3"
        />
      ) : (
        <div className="w-full h-24 bg-[var(--secondary)] rounded mb-3 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-[var(--muted-foreground)]" />
        </div>
      )}

      {/* Content */}
      <h3 className="font-medium text-sm text-[var(--foreground)] truncate">{item.name}</h3>
      <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 mt-1">{item.promptText}</p>

      {/* Category badge */}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-[10px] px-1.5 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded">
          {CATEGORY_LABELS[item.category]}
        </span>
        {item.isFeatured && (
          <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded">
            Featured
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--muted-foreground)]">
        <span>{item.useCount} uses</span>
      </div>

      {/* Actions menu */}
      <div className="absolute top-2 right-2" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-[var(--secondary)] rounded transition"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-full mt-1 w-32 py-1 bg-[var(--card)] border border-[var(--border)] rounded shadow-lg z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
                setShowMenu(false);
              }}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-[var(--secondary)] flex items-center gap-2"
            >
              <BookMarked className="w-3 h-3" /> Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(item._id);
                setShowMenu(false);
              }}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-[var(--secondary)] flex items-center gap-2"
            >
              <Copy className="w-3 h-3" /> Duplicate
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item._id);
                setShowMenu(false);
              }}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-[var(--secondary)] text-red-400 flex items-center gap-2"
            >
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PromptLibraryModalComponent() {
  const { activeModal, closeModal } = useUIStore();
  const {
    items,
    isLoading,
    searchQuery,
    categoryFilter,
    isCreateModalOpen,
    setSearchQuery,
    setCategoryFilter,
    loadItems,
    openCreateModal,
    duplicateItem,
    deleteItem,
  } = usePromptLibraryStore();

  const isOpen = activeModal === 'promptLibrary';

  // Load items when modal opens
  useEffect(() => {
    if (isOpen) {
      const controller = new AbortController();
      loadItems(undefined, controller.signal);
      return () => controller.abort();
    }
  }, [isOpen, loadItems]);

  const handleSelect = useCallback(
    (_item: IPromptLibraryItem) => {
      // Just close modal for now - integration will handle applying to node
      closeModal();
    },
    [closeModal]
  );

  const handleEdit = useCallback(
    (item: IPromptLibraryItem) => {
      openCreateModal(item);
    },
    [openCreateModal]
  );

  const handleDuplicate = useCallback(
    async (id: string) => {
      await duplicateItem(id);
    },
    [duplicateItem]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (confirm('Are you sure you want to delete this prompt?')) {
        await deleteItem(id);
      }
    },
    [deleteItem]
  );

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={closeModal} />
      <div className="fixed inset-4 md:inset-10 bg-[var(--card)] rounded-lg shadow-xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <BookMarked className="w-5 h-5 text-[var(--primary)]" />
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Prompt Library</h2>
          </div>
          <button
            onClick={closeModal}
            className="p-2 hover:bg-[var(--secondary)] rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompts..."
              className="w-full pl-10 pr-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>

          {/* Category filter */}
          <select
            value={categoryFilter ?? ''}
            onChange={(e) =>
              setCategoryFilter(e.target.value ? (e.target.value as PromptCategory) : null)
            }
            className="px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          >
            <option value="">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          {/* Create button */}
          <button
            onClick={() => openCreateModal()}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded text-sm font-medium flex items-center gap-2 hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" />
            New Prompt
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--muted-foreground)]">
              <BookMarked className="w-12 h-12 mb-4" />
              <p className="text-lg font-medium">No prompts yet</p>
              <p className="text-sm">Create your first prompt to get started</p>
              <button
                onClick={() => openCreateModal()}
                className="mt-4 px-4 py-2 bg-[var(--primary)] text-white rounded text-sm font-medium flex items-center gap-2 hover:opacity-90 transition"
              >
                <Plus className="w-4 h-4" />
                Create Prompt
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {items.map((item) => (
                <PromptCard
                  key={item._id}
                  item={item}
                  onSelect={handleSelect}
                  onEdit={handleEdit}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isCreateModalOpen && <CreatePromptModal />}
    </>
  );
}

export const PromptLibraryModal = memo(PromptLibraryModalComponent);
