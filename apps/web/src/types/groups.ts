/**
 * Node Group Types
 * Groups allow users to organize and lock multiple nodes together
 */

export interface NodeGroup {
  id: string;
  name: string;
  nodeIds: string[];
  isLocked: boolean;
  color?: GroupColor;
  collapsed?: boolean;
}

export type GroupColor =
  | 'purple'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'orange'
  | 'red'
  | 'pink'
  | 'gray';

export const GROUP_COLORS: Record<GroupColor, { bg: string; border: string; text: string }> = {
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
  },
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
  },
  green: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-400',
  },
  yellow: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
  },
  orange: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
  },
  red: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
  },
  pink: {
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/30',
    text: 'text-pink-400',
  },
  gray: {
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/30',
    text: 'text-gray-400',
  },
};

export const DEFAULT_GROUP_COLORS: GroupColor[] = [
  'purple',
  'blue',
  'green',
  'yellow',
  'orange',
  'red',
  'pink',
  'gray',
];
