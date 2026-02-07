import type { ComfyUIPrompt } from '@genfeedai/types';

// =============================================================================
// FLUX DEV — text-to-image via FLUX.1 Dev checkpoint
// =============================================================================

export interface FluxDevParams {
  prompt: string;
  seed?: number;
  width?: number;
  height?: number;
  steps?: number;
  cfg?: number;
  negativePrompt?: string;
}

export function buildFluxDevPrompt(params: FluxDevParams): ComfyUIPrompt {
  const {
    prompt,
    seed = Math.floor(Math.random() * 2 ** 32),
    width = 1024,
    height = 1024,
    steps = 20,
    cfg = 1.0,
    negativePrompt = '',
  } = params;

  return {
    '1': {
      class_type: 'CheckpointLoaderSimple',
      inputs: {
        ckpt_name: 'flux1-dev.safetensors',
      },
    },
    '2': {
      class_type: 'CLIPTextEncode',
      inputs: {
        text: prompt,
        clip: ['1', 1],
      },
    },
    '3': {
      class_type: 'CLIPTextEncode',
      inputs: {
        text: negativePrompt,
        clip: ['1', 1],
      },
    },
    '4': {
      class_type: 'EmptyLatentImage',
      inputs: {
        width,
        height,
        batch_size: 1,
      },
    },
    '5': {
      class_type: 'KSampler',
      inputs: {
        model: ['1', 0],
        positive: ['2', 0],
        negative: ['3', 0],
        latent_image: ['4', 0],
        seed,
        steps,
        cfg,
        sampler_name: 'euler',
        scheduler: 'normal',
        denoise: 1.0,
      },
    },
    '6': {
      class_type: 'VAEDecode',
      inputs: {
        samples: ['5', 0],
        vae: ['1', 2],
      },
    },
    '7': {
      class_type: 'SaveImage',
      inputs: {
        images: ['6', 0],
        filename_prefix: 'genfeed-flux-dev',
      },
    },
  };
}

// =============================================================================
// FLUX DEV + PuLID — face-consistent image generation (Flux 1)
// =============================================================================

export interface PulidFluxParams {
  prompt: string;
  faceImage: string;
  seed?: number;
  width?: number;
  height?: number;
  steps?: number;
  cfg?: number;
  pulidStrength?: number;
}

export function buildPulidFluxPrompt(params: PulidFluxParams): ComfyUIPrompt {
  const {
    prompt,
    faceImage,
    seed = Math.floor(Math.random() * 2 ** 32),
    width = 1024,
    height = 1024,
    steps = 20,
    cfg = 1.0,
    pulidStrength = 0.8,
  } = params;

  return {
    '1': {
      class_type: 'CheckpointLoaderSimple',
      inputs: {
        ckpt_name: 'flux1-dev.safetensors',
      },
    },
    '2': {
      class_type: 'PulidModelLoader',
      inputs: {
        pulid_file: 'ip-adapter_pulid_flux_v0.9.1.safetensors',
      },
    },
    '3': {
      class_type: 'PulidEvaClipLoader',
      inputs: {},
    },
    '4': {
      class_type: 'PulidInsightFaceLoader',
      inputs: {
        provider: 'CPU',
      },
    },
    '5': {
      class_type: 'LoadImage',
      inputs: {
        image: faceImage,
      },
    },
    '6': {
      class_type: 'ApplyPulid',
      inputs: {
        model: ['1', 0],
        pulid: ['2', 0],
        eva_clip: ['3', 0],
        face_analysis: ['4', 0],
        image: ['5', 0],
        method: 'fidelity',
        weight: pulidStrength,
        start_at: 0.0,
        end_at: 1.0,
      },
    },
    '7': {
      class_type: 'CLIPTextEncode',
      inputs: {
        text: prompt,
        clip: ['1', 1],
      },
    },
    '8': {
      class_type: 'CLIPTextEncode',
      inputs: {
        text: '',
        clip: ['1', 1],
      },
    },
    '9': {
      class_type: 'EmptyLatentImage',
      inputs: {
        width,
        height,
        batch_size: 1,
      },
    },
    '10': {
      class_type: 'KSampler',
      inputs: {
        model: ['6', 0],
        positive: ['7', 0],
        negative: ['8', 0],
        latent_image: ['9', 0],
        seed,
        steps,
        cfg,
        sampler_name: 'euler',
        scheduler: 'normal',
        denoise: 1.0,
      },
    },
    '11': {
      class_type: 'VAEDecode',
      inputs: {
        samples: ['10', 0],
        vae: ['1', 2],
      },
    },
    '12': {
      class_type: 'SaveImage',
      inputs: {
        images: ['11', 0],
        filename_prefix: 'genfeed-pulid-flux',
      },
    },
  };
}

