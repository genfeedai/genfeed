/**
 * Category colors for workflow nodes.
 * These hex values match the CSS variables in globals.scss.
 * Update both places when changing colors.
 */
export const CATEGORY_COLORS: Record<string, string> = {
  input: '#2dd4bf', // teal - oklch(0.7 0.15 160)
  ai: '#a855f7', // purple - oklch(0.65 0.25 300)
  processing: '#818cf8', // blue - oklch(0.65 0.2 250)
  output: '#f59e0b', // amber - oklch(0.75 0.18 70)
};

export const DEFAULT_NODE_COLOR = '#6b7280';
