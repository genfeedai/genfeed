import type { Edge, Node } from '@xyflow/react';

// =============================================================================
// HANDLE TYPES
// =============================================================================

export type HandleType = 'image' | 'text' | 'video' | 'number' | 'audio';

export interface HandleDefinition {
  id: string;
  type: HandleType;
  label: string;
  multiple?: boolean;
  required?: boolean;
}

// Connection validation rules
export const CONNECTION_RULES: Record<HandleType, HandleType[]> = {
  image: ['image'],
  text: ['text'],
  video: ['video'],
  number: ['number'],
  audio: ['audio'],
};

// =============================================================================
// NODE TYPES
// =============================================================================

export type NodeType =
  // Input nodes
  | 'imageInput'
  | 'audioInput'
  | 'videoInput'
  | 'prompt'
  | 'template'
  | 'tweetInput'
  // AI generation nodes
  | 'imageGen'
  | 'videoGen'
  | 'llm'
  | 'tweetRemix'
  | 'lipSync'
  | 'voiceChange'
  | 'transcribe'
  // Processing nodes
  | 'resize'
  | 'animation'
  | 'videoStitch'
  | 'videoTrim'
  // Output nodes
  | 'output'
  | 'preview'
  | 'download'
  | 'socialPublish';

export type NodeCategory = 'input' | 'ai' | 'processing' | 'output';

export type NodeStatus = 'idle' | 'pending' | 'processing' | 'complete' | 'error';

// =============================================================================
// BASE NODE DATA
// =============================================================================

export interface BaseNodeData extends Record<string, unknown> {
  label: string;
  status: NodeStatus;
  error?: string;
  progress?: number;
  // Lock state for skipping during execution
  isLocked?: boolean;
  cachedOutput?: unknown;
  lockTimestamp?: number;
}

// =============================================================================
// INPUT NODE DATA
// =============================================================================

export interface ImageInputNodeData extends BaseNodeData {
  image: string | null;
  filename: string | null;
  dimensions: { width: number; height: number } | null;
  source: 'upload' | 'url';
  url?: string;
}

export interface PromptNodeData extends BaseNodeData {
  prompt: string;
  variables: Record<string, string>;
}

export interface TemplateNodeData extends BaseNodeData {
  templateId: string;
  templateName: string;
  variables: Record<string, string>;
  resolvedPrompt: string | null;
}

export interface TweetInputNodeData extends BaseNodeData {
  inputMode: 'url' | 'text';
  tweetUrl: string;
  rawText: string;
  extractedTweet: string | null;
  authorHandle: string | null;
}

export interface AudioInputNodeData extends BaseNodeData {
  audio: string | null;
  filename: string | null;
  duration: number | null;
  source: 'upload' | 'url';
  url?: string;
}

export interface VideoInputNodeData extends BaseNodeData {
  video: string | null;
  filename: string | null;
  duration: number | null;
  dimensions: { width: number; height: number } | null;
  source: 'upload' | 'url';
  url?: string;
}

// =============================================================================
// AI NODE DATA
// =============================================================================

export type ImageModel = 'nano-banana' | 'nano-banana-pro';
export type VideoModel = 'veo-3.1-fast' | 'veo-3.1';
export type AspectRatio =
  | '1:1'
  | '16:9'
  | '9:16'
  | '4:3'
  | '3:4'
  | '4:5'
  | '5:4'
  | '2:3'
  | '3:2'
  | '21:9';
export type Resolution = '1K' | '2K' | '4K';
export type VideoResolution = '720p' | '1080p';
export type VideoDuration = 4 | 6 | 8;
export type OutputFormat = 'jpg' | 'png' | 'webp';

export interface ImageGenNodeData extends BaseNodeData {
  // Inputs from connections
  inputImages: string[];
  inputPrompt: string | null;

  // Output
  outputImage: string | null;

  // Model config
  model: ImageModel;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  outputFormat: OutputFormat;

  // Job state
  jobId: string | null;
}

