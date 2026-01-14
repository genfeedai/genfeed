import type { Types } from 'mongoose';

/**
 * Base job data interface
 */
export interface BaseJobData {
  executionId: string;
  workflowId: string;
  timestamp: string;
}

/**
 * Workflow orchestrator job data
 */
export interface WorkflowJobData extends BaseJobData {
  // Workflow execution metadata
}

/**
 * Node execution job data
 */
export interface NodeJobData extends BaseJobData {
  nodeId: string;
  nodeType: string;
  nodeData: Record<string, unknown>;
  dependsOn?: string[]; // Node IDs this depends on
}

/**
 * Image generation job data
 */
export interface ImageJobData extends NodeJobData {
  nodeType: 'imageGen';
  nodeData: {
    model: 'nano-banana' | 'nano-banana-pro';
    prompt: string;
    imageInput?: string[];
    aspectRatio?: string;
    resolution?: string;
    outputFormat?: string;
  };
}

/**
 * Video generation job data
 */
export interface VideoJobData extends NodeJobData {
  nodeType: 'videoGen';
  nodeData: {
    model: 'veo-3.1-fast' | 'veo-3.1';
    prompt: string;
    image?: string;
    lastFrame?: string;
    referenceImages?: string[];
    duration?: number;
    aspectRatio?: string;
    resolution?: string;
    generateAudio?: boolean;
    negativePrompt?: string;
    seed?: number;
  };
}

/**
 * LLM generation job data
 */
export interface LLMJobData extends NodeJobData {
  nodeType: 'llm';
  nodeData: {
    prompt: string;
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
  };
}

/**
 * Job result interface
 */
export interface JobResult {
  success: boolean;
  output?: Record<string, unknown>;
  error?: string;
  cost?: number;
  predictTime?: number;
  predictionId?: string;
}

/**
 * Job progress update
 */
export interface JobProgress {
  percent: number;
  message?: string;
  timestamp: string;
}

/**
 * Dead letter queue job data
 */
export interface DLQJobData {
  originalJobId: string;
  originalQueue: string;
  data: BaseJobData | NodeJobData;
  error: string;
  stack?: string;
  attemptsMade: number;
  failedAt: string;
}

/**
 * Queue job document for MongoDB persistence
 */
export interface QueueJobDocument {
  _id: Types.ObjectId;
  bullJobId: string;
  queueName: string;
  executionId: Types.ObjectId;
  nodeId: string;
  status: string;
  data: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: string;
  attemptsMade: number;
  processedAt?: Date;
  finishedAt?: Date;
  failedReason?: string;
  logs: Array<{ timestamp: Date; message: string; level: string }>;
  movedToDlq: boolean;
  createdAt: Date;
  updatedAt: Date;
}
