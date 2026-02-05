/**
 * Get the dimensions of an image from its source URL or data URL.
 */
export function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = src;
  });
}

/**
 * Get duration and dimensions of a video from its source URL or data URL.
 */
export function getVideoMetadata(
  src: string
): Promise<{ duration: number; dimensions: { width: number; height: number } }> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.onloadedmetadata = () =>
      resolve({
        duration: video.duration,
        dimensions: { width: video.videoWidth, height: video.videoHeight },
      });
    video.onerror = () => resolve({ duration: 0, dimensions: { width: 0, height: 0 } });
    video.src = src;
  });
}
