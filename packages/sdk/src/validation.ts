import type { CustomNodeData, CustomNodeDefinition, ValidationResult } from './types';

/**
 * Validate a node definition
 */
export function validateNodeDefinition(definition: CustomNodeDefinition): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!definition.type) {
    errors.push('Node type is required');
  } else if (!/^[a-zA-Z0-9_/-]+$/.test(definition.type)) {
    errors.push(
      'Node type must contain only alphanumeric characters, underscores, hyphens, and slashes'
    );
  }

  if (!definition.name) {
    errors.push('Node name is required');
  }

  if (!definition.description) {
    errors.push('Node description is required');
  }

  if (!definition.category) {
    errors.push('Node category is required');
  }

  if (!definition.process) {
    errors.push('Node processor function is required');
  }

  // Validate inputs
  if (definition.inputs) {
    const inputIds = new Set<string>();
    for (const input of definition.inputs) {
      if (!input.id) {
        errors.push('Input handle ID is required');
      } else if (inputIds.has(input.id)) {
        errors.push(`Duplicate input handle ID: ${input.id}`);
      } else {
        inputIds.add(input.id);
      }

      if (!input.type) {
        errors.push(`Input handle "${input.id}" must have a type`);
      }

      if (!input.label) {
        warnings.push(`Input handle "${input.id}" should have a label`);
      }
    }
  }

  // Validate outputs
  if (definition.outputs) {
    const outputIds = new Set<string>();
    for (const output of definition.outputs) {
      if (!output.id) {
        errors.push('Output handle ID is required');
      } else if (outputIds.has(output.id)) {
        errors.push(`Duplicate output handle ID: ${output.id}`);
      } else {
        outputIds.add(output.id);
      }

      if (!output.type) {
        errors.push(`Output handle "${output.id}" must have a type`);
      }

      if (!output.label) {
        warnings.push(`Output handle "${output.id}" should have a label`);
      }
    }
  }

  // Validate config schema
  if (definition.configSchema) {
    const configKeys = new Set<string>();
    for (const field of definition.configSchema) {
      if (!field.key) {
        errors.push('Config field key is required');
      } else if (configKeys.has(field.key)) {
        errors.push(`Duplicate config field key: ${field.key}`);
      } else {
        configKeys.add(field.key);
      }

      if (!field.type) {
        errors.push(`Config field "${field.key}" must have a type`);
      }

      if (field.type === 'select' && (!field.options || field.options.length === 0)) {
        errors.push(`Config field "${field.key}" of type select must have options`);
      }

      if (
        (field.type === 'number' || field.type === 'slider') &&
        field.min !== undefined &&
        field.max !== undefined
      ) {
        if (field.min > field.max) {
          errors.push(`Config field "${field.key}" has min > max`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validate node data against its definition
 */
export function validateNodeData<TData extends CustomNodeData>(
  data: TData,
  definition: CustomNodeDefinition<TData>,
  inputs: Record<string, unknown>
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required inputs
  for (const input of definition.inputs) {
    if (input.required && (inputs[input.id] === undefined || inputs[input.id] === null)) {
      errors.push(`Required input "${input.label}" is not connected`);
    }
  }

  // Check required config fields
  if (definition.configSchema) {
    for (const field of definition.configSchema) {
      if (
        field.required &&
        (data[field.key] === undefined || data[field.key] === null || data[field.key] === '')
      ) {
        errors.push(`Required field "${field.label}" is not set`);
      }
    }
  }

  // Run custom validator if provided
  if (definition.validate) {
    const customResult = definition.validate(data, inputs);
    if (customResult.errors) {
      errors.push(...customResult.errors);
    }
    if (customResult.warnings) {
      warnings.push(...customResult.warnings);
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
