import { Injectable } from '@nestjs/common';
import type {
  CostBreakdownItem,
  CostEstimate,
  JobCostBreakdown,
  WorkflowNodeForCost,
} from './interfaces/cost.interface';

// Model pricing - Source: replicate.com/pricing (Jan 2026)
// Image models: per output image (flat rate)
// Video models: per second of output video
// LLM models: per token
const PRICING = {
  // Image generation (per image)
  'nano-banana': 0.039,
  'nano-banana-pro': {
    '1K': 0.15,
    '2K': 0.15,
    '4K': 0.3,
  },
  // Legacy aliases
  'imagen-4-fast': 0.039,
  'imagen-4': 0.15,
  // Video generation (per second)
  'veo-3.1-fast': { withAudio: 0.15, withoutAudio: 0.1 },
  'veo-3.1': { withAudio: 0.4, withoutAudio: 0.2 },
  // Legacy aliases
  'veo-3-fast': { withAudio: 0.15, withoutAudio: 0.1 },
  'veo-3': { withAudio: 0.4, withoutAudio: 0.2 },
  // LLM (per token, derived from $9.50/million)
  llama: 0.0000095,
} as const;

type ImageModel = 'nano-banana' | 'nano-banana-pro' | 'imagen-4-fast' | 'imagen-4';
type VideoModel = 'veo-3.1-fast' | 'veo-3.1' | 'veo-3-fast' | 'veo-3';

// Node types that incur costs
const IMAGE_NODE_TYPES = ['imageGen', 'image-gen', 'ImageGenNode'];
const VIDEO_NODE_TYPES = ['videoGen', 'video-gen', 'VideoGenNode'];

// Default video duration (seconds)
const DEFAULT_VIDEO_DURATION = 8;

@Injectable()
export class CostCalculatorService {
  /**
   * Calculate estimated cost for a workflow before execution
   */
  calculateWorkflowEstimate(nodes: WorkflowNodeForCost[]): CostEstimate {
    const breakdown: CostBreakdownItem[] = [];
    let total = 0;

    for (const node of nodes) {
      const cost = this.calculateNodeCost(node);
      if (cost > 0) {
        const item: CostBreakdownItem = {
          nodeId: node.id,
          nodeType: node.type,
          model: node.data.model ?? 'unknown',
          unitPrice: this.getUnitPrice(node),
          quantity: 1,
          subtotal: cost,
        };

        // Add video-specific details
        if (this.isVideoNode(node.type)) {
          item.duration = node.data.duration ?? DEFAULT_VIDEO_DURATION;
          item.withAudio = node.data.generateAudio ?? true;
        }

        breakdown.push(item);
        total += cost;
      }
    }

    return { total, breakdown };
  }

  /**
   * Calculate cost for a single workflow node
   */
  private calculateNodeCost(node: WorkflowNodeForCost): number {
    const { type, data } = node;
    const model = data.model;

    if (!model) {
      return 0;
    }

    // Image generation nodes
    if (this.isImageNode(type)) {
      return this.calculateImageCost(model, data.resolution);
    }

    // Video generation nodes
    if (this.isVideoNode(type)) {
      const duration = data.duration ?? DEFAULT_VIDEO_DURATION;
      const withAudio = data.generateAudio ?? true;
      return this.calculateVideoCost(model, duration, withAudio);
    }

    return 0;
  }

  /**
   * Calculate actual cost for a completed prediction
   */
  calculatePredictionCost(
    model: string,
    duration?: number,
    withAudio?: boolean,
    resolution?: string
  ): number {
    // Image models
    if (this.isImageModel(model)) {
      return this.calculateImageCost(model, resolution);
    }

    // Video models
    if (this.isVideoModel(model)) {
      return this.calculateVideoCost(model, duration ?? DEFAULT_VIDEO_DURATION, withAudio ?? true);
    }

    return 0;
  }

  /**
   * Calculate image generation cost
   */
  calculateImageCost(model: string, resolution?: string): number {
    // nano-banana (flat rate)
    if (model === 'nano-banana' || model === 'imagen-4-fast') {
      return PRICING['nano-banana'];
    }

    // nano-banana-pro (resolution-based)
    if (model === 'nano-banana-pro' || model === 'imagen-4') {
      const pricing = PRICING['nano-banana-pro'];
      const resKey = this.normalizeResolution(resolution);
      return pricing[resKey as keyof typeof pricing] ?? pricing['2K'];
    }

    return 0;
  }

  /**
   * Calculate video generation cost
   */
  calculateVideoCost(model: string, duration: number, withAudio: boolean): number {
    const pricing = PRICING[model as VideoModel];
    if (!pricing || typeof pricing === 'number') {
      return 0;
    }

    const perSecond = withAudio ? pricing.withAudio : pricing.withoutAudio;
    return perSecond * duration;
  }

  /**
   * Check if model is an image model
   */
  private isImageModel(model: string): model is ImageModel {
    return ['nano-banana', 'nano-banana-pro', 'imagen-4-fast', 'imagen-4'].includes(model);
  }

  /**
   * Check if model is a video model
   */
  private isVideoModel(model: string): model is VideoModel {
    return ['veo-3.1-fast', 'veo-3.1', 'veo-3-fast', 'veo-3'].includes(model);
  }

  /**
   * Normalize resolution string to pricing key
   */
  private normalizeResolution(resolution?: string): string {
    if (!resolution) return '2K';
    const upper = resolution.toUpperCase();
    if (upper.includes('4K') || upper.includes('2160')) return '4K';
    if (upper.includes('1K') || upper.includes('720')) return '1K';
    return '2K';
  }

  /**
   * Calculate LLM cost based on token count
   */
  calculateLLMCost(inputTokens: number, outputTokens: number): number {
    return (inputTokens + outputTokens) * PRICING.llama;
  }

  /**
   * Get unit price for a node (for display purposes)
   */
  private getUnitPrice(node: WorkflowNodeForCost): number {
    const model = node.data.model;
    if (!model) {
      return 0;
    }

    // Image models - flat rate
    if (model === 'nano-banana' || model === 'imagen-4-fast') {
      return PRICING['nano-banana'];
    }

    // Image models - resolution-based
    if (model === 'nano-banana-pro' || model === 'imagen-4') {
      const pricing = PRICING['nano-banana-pro'];
      const resKey = this.normalizeResolution(node.data.resolution);
      return pricing[resKey as keyof typeof pricing] ?? pricing['2K'];
    }

    // Video models return per-second price
    if (this.isVideoModel(model)) {
      const pricing = PRICING[model as VideoModel];
      if (pricing && typeof pricing !== 'number') {
        const withAudio = node.data.generateAudio ?? true;
        return withAudio ? pricing.withAudio : pricing.withoutAudio;
      }
    }

    return 0;
  }

  /**
   * Build cost breakdown object for storing on job
   */
  buildJobCostBreakdown(
    model: string,
    cost: number,
    duration?: number,
    withAudio?: boolean,
    resolution?: string
  ): JobCostBreakdown {
    return {
      model,
      resolution,
      duration,
      withAudio,
      unitPrice: cost,
      quantity: 1,
    };
  }

  /**
   * Check if node type is an image generation node
   */
  private isImageNode(type: string): boolean {
    return IMAGE_NODE_TYPES.includes(type);
  }

  /**
   * Check if node type is a video generation node
   */
  private isVideoNode(type: string): boolean {
    return VIDEO_NODE_TYPES.includes(type);
  }
}
