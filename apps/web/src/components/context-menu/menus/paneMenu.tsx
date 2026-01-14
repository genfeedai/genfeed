import { Bot, Clipboard, Image, Maximize, MessageSquare, Monitor, Video } from 'lucide-react';
import type { ContextMenuItemConfig } from '../ContextMenu';

interface PaneMenuOptions {
  screenX: number;
  screenY: number;
  hasClipboard: boolean;
  onAddNode: (type: string, screenX: number, screenY: number) => void;
  onPaste: () => void;
  onSelectAll: () => void;
  onFitView: () => void;
}

export function getPaneMenuItems({
  screenX,
  screenY,
  hasClipboard,
  onAddNode,
  onPaste,
  onSelectAll,
  onFitView,
}: PaneMenuOptions): ContextMenuItemConfig[] {
  return [
    {
      id: 'add-prompt',
      label: 'Add Prompt Node',
      icon: <MessageSquare className="w-4 h-4" />,
      onClick: () => onAddNode('prompt', screenX, screenY),
    },
    {
      id: 'add-image-gen',
      label: 'Add Image Generator',
      icon: <Image className="w-4 h-4" />,
      onClick: () => onAddNode('imageGen', screenX, screenY),
    },
    {
      id: 'add-video-gen',
      label: 'Add Video Generator',
      icon: <Video className="w-4 h-4" />,
      onClick: () => onAddNode('videoGen', screenX, screenY),
    },
    {
      id: 'add-llm',
      label: 'Add LLM Node',
      icon: <Bot className="w-4 h-4" />,
      onClick: () => onAddNode('llm', screenX, screenY),
    },
    {
      id: 'add-output',
      label: 'Add Output Node',
      icon: <Monitor className="w-4 h-4" />,
      onClick: () => onAddNode('output', screenX, screenY),
    },
    {
      id: 'separator-1',
      label: '',
      separator: true,
      onClick: () => {},
    },
    {
      id: 'paste',
      label: 'Paste',
      icon: <Clipboard className="w-4 h-4" />,
      shortcut: '⌘V',
      disabled: !hasClipboard,
      onClick: onPaste,
    },
    {
      id: 'separator-2',
      label: '',
      separator: true,
      onClick: () => {},
    },
    {
      id: 'select-all',
      label: 'Select All',
      shortcut: '⌘A',
      onClick: onSelectAll,
    },
    {
      id: 'fit-view',
      label: 'Fit View',
      icon: <Maximize className="w-4 h-4" />,
      shortcut: 'F',
      onClick: onFitView,
    },
  ];
}
