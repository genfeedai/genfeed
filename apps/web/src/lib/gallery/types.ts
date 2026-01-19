export interface GalleryItem {
  id: string;
  name: string;
  path: string;
  type: 'image' | 'video' | 'audio';
  size: number;
  mimeType: string;
  modifiedAt: string;
}

export interface GalleryResponse {
  items: GalleryItem[];
  total: number;
}

export const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'] as const;
export const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov'] as const;
export const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'] as const;

export const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
};