// =============================================================================
// Z-IMAGE TURBO — fast image generation
// =============================================================================

export interface ZImageTurboParams {
  prompt: string;
  seed?: number;
  width?: number;
  height?: number;
  steps?: number;
}

export function buildZImageTurboPrompt(params: ZImageTurboParams): ComfyUIPrompt {
  const {
    prompt,
    seed = Math.floor(Math.random() * 2 ** 32),
    width = 1024,
    height = 1024,
    steps = 4,
  } = params;

  return {
    '1': {
      class_type: 'CheckpointLoaderSimple',
      inputs: {
        ckpt_name: 'z-image-turbo.safetensors',
      },
    },
    '2': {
      class_type: 'CLIPTextEncode',
      inputs: {
        text: prompt,
        clip: ['1', 1],
      },
    },
    '3': {
      class_type: 'CLIPTextEncode',
      inputs: {
        text: '',
        clip: ['1', 1],
      },
    },
    '4': {
      class_type: 'EmptyLatentImage',
      inputs: {
        width,
        height,
        batch_size: 1,
      },
    },
    '5': {
      class_type: 'KSampler',
      inputs: {
        model: ['1', 0],
        positive: ['2', 0],
        negative: ['3', 0],
        latent_image: ['4', 0],
        seed,
        steps,
        cfg: 1.0,
        sampler_name: 'euler_ancestral',
        scheduler: 'normal',
        denoise: 1.0,
      },
    },
    '6': {
      class_type: 'VAEDecode',
      inputs: {
        samples: ['5', 0],
        vae: ['1', 2],
      },
    },
    '7': {
      class_type: 'SaveImage',
      inputs: {
        images: ['6', 0],
        filename_prefix: 'genfeed-z-turbo',
      },
    },
  };
}

// =============================================================================
// FLUX 2 DEV — text-to-image via split UNET + Mistral 3 encoder + VAE
// Uses CLIPTextEncode + FluxGuidance (Mistral CLIP lacks T5-XXL tokenizer).
// KSampler cfg=1.0 because guidance is handled by the FluxGuidance node.
// =============================================================================

export interface Flux2DevParams {
  prompt: string;
  seed?: number;
  width?: number;
  height?: number;
  steps?: number;
  guidance?: number;
}

export function buildFlux2DevPrompt(params: Flux2DevParams): ComfyUIPrompt {
  const {
    prompt,
    seed = Math.floor(Math.random() * 2 ** 32),
    width = 1024,
    height = 1024,
    steps = 20,
    guidance = 3.5,
  } = params;

  return {
    '1': {
      class_type: 'UNETLoader',
      inputs: {
        unet_name: 'flux2_dev_fp8mixed.safetensors',
        weight_dtype: 'fp8_e4m3fn',
      },
    },
    '2': {
      class_type: 'CLIPLoader',
      inputs: {
        clip_name: 'mistral_3_small_flux2_fp8.safetensors',
        type: 'flux2',
      },
    },
    '3': {
      class_type: 'CLIPTextEncode',
      inputs: {
        text: prompt,
        clip: ['2', 0],
      },
    },
    '4': {
      class_type: 'FluxGuidance',
      inputs: {
        conditioning: ['3', 0],
        guidance,
      },
    },
    '5': {
      class_type: 'CLIPTextEncode',
      inputs: {
        text: '',
        clip: ['2', 0],
      },
    },
    '6': {
      class_type: 'VAELoader',
      inputs: {
        vae_name: 'flux2-vae.safetensors',
      },
    },
    '7': {
      class_type: 'EmptyLatentImage',
      inputs: {
        width,
        height,
        batch_size: 1,
      },
    },
    '8': {
      class_type: 'KSampler',
      inputs: {
        model: ['1', 0],
        positive: ['4', 0],
        negative: ['5', 0],
        latent_image: ['7', 0],
        seed,
        steps,
        cfg: 1.0,
        sampler_name: 'euler',
        scheduler: 'normal',
        denoise: 1.0,
      },
    },
    '9': {
      class_type: 'VAEDecode',
      inputs: {
        samples: ['8', 0],
        vae: ['6', 0],
      },
    },
    '10': {
      class_type: 'SaveImage',
      inputs: {
        images: ['9', 0],
        filename_prefix: 'genfeed-flux2-dev',
      },
    },
  };
}

