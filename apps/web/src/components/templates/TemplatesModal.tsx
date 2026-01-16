'use client';

import type { EdgeStyle } from '@genfeedai/types';
import { Image, Layers, Video, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { memo, useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { type TemplateData, templatesApi } from '@/lib/api/templates';
import { useUIStore } from '@/store/uiStore';
import { useWorkflowStore } from '@/store/workflowStore';

type CategoryFilter = 'all' | 'images' | 'video' | 'full-pipeline';

const CATEGORY_CONFIG: Record<CategoryFilter, { label: string; icon: typeof Image }> = {
  all: { label: 'All', icon: Layers },
  images: { label: 'Images', icon: Image },
  video: { label: 'Video', icon: Video },
  'full-pipeline': { label: 'Full Pipeline', icon: Layers },
};

function TemplateCard({
  template,
  onSelect,
}: {
  template: TemplateData;
  onSelect: (template: TemplateData) => void;
}) {
  const CategoryIcon = CATEGORY_CONFIG[template.category]?.icon ?? Layers;

  return (
    <button
      onClick={() => onSelect(template)}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary hover:shadow-lg"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full bg-secondary">
        {template.thumbnail ? (
          <img
            src={template.thumbnail}
            alt={template.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <CategoryIcon className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        {/* Category badge */}
        <span className="absolute left-2 top-2 rounded bg-background/80 px-2 py-0.5 text-xs font-medium backdrop-blur-sm">
          {CATEGORY_CONFIG[template.category]?.label}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3 text-left">
        <h3 className="font-medium text-foreground group-hover:text-primary">{template.name}</h3>
        {template.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{template.description}</p>
        )}
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{template.nodes.length} nodes</span>
          <span>•</span>
          <span>{template.edges.length} connections</span>
        </div>
      </div>
    </button>
  );
}

function TemplatesModalComponent() {
  const router = useRouter();
  const { activeModal, closeModal } = useUIStore();
  const { loadWorkflow, saveWorkflow } = useWorkflowStore();

  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  const isOpen = activeModal === 'templates';

  useEffect(() => {
    if (!isOpen) return;

    const controller = new AbortController();

    async function fetchTemplates() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await templatesApi.getAll(controller.signal);
        setTemplates(data);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError('Failed to load templates');
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchTemplates();
    return () => controller.abort();
  }, [isOpen]);

  const handleSelectTemplate = useCallback(
    async (template: TemplateData) => {
      setIsSaving(true);
      try {
        // Load the template data into the store
        const now = new Date().toISOString();
        loadWorkflow({
          version: 1,
          name: template.name,
          description: template.description ?? '',
          nodes: template.nodes,
          edges: template.edges,
          edgeStyle: (template.edgeStyle ?? 'bezier') as EdgeStyle,
          groups: [],
          createdAt: now,
          updatedAt: now,
        });

        // Save to create a new workflow from the template
        const savedWorkflow = await saveWorkflow();
        closeModal();

        // Navigate to the new workflow
        router.push(`/w/${savedWorkflow._id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create workflow');
      } finally {
        setIsSaving(false);
      }
    },
    [loadWorkflow, saveWorkflow, closeModal, router]
  );

  const filteredTemplates =
    categoryFilter === 'all' ? templates : templates.filter((t) => t.category === categoryFilter);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50" onClick={closeModal} />

      {/* Modal */}
      <div className="fixed inset-10 z-50 flex flex-col overflow-hidden rounded-lg bg-card shadow-xl md:inset-20 lg:inset-x-40">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">Templates</h2>
            <p className="text-sm text-muted-foreground">Start with a pre-built workflow</p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={closeModal}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1 border-b border-border px-6 py-2">
          {(Object.keys(CATEGORY_CONFIG) as CategoryFilter[]).map((category) => {
            const { label, icon: Icon } = CATEGORY_CONFIG[category];
            const isActive = categoryFilter === category;

            return (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 relative">
          {isSaving && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Creating workflow...</p>
              </div>
            </div>
          )}
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : error ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-destructive">
              <p>{error}</p>
              <Button variant="secondary" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No templates found
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template._id}
                  template={template}
                  onSelect={handleSelectTemplate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export const TemplatesModal = memo(TemplatesModalComponent);
