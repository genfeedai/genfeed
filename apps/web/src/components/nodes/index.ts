export * from './ai';
export { BaseNode } from './BaseNode';
export * from './input';
export * from './output';
export * from './processing';

// Node type mapping for React Flow
import type { NodeTypes } from '@xyflow/react';
import { ImageGenNode, LLMNode, TweetRemixNode, VideoGenNode } from './ai';
import { ImageInputNode, PromptNode, TemplateNode, TweetInputNode } from './input';
import { OutputNode, PreviewNode } from './output';
import { AnimationNode, VideoStitchNode } from './processing';

export const nodeTypes: NodeTypes = {
  imageInput: ImageInputNode,
  prompt: PromptNode,
  template: TemplateNode,
  tweetInput: TweetInputNode,
  imageGen: ImageGenNode,
  videoGen: VideoGenNode,
  llm: LLMNode,
  tweetRemix: TweetRemixNode,
  animation: AnimationNode,
  videoStitch: VideoStitchNode,
  output: OutputNode,
  preview: PreviewNode,
};
