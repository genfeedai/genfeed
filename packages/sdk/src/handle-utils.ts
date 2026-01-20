import type { HandleType } from '@genfeedai/types';
import type { HandleDefinition } from './types';

/**
 * Helper functions for creating handle definitions
 */

/**
 * Create an image input handle
 */
export function imageInput(
  id: string,
  label: string,
  options?: Partial<Omit<HandleDefinition, 'id' | 'type' | 'label'>>
): HandleDefinition {
  return { id, type: 'image', label, ...options };
}

/**
 * Create an image output handle
 */
export function imageOutput(id: string, label: string): HandleDefinition {
  return { id, type: 'image', label };
}

/**
 * Create a video input handle
 */
export function videoInput(
  id: string,
  label: string,
  options?: Partial<Omit<HandleDefinition, 'id' | 'type' | 'label'>>
): HandleDefinition {
  return { id, type: 'video', label, ...options };
}

/**
 * Create a video output handle
 */
export function videoOutput(id: string, label: string): HandleDefinition {
  return { id, type: 'video', label };
}

/**
 * Create a text input handle
 */
export function textInput(
  id: string,
  label: string,
  options?: Partial<Omit<HandleDefinition, 'id' | 'type' | 'label'>>
): HandleDefinition {
  return { id, type: 'text', label, ...options };
}

/**
 * Create a text output handle
 */
export function textOutput(id: string, label: string): HandleDefinition {
  return { id, type: 'text', label };
}

/**
 * Create an audio input handle
 */
export function audioInput(
  id: string,
  label: string,
  options?: Partial<Omit<HandleDefinition, 'id' | 'type' | 'label'>>
): HandleDefinition {
  return { id, type: 'audio', label, ...options };
}

/**
 * Create an audio output handle
 */
export function audioOutput(id: string, label: string): HandleDefinition {
  return { id, type: 'audio', label };
}

/**
 * Create a number input handle
 */
export function numberInput(
  id: string,
  label: string,
  options?: Partial<Omit<HandleDefinition, 'id' | 'type' | 'label'>>
): HandleDefinition {
  return { id, type: 'number', label, ...options };
}

/**
 * Create a number output handle
 */
export function numberOutput(id: string, label: string): HandleDefinition {
  return { id, type: 'number', label };
}

/**
 * Check if two handle types are compatible
 */
export function areTypesCompatible(source: HandleType, target: HandleType): boolean {
  return source === target;
}

/**
 * Get the color for a handle type (for UI consistency)
 */
export function getHandleColor(type: HandleType): string {
  const colors: Record<HandleType, string> = {
    image: '#10b981', // emerald
    video: '#3b82f6', // blue
    text: '#f59e0b', // amber
    audio: '#8b5cf6', // violet
    number: '#ef4444', // red
  };
  return colors[type] ?? '#6b7280'; // gray fallback
}