export interface VideoGenNodeData extends BaseNodeData {
  // Inputs from connections
  inputImage: string | null;
  lastFrame: string | null;
  referenceImages: string[];
  inputPrompt: string | null;
  negativePrompt: string;

  // Output
  outputVideo: string | null;

  // Model config
  model: VideoModel;
  duration: VideoDuration;
  aspectRatio: AspectRatio;
  resolution: VideoResolution;
  generateAudio: boolean;

  // Job state
  jobId: string | null;
}

export interface LLMNodeData extends BaseNodeData {
  // Inputs from connections
  inputPrompt: string | null;

  // Output
  outputText: string | null;

  // Model config
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  topP: number;

  // Job state
  jobId: string | null;
}

export type TweetTone = 'professional' | 'casual' | 'witty' | 'viral';

export interface TweetVariation {
  id: string;
  text: string;
  charCount: number;
}

export interface TweetRemixNodeData extends BaseNodeData {
  // Input from connection
  inputTweet: string | null;

  // Variations output
  variations: TweetVariation[];
  selectedIndex: number | null;
  outputTweet: string | null;

  // Config
  tone: TweetTone;
  maxLength: number;

  // Job state
  jobId: string | null;
}

export type LipSyncModel =
  | 'sync/lipsync-2-pro'
  | 'sync/lipsync-2'
  | 'bytedance/latentsync'
  | 'pixverse-ai/lipsync';

export type LipSyncMode = 'loop' | 'bounce' | 'cut_off' | 'silence' | 'remap';

export interface LipSyncNodeData extends BaseNodeData {
  // Inputs from connections
  inputImage: string | null;
  inputVideo: string | null;
  inputAudio: string | null;

  // Output
  outputVideo: string | null;

  // Config
  model: LipSyncModel;
  syncMode: LipSyncMode;
  temperature: number;
  activeSpeaker: boolean;

  // Job state
  jobId: string | null;
}

export interface VoiceChangeNodeData extends BaseNodeData {
  // Inputs from connections
  inputVideo: string | null;
  inputAudio: string | null;

  // Output
  outputVideo: string | null;

  // Config
  preserveOriginalAudio: boolean;
  audioMixLevel: number;

  // Job state
  jobId: string | null;
}

export type TranscribeLanguage = 'auto' | 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh' | 'ko' | 'pt';

export interface TranscribeNodeData extends BaseNodeData {
  // Inputs from connections
  inputVideo: string | null;
  inputAudio: string | null;

  // Output
  outputText: string | null;

  // Config
  language: TranscribeLanguage;
  timestamps: boolean;

  // Job state
  jobId: string | null;
}

// =============================================================================
// PROCESSING NODE DATA
// =============================================================================

export type EasingPreset =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'easeInQuad'
  | 'easeOutQuad'
  | 'easeInOutQuad'
  | 'easeInCubic'
  | 'easeOutCubic'
  | 'easeInOutCubic'
  | 'easeInExpo'
  | 'easeOutExpo'
  | 'easeInOutExpo';

export type CubicBezier = [number, number, number, number];

export interface AnimationNodeData extends BaseNodeData {
  // Inputs from connections
  inputVideo: string | null;

  // Output
  outputVideo: string | null;

  // Easing config
  curveType: 'preset' | 'custom';
  preset: EasingPreset;
  customCurve: CubicBezier;

  // Time-warp settings
  speedMultiplier: number;
}

export type TransitionType = 'cut' | 'crossfade' | 'wipe' | 'fade';

export interface VideoStitchNodeData extends BaseNodeData {
  // Inputs from connections
  inputVideos: string[];

  // Output
  outputVideo: string | null;

  // Stitch config
  transitionType: TransitionType;
  transitionDuration: number;
  seamlessLoop: boolean;
}

export interface ResizeNodeData extends BaseNodeData {
  // Inputs from connections
  inputMedia: string | null;
  inputType: 'image' | 'video' | null;

