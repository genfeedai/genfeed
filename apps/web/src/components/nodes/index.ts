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
  TweetRemixNode,
  VideoGenNode,
  VoiceChangeNode,
} from './ai';
import {
  AudioInputNode,
  ImageInputNode,
  PromptNode,
  RssInputNode,
  TemplateNode,
  TweetInputNode,
  VideoInputNode,
} from './input';
import { OutputNode, PreviewNode, SocialPublishNode } from './output';
import {
  AnimationNode,
  AnnotationNode,
  ImageGridSplitNode,
  LumaReframeImageNode,
  LumaReframeVideoNode,
  ResizeNode,
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
  tweetInput: TweetInputNode,
  rssInput: RssInputNode,
  imageGen: ImageGenNode,
  videoGen: VideoGenNode,
  llm: LLMNode,
  tweetRemix: TweetRemixNode,
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
  output: OutputNode,
  preview: PreviewNode,
  socialPublish: SocialPublishNode,
};
