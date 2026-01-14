# Generate Workflow

Generate a visual node-based workflow based on user requirements.

## User Request
$ARGUMENTS

## Mode
**This command MUST run in plan mode.** Enter plan mode immediately and:
1. Design the workflow structure
2. Present the plan with a visual diagram (ASCII)
3. List all nodes and their connections
4. Wait for user approval before writing any files

## Instructions

Design a valid workflow that fulfills the user's request. You MUST:

1. **Understand the request** - What does the user want to accomplish?
2. **Select appropriate nodes** - Use the node definitions below
3. **Create valid connections** - Respect type constraints (image→image, text→text, video→video)
4. **Position nodes logically** - Left-to-right flow, ~300px horizontal spacing, ~200px vertical spacing
5. **Save the workflow** - Write to `apps/web/src/templates/generated/[slug].ts`

## Available Node Types

### Input Nodes (category: "input")
| Type | Description | Outputs |
|------|-------------|---------|
| `prompt` | Text prompt for AI generation | text |
| `imageInput` | Upload or reference an image | image |
| `template` | Preset prompt template | text |
| `tweetInput` | Twitter URL or paste tweet text | text |

### AI Nodes (category: "ai")
| Type | Description | Inputs | Outputs |
|------|-------------|--------|---------|
| `llm` | Generate text with meta-llama | text (prompt) | text |
| `imageGen` | Generate images (nano-banana) | text (prompt), image[] (reference) | image |
| `videoGen` | Generate videos (veo-3.1) | text (prompt), image (start), image (lastFrame) | video |
| `tweetRemix` | Generate 3 tweet variations | text (tweet) | text |

### Processing Nodes (category: "processing")
| Type | Description | Inputs | Outputs |
|------|-------------|--------|---------|
| `resize` | Resize images or videos | image/video | image/video |
| `animation` | Apply easing curve to video | video | video |
| `videoStitch` | Concatenate multiple videos | video[] | video |

### Output Nodes (category: "output")
| Type | Description | Inputs |
|------|-------------|--------|
| `output` | Final workflow output | image/video/text |
| `preview` | Preview media with playback controls | image/video |
| `download` | Download output file | image/video |

## Connection Rules

Only these connections are valid:
- `image` → `image`
- `text` → `text`
- `video` → `video`
- `number` → `number`

## Workflow File Structure

```typescript
import type { WorkflowFile } from "@/types/workflow";

export const WORKFLOW_NAME_TEMPLATE: WorkflowFile = {
  version: 1,
  name: "Human-readable name",
  description: "What this workflow does",
  nodes: [
    {
      id: "unique-id",
      type: "nodeType",
      position: { x: 50, y: 200 },
      data: {
        label: "Node Label",
        status: "idle",
        // ... node-specific data
      },
    },
  ],
  edges: [
    {
      id: "edge-id",
      source: "source-node-id",
      target: "target-node-id",
      sourceHandle: "output-handle-id",
      targetHandle: "input-handle-id",
    },
  ],
  edgeStyle: "smoothstep",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
```

## Default Node Data by Type

### prompt
```typescript
{ label: "Prompt", status: "idle", prompt: "", variables: {} }
```

### llm
```typescript
{
  label: "LLM",
  status: "idle",
  inputPrompt: null,
  outputText: null,
  systemPrompt: "You are a creative assistant...",
  temperature: 0.7,
  maxTokens: 1024,
  topP: 0.9,
  jobId: null,
}
```

### imageGen
```typescript
{
  label: "Image Generator",
  status: "idle",
  inputImages: [],
  inputPrompt: null,
  outputImage: null,
  model: "nano-banana-pro",
  aspectRatio: "16:9",
  resolution: "2K",
  outputFormat: "jpg",
  jobId: null,
}
```

### videoGen
```typescript
{
  label: "Video Generator",
  status: "idle",
  inputImage: null,
  lastFrame: null,
  referenceImages: [],
  inputPrompt: null,
  negativePrompt: "",
  outputVideo: null,
  model: "veo-3.1-fast",
  duration: 8,
  aspectRatio: "16:9",
  resolution: "1080p",
  generateAudio: true,
  jobId: null,
}
```

### output
```typescript
{
  label: "Output",
  status: "idle",
  inputMedia: null,
  inputType: null,
  outputName: "output",
}
```

## Handle IDs Reference

### Input Handles (targetHandle)
- `prompt` → prompt input
- `images` → reference images (multiple)
- `image` → single image input
- `lastFrame` → video interpolation end frame
- `media` → generic media input
- `video` → video input
- `videos` → multiple videos input
- `tweet` → tweet text input

### Output Handles (sourceHandle)
- `text` → text output
- `image` → image output
- `video` → video output
- `media` → generic media output

## Task

### Phase 1: Plan (Required)
1. **Enter plan mode** using EnterPlanMode tool
2. **Analyze the request** - Understand what the user wants to accomplish
3. **Design the workflow** - Select nodes, define connections, plan positions
4. **Write the plan** with:
   - ASCII diagram showing the node flow
   - Table of all nodes with their types and purposes
   - Table of all edges with source/target handles
   - The complete TypeScript code that will be generated
5. **Exit plan mode** and wait for user approval

### Phase 2: Execute (After Approval)
1. Create the directory if needed: `apps/web/src/templates/generated/`
2. Write the workflow file to `apps/web/src/templates/generated/[slug].ts`
3. Use a descriptive slug based on the workflow purpose
4. Export the workflow with a descriptive constant name
5. Register it in `apps/web/src/templates/index.ts` by adding an import and entry to `TEMPLATE_REGISTRY` and `TEMPLATE_INFO`

### Plan Format Example

```
## Workflow: [Name]

### Flow Diagram
┌─────────┐    ┌─────────┐    ┌─────────┐
│ Prompt  │───▶│   LLM   │───▶│ImageGen │───▶ Output
└─────────┘    └─────────┘    └─────────┘

### Nodes
| ID | Type | Label | Purpose |
|----|------|-------|---------|
| prompt-1 | prompt | Concept | User input |
| llm-1 | llm | Expander | Expand prompt |

### Edges
| Source | Target | Type |
|--------|--------|------|
| prompt-1:text | llm-1:prompt | text |

### Generated Code
[Full TypeScript file content]
```
