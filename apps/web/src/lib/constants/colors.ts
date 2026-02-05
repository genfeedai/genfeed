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

/**
 * Node color palette for individual node coloring.
 * These are the same colors used for groups.
 */
export type NodeColor =
  | 'none'
  | 'purple'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'orange'
  | 'red'
  | 'pink'
  | 'gray';

export const NODE_COLOR_VALUES: Record<NodeColor, string | null> = {
  none: null,
  purple: '#a855f7',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  orange: '#f97316',
  red: '#ef4444',
  pink: '#ec4899',
  gray: '#6b7280',
};

export const NODE_COLOR_LABELS: Record<NodeColor, string> = {
  none: 'Default',
  purple: 'Purple',
  blue: 'Blue',
  green: 'Green',
  yellow: 'Yellow',
  orange: 'Orange',
  red: 'Red',
  pink: 'Pink',
  gray: 'Gray',
};

export const NODE_COLORS: NodeColor[] = [
  'none',
  'purple',
  'blue',
  'green',
  'yellow',
  'orange',
  'red',
  'pink',
  'gray',
];