// =============================================================================
// FLUX 2 DEV + PuLID — face-consistent image generation
// Uses CLIPTextEncode + FluxGuidance (Mistral CLIP lacks T5-XXL tokenizer).
// ApplyPulid requires: eva_clip (PulidEvaClipLoader) + face_analysis
// (PulidInsightFaceLoader) + method/weight/start_at/end_at
// =============================================================================

export interface Flux2PulidParams extends Flux2DevParams {
  faceImage: string;
  pulidStrength?: number;
  pulidMethod?: 'fidelity' | 'style' | 'neutral';
  pulidStartAt?: number;
  pulidEndAt?: number;
}

export function buildFlux2DevPulidPrompt(params: Flux2PulidParams): ComfyUIPrompt {
  const {
    prompt,
    faceImage,
    seed = Math.floor(Math.random() * 2 ** 32),
    width = 1024,
    height = 1024,
    steps = 20,
    guidance = 3.5,
    pulidStrength = 0.8,
    pulidMethod = 'fidelity',
    pulidStartAt = 0.0,
    pulidEndAt = 1.0,
  } = params;

  return {
    '1': {
      class_type: 'UNETLoader',
      inputs: {
        unet_name: 'flux2_dev_fp8mixed.safetensors',
        weight_dtype: 'fp8_e4m3fn',
      },
    },
    '2': {
      class_type: 'CLIPLoader',
      inputs: {
        clip_name: 'mistral_3_small_flux2_fp8.safetensors',
        type: 'flux2',
      },
    },
    '3': {
      class_type: 'PulidModelLoader',
      inputs: {
        pulid_file: 'ip-adapter_pulid_flux_v0.9.1.safetensors',
      },
    },
    '4': {
      class_type: 'PulidEvaClipLoader',
      inputs: {},
    },
    '5': {
      class_type: 'PulidInsightFaceLoader',
      inputs: {
        provider: 'CPU',
      },
    },
    '6': {
      class_type: 'LoadImage',
      inputs: {
        image: faceImage,
      },
    },
    '7': {
      class_type: 'ApplyPulid',
      inputs: {
        model: ['1', 0],
        pulid: ['3', 0],
        eva_clip: ['4', 0],
        face_analysis: ['5', 0],
        image: ['6', 0],
        method: pulidMethod,
        weight: pulidStrength,
        start_at: pulidStartAt,
        end_at: pulidEndAt,
      },
    },
    '8': {
      class_type: 'CLIPTextEncode',
      inputs: {
        text: prompt,
        clip: ['2', 0],
      },
    },
    '9': {
      class_type: 'FluxGuidance',
      inputs: {
        conditioning: ['8', 0],
        guidance,
      },
    },
    '10': {
      class_type: 'CLIPTextEncode',
      inputs: {
        text: '',
        clip: ['2', 0],
      },
    },
    '11': {
      class_type: 'VAELoader',
      inputs: {
        vae_name: 'flux2-vae.safetensors',
      },
    },
    '12': {
      class_type: 'EmptyLatentImage',
      inputs: {
        width,
        height,
        batch_size: 1,
      },
    },
    '13': {
      class_type: 'KSampler',
      inputs: {
        model: ['7', 0],
        positive: ['9', 0],
        negative: ['10', 0],
        latent_image: ['12', 0],
        seed,
        steps,
        cfg: 1.0,
        sampler_name: 'euler',
        scheduler: 'normal',
        denoise: 1.0,
      },
    },
    '14': {
      class_type: 'VAEDecode',
      inputs: {
        samples: ['13', 0],
        vae: ['11', 0],
      },
    },
    '15': {
      class_type: 'SaveImage',
      inputs: {
        images: ['14', 0],
        filename_prefix: 'genfeed-flux2-pulid',
      },
    },
  };
}

// =============================================================================
// FLUX 2 DEV + PuLID + 4K UPSCALE — face-consistent with 4x upscale
// Base 832x1216 (Instagram 4:5) → 4x → 3328x4864
// =============================================================================

export interface Flux2PulidUpscaleParams extends Flux2PulidParams {
  upscaleModel?: string;
}

