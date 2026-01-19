export * from './ai';
export { BaseNode } from './BaseNode';
export * from './input';
export * from './output';
export * from './processing';

// Node type mapping for React Flow
import type { NodeTypes } from '@xyflow/react';
import {
  ImageGenNode,
  LipSyncNode,
  LLMNode,
  TextToSpeechNode,
  TranscribeNode,
  VideoGenNode,
  VoiceChangeNode,
} from './ai';
import { AudioInputNode, ImageInputNode, PromptNode, TemplateNode, VideoInputNode } from './input';
import { OutputNode, PreviewNode } from './output';
import {
  AnimationNode,
  AnnotationNode,
  ImageGridSplitNode,
  LumaReframeImageNode,
  LumaReframeVideoNode,
  ResizeNode,
  SubtitleNode,
  TopazImageUpscaleNode,
  TopazVideoUpscaleNode,
  VideoFrameExtractNode,
  VideoStitchNode,
  VideoTrimNode,
} from './processing';

export const nodeTypes: NodeTypes = {
  audioInput: AudioInputNode,
  imageInput: ImageInputNode,
  videoInput: VideoInputNode,
  prompt: PromptNode,
  template: TemplateNode,
  imageGen: ImageGenNode,
  videoGen: VideoGenNode,
  llm: LLMNode,
  lipSync: LipSyncNode,
  voiceChange: VoiceChangeNode,
  textToSpeech: TextToSpeechNode,
  transcribe: TranscribeNode,
  resize: ResizeNode,
  animation: AnimationNode,
  annotation: AnnotationNode,
  imageGridSplit: ImageGridSplitNode,
  videoStitch: VideoStitchNode,
  videoTrim: VideoTrimNode,
  videoFrameExtract: VideoFrameExtractNode,
  lumaReframeImage: LumaReframeImageNode,
  lumaReframeVideo: LumaReframeVideoNode,
  topazImageUpscale: TopazImageUpscaleNode,
  topazVideoUpscale: TopazVideoUpscaleNode,
  subtitle: SubtitleNode,
  output: OutputNode,
  preview: PreviewNode,
};