  // Output
  outputMedia: string | null;

  // Resize config
  targetAspectRatio: AspectRatio;
  targetWidth: number | null;
  targetHeight: number | null;
  fitMode: 'contain' | 'cover' | 'fill';
}

export interface VideoTrimNodeData extends BaseNodeData {
  // Inputs from connections
  inputVideo: string | null;

  // Output
  outputVideo: string | null;

  // Trim config (in seconds)
  startTime: number;
  endTime: number;
  duration: number | null;

  // Job state
  jobId: string | null;
}

// =============================================================================
// OUTPUT NODE DATA
// =============================================================================

export interface OutputNodeData extends BaseNodeData {
  // Inputs from connections
  inputMedia: string | null;
  inputType: 'image' | 'video' | 'text' | null;

  // Output name for saving
  outputName: string;
}

export interface PreviewNodeData extends BaseNodeData {
  // Inputs from connections
  inputMedia: string | null;
  inputType: 'image' | 'video' | null;

  // Preview state
  isPlaying: boolean;
  volume: number;
}

export interface DownloadNodeData extends BaseNodeData {
  // Inputs from connections
  inputMedia: string | null;
  inputType: 'image' | 'video' | null;

  // Download config
  filename: string;
  format: string;
}

export type SocialPlatform = 'youtube' | 'tiktok' | 'instagram' | 'twitter';
export type SocialVisibility = 'public' | 'private' | 'unlisted';

export interface SocialPublishNodeData extends BaseNodeData {
  // Inputs from connections
  inputVideo: string | null;

  // Publish config
  platform: SocialPlatform;
  title: string;
  description: string;
  tags: string[];
  visibility: SocialVisibility;
  scheduledTime: string | null;

  // Output
  publishedUrl: string | null;

  // Job state
  jobId: string | null;
}

// =============================================================================
// NODE DATA UNION
// =============================================================================

export type WorkflowNodeData =
  | ImageInputNodeData
  | AudioInputNodeData
  | VideoInputNodeData
  | PromptNodeData
  | TemplateNodeData
  | TweetInputNodeData
  | ImageGenNodeData
  | VideoGenNodeData
  | LLMNodeData
  | TweetRemixNodeData
  | LipSyncNodeData
  | VoiceChangeNodeData
  | TranscribeNodeData
  | AnimationNodeData
  | VideoStitchNodeData
  | ResizeNodeData
  | VideoTrimNodeData
  | OutputNodeData
  | PreviewNodeData
  | DownloadNodeData
  | SocialPublishNodeData;

// =============================================================================
// WORKFLOW NODE & EDGE
// =============================================================================

export type WorkflowNode = Node<WorkflowNodeData, NodeType>;
export type WorkflowEdge = Edge;

// =============================================================================
// NODE DEFINITION (for registry)
// =============================================================================

export interface NodeDefinition {
  type: NodeType;
  label: string;
  description: string;
  category: NodeCategory;
  icon: string;
  inputs: HandleDefinition[];
  outputs: HandleDefinition[];
  defaultData: Partial<WorkflowNodeData>;
}

// =============================================================================
// NODE REGISTRY
// =============================================================================

