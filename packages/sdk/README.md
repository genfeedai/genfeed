# @genfeedai/sdk

SDK for building custom Genfeed nodes. Create custom nodes for the Genfeed workflow editor without forking the core repository.

## Installation

```bash
npm install @genfeedai/sdk
# or
bun add @genfeedai/sdk
```

## Quick Start

### Define a Custom Node

```typescript
import { createNode, registerNode, imageInput, imageOutput } from '@genfeedai/sdk';

// Create a custom image filter node
const imageFilterNode = createNode('myOrg/imageFilter')
  .name('Image Filter')
  .description('Apply artistic filters to images')
  .category('processing')
  .icon('filter')
  .input('image', 'image', 'Input Image', { required: true })
  .output('image', 'image', 'Filtered Image')
  .config({
    key: 'filterType',
    type: 'select',
    label: 'Filter Type',
    options: [
      { value: 'grayscale', label: 'Grayscale' },
      { value: 'sepia', label: 'Sepia' },
      { value: 'blur', label: 'Blur' },
    ],
    defaultValue: 'grayscale',
  })
  .config({
    key: 'intensity',
    type: 'slider',
    label: 'Intensity',
    min: 0,
    max: 100,
    defaultValue: 50,
  })
  .process(async (data, ctx) => {
    ctx.log('Applying filter: ' + data.filterType);
    ctx.updateProgress(50, 'Processing...');

    const inputImage = ctx.inputs.image as string;
    // Your filtering logic here
    const filteredImage = await applyFilter(inputImage, data.filterType, data.intensity);

    return {
      outputs: {
        image: filteredImage,
      },
    };
  })
  .cost((data) => ({
    estimated: 0.01,
    description: 'Image filter processing',
  }))
  .build();

// Register the node
registerNode(imageFilterNode);
```

### Alternative: Define with Plain Object

```typescript
import { defineNode, registerNode } from '@genfeedai/sdk';

const myNode = defineNode({
  type: 'myOrg/textProcessor',
  name: 'Text Processor',
  description: 'Process text with custom logic',
  category: 'processing',
  inputs: [
    { id: 'text', type: 'text', label: 'Input Text', required: true },
  ],
  outputs: [
    { id: 'text', type: 'text', label: 'Processed Text' },
  ],
  configSchema: [
    {
      key: 'mode',
      type: 'select',
      label: 'Processing Mode',
      options: [
        { value: 'uppercase', label: 'Uppercase' },
        { value: 'lowercase', label: 'Lowercase' },
      ],
    },
  ],
  defaultData: {
    label: 'Text Processor',
    status: 'idle',
    mode: 'uppercase',
  },
  async process(data, ctx) {
    const text = ctx.inputs.text as string;
    const result = data.mode === 'uppercase' ? text.toUpperCase() : text.toLowerCase();
    return { outputs: { text: result } };
  },
});

registerNode(myNode);
```

## React Integration

```tsx
import { useNodeDefinition, useNodeValidation, createConfigPanel } from '@genfeedai/sdk/react';

function MyNodeComponent({ nodeId, data, onUpdate }) {
  const definition = useNodeDefinition(data.type);
  const validation = useNodeValidation(data, definition, inputs);

  // Create config panel for the node
  const ConfigPanel = createConfigPanel(definition);

  return (
    <div className={`node ${validation.valid ? '' : 'invalid'}`}>
      <h3>{definition?.name}</h3>
      {!validation.valid && (
        <ul className="errors">
          {validation.errors?.map((err, i) => <li key={i}>{err}</li>)}
        </ul>
      )}
      <ConfigPanel data={data} onUpdate={onUpdate} />
    </div>
  );
}
```

## Handle Types

The SDK supports these handle types for connecting nodes:

| Type | Description | Example |
|------|-------------|---------|
| `image` | Image data (base64, URL, or blob) | Photos, generated images |
| `video` | Video data (URL or blob) | Video clips, animations |
| `text` | Text/string data | Prompts, captions |
| `audio` | Audio data (URL or blob) | Voice, music |
| `number` | Numeric values | Counts, dimensions |

## Configuration Fields

Available config field types:

| Type | Description | Options |
|------|-------------|---------|
| `text` | Single-line text input | `placeholder` |
| `textarea` | Multi-line text input | `placeholder` |
| `number` | Numeric input | `min`, `max`, `step` |
| `select` | Dropdown selection | `options` (required) |
| `checkbox` | Boolean toggle | - |
| `slider` | Range slider | `min`, `max`, `step` |
| `color` | Color picker | - |

## Plugin Distribution

Package your nodes as an npm package:

```json
{
  "name": "@myorg/genfeed-plugin-filters",
  "version": "1.0.0",
  "main": "dist/index.js",
  "peerDependencies": {
    "@genfeedai/sdk": "^0.1.0"
  },
  "genfeed": {
    "nodes": ["myOrg/imageFilter", "myOrg/videoFilter"]
  }
}
```

```typescript
// src/index.ts
import { registerNode } from '@genfeedai/sdk';
import { imageFilterNode } from './nodes/imageFilter';
import { videoFilterNode } from './nodes/videoFilter';

export function register() {
  registerNode(imageFilterNode);
  registerNode(videoFilterNode);
}

// Auto-register on import
register();
```

## API Reference

### Core Functions

- `createNode(type)` - Create a node with fluent builder
- `defineNode(definition)` - Create a node from object
- `registerNode(definition)` - Register a node globally
- `getNode(type)` - Get a registered node definition
- `getAllNodes()` - Get all registered nodes

### Handle Helpers

- `imageInput(id, label, options?)` - Create image input handle
- `imageOutput(id, label)` - Create image output handle
- `videoInput(id, label, options?)` - Create video input handle
- `textInput(id, label, options?)` - Create text input handle
- `audioInput(id, label, options?)` - Create audio input handle
- `numberInput(id, label, options?)` - Create number input handle

### React Hooks

- `useNodeDefinition(type)` - Get node definition
- `useAllNodes()` - Get all registered nodes
- `useNodesByCategory(category)` - Get nodes by category
- `useNodeValidation(data, definition, inputs)` - Validate node data
- `useNodeCostEstimate(data, definition)` - Get cost estimate

## License

AGPL-3.0
