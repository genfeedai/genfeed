import { Copy, Image, Lock, LockOpen, Scissors, Trash2 } from 'lucide-react';
import { type ContextMenuItemConfig, createSeparator } from '@/components/context-menu/ContextMenu';

interface NodeMenuOptions {
  nodeId: string;
  isLocked: boolean;
  hasMediaOutput: boolean;
  onDuplicate: (nodeId: string) => void;
  onLock: (nodeId: string) => void;
  onUnlock: (nodeId: string) => void;
  onCut: (nodeId: string) => void;
  onCopy: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onSetAsThumbnail?: (nodeId: string) => void;
}

export function getNodeMenuItems({
  nodeId,
  isLocked,
  hasMediaOutput,
  onDuplicate,
  onLock,
  onUnlock,
  onCut,
  onCopy,
  onDelete,
  onSetAsThumbnail,
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
