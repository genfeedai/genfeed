import type { FC, ReactNode } from 'react';
import type { ConfigField, CustomNodeData, CustomNodeDefinition } from '../types';

/**
 * Props for the ConfigFieldRenderer component
 */
export interface ConfigFieldRendererProps<TData extends CustomNodeData = CustomNodeData> {
  field: ConfigField;
  value: unknown;
  data: TData;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

/**
 * Default field renderer - can be overridden with custom renderers
 * This provides a basic reference implementation
 */
export const DefaultConfigFieldRenderer: FC<ConfigFieldRendererProps> = ({
  field,
  value,
  onChange,
  disabled,
}) => {
  // Check conditional display
  // if (field.showWhen) {
  //   const shouldShow = Object.entries(field.showWhen).every(
  //     ([key, val]) => data[key] === val
  //   );
  //   if (!shouldShow) return null;
  // }

  switch (field.type) {
    case 'text':
      return (
        <input
          type="text"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
        />
      );

    case 'textarea':
      return (
        <textarea
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
        />
      );

    case 'number':
      return (
        <input
          type="number"
          value={(value as number) ?? field.defaultValue ?? 0}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          min={field.min}
          max={field.max}
          step={field.step}
          disabled={disabled}
        />
      );

    case 'select':
      return (
        <select
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          <option value="">Select...</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );

    case 'checkbox':
      return (
        <input
          type="checkbox"
          checked={(value as boolean) ?? false}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
      );

    case 'slider':
      return (
        <input
          type="range"
          value={(value as number) ?? field.defaultValue ?? field.min ?? 0}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          min={field.min}
          max={field.max}
          step={field.step}
          disabled={disabled}
        />
      );

    case 'color':
      return (
        <input
          type="color"
          value={(value as string) ?? '#000000'}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      );

    default:
      return <span>Unknown field type: {field.type}</span>;
  }
};

/**
 * Props for custom node wrapper component
 */
export interface CustomNodeWrapperProps<TData extends CustomNodeData = CustomNodeData> {
  definition: CustomNodeDefinition<TData>;
  data: TData;
  selected?: boolean;
  children: ReactNode;
}

/**
 * Type for custom field renderer registry
 */
export type FieldRendererRegistry = Partial<
  Record<ConfigField['type'], FC<ConfigFieldRendererProps>>
>;

/**
 * Create a config panel renderer for a node definition
 */
export function createConfigPanel<TData extends CustomNodeData = CustomNodeData>(
  definition: CustomNodeDefinition<TData>,
  renderers?: FieldRendererRegistry
): FC<{
  data: TData;
  onUpdate: (data: TData) => void;
  disabled?: boolean;
}> {
  return ({ data, onUpdate, disabled }) => {
    if (!definition.configSchema || definition.configSchema.length === 0) {
      return null;
    }

    return (
      <div className="genfeed-config-panel">
        {definition.configSchema.map((field) => {
          const FieldRenderer = renderers?.[field.type] ?? DefaultConfigFieldRenderer;

          return (
            <div key={field.key} className="genfeed-config-field">
              <label>
                {field.label}
                {field.required && <span className="required">*</span>}
              </label>
              {field.description && <p className="description">{field.description}</p>}
              <FieldRenderer
                field={field}
                value={data[field.key]}
                data={data}
                onChange={(value) => onUpdate({ ...data, [field.key]: value })}
                disabled={disabled}
              />
            </div>
          );
        })}
      </div>
    );
  };
}