export function buildFlux2DevPulidUpscalePrompt(params: Flux2PulidUpscaleParams): ComfyUIPrompt {
  const {
    prompt,
    faceImage,
    seed = Math.floor(Math.random() * 2 ** 32),
    width = 832,
    height = 1216,
    steps = 20,
    guidance = 3.5,
    pulidStrength = 0.8,
    pulidMethod = 'fidelity',
    pulidStartAt = 0.0,
    pulidEndAt = 1.0,
    upscaleModel = '4x-UltraSharp.pth',
  } = params;

  return {
    '1': {
      class_type: 'UNETLoader',
      inputs: {
        unet_name: 'flux2_dev_fp8mixed.safetensors',
        weight_dtype: 'fp8_e4m3fn',
      },
    },
    '2': {
      class_type: 'CLIPLoader',
      inputs: {
        clip_name: 'mistral_3_small_flux2_fp8.safetensors',
        type: 'flux2',
      },
    },
    '3': {
      class_type: 'PulidModelLoader',
      inputs: {
        pulid_file: 'ip-adapter_pulid_flux_v0.9.1.safetensors',
      },
    },
    '4': {
      class_type: 'PulidEvaClipLoader',
      inputs: {},
    },
    '5': {
      class_type: 'PulidInsightFaceLoader',
      inputs: {
        provider: 'CPU',
      },
    },
    '6': {
      class_type: 'LoadImage',
      inputs: {
        image: faceImage,
      },
    },
    '7': {
      class_type: 'ApplyPulid',
      inputs: {
        model: ['1', 0],
        pulid: ['3', 0],
        eva_clip: ['4', 0],
        face_analysis: ['5', 0],
        image: ['6', 0],
        method: pulidMethod,
        weight: pulidStrength,
        start_at: pulidStartAt,
        end_at: pulidEndAt,
      },
    },
    '8': {
      class_type: 'CLIPTextEncode',
      inputs: {
        text: prompt,
        clip: ['2', 0],
      },
    },
    '9': {
      class_type: 'FluxGuidance',
      inputs: {
        conditioning: ['8', 0],
        guidance,
      },
    },
    '10': {
      class_type: 'CLIPTextEncode',
      inputs: {
        text: '',
        clip: ['2', 0],
      },
    },
    '11': {
      class_type: 'VAELoader',
      inputs: {
        vae_name: 'flux2-vae.safetensors',
      },
    },
    '12': {
      class_type: 'EmptyLatentImage',
      inputs: {
        width,
        height,
        batch_size: 1,
      },
    },
    '13': {
      class_type: 'KSampler',
      inputs: {
        model: ['7', 0],
        positive: ['9', 0],
        negative: ['10', 0],
        latent_image: ['12', 0],
        seed,
        steps,
        cfg: 1.0,
        sampler_name: 'euler',
        scheduler: 'normal',
        denoise: 1.0,
      },
    },
    '14': {
      class_type: 'VAEDecode',
      inputs: {
        samples: ['13', 0],
        vae: ['11', 0],
      },
    },
    '15': {
      class_type: 'UpscaleModelLoader',
      inputs: {
        model_name: upscaleModel,
      },
    },
    '16': {
      class_type: 'ImageUpscaleWithModel',
      inputs: {
        upscale_model: ['15', 0],
        image: ['14', 0],
      },
    },
    '17': {
      class_type: 'SaveImage',
      inputs: {
        images: ['16', 0],
        filename_prefix: 'genfeed-flux2-pulid-4k',
      },
    },
  };
}

// =============================================================================
// FLUX 2 DEV + PuLID + LoRA — face-consistent with LoRA customization
// =============================================================================

export interface Flux2PulidLoraParams extends Flux2PulidParams {
  loraPath: string;
  loraStrength?: number;
  realismLora?: string;
  realismLoraStrength?: number;
}

