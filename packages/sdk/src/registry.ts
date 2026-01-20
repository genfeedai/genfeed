import type { CustomNodeData, CustomNodeDefinition, PluginManifest } from './types';

/**
 * Global registry for custom nodes
 * Nodes are registered at runtime and made available to the workflow editor
 */
class NodeRegistry {
  private nodes = new Map<string, CustomNodeDefinition>();
  private plugins = new Map<string, PluginManifest>();

  /**
   * Register a custom node definition
   */
  register<TData extends CustomNodeData = CustomNodeData>(
    definition: CustomNodeDefinition<TData>
  ): void {
    if (this.nodes.has(definition.type)) {
      console.warn(`Node type "${definition.type}" is already registered. Overwriting.`);
    }
    this.nodes.set(definition.type, definition as CustomNodeDefinition);
  }

  /**
   * Register multiple nodes at once
   */
  registerAll(definitions: CustomNodeDefinition[]): void {
    for (const def of definitions) {
      this.register(def);
    }
  }

  /**
   * Register a plugin with its manifest
   */
  registerPlugin(manifest: PluginManifest, nodes: CustomNodeDefinition[]): void {
    this.plugins.set(manifest.name, manifest);
    this.registerAll(nodes);
  }

  /**
   * Unregister a node type
   */
  unregister(type: string): boolean {
    return this.nodes.delete(type);
  }

  /**
   * Get a node definition by type
   */
  get(type: string): CustomNodeDefinition | undefined {
    return this.nodes.get(type);
  }

  /**
   * Check if a node type is registered
   */
  has(type: string): boolean {
    return this.nodes.has(type);
  }

  /**
   * Get all registered node definitions
   */
  getAll(): CustomNodeDefinition[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get all node types
   */
  getTypes(): string[] {
    return Array.from(this.nodes.keys());
  }

  /**
   * Get nodes by category
   */
  getByCategory(category: string): CustomNodeDefinition[] {
    return this.getAll().filter((def) => def.category === category);
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): PluginManifest[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Clear all registrations (useful for testing)
   */
  clear(): void {
    this.nodes.clear();
    this.plugins.clear();
  }
}

/**
 * Global node registry instance
 */
export const nodeRegistry = new NodeRegistry();

/**
 * Convenience function to register a node
 */
export function registerNode<TData extends CustomNodeData = CustomNodeData>(
  definition: CustomNodeDefinition<TData>
): void {
  nodeRegistry.register(definition);
}

/**
 * Convenience function to get a node definition
 */
export function getNode(type: string): CustomNodeDefinition | undefined {
  return nodeRegistry.get(type);
}

/**
 * Convenience function to get all registered nodes
 */
export function getAllNodes(): CustomNodeDefinition[] {
  return nodeRegistry.getAll();
}
