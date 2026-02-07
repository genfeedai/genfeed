import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    nodes: 'src/nodes/index.ts',
    workflow: 'src/workflow.ts',
    comfyui: 'src/comfyui/index.ts',
    replicate: 'src/replicate/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  splitting: true,
  treeshake: true,
  external: ['@xyflow/react'],
});