export function buildFlux2DevPulidLoraPrompt(params: Flux2PulidLoraParams): ComfyUIPrompt {
  const {
    prompt,
    faceImage,
    loraPath,
    seed = Math.floor(Math.random() * 2 ** 32),
    width = 1024,
    height = 1024,
    steps = 20,
    guidance = 3.5,
    pulidStrength = 0.8,
    pulidMethod = 'fidelity',
    pulidStartAt = 0.0,
    pulidEndAt = 1.0,
    loraStrength = 0.8,
  } = params;

  return {
    '1': {
      class_type: 'UNETLoader',
      inputs: {
        unet_name: 'flux2_dev_fp8mixed.safetensors',
        weight_dtype: 'fp8_e4m3fn',
      },
    },
    '2': {
      class_type: 'CLIPLoader',
      inputs: {
        clip_name: 'mistral_3_small_flux2_fp8.safetensors',
        type: 'flux2',
      },
    },
    '3': {
      class_type: 'LoraLoader',
      inputs: {
        model: ['1', 0],
        clip: ['2', 0],
        lora_name: loraPath,
        strength_model: loraStrength,
        strength_clip: loraStrength,
      },
    },
    '4': {
      class_type: 'PulidModelLoader',
      inputs: {
        pulid_file: 'ip-adapter_pulid_flux_v0.9.1.safetensors',
      },
    },
    '5': {
      class_type: 'PulidEvaClipLoader',
      inputs: {},
    },
    '6': {
      class_type: 'PulidInsightFaceLoader',
      inputs: {
        provider: 'CPU',
      },
    },
    '7': {
      class_type: 'LoadImage',
      inputs: {
        image: faceImage,
      },
    },
    '8': {
      class_type: 'ApplyPulid',
      inputs: {
        model: ['3', 0],
        pulid: ['4', 0],
        eva_clip: ['5', 0],
        face_analysis: ['6', 0],
        image: ['7', 0],
        method: pulidMethod,
        weight: pulidStrength,
        start_at: pulidStartAt,
        end_at: pulidEndAt,
      },
    },
    '9': {
      class_type: 'CLIPTextEncode',
      inputs: {
        text: prompt,
        clip: ['3', 1],
      },
    },
    '10': {
      class_type: 'FluxGuidance',
      inputs: {
        conditioning: ['9', 0],
        guidance,
      },
    },
    '11': {
      class_type: 'CLIPTextEncode',
      inputs: {
        text: '',
        clip: ['3', 1],
      },
    },
    '12': {
      class_type: 'VAELoader',
      inputs: {
        vae_name: 'flux2-vae.safetensors',
      },
    },
    '13': {
      class_type: 'EmptyLatentImage',
      inputs: {
        width,
        height,
        batch_size: 1,
      },
    },
    '14': {
      class_type: 'KSampler',
      inputs: {
        model: ['8', 0],
        positive: ['10', 0],
        negative: ['11', 0],
        latent_image: ['13', 0],
        seed,
        steps,
        cfg: 1.0,
        sampler_name: 'euler',
        scheduler: 'normal',
        denoise: 1.0,
      },
    },
    '15': {
      class_type: 'VAEDecode',
      inputs: {
        samples: ['14', 0],
        vae: ['12', 0],
      },
    },
    '16': {
      class_type: 'SaveImage',
      inputs: {
        images: ['15', 0],
        filename_prefix: 'genfeed-flux2-pulid-lora',
      },
    },
  };
}

// =============================================================================
// FLUX 2 KLEIN — fast generation with 9B model
// =============================================================================

export interface Flux2KleinParams {
  prompt: string;
  seed?: number;
  width?: number;
  height?: number;
  steps?: number;
}

export function buildFlux2KleinPrompt(params: Flux2KleinParams): ComfyUIPrompt {
  const {
    prompt,
    seed = Math.floor(Math.random() * 2 ** 32),
    width = 1024,
    height = 1024,
    steps = 6,
  } = params;

  return {
    '1': {
      class_type: 'UNETLoader',
      inputs: {
        unet_name: 'flux-2-klein-9b-fp8.safetensors',
        weight_dtype: 'fp8_e4m3fn',
      },
    },
    '2': {
      class_type: 'CLIPLoader',
      inputs: {
        clip_name: 'mistral_3_small_flux2_fp8.safetensors',
        type: 'flux2',
      },
    },
    '3': {
      class_type: 'CLIPTextEncode',
      inputs: {
        text: prompt,
        clip: ['2', 0],
      },
    },
    '4': {
      class_type: 'FluxGuidance',
      inputs: {
        conditioning: ['3', 0],
        guidance: 3.5,
      },
    },
    '5': {
      class_type: 'CLIPTextEncode',
      inputs: {
        text: '',
        clip: ['2', 0],
      },
    },
    '6': {
      class_type: 'VAELoader',
      inputs: {
        vae_name: 'flux2-vae.safetensors',
      },
    },
    '7': {
      class_type: 'EmptyLatentImage',
      inputs: {
        width,
        height,
        batch_size: 1,
      },
    },
    '8': {
      class_type: 'KSampler',
      inputs: {
        model: ['1', 0],
        positive: ['4', 0],
        negative: ['5', 0],
        latent_image: ['7', 0],
        seed,
        steps,
        cfg: 1.0,
        sampler_name: 'euler',
        scheduler: 'normal',
        denoise: 1.0,
      },
    },
    '9': {
      class_type: 'VAEDecode',
      inputs: {
        samples: ['8', 0],
        vae: ['6', 0],
      },
    },
    '10': {
      class_type: 'SaveImage',
      inputs: {
        images: ['9', 0],
        filename_prefix: 'genfeed-flux2-klein',
      },
    },
  };
}
