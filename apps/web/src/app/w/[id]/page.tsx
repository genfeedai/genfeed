'use client';

import { ReactFlowProvider } from '@xyflow/react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AnnotationModal } from '@/components/annotation/AnnotationModal';
import { WorkflowCanvas } from '@/components/canvas/WorkflowCanvas';
import { AIGeneratorPanel } from '@/components/panels/AIGeneratorPanel';
import { ConfigPanel } from '@/components/panels/ConfigPanel';
import { NodePalette } from '@/components/panels/NodePalette';
import { PromptLibraryModal } from '@/components/prompt-library';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { Toolbar } from '@/components/Toolbar';
import { TemplatesModal } from '@/components/templates/TemplatesModal';
import { WelcomeModal } from '@/components/welcome/WelcomeModal';
import { GenerateWorkflowModal } from '@/components/workflow/GenerateWorkflowModal';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useSettingsStore } from '@/store/settingsStore';
import { useUIStore } from '@/store/uiStore';
import { useWorkflowStore } from '@/store/workflowStore';

export default function WorkflowEditorPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as string;

  const { showPalette, showConfigPanel, showAIGenerator, autoSaveEnabled, activeModal, openModal } =
    useUIStore();
  const hasSeenWelcome = useSettingsStore((s) => s.hasSeenWelcome);
  const {
    loadWorkflowById,
    createNewWorkflow,
    isLoading,
    workflowId: currentWorkflowId,
  } = useWorkflowStore();

  const [error, setError] = useState<string | null>(null);
  const initRef = useRef(false);

  // Initialize auto-save (triggers 5s after last change)
  useAutoSave(autoSaveEnabled);

  // Load workflow on mount
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const controller = new AbortController();

    async function init() {
      try {
        if (workflowId === 'new') {
          // Create new workflow and redirect to its ID
          const newId = await createNewWorkflow(controller.signal);
          router.replace(`/w/${newId}`);
        } else {
          // Load existing workflow
          await loadWorkflowById(workflowId, controller.signal);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to load workflow');
      }
    }

    init();

    return () => controller.abort();
  }, [workflowId, loadWorkflowById, createNewWorkflow, router]);

  // Show welcome modal on first visit
  useEffect(() => {
    if (!hasSeenWelcome && !activeModal && currentWorkflowId) {
      openModal('welcome');
    }
  }, [hasSeenWelcome, activeModal, openModal, currentWorkflowId]);

  // Loading state
  if (isLoading || (workflowId === 'new' && !currentWorkflowId)) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--muted-foreground)]">
            {workflowId === 'new' ? 'Creating workflow...' : 'Loading workflow...'}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
            <span className="text-red-500 text-2xl">!</span>
          </div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Failed to load workflow
          </h2>
          <p className="text-[var(--muted-foreground)]">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 text-sm bg-[var(--secondary)] text-[var(--foreground)] rounded-lg hover:opacity-90 transition"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => router.push('/w/new')}
              className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition"
            >
              Create New Workflow
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <main className="h-screen w-screen flex flex-col overflow-hidden bg-[var(--background)]">
        <Toolbar />
        <div className="flex-1 flex overflow-hidden">
          {showPalette && <NodePalette />}
          <div className="flex-1 relative">
            <WorkflowCanvas />
          </div>
          {showConfigPanel && <ConfigPanel />}
          {showAIGenerator && <AIGeneratorPanel />}
        </div>
      </main>
      <PromptLibraryModal />
      <SettingsModal />
      <AnnotationModal />
      <GenerateWorkflowModal />
      <TemplatesModal />
      {activeModal === 'welcome' && <WelcomeModal />}
    </ReactFlowProvider>
  );
}
