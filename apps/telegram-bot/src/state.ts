/**
 * Session state machine for per-chat conversation tracking.
 * States: idle → selecting → collecting → confirming → running → idle
 */

export type ChatState = 'idle' | 'selecting' | 'collecting' | 'confirming' | 'running';

export const IMAGE_MODELS = [
  'nano-banana-pro',
  'flux-schnell',
  'flux-2-pro',
  'imagen-3-fast',
  'imagen-4-fast',
] as const;

export const VIDEO_MODELS = [
  'veo-2',
  'veo-3',
  'veo-3-fast',
  'veo-3.1',
  'veo-3.1-fast',
  'kling-v2.1',
  'wan-2.2-i2v-fast',
] as const;

export interface WorkflowInput {
  nodeId: string;
  nodeType: string;
  label: string;
  inputType: 'image' | 'text' | 'audio' | 'video';
  required: boolean;
  defaultValue?: string;
}

export interface WorkflowJson {
  version: number;
  name: string;
  description: string;
  nodes: Array<{
    id: string;
    type: string;
    data: Record<string, unknown>;
    position?: { x: number; y: number };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle: string;
    targetHandle: string;
  }>;
}

export interface UserSettings {
  imageModel: string;
  videoModel: string;
}

export interface Session {
  state: ChatState;
  workflowId?: string;
  workflowName?: string;
  workflow?: WorkflowJson;
  requiredInputs: WorkflowInput[];
  currentInputIndex: number;
  collectedInputs: Map<string, string>;
  startedAt: number;
  statusMessageId?: number;
}

/** In-memory session store keyed by chat ID */
const sessions = new Map<number, Session>();

/** In-memory user settings store keyed by chat ID */
const userSettings = new Map<number, UserSettings>();

export function getSession(chatId: number): Session | undefined {
  return sessions.get(chatId);
}

export function getOrCreateSession(chatId: number): Session {
  let s = sessions.get(chatId);
  if (!s) {
    s = createIdleSession();
    sessions.set(chatId, s);
  }
  return s;
}

export function setSession(chatId: number, session: Session): void {
  sessions.set(chatId, session);
}

export function deleteSession(chatId: number): void {
  sessions.delete(chatId);
}

export function createIdleSession(): Session {
  return {
    state: 'idle',
    requiredInputs: [],
    currentInputIndex: 0,
    collectedInputs: new Map(),
    startedAt: Date.now(),
  };
}

export function activeSessionCount(): number {
  return sessions.size;
}

export function getUserSettings(chatId: number): UserSettings {
  let settings = userSettings.get(chatId);
  if (!settings) {
    settings = {
      imageModel: 'nano-banana-pro', // Default image model
      videoModel: 'veo-3.1-fast', // Default video model
    };
    userSettings.set(chatId, settings);
  }
  return settings;
}

export function setUserSettings(chatId: number, settings: UserSettings): void {
  userSettings.set(chatId, settings);
}

export function updateUserImageModel(chatId: number, model: string): void {
  const settings = getUserSettings(chatId);
  settings.imageModel = model;
  setUserSettings(chatId, settings);
}

export function updateUserVideoModel(chatId: number, model: string): void {
  const settings = getUserSettings(chatId);
  settings.videoModel = model;
  setUserSettings(chatId, settings);
}

/**
 * Extract required user inputs from a workflow JSON.
 */
export function extractInputs(workflow: WorkflowJson): WorkflowInput[] {
  const inputs: WorkflowInput[] = [];
  for (const node of workflow.nodes) {
    switch (node.type) {
      case 'imageInput':
        inputs.push({
          nodeId: node.id,
          nodeType: node.type,
          label: (node.data.label as string) || 'Image',
          inputType: 'image',
          required: true,
        });
        break;
      case 'prompt':
        inputs.push({
          nodeId: node.id,
          nodeType: node.type,
          label: (node.data.label as string) || 'Prompt',
          inputType: 'text',
          required: true,
          defaultValue: node.data.prompt as string | undefined,
        });
        break;
      case 'audioInput':
        inputs.push({
          nodeId: node.id,
          nodeType: node.type,
          label: (node.data.label as string) || 'Audio',
          inputType: 'audio',
          required: true,
        });
        break;
      case 'videoInput':
        inputs.push({
          nodeId: node.id,
          nodeType: node.type,
          label: (node.data.label as string) || 'Video',
          inputType: 'video',
          required: true,
        });
        break;
    }
  }
  return inputs;
}
