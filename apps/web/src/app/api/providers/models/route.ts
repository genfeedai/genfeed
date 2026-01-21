import type { ModelCapability, ProviderModel, ProviderType } from '@genfeedai/types';
import { type NextRequest, NextResponse } from 'next/server';

// Helper to check which providers have env credentials
function getConfiguredProviders(): Set<ProviderType> {
  const configured = new Set<ProviderType>();

  if (process.env.REPLICATE_API_TOKEN) {
    configured.add('replicate');
  }
  if (process.env.FAL_API_KEY) {
    configured.add('fal');
  }
  if (process.env.HF_API_TOKEN) {
    configured.add('huggingface');
  }

  return configured;
}

// Available models catalog
const MODELS_CATALOG: ProviderModel[] = [
  // Image generation models
  {
    id: 'google/nano-banana',
    displayName: 'Nano Banana',
    provider: 'replicate',
    capabilities: ['text-to-image'],
    description: 'Fast image generation model by Google',
    pricing: '$0.039/image',
  },
  {
    id: 'google/nano-banana-pro',
    displayName: 'Nano Banana Pro',
    provider: 'replicate',
    capabilities: ['text-to-image', 'image-to-image'],
    description: 'High-quality image generation with resolution control',
    pricing: '$0.15-0.30/image',
  },
  {
    id: 'black-forest-labs/flux-schnell',
    displayName: 'FLUX Schnell',
    provider: 'replicate',
    capabilities: ['text-to-image'],
    description: 'Fast text-to-image model from Black Forest Labs',
    pricing: '$0.003/image',
  },
  {
    id: 'black-forest-labs/flux-dev',
    displayName: 'FLUX Dev',
    provider: 'replicate',
    capabilities: ['text-to-image'],
    description: 'High-quality text-to-image for development',
    pricing: '$0.025/image',
  },
  {
    id: 'black-forest-labs/flux-1.1-pro',
    displayName: 'FLUX 1.1 Pro',
    provider: 'replicate',
    capabilities: ['text-to-image'],
    description: 'Professional-grade image generation',
    pricing: '$0.04/image',
  },
  {
    id: 'stability-ai/sdxl',
    displayName: 'Stable Diffusion XL',
    provider: 'replicate',
    capabilities: ['text-to-image', 'image-to-image'],
    description: 'High-resolution image synthesis',
    pricing: '$0.0023/image',
  },
  {
    id: 'bytedance/sdxl-lightning-4step',
    displayName: 'SDXL Lightning',
    provider: 'replicate',
    capabilities: ['text-to-image'],
    description: 'Ultra-fast SDXL variant in 4 steps',
    pricing: '$0.0015/image',
  },
  // Video generation models
  {
    id: 'google/veo-3.1-fast',
    displayName: 'Veo 3.1 Fast',
    provider: 'replicate',
    capabilities: ['text-to-video', 'image-to-video'],
    description: 'Fast video generation with optional audio',
    pricing: '$0.10-0.15/sec',
  },
  {
    id: 'google/veo-3.1',
    displayName: 'Veo 3.1',
    provider: 'replicate',
    capabilities: ['text-to-video', 'image-to-video'],
    description: 'High-quality video generation with audio',
    pricing: '$0.20-0.40/sec',
  },
  {
    id: 'minimax/video-01',
    displayName: 'MiniMax Video-01',
    provider: 'replicate',
    capabilities: ['text-to-video', 'image-to-video'],
    description: 'High-quality video from text or images',
    pricing: '$0.20/sec',
  },
  {
    id: 'luma/ray',
    displayName: 'Luma Ray',
    provider: 'replicate',
    capabilities: ['text-to-video', 'image-to-video'],
    description: 'Cinematic video generation',
    pricing: '$0.15/sec',
  },
  // fal.ai models
  {
    id: 'fal-ai/flux/schnell',
    displayName: 'FLUX Schnell',
    provider: 'fal',
    capabilities: ['text-to-image'],
    description: 'Fast image generation on fal.ai',
    pricing: '$0.003/image',
  },
  {
    id: 'fal-ai/flux-pro',
    displayName: 'FLUX Pro',
    provider: 'fal',
    capabilities: ['text-to-image'],
    description: 'Professional image generation on fal.ai',
    pricing: '$0.05/image',
  },
  {
    id: 'fal-ai/kling-video',
    displayName: 'Kling Video',
    provider: 'fal',
    capabilities: ['text-to-video', 'image-to-video'],
    description: 'High-quality video generation',
    pricing: '$0.10/sec',
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const provider = searchParams.get('provider') as ProviderType | null;
  const capabilitiesParam = searchParams.get('capabilities');
  const query = searchParams.get('query')?.toLowerCase();

  // Parse capabilities filter
  const capabilities = capabilitiesParam
    ? (capabilitiesParam.split(',') as ModelCapability[])
    : null;

  // Get configured providers from env
  const configuredProviders = getConfiguredProviders();
  const configuredProvidersList = Array.from(configuredProviders) as ProviderType[];

  // Filter models to only those from configured providers
  let filteredModels = MODELS_CATALOG.filter((m) => configuredProviders.has(m.provider));

  // Filter by specific provider (if requested and configured)
  if (provider && configuredProviders.has(provider)) {
    filteredModels = filteredModels.filter((m) => m.provider === provider);
  }

  // Filter by capabilities
  if (capabilities?.length) {
    filteredModels = filteredModels.filter((m) =>
      m.capabilities.some((c) => capabilities.includes(c))
    );
  }

  // Filter by search query
  if (query) {
    filteredModels = filteredModels.filter(
      (m) =>
        m.displayName.toLowerCase().includes(query) ||
        m.id.toLowerCase().includes(query) ||
        m.description?.toLowerCase().includes(query)
    );
  }

  return NextResponse.json({
    models: filteredModels,
    configuredProviders: configuredProvidersList,
  });
}
