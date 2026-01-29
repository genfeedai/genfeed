import type { EdgeTypes } from '@xyflow/react';

import { SmartBezierEdge } from './SmartBezierEdge';
import { SmartSmoothStepEdge } from './SmartSmoothStepEdge';
import { SmartStraightEdge } from './SmartStraightEdge';

/**
 * Custom edge types with offset support for parallel edge separation.
 * Maps React Flow edge type names to our smart edge components.
 */
export const edgeTypes: EdgeTypes = {
  // Default React Flow types mapped to our smart versions
  default: SmartBezierEdge,
  bezier: SmartBezierEdge,
  smoothstep: SmartSmoothStepEdge,
  straight: SmartStraightEdge,
};

export { SmartBezierEdge } from './SmartBezierEdge';
export { SmartSmoothStepEdge } from './SmartSmoothStepEdge';
export { SmartStraightEdge } from './SmartStraightEdge';
