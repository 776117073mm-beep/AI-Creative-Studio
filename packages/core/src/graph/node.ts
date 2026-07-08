import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { NodeId, NodeType, NodeTypeSchema } from '../types/index.js';

export type { NodeId, NodeType };

export interface INodeMetadata {
  name: string;
  description?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
  createdBy?: string;
  locked?: boolean;
  visible?: boolean;
}

export const NodeDataSchema = z.record(z.unknown());

export type NodeData = z.infer<typeof NodeDataSchema>;

export interface INode<Input extends NodeData = NodeData, Output extends NodeData = NodeData> {
  id: NodeId;
  type: NodeType;
  metadata: INodeMetadata;
  inputs: Input;
  outputs: Output;
  dependencies: Set<NodeId>;
  dependents: Set<NodeId>;
}

export function createNode<T extends NodeType>(
  type: T,
  options: {
    id?: NodeId;
    name?: string;
    inputs?: NodeData;
    outputs?: NodeData;
    metadata?: Partial<INodeMetadata>;
  } = {}
): INode {
  const now = Date.now();
  const id = options.id || uuidv4() as NodeId;

  return {
    id,
    type,
    metadata: {
      name: options.name || `${type}-${id.slice(0, 8)}`,
      createdAt: now,
      updatedAt: now,
      visible: true,
      locked: false,
      ...options.metadata,
    },
    inputs: options.inputs || {},
    outputs: options.outputs || {},
    dependencies: new Set(),
    dependents: new Set(),
  };
}

export function validateNodeType(type: string): NodeType {
  return NodeTypeSchema.parse(type);
}

export function isNodeType(value: unknown): value is NodeType {
  return NodeTypeSchema.safeParse(value).success;
}
