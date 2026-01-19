import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import {
  AUDIO_EXTENSIONS,
  type GalleryItem,
  type GalleryResponse,
  IMAGE_EXTENSIONS,
  MIME_TYPES,
  VIDEO_EXTENSIONS,
} from '@/lib/gallery/types';

const OUTPUT_DIR = path.resolve(process.cwd(), '../../output');

async function getFilesFromDirectory(
  dirPath: string,
  relativePath: string,
  type: 'image' | 'video' | 'audio'
): Promise<GalleryItem[]> {
  const items: GalleryItem[] = [];
  const extensionMap = {
    image: IMAGE_EXTENSIONS,
    video: VIDEO_EXTENSIONS,
    audio: AUDIO_EXTENSIONS,
  };
  const extensions: readonly string[] = extensionMap[type];

  try {
    const files = await readdir(dirPath);

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (!extensions.includes(ext)) continue;

      const filePath = path.join(dirPath, file);
      const fileStat = await stat(filePath);

      if (!fileStat.isFile()) continue;

      items.push({
        id: Buffer.from(`${relativePath}/${file}`).toString('base64url'),
        name: file,
        path: `${relativePath}/${file}`,
        type,
        size: fileStat.size,
        mimeType: MIME_TYPES[ext] || 'application/octet-stream',
        modifiedAt: fileStat.mtime.toISOString(),
      });
    }
  } catch {
    // Directory doesn't exist or is not readable
  }

  return items;
}

export async function GET(): Promise<NextResponse<GalleryResponse>> {
  const imagesDir = path.join(OUTPUT_DIR, 'images');
  const videosDir = path.join(OUTPUT_DIR, 'videos');
  const audioDir = path.join(OUTPUT_DIR, 'audio');

  const [images, videos, audio] = await Promise.all([
    getFilesFromDirectory(imagesDir, 'images', 'image'),
    getFilesFromDirectory(videosDir, 'videos', 'video'),
    getFilesFromDirectory(audioDir, 'audio', 'audio'),
  ]);

  const items = [...images, ...videos, ...audio].sort(
    (a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
  );

  return NextResponse.json({
    items,
    total: items.length,
  });
}
