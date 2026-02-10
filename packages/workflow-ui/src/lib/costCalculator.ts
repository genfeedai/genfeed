import type { WorkflowNode } from '@genfeedai/types';
import {
  DEFAULT_VIDEO_DURATION,
  IMAGE_NODE_TYPES,
  LUMA_NODE_TYPES,
  PRICING,
  TOPAZ_NODE_TYPES,
  VIDEO_NODE_TYPES,
} from '@genfeedai/core';

// =============================================================================
// TYPES
// =============================================================================

export interface NodeCostEstimate {
  nodeId: string;
  nodeLabel: string;
  nodeType: string;
  model: string;
  unit: string;
  cost: number;
}

export interface CostBreakdown {
  total: number;
  nodes: NodeCostEstimate[];
}

// =============================================================================
// HELPERS
// =============================================================================

function isNodeType(type: string, list: readonly string[]): boolean {
  return list.includes(type);
}

function getDataField<T>(data: Record<string, unknown>, key: string, fallback: T): T {
  return (data[key] as T) ?? fallback;
}

// =============================================================================
// COST CALCULATOR
// =============================================================================

export function calculateWorkflowCost(nodes: WorkflowNode[]): CostBreakdown {
  const estimates: NodeCostEstimate[] = [];

  for (const node of nodes) {
    const data = node.data as Record<string, unknown>;
    const type = node.type ?? '';
    const label = getDataField(data, 'label', type);

    // Image generation
    if (isNodeType(type, IMAGE_NODE_TYPES)) {
      const model = getDataField(data, 'model', 'nano-banana');
      const resolution = getDataField(data, 'resolution', '2K');
      let cost = 0;

      const priceEntry = PRICING[model as keyof typeof PRICING];
      if (typeof priceEntry === 'number') {
        cost = priceEntry;
      } else if (priceEntry && typeof priceEntry === 'object' && !Array.isArray(priceEntry)) {
        cost =
          (priceEntry as Record<string, number>)[resolution] ??
          Object.values(priceEntry as Record<string, number>)[0] ??
          0;
      }

      estimates.push({
        nodeId: node.id,
        nodeLabel: label,
        nodeType: type,
        model,
        unit: 'per image',
        cost,
      });
      continue;
    }

    // Video generation
    if (isNodeType(type, VIDEO_NODE_TYPES)) {
      const model = getDataField(data, 'model', 'veo-3.1-fast');
      const duration = getDataField(data, 'duration', DEFAULT_VIDEO_DURATION);
      const generateAudio = getDataField(data, 'generateAudio', true);

      const priceEntry = PRICING[model as keyof typeof PRICING];
      let perSecond = 0;

      if (priceEntry && typeof priceEntry === 'object' && !Array.isArray(priceEntry)) {
        const entry = priceEntry as { withAudio?: number; withoutAudio?: number };
        perSecond = generateAudio ? (entry.withAudio ?? 0) : (entry.withoutAudio ?? 0);
      }

      estimates.push({
        nodeId: node.id,
        nodeLabel: label,
        nodeType: type,
        model,
        unit: `${duration}s video`,
        cost: perSecond * duration,
      });
      continue;
    }

    // Luma reframe
    if (isNodeType(type, LUMA_NODE_TYPES)) {
      const model = getDataField(data, 'model', 'photon-flash-1');
      const inputType = getDataField<string>(data, 'inputType', 'image');

      let cost = 0;
      if (inputType === 'video') {
        cost = (PRICING['luma-reframe-video'] as number) * DEFAULT_VIDEO_DURATION;
      } else {
        const imageEntry = PRICING['luma-reframe-image'];
        cost = (imageEntry as Record<string, number>)[model] ?? 0.01;
      }

      estimates.push({
        nodeId: node.id,
        nodeLabel: label,
        nodeType: type,
        model,
        unit: inputType === 'video' ? 'per video' : 'per image',
        cost,
      });
      continue;
    }

    // Topaz upscale
    if (isNodeType(type, TOPAZ_NODE_TYPES)) {
      const inputType = getDataField<string>(data, 'inputType', 'image');

      if (inputType === 'video') {
        const resolution = getDataField(data, 'targetResolution', '1080p');
        const fps = getDataField(data, 'targetFps', 30);
        const key = `${resolution}-${fps}` as keyof (typeof PRICING)['topaz-video-upscale'];
        const pricePerChunk = PRICING['topaz-video-upscale'][key] ?? 0.101;
        const duration = DEFAULT_VIDEO_DURATION;
        const chunks = Math.ceil(duration / 5);

        estimates.push({
          nodeId: node.id,
          nodeLabel: label,
          nodeType: type,
          model: 'topaz-video',
          unit: `${duration}s video`,
          cost: pricePerChunk * chunks,
        });
      } else {
        // Image upscale - default to ~1MP tier
        const tier =
          PRICING['topaz-image-upscale'].find((t) => 1 <= t.maxMP) ??
          PRICING['topaz-image-upscale'][0];

        estimates.push({
          nodeId: node.id,
          nodeLabel: label,
          nodeType: type,
          model: getDataField(data, 'model', 'topaz-standard-v2'),
          unit: 'per image',
          cost: tier.price,
        });
      }
      continue;
    }

    // LLM
    if (type === 'llm') {
      const maxTokens = getDataField(data, 'maxTokens', 1024);
      // Rough estimate: input tokens ~= 2x maxTokens (system prompt + input)
      const estimatedTokens = maxTokens * 3;

      estimates.push({
        nodeId: node.id,
        nodeLabel: label,
        nodeType: type,
        model: getDataField(data, 'model', 'llama'),
        unit: `~${estimatedTokens} tokens`,
        cost: estimatedTokens * PRICING.llama,
      });
    }
  }

  return {
    total: estimates.reduce((sum, e) => sum + e.cost, 0),
    nodes: estimates,
  };
}

export function formatCost(amount: number): string {
  if (amount === 0) return '$0.00';
  if (amount < 0.01) return `$${amount.toFixed(4)}`;
  return `$${amount.toFixed(2)}`;
}
