import type { PromptCategory } from '@genfeedai/types';

interface SystemPrompt {
  name: string;
  description: string;
  promptText: string;
  styleSettings: {
    mood?: string;
    style?: string;
    camera?: string;
    lighting?: string;
    scene?: string;
  };
  aspectRatio: string;
  preferredModel: string;
  category: PromptCategory;
  tags: string[];
  isFeatured: boolean;
  isSystem: boolean;
}

// System prompts to seed on startup
export const SYSTEM_PROMPTS: SystemPrompt[] = [
  // ============================================
  // PORTRAIT (3)
  // ============================================
  {
    name: 'Cinematic Portrait',
    description: 'Dramatic portrait with cinematic lighting and shallow depth of field',
    promptText:
      'Cinematic portrait photograph, dramatic side lighting with deep shadows, shallow depth of field f/1.4, film grain, moody atmosphere, professional studio quality, 85mm lens, bokeh background',
    styleSettings: {
      mood: 'cinematic',
      style: 'photorealistic',
      camera: 'portrait',
      lighting: 'dramatic',
      scene: 'studio',
    },
    aspectRatio: '4:5',
    preferredModel: 'nano-banana-pro',
    category: 'portrait',
    tags: ['cinematic', 'dramatic', 'portrait', 'studio', 'moody'],
    isFeatured: true,
    isSystem: true,
  },
  {
    name: 'Fashion Editorial',
    description: 'High-fashion magazine style portrait with elegant styling',
    promptText:
      'High-fashion editorial portrait, Vogue magazine style, elegant pose, professional studio lighting, clean background, sharp focus on subject, fashion photography, couture aesthetic, 70mm lens',
    styleSettings: {
      mood: 'dramatic',
      style: 'photorealistic',
      camera: 'portrait',
      lighting: 'studio',
      scene: 'studio',
    },
    aspectRatio: '3:4',
    preferredModel: 'nano-banana-pro',
    category: 'fashion',
    tags: ['fashion', 'editorial', 'magazine', 'elegant', 'professional'],
    isFeatured: true,
    isSystem: true,
  },
  {
    name: 'Environmental Portrait',
    description: 'Subject photographed in their natural environment with context',
    promptText:
      'Environmental portrait, subject in their natural setting, storytelling composition, natural lighting, context-rich background, documentary style, authentic moment, 35mm lens wide perspective',
    styleSettings: {
      mood: 'peaceful',
      style: 'photorealistic',
      camera: 'wide-angle',
      lighting: 'natural',
      scene: 'outdoor',
    },
    aspectRatio: '3:2',
    preferredModel: 'nano-banana-pro',
    category: 'portrait',
    tags: ['environmental', 'documentary', 'natural', 'storytelling', 'authentic'],
    isFeatured: true,
    isSystem: true,
  },

  // ============================================
  // PRODUCT (2)
  // ============================================
  {
    name: 'E-commerce Product Shot',
    description: 'Clean product photography on white background for online stores',
    promptText:
      'Professional e-commerce product photography, pure white background, soft studio lighting, sharp product focus, clean shadows, commercial quality, high detail, packshot style, 100mm macro lens',
    styleSettings: {
      mood: 'peaceful',
      style: 'photorealistic',
      camera: 'macro',
      lighting: 'studio',
      scene: 'studio',
    },
    aspectRatio: '1:1',
    preferredModel: 'nano-banana-pro',
    category: 'product',
    tags: ['ecommerce', 'product', 'white-background', 'commercial', 'clean'],
    isFeatured: true,
    isSystem: true,
  },
  {
    name: 'Lifestyle Product',
    description: 'Product showcased in a natural lifestyle setting',
    promptText:
      'Lifestyle product photography, product in natural home setting, warm ambient lighting, cozy atmosphere, styled scene with props, Instagram aesthetic, soft shadows, inviting composition',
    styleSettings: {
      mood: 'peaceful',
      style: 'photorealistic',
      camera: 'eye-level',
      lighting: 'natural',
      scene: 'domestic',
    },
    aspectRatio: '4:5',
    preferredModel: 'nano-banana-pro',
    category: 'product',
    tags: ['lifestyle', 'product', 'natural', 'cozy', 'instagram'],
    isFeatured: true,
    isSystem: true,
  },

  // ============================================
  // LANDSCAPE (2)
  // ============================================
  {
    name: 'Golden Hour Landscape',
    description: 'Warm sunset landscape with dramatic golden light',
    promptText:
      'Golden hour landscape photography, warm sunset light, long shadows, vibrant orange and gold tones, dramatic sky, epic vista, wide angle composition, nature photography, 16mm ultra-wide lens',
    styleSettings: {
      mood: 'peaceful',
      style: 'photorealistic',
      camera: 'wide-angle',
      lighting: 'golden-hour',
      scene: 'nature',
    },
    aspectRatio: '16:9',
    preferredModel: 'nano-banana-pro',
    category: 'landscape',
    tags: ['landscape', 'golden-hour', 'sunset', 'nature', 'dramatic'],
    isFeatured: true,
    isSystem: true,
  },
  {
    name: 'Moody Landscape',
    description: 'Atmospheric landscape with dramatic weather and mood',
    promptText:
      'Moody landscape photography, dramatic storm clouds, fog and mist, desaturated colors, atmospheric perspective, brooding atmosphere, fine art style, dramatic weather, cinematic composition',
    styleSettings: {
      mood: 'moody',
      style: 'photorealistic',
      camera: 'wide-angle',
      lighting: 'dramatic',
      scene: 'nature',
    },
    aspectRatio: '21:9',
    preferredModel: 'nano-banana-pro',
    category: 'landscape',
    tags: ['landscape', 'moody', 'atmospheric', 'dramatic', 'fine-art'],
    isFeatured: true,
    isSystem: true,
  },

  // ============================================
  // ANIME (1)
  // ============================================
  {
    name: 'Anime Character',
    description: 'High-quality anime character illustration in Studio Ghibli style',
    promptText:
      'Studio Ghibli style anime character, soft watercolor textures, hand-drawn aesthetic, expressive eyes, gentle color palette, whimsical atmosphere, detailed background, Hayao Miyazaki inspired, cel-shaded lighting',
    styleSettings: {
      mood: 'whimsical',
      style: 'anime',
      camera: 'eye-level',
      lighting: 'soft',
      scene: 'outdoor',
    },
    aspectRatio: '3:4',
    preferredModel: 'nano-banana-pro',
    category: 'anime',
    tags: ['anime', 'ghibli', 'character', 'illustration', 'japanese'],
    isFeatured: true,
    isSystem: true,
  },

  // ============================================
  // FOOD (1)
  // ============================================
  {
    name: 'Food Photography',
    description: 'Appetizing food photography with professional lighting',
    promptText:
      'Professional food photography, appetizing presentation, soft diffused lighting, shallow depth of field, fresh ingredients, steam and texture details, restaurant quality, overhead angle, food styling',
    styleSettings: {
      mood: 'peaceful',
      style: 'photorealistic',
      camera: 'high-angle',
      lighting: 'soft',
      scene: 'indoor',
    },
    aspectRatio: '1:1',
    preferredModel: 'nano-banana-pro',
    category: 'food',
    tags: ['food', 'culinary', 'appetizing', 'restaurant', 'professional'],
    isFeatured: true,
    isSystem: true,
  },

  // ============================================
  // ABSTRACT (1)
  // ============================================
  {
    name: 'Abstract Art',
    description: 'Creative non-representational abstract artwork',
    promptText:
      'Abstract art composition, bold geometric shapes, vibrant color contrasts, dynamic movement, non-representational forms, contemporary art style, textured brushstrokes, artistic expression, gallery quality',
    styleSettings: {
      mood: 'energetic',
      style: 'digital-art',
      camera: 'eye-level',
      lighting: 'studio',
      scene: 'abstract',
    },
    aspectRatio: '1:1',
    preferredModel: 'nano-banana-pro',
    category: 'abstract',
    tags: ['abstract', 'art', 'geometric', 'contemporary', 'creative'],
    isFeatured: true,
    isSystem: true,
  },

  // ============================================
  // ADS / MARKETING (2)
  // ============================================
  {
    name: 'Social Media Ad',
    description: 'Attention-grabbing visual for social media advertising',
    promptText:
      'Eye-catching social media advertisement, bold vibrant colors, clean modern design, attention-grabbing composition, Instagram/TikTok optimized, trendy aesthetic, high contrast, clear focal point, marketing visual',
    styleSettings: {
      mood: 'energetic',
      style: 'digital-art',
      camera: 'eye-level',
      lighting: 'studio',
      scene: 'studio',
    },
    aspectRatio: '9:16',
    preferredModel: 'nano-banana-pro',
    category: 'ads',
    tags: ['social-media', 'advertising', 'marketing', 'trendy', 'bold'],
    isFeatured: true,
    isSystem: true,
  },
  {
    name: 'Hero Banner',
    description: 'Wide format impactful banner for websites and campaigns',
    promptText:
      'Website hero banner, wide panoramic format, impactful visual, professional marketing quality, clean negative space for text overlay, gradient lighting, brand-friendly aesthetic, high resolution, corporate style',
    styleSettings: {
      mood: 'dramatic',
      style: 'photorealistic',
      camera: 'wide-angle',
      lighting: 'dramatic',
      scene: 'studio',
    },
    aspectRatio: '21:9',
    preferredModel: 'nano-banana-pro',
    category: 'ads',
    tags: ['banner', 'hero', 'website', 'marketing', 'corporate'],
    isFeatured: true,
    isSystem: true,
  },
];