export const NODE_DEFINITIONS: Record<NodeType, NodeDefinition> = {
  // Input nodes
  imageInput: {
    type: 'imageInput',
    label: 'Image Input',
    description: 'Upload or reference an image',
    category: 'input',
    icon: 'Image',
    inputs: [],
    outputs: [{ id: 'image', type: 'image', label: 'Image' }],
    defaultData: {
      label: 'Image Input',
      status: 'idle',
      image: null,
      filename: null,
      dimensions: null,
      source: 'upload',
    },
  },
  prompt: {
    type: 'prompt',
    label: 'Prompt',
    description: 'Text prompt for AI generation',
    category: 'input',
    icon: 'MessageSquare',
    inputs: [],
    outputs: [{ id: 'text', type: 'text', label: 'Prompt' }],
    defaultData: {
      label: 'Prompt',
      status: 'idle',
      prompt: '',
      variables: {},
    },
  },
  template: {
    type: 'template',
    label: 'Template',
    description: 'Preset prompt template',
    category: 'input',
    icon: 'FileText',
    inputs: [],
    outputs: [{ id: 'text', type: 'text', label: 'Prompt' }],
    defaultData: {
      label: 'Template',
      status: 'idle',
      templateId: '',
      templateName: '',
      variables: {},
      resolvedPrompt: null,
    },
  },
  tweetInput: {
    type: 'tweetInput',
    label: 'Tweet Input',
    description: 'Enter a Twitter URL or paste tweet text',
    category: 'input',
    icon: 'AtSign',
    inputs: [],
    outputs: [{ id: 'text', type: 'text', label: 'Tweet Text' }],
    defaultData: {
      label: 'Tweet Input',
      status: 'idle',
      inputMode: 'url',
      tweetUrl: '',
      rawText: '',
      extractedTweet: null,
      authorHandle: null,
    },
  },
  audioInput: {
    type: 'audioInput',
    label: 'Audio Input',
    description: 'Upload an audio file (MP3, WAV)',
    category: 'input',
    icon: 'Volume2',
    inputs: [],
    outputs: [{ id: 'audio', type: 'audio', label: 'Audio' }],
    defaultData: {
      label: 'Audio Input',
      status: 'idle',
      audio: null,
      filename: null,
      duration: null,
      source: 'upload',
    },
  },
  videoInput: {
    type: 'videoInput',
    label: 'Video Input',
    description: 'Upload or reference a video file',
    category: 'input',
    icon: 'FileVideo',
    inputs: [],
    outputs: [{ id: 'video', type: 'video', label: 'Video' }],
    defaultData: {
      label: 'Video Input',
      status: 'idle',
      video: null,
      filename: null,
      duration: null,
      dimensions: null,
      source: 'upload',
    },
  },

  // AI nodes
  imageGen: {
    type: 'imageGen',
    label: 'Image Generator',
    description: 'Generate images with nano-banana models',
    category: 'ai',
    icon: 'Sparkles',
    inputs: [
      { id: 'prompt', type: 'text', label: 'Prompt', required: true },
      { id: 'images', type: 'image', label: 'Reference Images', multiple: true },
    ],
    outputs: [{ id: 'image', type: 'image', label: 'Generated Image' }],
    defaultData: {
      label: 'Image Generator',
      status: 'idle',
      inputImages: [],
      inputPrompt: null,
      outputImage: null,
      model: 'nano-banana-pro',
      aspectRatio: '1:1',
      resolution: '2K',
      outputFormat: 'jpg',
      jobId: null,
    },
  },
  videoGen: {
    type: 'videoGen',
    label: 'Video Generator',
    description: 'Generate videos with veo-3.1 models',
    category: 'ai',
    icon: 'Video',
    inputs: [
      { id: 'prompt', type: 'text', label: 'Prompt', required: true },
      { id: 'image', type: 'image', label: 'Starting Frame' },
      { id: 'lastFrame', type: 'image', label: 'Last Frame (interpolation)' },
    ],
    outputs: [{ id: 'video', type: 'video', label: 'Generated Video' }],
    defaultData: {
      label: 'Video Generator',
      status: 'idle',
      inputImage: null,
      lastFrame: null,
      referenceImages: [],
      inputPrompt: null,
      negativePrompt: '',
      outputVideo: null,
      model: 'veo-3.1-fast',
      duration: 8,
      aspectRatio: '16:9',
      resolution: '1080p',
      generateAudio: true,
      jobId: null,
    },
  },
  llm: {
    type: 'llm',
    label: 'LLM',
    description: 'Generate text with meta-llama',
    category: 'ai',
    icon: 'Brain',
    inputs: [{ id: 'prompt', type: 'text', label: 'Prompt', required: true }],
    outputs: [{ id: 'text', type: 'text', label: 'Generated Text' }],
    defaultData: {
      label: 'LLM',
      status: 'idle',
      inputPrompt: null,
      outputText: null,
      systemPrompt: 'You are a creative assistant helping generate content prompts.',
      temperature: 0.7,
      maxTokens: 1024,
      topP: 0.9,
      jobId: null,
    },
  },
  tweetRemix: {
    type: 'tweetRemix',
    label: 'Tweet Remix',
    description: 'Generate 3 tweet variations with your brand voice',
    category: 'ai',
    icon: 'RefreshCw',
    inputs: [{ id: 'tweet', type: 'text', label: 'Original Tweet', required: true }],
    outputs: [{ id: 'text', type: 'text', label: 'Selected Tweet' }],
    defaultData: {
      label: 'Tweet Remix',
      status: 'idle',
      inputTweet: null,
      variations: [],
      selectedIndex: null,
      outputTweet: null,
      tone: 'professional',
      maxLength: 280,
      jobId: null,
    },
  },
  lipSync: {
    type: 'lipSync',
    label: 'Lip Sync',
    description: 'Generate talking-head video from image/video and audio using Replicate',
    category: 'ai',
    icon: 'Mic',
    inputs: [
      { id: 'image', type: 'image', label: 'Face Image' },
      { id: 'video', type: 'video', label: 'Source Video' },
      { id: 'audio', type: 'audio', label: 'Audio', required: true },
    ],
    outputs: [{ id: 'video', type: 'video', label: 'Generated Video' }],
    defaultData: {
      label: 'Lip Sync',
      status: 'idle',
      inputImage: null,
      inputVideo: null,
      inputAudio: null,
      outputVideo: null,
      model: 'sync/lipsync-2',
      syncMode: 'loop',
      temperature: 0.5,
      activeSpeaker: false,
      jobId: null,
    },
  },
  voiceChange: {
    type: 'voiceChange',
    label: 'Voice Change',
    description: 'Replace or mix audio track in a video',
    category: 'ai',
    icon: 'AudioLines',
    inputs: [
      { id: 'video', type: 'video', label: 'Video', required: true },
      { id: 'audio', type: 'audio', label: 'New Audio', required: true },
    ],
    outputs: [{ id: 'video', type: 'video', label: 'Output Video' }],
    defaultData: {
      label: 'Voice Change',
      status: 'idle',
      inputVideo: null,
      inputAudio: null,
      outputVideo: null,
      preserveOriginalAudio: false,
      audioMixLevel: 0.5,
      jobId: null,
    },
  },
  transcribe: {
    type: 'transcribe',
    label: 'Transcribe',
    description: 'Convert video or audio to text transcript',
    category: 'ai',
    icon: 'FileText',
    inputs: [
      { id: 'video', type: 'video', label: 'Video' },
      { id: 'audio', type: 'audio', label: 'Audio' },
    ],
    outputs: [{ id: 'text', type: 'text', label: 'Transcript' }],
    defaultData: {
      label: 'Transcribe',
      status: 'idle',
      inputVideo: null,
      inputAudio: null,
      outputText: null,
      language: 'auto',
      timestamps: false,
      jobId: null,
    },
  },

  // Processing nodes
  resize: {
    type: 'resize',
    label: 'Resize',
    description: 'Resize images or videos',
    category: 'processing',
    icon: 'Maximize2',
    inputs: [{ id: 'media', type: 'image', label: 'Media', required: true }],
    outputs: [{ id: 'media', type: 'image', label: 'Resized Media' }],
    defaultData: {
      label: 'Resize',
      status: 'idle',
      inputMedia: null,
      inputType: null,
      outputMedia: null,
      targetAspectRatio: '16:9',
      targetWidth: null,
      targetHeight: null,
      fitMode: 'cover',
    },
  },
  animation: {
    type: 'animation',
    label: 'Animation',
    description: 'Apply easing curve to video',
    category: 'processing',
    icon: 'Wand2',
    inputs: [{ id: 'video', type: 'video', label: 'Video', required: true }],
    outputs: [{ id: 'video', type: 'video', label: 'Animated Video' }],
    defaultData: {
      label: 'Animation',
      status: 'idle',
      inputVideo: null,
      outputVideo: null,
      curveType: 'preset',
      preset: 'easeInOutCubic',
      customCurve: [0.645, 0.045, 0.355, 1],
      speedMultiplier: 1,
    },
  },
  videoStitch: {
    type: 'videoStitch',
    label: 'Video Stitch',
    description: 'Concatenate multiple videos',
    category: 'processing',
    icon: 'Layers',
    inputs: [{ id: 'videos', type: 'video', label: 'Videos', multiple: true, required: true }],
    outputs: [{ id: 'video', type: 'video', label: 'Stitched Video' }],
    defaultData: {
      label: 'Video Stitch',
      status: 'idle',
      inputVideos: [],
      outputVideo: null,
      transitionType: 'crossfade',
      transitionDuration: 0.5,
      seamlessLoop: false,
    },
  },
  videoTrim: {
    type: 'videoTrim',
    label: 'Video Trim',
    description: 'Trim video to a specific time range',
    category: 'processing',
    icon: 'Scissors',
    inputs: [{ id: 'video', type: 'video', label: 'Video', required: true }],
    outputs: [{ id: 'video', type: 'video', label: 'Trimmed Video' }],
    defaultData: {
      label: 'Video Trim',
      status: 'idle',
      inputVideo: null,
      outputVideo: null,
      startTime: 0,
      endTime: 60,
      duration: null,
      jobId: null,
    },
  },

  // Output nodes
  output: {
    type: 'output',
    label: 'Output',
    description: 'Final workflow output',
    category: 'output',
    icon: 'CheckCircle',
    inputs: [{ id: 'media', type: 'image', label: 'Media', required: true }],
    outputs: [],
    defaultData: {
      label: 'Output',
      status: 'idle',
      inputMedia: null,
      inputType: null,
      outputName: 'output',
    },
  },
  preview: {
    type: 'preview',
    label: 'Preview',
    description: 'Preview media with playback controls',
    category: 'output',
    icon: 'Eye',
    inputs: [{ id: 'media', type: 'image', label: 'Media', required: true }],
    outputs: [],
    defaultData: {
      label: 'Preview',
      status: 'idle',
      inputMedia: null,
      inputType: null,
      isPlaying: false,
      volume: 1,
    },
  },
  download: {
    type: 'download',
    label: 'Download',
    description: 'Download output file',
    category: 'output',
    icon: 'Download',
    inputs: [{ id: 'media', type: 'image', label: 'Media', required: true }],
    outputs: [],
    defaultData: {
      label: 'Download',
      status: 'idle',
      inputMedia: null,
      inputType: null,
      filename: 'output',
      format: 'mp4',
    },
  },
  socialPublish: {
    type: 'socialPublish',
    label: 'Social Publish',
    description: 'Publish video to YouTube, TikTok, or Instagram',
    category: 'output',
    icon: 'Share2',
    inputs: [{ id: 'video', type: 'video', label: 'Video', required: true }],
    outputs: [],
    defaultData: {
      label: 'Social Publish',
      status: 'idle',
      inputVideo: null,
      platform: 'youtube',
      title: '',
      description: '',
      tags: [],
      visibility: 'public',
      scheduledTime: null,
      publishedUrl: null,
      jobId: null,
    },
  },
};

// Helper to get nodes by category
export function getNodesByCategory(): Record<NodeCategory, NodeDefinition[]> {
  const categories: Record<NodeCategory, NodeDefinition[]> = {
    input: [],
    ai: [],
    processing: [],
    output: [],
  };

  for (const def of Object.values(NODE_DEFINITIONS)) {
    categories[def.category].push(def);
  }

  return categories;
}
