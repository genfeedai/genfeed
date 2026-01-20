import type { HandleType, NodeCategory, NodeStatus } from '@genfeedai/types';

/**
 * Node definition for custom nodes
 */
export interface CustomNodeDefinition<TData extends CustomNodeData = CustomNodeData> {
  /** Unique identifier for the node type (e.g., 'myOrg/customNode') */
  type: string;

  /** Human-readable name displayed in the UI */
  name: string;

  /** Short description of what the node does */
  description: string;

  /** Category for organizing in the node palette */
  category: NodeCategory | 'custom';

  /** Icon name or component */
  icon?: string;

  /** Input handles (data the node receives) */
  inputs: HandleDefinition[];

  /** Output handles (data the node produces) */
  outputs: HandleDefinition[];

  /** Default data values when creating a new instance */
  defaultData: Partial<TData>;

  /** Configuration schema for the node's settings panel */
  configSchema?: ConfigField[];

  /** Processing function executed when the node runs */
  process: NodeProcessor<TData>;

  /** Optional validation function */
  validate?: NodeValidator<TData>;

  /** Optional cost estimator for workflow cost calculations */
  estimateCost?: CostEstimator<TData>;
}

/**
 * Handle definition for node inputs/outputs
 */
export interface HandleDefinition {
  /** Unique ID within the node */
  id: string;

  /** Data type this handle accepts/produces */
  type: HandleType;

  /** Human-readable label */
  label: string;

  /** Can accept multiple connections (for inputs) */
  multiple?: boolean;

  /** Is this handle required? */
  required?: boolean;
}

/**
 * Base data interface for custom nodes
 */
export interface CustomNodeData extends Record<string, unknown> {
  label: string;
  status: NodeStatus;
  error?: string;
  progress?: number;
}

/**
 * Configuration field for node settings
 */
export interface ConfigField {
  /** Field key in node data */
  key: string;

  /** Field type */
  type: 'text' | 'number' | 'select' | 'checkbox' | 'slider' | 'textarea' | 'color';

  /** Human-readable label */
  label: string;

  /** Optional description/help text */
  description?: string;

  /** Default value */
  defaultValue?: unknown;

  /** Is this field required? */
  required?: boolean;

  /** Options for select fields */
  options?: Array<{ value: string; label: string }>;

  /** Min/max for number/slider fields */
  min?: number;
  max?: number;
  step?: number;

  /** Placeholder text */
  placeholder?: string;

  /** Conditional display based on other field values */
  showWhen?: Record<string, unknown>;
}

/**
 * Context provided to the node processor
 */
export interface ProcessorContext {
  /** Node instance ID */
  nodeId: string;

  /** Current execution ID */
  executionId: string;

  /** Workflow ID */
  workflowId: string;

  /** Input values resolved from connected nodes */
  inputs: Record<string, unknown>;

  /** Update progress (0-100) */
  updateProgress: (percent: number, message?: string) => Promise<void>;

  /** Log a message */
  log: (message: string) => Promise<void>;

  /** Abort signal for cancellation */
  signal: AbortSignal;
}

/**
 * Result from node processing
 */
export interface ProcessorResult {
  /** Output values keyed by output handle ID */
  outputs: Record<string, unknown>;

  /** Optional metadata about the processing */
  metadata?: Record<string, unknown>;
}

/**
 * Node processor function type
 */
export type NodeProcessor<TData extends CustomNodeData = CustomNodeData> = (
  data: TData,
  context: ProcessorContext
) => Promise<ProcessorResult>;

/**
 * Node validator function type
 */
export type NodeValidator<TData extends CustomNodeData = CustomNodeData> = (
  data: TData,
  inputs: Record<string, unknown>
) => ValidationResult;

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

/**
 * Cost estimator function type
 */
export type CostEstimator<TData extends CustomNodeData = CustomNodeData> = (
  data: TData
) => CostEstimate;

/**
 * Cost estimate for a node
 */
export interface CostEstimate {
  /** Estimated cost in USD */
  estimated: number;

  /** Cost breakdown by resource */
  breakdown?: Record<string, number>;

  /** Cost description */
  description?: string;
}

/**
 * Node instance with runtime data
 */
export interface NodeInstance<TData extends CustomNodeData = CustomNodeData> {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: TData;
}

/**
 * Plugin manifest for distributing node packages
 */
export interface PluginManifest {
  /** Plugin name (e.g., '@myorg/genfeed-plugin-foo') */
  name: string;

  /** Semantic version */
  version: string;

  /** Plugin description */
  description: string;

  /** Author information */
  author: string;

  /** License */
  license: string;

  /** Node types provided by this plugin */
  nodes: string[];

  /** Minimum Genfeed version required */
  minGenfeedVersion?: string;

  /** Plugin homepage/repo URL */
  homepage?: string;
}
