import type {
  ImageGenNodeData,
  ImageInputNodeData,
  NodeType,
  OutputNodeData,
  VideoGenNodeData,
  VideoInputNodeData,
  WorkflowNodeData,
} from '@genfeedai/types';

export interface MediaInfo {
  url: string | null;
  type: 'image' | 'video' | null;
}

/**
 * Extract media URL and type from node data
 */
export function getMediaFromNode(nodeType: NodeType, data: WorkflowNodeData): MediaInfo {
  switch (nodeType) {
    case 'imageGen': {
      const imgData = data as ImageGenNodeData;
      return { url: imgData.outputImage, type: imgData.outputImage ? 'image' : null };
    }
    case 'videoGen': {
      const vidData = data as VideoGenNodeData;
      return { url: vidData.outputVideo, type: vidData.outputVideo ? 'video' : null };
    }
    case 'imageInput': {
      const inputData = data as ImageInputNodeData;
      return { url: inputData.image, type: inputData.image ? 'image' : null };
    }
    case 'videoInput': {
      const vidInputData = data as VideoInputNodeData;
      return { url: vidInputData.video, type: vidInputData.video ? 'video' : null };
    }
    case 'output': {
      const outData = data as OutputNodeData;
      const mediaType = outData.inputType === 'text' ? null : outData.inputType;
      return { url: outData.inputMedia, type: mediaType };
    }
    default:
      return { url: null, type: null };
  }
}
