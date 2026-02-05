import { Copy, Image, Lock, LockOpen, Palette, Scissors, Trash2 } from 'lucide-react';
import { type ContextMenuItemConfig, createSeparator } from '@/components/context-menu/ContextMenu';
import { NODE_COLORS, NODE_COLOR_LABELS, NODE_COLOR_VALUES } from '@/lib/constants/colors';

interface NodeMenuOptions {
  nodeId: string;
  isLocked: boolean;
  hasMediaOutput: boolean;
  currentColor?: string;
  onDuplicate: (nodeId: string) => void;
  onLock: (nodeId: string) => void;
  onUnlock: (nodeId: string) => void;
  onCut: (nodeId: string) => void;
  onCopy: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onSetAsThumbnail?: (nodeId: string) => void;
  onSetColor?: (nodeId: string, color: string | null) => void;
}

export function getNodeMenuItems({
  nodeId,
  isLocked,
  hasMediaOutput,
  currentColor,
  onDuplicate,
  onLock,
  onUnlock,
  onCut,
  onCopy,
  onDelete,
  onSetAsThumbnail,
  onSetColor,
}: NodeMenuOptions): ContextMenuItemConfig[] {
  const items: ContextMenuItemConfig[] = [
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: <Copy className="w-4 h-4" />,
      shortcut: '⌘D',
      onClick: () => onDuplicate(nodeId),
    },
  ];

  // Add "Set as Thumbnail" option for nodes with media output
  if (hasMediaOutput && onSetAsThumbnail) {
    items.push({
      id: 'setThumbnail',
      label: 'Set as Thumbnail',
      icon: <Image className="w-4 h-4" />,
      onClick: () => onSetAsThumbnail(nodeId),
    });
  }

  // Add color picker submenu
  if (onSetColor) {
    const colorSubmenu: ContextMenuItemConfig[] = NODE_COLORS.map((color) => {
      const colorValue = NODE_COLOR_VALUES[color];
      const isSelected = colorValue === currentColor || (color === 'none' && !currentColor);
      return {
        id: `color-${color}`,
        label: `${isSelected ? '✓ ' : ''}${NODE_COLOR_LABELS[color]}`,
        icon: (
          <div
            className="w-4 h-4 rounded-sm border border-border"
            style={{ backgroundColor: colorValue || 'transparent' }}
          />
        ),
        onClick: () => onSetColor(nodeId, colorValue),
      };
    });

    items.push({
      id: 'setColor',
      label: 'Set Color',
      icon: <Palette className="w-4 h-4" />,
      submenu: colorSubmenu,
    });
  }

  items.push(createSeparator('separator-1'));

  items.push(
    isLocked
      ? {
          id: 'unlock',
          label: 'Unlock Node',
          icon: <LockOpen className="w-4 h-4" />,
          shortcut: 'L',
          onClick: () => onUnlock(nodeId),
        }
      : {
          id: 'lock',
          label: 'Lock Node',
          icon: <Lock className="w-4 h-4" />,
          shortcut: 'L',
          onClick: () => onLock(nodeId),
        }
  );

  items.push(createSeparator('separator-2'));

  items.push(
    {
      id: 'cut',
      label: 'Cut',
      icon: <Scissors className="w-4 h-4" />,
      shortcut: '⌘X',
      onClick: () => onCut(nodeId),
    },
    {
      id: 'copy',
      label: 'Copy',
      icon: <Copy className="w-4 h-4" />,
      shortcut: '⌘C',
      onClick: () => onCopy(nodeId),
    }
  );

  items.push(createSeparator('separator-3'));

  items.push({
    id: 'delete',
    label: 'Delete',
    icon: <Trash2 className="w-4 h-4" />,
    shortcut: '⌫',
    danger: true,
    onClick: () => onDelete(nodeId),
  });

  return items;
}
