import { describe, expect, it } from 'vitest';

import type { HandleDefinition } from '@genfeedai/types';

import { generateHandlesFromSchema, isSchemaHandle } from './schemaHandles';

describe('generateHandlesFromSchema', () => {
  const staticHandles: HandleDefinition[] = [
    { id: 'prompt', type: 'text', label: 'Prompt' },
    { id: 'image', type: 'image', label: 'Image' },
  ];

  it('returns staticHandles when no schema is provided', () => {
    const result = generateHandlesFromSchema(undefined, staticHandles);
    expect(result).toBe(staticHandles);
  });

  it('returns staticHandles when schema has no properties', () => {
    const schema = { required: ['prompt'] };
    const result = generateHandlesFromSchema(schema, staticHandles);
    expect(result).toBe(staticHandles);
  });

  it('returns staticHandles only when schema has no handle-able fields', () => {
    const schema = {
      properties: {
        width: { type: 'number' },
        height: { type: 'number' },
      },
    };
    const result = generateHandlesFromSchema(schema, staticHandles);
    expect(result).toEqual(staticHandles);
  });

  it('adds a dynamic image handle from schema', () => {
    const schema = {
      properties: {
        start_image: { type: 'string', title: 'Start Image' },
      },
    };
    const result = generateHandlesFromSchema(schema, staticHandles);
    expect(result).toHaveLength(3);
    expect(result[2]).toEqual({
      id: 'start_image',
      type: 'image',
      label: 'Start Image',
      multiple: false,
      required: undefined,
      fromSchema: true,
    });
  });

  it('does not add duplicate when static handle already covers the field', () => {
    const schema = {
      properties: {
        prompt: { type: 'string', title: 'Prompt' },
        start_image: { type: 'string', title: 'Start Image' },
      },
    };
    const result = generateHandlesFromSchema(schema, staticHandles);
    // prompt already in static, only start_image is added
    expect(result).toHaveLength(3);
    expect(result.filter((h) => h.id === 'prompt')).toHaveLength(1);
  });

  it('sets multiple to true for array type fields', () => {
    const schema = {
      properties: {
        reference_images: { type: 'array', title: 'Reference Images' },
      },
    };
    const result = generateHandlesFromSchema(schema, staticHandles);
    const refHandle = result.find((h) => h.id === 'reference_images');
    expect(refHandle).toBeDefined();
    expect(refHandle!.multiple).toBe(true);
  });

  it('marks field as required when in schema.required array', () => {
    const schema = {
      required: ['start_image'],
      properties: {
        start_image: { type: 'string' },
      },
    };
    const result = generateHandlesFromSchema(schema, staticHandles);
    const handle = result.find((h) => h.id === 'start_image');
    expect(handle).toBeDefined();
    expect(handle!.required).toBe(true);
  });

  it('uses title from schema property as label when available', () => {
    const schema = {
      properties: {
        start_image: { type: 'string', title: 'Custom Title' },
      },
    };
    const result = generateHandlesFromSchema(schema, staticHandles);
    const handle = result.find((h) => h.id === 'start_image');
    expect(handle!.label).toBe('Custom Title');
  });

  it('falls back to formatted field name when title is missing', () => {
    const schema = {
      properties: {
        start_image: { type: 'string' },
      },
    };
    const result = generateHandlesFromSchema(schema, staticHandles);
    const handle = result.find((h) => h.id === 'start_image');
    expect(handle!.label).toBe('Start Image');
  });

  it('marks all dynamic handles with fromSchema: true', () => {
    const schema = {
      properties: {
        start_image: { type: 'string' },
        end_image: { type: 'string' },
        video_url: { type: 'string' },
      },
    };
    const result = generateHandlesFromSchema(schema, staticHandles);
    const dynamicHandles = result.filter((h) => !staticHandles.includes(h));
    expect(dynamicHandles).toHaveLength(3);
    for (const handle of dynamicHandles) {
      expect(handle.fromSchema).toBe(true);
    }
  });
});

describe('isSchemaHandle', () => {
  it('returns true when fromSchema is true', () => {
    const handle: HandleDefinition = {
      id: 'start_image',
      type: 'image',
      label: 'Start Image',
      fromSchema: true,
    };
    expect(isSchemaHandle(handle)).toBe(true);
  });

  it('returns false when fromSchema is false', () => {
    const handle: HandleDefinition = {
      id: 'prompt',
      type: 'text',
      label: 'Prompt',
      fromSchema: false,
    };
    expect(isSchemaHandle(handle)).toBe(false);
  });

  it('returns false when fromSchema is not set', () => {
    const handle: HandleDefinition = {
      id: 'prompt',
      type: 'text',
      label: 'Prompt',
    };
    expect(isSchemaHandle(handle)).toBe(false);
  });

  it('returns false when fromSchema is undefined', () => {
    const handle: HandleDefinition = {
      id: 'prompt',
      type: 'text',
      label: 'Prompt',
      fromSchema: undefined,
    };
    expect(isSchemaHandle(handle)).toBe(false);
  });
});
