/**
 * Node Dimensions Utility
 *
 * Calculate node dimensions based on output aspect ratio,
 * respecting min/max constraints.
 */

/**
 * Extract dimensions from a base64 data URL image.
 */
export function getImageDimensions(
  base64DataUrl: string
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    if (!base64DataUrl || !base64DataUrl.startsWith('data:image')) {
      resolve(null);
      return;
    }

    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = base64DataUrl;
  });
}

/**
 * Extract dimensions from a video data URL or blob URL.
 */
export function getVideoDimensions(
  videoUrl: string
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    if (!videoUrl) {
      resolve(null);
      return;
    }

    const video = document.createElement('video');
    video.onloadedmetadata = () => {
      resolve({ width: video.videoWidth, height: video.videoHeight });
    };
    video.onerror = () => {
      resolve(null);
    };
    video.src = videoUrl;
  });
}

// Node sizing constraints
const MIN_WIDTH = 200;
const MAX_WIDTH = 500;
const MIN_HEIGHT = 200;
const MAX_HEIGHT = 600;

// Node chrome: header (~40px), controls/padding (~60px)
const NODE_CHROME_HEIGHT = 100;

/**
 * Calculate node dimensions that maintain aspect ratio within constraints.
 *
 * @param aspectRatio - Width divided by height (e.g., 16/9 for landscape)
 * @param baseWidth - Starting width to calculate from (default 300px)
 */
export function calculateNodeSize(
  aspectRatio: number,
  baseWidth: number = 300
): { width: number; height: number } {
  if (!aspectRatio || aspectRatio <= 0 || !Number.isFinite(aspectRatio)) {
    return { width: 300, height: 300 };
  }

  let width = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, baseWidth));

  let contentHeight = width / aspectRatio;
  let totalHeight = contentHeight + NODE_CHROME_HEIGHT;

  if (totalHeight > MAX_HEIGHT) {
    contentHeight = MAX_HEIGHT - NODE_CHROME_HEIGHT;
    width = contentHeight * aspectRatio;
    totalHeight = MAX_HEIGHT;
  }

  if (totalHeight < MIN_HEIGHT) {
    contentHeight = MIN_HEIGHT - NODE_CHROME_HEIGHT;
    width = contentHeight * aspectRatio;
    totalHeight = MIN_HEIGHT;
  }

  if (width > MAX_WIDTH) {
    width = MAX_WIDTH;
    contentHeight = width / aspectRatio;
    totalHeight = contentHeight + NODE_CHROME_HEIGHT;
    totalHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, totalHeight));
  }

  if (width < MIN_WIDTH) {
    width = MIN_WIDTH;
    contentHeight = width / aspectRatio;
    totalHeight = contentHeight + NODE_CHROME_HEIGHT;
    totalHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, totalHeight));
  }

  return {
    width: Math.round(width),
    height: Math.round(totalHeight),
  };
}

/**
 * Calculate node dimensions preserving current height if provided.
 *
 * @param aspectRatio - Width divided by height
 * @param currentHeight - Optional current height to preserve (if within constraints)
 */
export function calculateNodeSizePreservingHeight(
  aspectRatio: number,
  currentHeight?: number
): { width: number; height: number } {
  if (!aspectRatio || aspectRatio <= 0 || !Number.isFinite(aspectRatio)) {
    return { width: 300, height: currentHeight ?? 300 };
  }

  if (currentHeight !== undefined && currentHeight >= MIN_HEIGHT && currentHeight <= MAX_HEIGHT) {
    const contentHeight = currentHeight - NODE_CHROME_HEIGHT;
    let width = contentHeight * aspectRatio;
    width = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width));

    return {
      width: Math.round(width),
      height: Math.round(currentHeight),
    };
  }

  return calculateNodeSize(aspectRatio);
}
