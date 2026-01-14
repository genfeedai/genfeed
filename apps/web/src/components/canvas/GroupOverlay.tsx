'use client';

import { useReactFlow } from '@xyflow/react';
import { clsx } from 'clsx';
import { Lock, Trash2, Unlock } from 'lucide-react';
import { memo, useMemo } from 'react';
import { useWorkflowStore } from '@/store/workflowStore';
import type { NodeGroup } from '@/types/groups';
import { GROUP_COLORS } from '@/types/groups';

interface GroupBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

function calculateGroupBounds(
  nodeIds: string[],
  getNode: (
    id: string
  ) =>
    | { position: { x: number; y: number }; measured?: { width?: number; height?: number } }
    | undefined
): GroupBounds | null {
  if (nodeIds.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const nodeId of nodeIds) {
    const node = getNode(nodeId);
    if (!node) continue;

    const width = node.measured?.width ?? 200;
    const height = node.measured?.height ?? 100;

    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + width);
    maxY = Math.max(maxY, node.position.y + height);
  }

  if (minX === Infinity) return null;

  const padding = 24;
  return {
    x: minX - padding,
    y: minY - padding - 32, // Extra space for header
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2 + 32,
  };
}

interface GroupOverlayItemProps {
  group: NodeGroup;
}

function GroupOverlayItem({ group }: GroupOverlayItemProps) {
  const { getNode } = useReactFlow();
  const { toggleGroupLock, deleteGroup } = useWorkflowStore();

  const bounds = useMemo(
    () => calculateGroupBounds(group.nodeIds, getNode),
    [group.nodeIds, getNode]
  );

  if (!bounds) return null;

  const colors = GROUP_COLORS[group.color ?? 'purple'];

  return (
    <div
      className={clsx(
        'absolute rounded-lg border-2 border-dashed pointer-events-auto',
        colors.bg,
        colors.border,
        group.isLocked && 'opacity-60'
      )}
      style={{
        left: bounds.x,
        top: bounds.y,
        width: bounds.width,
        height: bounds.height,
      }}
    >
      {/* Group Header */}
      <div
        className={clsx(
          'absolute -top-0 left-0 right-0 h-8 flex items-center justify-between px-3 rounded-t-lg',
          colors.bg
        )}
      >
        <span className={clsx('text-sm font-medium truncate', colors.text)}>{group.name}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleGroupLock(group.id)}
            className={clsx('p-1 rounded hover:bg-white/10 transition-colors', colors.text)}
            title={group.isLocked ? 'Unlock group' : 'Lock group'}
          >
            {group.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
          <button
            onClick={() => deleteGroup(group.id)}
            className={clsx('p-1 rounded hover:bg-white/10 transition-colors', colors.text)}
            title="Delete group"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lock Badge */}
      {group.isLocked && (
        <div
          className={clsx(
            'absolute top-10 left-3 px-2 py-0.5 rounded text-xs font-medium',
            colors.bg,
            colors.text
          )}
        >
          LOCKED
        </div>
      )}
    </div>
  );
}

function GroupOverlayComponent() {
  const { groups } = useWorkflowStore();

  if (groups.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      {groups.map((group) => (
        <GroupOverlayItem key={group.id} group={group} />
      ))}
    </div>
  );
}

export const GroupOverlay = memo(GroupOverlayComponent);
