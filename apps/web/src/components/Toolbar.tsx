'use client';

import type { WorkflowFile } from '@content-workflow/types';
import {
  AlertCircle,
  BookMarked,
  FolderOpen,
  LayoutTemplate,
  PanelLeftClose,
  PanelRightClose,
  Play,
  Save,
  Square,
  X,
} from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';
import { useExecutionStore } from '@/store/executionStore';
import { useUIStore } from '@/store/uiStore';
import { useWorkflowStore } from '@/store/workflowStore';

/**
 * Validates workflow JSON structure before loading
 */
function isValidWorkflow(data: unknown): data is WorkflowFile {
  if (!data || typeof data !== 'object') return false;

  const workflow = data as Record<string, unknown>;

  // Check required fields
  if (typeof workflow.name !== 'string') return false;
  if (!Array.isArray(workflow.nodes)) return false;
  if (!Array.isArray(workflow.edges)) return false;

  // Validate nodes have required properties
  for (const node of workflow.nodes) {
    if (!node || typeof node !== 'object') return false;
    const n = node as Record<string, unknown>;
    if (typeof n.id !== 'string') return false;
    if (typeof n.type !== 'string') return false;
    if (!n.position || typeof n.position !== 'object') return false;
  }

  // Validate edges have required properties
  for (const edge of workflow.edges) {
    if (!edge || typeof edge !== 'object') return false;
    const e = edge as Record<string, unknown>;
    if (typeof e.id !== 'string') return false;
    if (typeof e.source !== 'string') return false;
    if (typeof e.target !== 'string') return false;
  }

  return true;
}

export function Toolbar() {
  const { workflowName, isDirty, exportWorkflow, clearWorkflow } = useWorkflowStore();
  const { isRunning, executeWorkflow, stopExecution, validationErrors, clearValidationErrors } =
    useExecutionStore();
  const { showPalette, showConfigPanel, togglePalette, toggleConfigPanel, openModal } =
    useUIStore();

  // Memoize deduped error messages
  const uniqueErrorMessages = useMemo(() => {
    if (!validationErrors?.errors.length) return [];
    return [...new Set(validationErrors.errors.map((e) => e.message))];
  }, [validationErrors]);

  const handleSave = useCallback(() => {
    const workflow = exportWorkflow();
    const blob = new Blob([JSON.stringify(workflow, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${workflow.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [exportWorkflow]);

  const handleLoad = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);

          if (!isValidWorkflow(data)) {
            logger.error('Invalid workflow file structure', null, { context: 'Toolbar' });
            return;
          }

          useWorkflowStore.getState().loadWorkflow(data);
        } catch (error) {
          logger.error('Failed to parse workflow file', error, { context: 'Toolbar' });
        }
      };
      reader.onerror = () => {
        logger.error('Failed to read workflow file', reader.error, { context: 'Toolbar' });
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  const handleRunStop = useCallback(() => {
    if (isRunning) {
      stopExecution();
    } else {
      executeWorkflow();
    }
  }, [isRunning, executeWorkflow, stopExecution]);

  return (
    <div className="flex h-14 items-center gap-4 border-b border-border bg-card px-4">
      {/* Logo / Title */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-chart-4">
          <span className="text-sm font-bold text-primary-foreground">CW</span>
        </div>
        <div>
          <h1 className="text-sm font-semibold text-foreground">
            {workflowName}
            {isDirty && <span className="text-muted-foreground">*</span>}
          </h1>
          <p className="text-xs text-muted-foreground">Content Workflow</p>
        </div>
      </div>

      {/* Divider */}
      <div className="h-8 w-px bg-border" />

      {/* Panel Toggles */}
      <div className="flex items-center gap-1">
        <Button
          variant={showPalette ? 'secondary' : 'ghost'}
          size="icon-sm"
          onClick={togglePalette}
          title="Toggle Node Palette"
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
        <Button
          variant={showConfigPanel ? 'secondary' : 'ghost'}
          size="icon-sm"
          onClick={toggleConfigPanel}
          title="Toggle Config Panel"
        >
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>

      {/* Divider */}
      <div className="h-8 w-px bg-border" />

      {/* File Operations */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" onClick={handleSave} title="Save Workflow">
          <Save className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={handleLoad} title="Load Workflow">
          <FolderOpen className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => openModal('templates')}
          title="Templates"
        >
          <LayoutTemplate className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => openModal('promptLibrary')}
          title="Prompt Library"
        >
          <BookMarked className="h-4 w-4" />
        </Button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Run Controls */}
      <Button variant={isRunning ? 'destructive' : 'default'} onClick={handleRunStop}>
        {isRunning ? (
          <>
            <Square className="h-4 w-4" />
            Stop
          </>
        ) : (
          <>
            <Play className="h-4 w-4 fill-current" />
            Run Workflow
          </>
        )}
      </Button>

      {/* New Workflow */}
      <Button variant="secondary" onClick={clearWorkflow}>
        New
      </Button>

      {/* Validation Errors Toast */}
      {uniqueErrorMessages.length > 0 && (
        <div className="fixed right-4 top-20 z-50 max-w-sm rounded-lg border border-destructive/30 bg-destructive/10 p-4 shadow-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div className="min-w-0 flex-1">
              <h4 className="mb-2 text-sm font-medium text-destructive">Cannot run workflow</h4>
              <ul className="space-y-1">
                {uniqueErrorMessages.slice(0, 5).map((message) => (
                  <li key={message} className="text-xs text-destructive/80">
                    {message}
                  </li>
                ))}
                {uniqueErrorMessages.length > 5 && (
                  <li className="text-xs text-destructive/60">
                    +{uniqueErrorMessages.length - 5} more errors
                  </li>
                )}
              </ul>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={clearValidationErrors}>
              <X className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
