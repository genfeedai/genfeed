import { useCallback, useMemo } from 'react';
import { nodeRegistry } from '../registry';
import type { CustomNodeData, CustomNodeDefinition, ValidationResult } from '../types';
import { validateNodeData } from '../validation';

/**
 * Hook to get a node definition by type
 */
export function useNodeDefinition(type: string): CustomNodeDefinition | undefined {
  return useMemo(() => nodeRegistry.get(type), [type]);
}

/**
 * Hook to get all registered nodes
 */
export function useAllNodes(): CustomNodeDefinition[] {
  return useMemo(() => nodeRegistry.getAll(), []);
}

/**
 * Hook to get nodes by category
 */
export function useNodesByCategory(category: string): CustomNodeDefinition[] {
  return useMemo(() => nodeRegistry.getByCategory(category), [category]);
}

/**
 * Hook for validating node data
 */
export function useNodeValidation<TData extends CustomNodeData>(
  data: TData,
  definition: CustomNodeDefinition<TData> | undefined,
  inputs: Record<string, unknown>
): ValidationResult {
  return useMemo(() => {
    if (!definition) {
      return { valid: true };
    }
    return validateNodeData(data, definition, inputs);
  }, [data, definition, inputs]);
}

/**
 * Hook for updating node data
 * Returns a memoized update function
 */
export function useNodeDataUpdater<TData extends CustomNodeData>(
  data: TData,
  onUpdate: (data: TData) => void
): {
  updateField: <K extends keyof TData>(key: K, value: TData[K]) => void;
  updateFields: (updates: Partial<TData>) => void;
} {
  const updateField = useCallback(
    <K extends keyof TData>(key: K, value: TData[K]) => {
      onUpdate({ ...data, [key]: value });
    },
    [data, onUpdate]
  );

  const updateFields = useCallback(
    (updates: Partial<TData>) => {
      onUpdate({ ...data, ...updates });
    },
    [data, onUpdate]
  );

  return { updateField, updateFields };
}

/**
 * Hook for estimating node cost
 */
export function useNodeCostEstimate<TData extends CustomNodeData>(
  data: TData,
  definition: CustomNodeDefinition<TData> | undefined
): { estimated: number; breakdown?: Record<string, number>; description?: string } | null {
  return useMemo(() => {
    if (!definition?.estimateCost) {
      return null;
    }
    return definition.estimateCost(data);
  }, [data, definition]);
}
