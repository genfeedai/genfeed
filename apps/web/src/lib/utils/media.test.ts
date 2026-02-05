import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getImageDimensions, getVideoMetadata } from './media';

describe('getImageDimensions', () => {
  let mockImage: Record<string, unknown>;

  beforeEach(() => {
    mockImage = {};
    vi.stubGlobal(
      'Image',
      vi.fn(() => mockImage)
    );
  });

  it('resolves with correct dimensions on load', async () => {
    const promise = getImageDimensions('https://example.com/image.png');
    mockImage.width = 1920;
    mockImage.height = 1080;
    (mockImage.onload as () => void)();
    expect(await promise).toEqual({ width: 1920, height: 1080 });
  });

  it('resolves with {0,0} on error', async () => {
    const promise = getImageDimensions('https://example.com/bad.png');
    (mockImage.onerror as () => void)();
    expect(await promise).toEqual({ width: 0, height: 0 });
  });

  it('sets crossOrigin to anonymous', () => {
    getImageDimensions('https://example.com/image.png');
    expect(mockImage.crossOrigin).toBe('anonymous');
  });
});

describe('getVideoMetadata', () => {
  let mockVideo: Record<string, unknown>;

  beforeEach(() => {
    mockVideo = {};
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'video') return mockVideo as unknown as HTMLVideoElement;
      return document.createElement(tag);
    });
  });

  it('resolves with duration and dimensions on loadedmetadata', async () => {
    const promise = getVideoMetadata('https://example.com/video.mp4');
    mockVideo.duration = 30.5;
    mockVideo.videoWidth = 3840;
    mockVideo.videoHeight = 2160;
    (mockVideo.onloadedmetadata as () => void)();
    expect(await promise).toEqual({
      duration: 30.5,
      dimensions: { width: 3840, height: 2160 },
    });
  });

  it('resolves with zeros on error', async () => {
    const promise = getVideoMetadata('https://example.com/bad.mp4');
    (mockVideo.onerror as () => void)();
    expect(await promise).toEqual({
      duration: 0,
      dimensions: { width: 0, height: 0 },
    });
  });

  it('sets crossOrigin to anonymous', () => {
    getVideoMetadata('https://example.com/video.mp4');
    expect(mockVideo.crossOrigin).toBe('anonymous');
  });
});
