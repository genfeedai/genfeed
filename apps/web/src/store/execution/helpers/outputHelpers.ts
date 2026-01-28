import type { useWorkflowStore } from '@/store/workflowStore';

/**
 * Extract the actual URL/value from various Replicate output formats
 * Replicate outputs can be:
 * - A string URL directly: "https://..."
 * - An array with one URL: ["https://..."]
 * - An object with a url field: { url: "https://..." }
 * - An object with image/video field: { image: "https://..." } or { video: "https://..." }
 */
function extractOutputValue(output: unknown): string | null {
  if (!output) return null;

  // Direct string URL
  if (typeof output === 'string') {
    return output;
  }

  // Array of URLs - take the first one
  if (Array.isArray(output) && output.length > 0) {
    const first = output[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object' && 'url' in first) {
      return String((first as { url: unknown }).url);
    }
  }

  // Object with url, image, or video field (backend normalizes to these formats)
  if (typeof output === 'object' && output !== null) {
    const obj = output as Record<string, unknown>;
    if ('url' in obj) return String(obj.url);
    if ('image' in obj) return String(obj.image);
    if ('video' in obj) return String(obj.video);
  }

  return null;
}

/**
 * Map output to correct node data field based on node type
 */
export function getOutputUpdate(
  nodeId: string,
  output: unknown,
  workflowStore: ReturnType<typeof useWorkflowStore.getState>
): Record<string, unknown> {
  const node = workflowStore.getNodeById(nodeId);
  if (!node) return {};

  const nodeType = node.type;
  const outputValue = extractOutputValue(output);

  // Image output nodes
  if (['imageGen'].includes(nodeType)) {
    return { outputImage: outputValue };
  }

  // Unified nodes - output type matches input type
  if (['reframe', 'upscale'].includes(nodeType)) {
    const inputType = (node.data as { inputType?: string }).inputType;
    if (inputType === 'video') {
      return { outputVideo: outputValue };
    }
    return { outputImage: outputValue };
  }

  // Video output nodes
  if (['videoGen', 'animation', 'videoStitch', 'lipSync', 'voiceChange'].includes(nodeType)) {
    return { outputVideo: outputValue };
  }

  // Audio output nodes
  if (nodeType === 'textToSpeech') {
    return { outputAudio: outputValue };
  }

  // LLM nodes - keep original for text (might be array of strings)
  if (nodeType === 'llm') {
    const textOutput = Array.isArray(output) ? output.join('') : outputValue;
    return { outputText: textOutput };
  }

  // Resize nodes
  if (nodeType === 'resize') {
    return { outputMedia: outputValue };
  }

  return { output: outputValue };
}
