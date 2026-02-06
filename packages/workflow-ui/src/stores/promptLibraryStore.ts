import type { ICreatePrompt, IPrompt, IQueryPrompts, PromptCategory } from '@genfeedai/types';
import { create } from 'zustand';
import type { PromptLibraryService } from '../provider/types';

// =============================================================================
// Module-level API configuration
// =============================================================================

let _promptApi: PromptLibraryService | null = null;

/**
 * Configure the prompt library store with an API service.
 * Called by WorkflowUIProvider when a promptLibrary service is provided.
 *
 * This pattern is used because Zustand stores exist outside the React tree
 * and cannot use useContext directly.
 */
export function configurePromptLibrary(api: PromptLibraryService): void {
  _promptApi = api;
}

// =============================================================================
// Store
// =============================================================================

interface PromptLibraryStore {
  // State
  items: IPrompt[];
  featuredItems: IPrompt[];
  selectedItem: IPrompt | null;
  isLoading: boolean;
  error: string | null;

  // Filters
  searchQuery: string;
  categoryFilter: PromptCategory | null;

  // Quick picker state (for dropdown in nodes)
  isPickerOpen: boolean;

  // Modal state
  isCreateModalOpen: boolean;
  editingItem: IPrompt | null;

  // Actions - UI
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: PromptCategory | null) => void;
  setSelectedItem: (item: IPrompt | null) => void;
  openPicker: () => void;
  closePicker: () => void;
  openCreateModal: (editItem?: IPrompt) => void;
  closeCreateModal: () => void;

  // Actions - API
  loadItems: (query?: IQueryPrompts, signal?: AbortSignal) => Promise<void>;
  loadFeatured: (signal?: AbortSignal) => Promise<void>;
  createItem: (data: ICreatePrompt, signal?: AbortSignal) => Promise<IPrompt>;
  updateItem: (id: string, data: Partial<ICreatePrompt>, signal?: AbortSignal) => Promise<IPrompt>;
  deleteItem: (id: string, signal?: AbortSignal) => Promise<void>;
  duplicateItem: (id: string, signal?: AbortSignal) => Promise<IPrompt>;
  recordItemUsage: (id: string, signal?: AbortSignal) => Promise<IPrompt>;
}

export const usePromptLibraryStore = create<PromptLibraryStore>((set, get) => ({
  // Initial state
  items: [],
  featuredItems: [],
  selectedItem: null,
  isLoading: false,
  error: null,
  searchQuery: '',
  categoryFilter: null,
  isPickerOpen: false,
  isCreateModalOpen: false,
  editingItem: null,

  // UI Actions
  setSearchQuery: (query) => set({ searchQuery: query }),

  setCategoryFilter: (category) => set({ categoryFilter: category }),

  setSelectedItem: (item) => set({ selectedItem: item }),

  openPicker: () => set({ isPickerOpen: true }),

  closePicker: () => set({ isPickerOpen: false }),

  openCreateModal: (editItem) =>
    set({
      isCreateModalOpen: true,
      editingItem: editItem ?? null,
    }),

  closeCreateModal: () =>
    set({
      isCreateModalOpen: false,
      editingItem: null,
    }),

  // API Actions — all no-op if _promptApi is not configured
  loadItems: async (query, signal) => {
    if (!_promptApi) return;
    set({ isLoading: true, error: null });
    try {
      const { searchQuery, categoryFilter } = get();
      const finalQuery: IQueryPrompts = {
        ...query,
        search: query?.search ?? (searchQuery || undefined),
        category: query?.category ?? categoryFilter ?? undefined,
      };
      const items = await _promptApi.getAll(finalQuery, signal);
      set({ items, isLoading: false });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        set({ error: (error as Error).message, isLoading: false });
      }
    }
  },

  loadFeatured: async (signal) => {
    if (!_promptApi) return;
    try {
      const featuredItems = await _promptApi.getFeatured(10, signal);
      set({ featuredItems });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        // Silently fail for featured items
      }
    }
  },

  createItem: async (data, signal) => {
    if (!_promptApi) throw new Error('Prompt library not configured');
    set({ isLoading: true, error: null });
    try {
      const item = await _promptApi.create(data, signal);
      set((state) => ({
        items: [item, ...state.items],
        isLoading: false,
        isCreateModalOpen: false,
        editingItem: null,
      }));
      return item;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateItem: async (id, data, signal) => {
    if (!_promptApi) throw new Error('Prompt library not configured');
    set({ isLoading: true, error: null });
    try {
      const item = await _promptApi.update(id, data, signal);
      set((state) => ({
        items: state.items.map((i) => (i._id === id ? item : i)),
        selectedItem: state.selectedItem?._id === id ? item : state.selectedItem,
        isLoading: false,
        isCreateModalOpen: false,
        editingItem: null,
      }));
      return item;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteItem: async (id, signal) => {
    if (!_promptApi) throw new Error('Prompt library not configured');
    try {
      await _promptApi.delete(id, signal);
      set((state) => ({
        items: state.items.filter((i) => i._id !== id),
        selectedItem: state.selectedItem?._id === id ? null : state.selectedItem,
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  duplicateItem: async (id, signal) => {
    if (!_promptApi) throw new Error('Prompt library not configured');
    try {
      const item = await _promptApi.duplicate(id, signal);
      set((state) => ({
        items: [item, ...state.items],
      }));
      return item;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  recordItemUsage: async (id, signal) => {
    if (!_promptApi) throw new Error('Prompt library not configured');
    try {
      const item = await _promptApi.use(id, signal);
      set((state) => ({
        items: state.items.map((i) => (i._id === id ? item : i)),
        isPickerOpen: false,
      }));
      return item;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },
}));
