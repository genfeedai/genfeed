import type {
  ConfigField,
  CostEstimator,
  CustomNodeData,
  CustomNodeDefinition,
  HandleDefinition,
  NodeProcessor,
  NodeValidator,
} from './types';

/**
 * Fluent builder for creating custom node definitions
 *
 * @example
 * ```ts
 * const myNode = createNode('myOrg/imageFilter')
 *   .name('Image Filter')
 *   .description('Apply filters to images')
 *   .category('processing')
 *   .input('image', 'image', 'Input Image', { required: true })
 *   .output('image', 'image', 'Filtered Image')
 *   .config({ key: 'filterType', type: 'select', label: 'Filter', options: [...] })
 *   .process(async (data, ctx) => {
 *     // Processing logic
 *     return { outputs: { image: filteredImage } };
 *   })
 *   .build();
 * ```
 */
export class NodeBuilder<TData extends CustomNodeData = CustomNodeData> {
  private definition: Partial<CustomNodeDefinition<TData>> = {
    inputs: [],
    outputs: [],
    configSchema: [],
    defaultData: {} as Partial<TData>,
  };

  constructor(type: string) {
    this.definition.type = type;
  }

  /**
   * Set the display name
   */
  name(name: string): this {
    this.definition.name = name;
    return this;
  }

  /**
   * Set the description
   */
  description(description: string): this {
    this.definition.description = description;
    return this;
  }

  /**
   * Set the category
   */
  category(category: CustomNodeDefinition['category']): this {
    this.definition.category = category;
    return this;
  }

  /**
   * Set the icon
   */
  icon(icon: string): this {
    this.definition.icon = icon;
    return this;
  }

  /**
   * Add an input handle
   */
  input(
    id: string,
    type: HandleDefinition['type'],
    label: string,
    options?: Partial<Omit<HandleDefinition, 'id' | 'type' | 'label'>>
  ): this {
    this.definition.inputs!.push({ id, type, label, ...options });
    return this;
  }

  /**
   * Add an output handle
   */
  output(
    id: string,
    type: HandleDefinition['type'],
    label: string,
    options?: Partial<Omit<HandleDefinition, 'id' | 'type' | 'label'>>
  ): this {
    this.definition.outputs!.push({ id, type, label, ...options });
    return this;
  }

  /**
   * Add a configuration field
   */
  config(field: ConfigField): this {
    this.definition.configSchema!.push(field);
    return this;
  }

  /**
   * Set default data values
   */
  defaults(data: Partial<TData>): this {
    this.definition.defaultData = { ...this.definition.defaultData, ...data };
    return this;
  }

  /**
   * Set the processing function
   */
  process(processor: NodeProcessor<TData>): this {
    this.definition.process = processor;
    return this;
  }

  /**
   * Set the validation function
   */
  validate(validator: NodeValidator<TData>): this {
    this.definition.validate = validator;
    return this;
  }

  /**
   * Set the cost estimator
   */
  cost(estimator: CostEstimator<TData>): this {
    this.definition.estimateCost = estimator;
    return this;
  }

  /**
   * Build the final node definition
   */
  build(): CustomNodeDefinition<TData> {
    // Validate required fields
    if (!this.definition.type) throw new Error('Node type is required');
    if (!this.definition.name) throw new Error('Node name is required');
    if (!this.definition.description) throw new Error('Node description is required');
    if (!this.definition.category) throw new Error('Node category is required');
    if (!this.definition.process) throw new Error('Node processor is required');

    return this.definition as CustomNodeDefinition<TData>;
  }
}

/**
 * Create a new node definition using the fluent builder
 */
export function createNode<TData extends CustomNodeData = CustomNodeData>(
  type: string
): NodeBuilder<TData> {
  return new NodeBuilder<TData>(type);
}

/**
 * Create a node definition from a plain object
 */
export function defineNode<TData extends CustomNodeData = CustomNodeData>(
  definition: CustomNodeDefinition<TData>
): CustomNodeDefinition<TData> {
  // Validate
  if (!definition.type) throw new Error('Node type is required');
  if (!definition.name) throw new Error('Node name is required');
  if (!definition.description) throw new Error('Node description is required');
  if (!definition.category) throw new Error('Node category is required');
  if (!definition.process) throw new Error('Node processor is required');

  return definition;
}
