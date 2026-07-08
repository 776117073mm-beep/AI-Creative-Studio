import { NodeId, INode, createNode, NodeType, INodeMetadata, NodeData } from './node.js';
import { EventEmitter } from 'eventemitter3';
import { ProjectId } from '../types/index.js';

export type { NodeId, INodeMetadata, NodeData };

export interface IProjectGraphEvents {
  'node:added': { nodeId: NodeId; node: INode };
  'node:removed': { nodeId: NodeId; node: INode };
  'node:updated': { nodeId: NodeId; node: INode; changes: Partial<INode> };
  'node:connected': { fromId: NodeId; toId: NodeId };
  'node:disconnected': { fromId: NodeId; toId: NodeId };
  'graph:cleared': {};
  'graph:loaded': { projectId: ProjectId };
}

export class ProjectGraph {
  private nodes: Map<NodeId, INode> = new Map();
  private readonly eventEmitter = new EventEmitter<IProjectGraphEvents>();
  private rootNodeId: NodeId | null = null;

  constructor(public readonly projectId: ProjectId) {}

  addNode<K extends NodeType>(
    type: K,
    options?: Parameters<typeof createNode>[1]
  ): INode {
    const node = createNode(type, options);
    this.nodes.set(node.id, node);

    if (type === 'project') {
      this.rootNodeId = node.id;
    }

    this.eventEmitter.emit('node:added', { nodeId: node.id, node });
    return node;
  }

  getNode(id: NodeId): INode | undefined {
    return this.nodes.get(id);
  }

  hasNode(id: NodeId): boolean {
    return this.nodes.has(id);
  }

  removeNode(id: NodeId): boolean {
    const node = this.nodes.get(id);
    if (!node) return false;

    for (const depId of node.dependencies) {
      const dep = this.nodes.get(depId);
      if (dep) {
        dep.dependents.delete(id);
      }
    }

    for (const depId of node.dependents) {
      const dep = this.nodes.get(depId);
      if (dep) {
        dep.dependencies.delete(id);
      }
    }

    this.nodes.delete(id);
    this.eventEmitter.emit('node:removed', { nodeId: id, node });
    return true;
  }

  updateNode(id: NodeId, updates: Partial<INode>): INode | undefined {
    const node = this.nodes.get(id);
    if (!node) return undefined;

    const updatedNode = {
      ...node,
      ...updates,
      metadata: {
        ...node.metadata,
        ...updates.metadata,
        updatedAt: Date.now(),
      },
    };

    this.nodes.set(id, updatedNode as INode);
    this.eventEmitter.emit('node:updated', {
      nodeId: id,
      node: updatedNode as INode,
      changes: updates,
    });

    return updatedNode as INode;
  }

  connectNodes(fromId: NodeId, toId: NodeId): boolean {
    const fromNode = this.nodes.get(fromId);
    const toNode = this.nodes.get(toId);

    if (!fromNode || !toNode) return false;

    if (this.wouldCreateCycle(fromId, toId)) {
      console.warn('Connection would create a cycle');
      return false;
    }

    fromNode.dependents.add(toId);
    toNode.dependencies.add(fromId);

    this.eventEmitter.emit('node:connected', { fromId, toId });
    return true;
  }

  disconnectNodes(fromId: NodeId, toId: NodeId): boolean {
    const fromNode = this.nodes.get(fromId);
    const toNode = this.nodes.get(toId);

    if (!fromNode || !toNode) return false;

    fromNode.dependents.delete(toId);
    toNode.dependencies.delete(fromId);

    this.eventEmitter.emit('node:disconnected', { fromId, toId });
    return true;
  }

  wouldCreateCycle(fromId: NodeId, toId: NodeId): boolean {
    const visited = new Set<NodeId>();
    const stack = [toId];

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (current === fromId) return true;
      if (visited.has(current)) continue;
      visited.add(current);

      const node = this.nodes.get(current);
      if (node) {
        for (const depId of node.dependencies) {
          stack.push(depId);
        }
      }
    }

    return false;
  }

  getDependencies(nodeId: NodeId): INode[] {
    const node = this.nodes.get(nodeId);
    if (!node) return [];

    const deps: INode[] = [];
    for (const depId of node.dependencies) {
      const dep = this.nodes.get(depId);
      if (dep) deps.push(dep);
    }
    return deps;
  }

  getDependents(nodeId: NodeId): INode[] {
    const node = this.nodes.get(nodeId);
    if (!node) return [];

    const dependents: INode[] = [];
    for (const depId of node.dependents) {
      const dep = this.nodes.get(depId);
      if (dep) dependents.push(dep);
    }
    return dependents;
  }

  getNodesByType(type: NodeType): INode[] {
    const result: INode[] = [];
    for (const node of this.nodes.values()) {
      if (node.type === type) {
        result.push(node);
      }
    }
    return result;
  }

  traverse(
    callback: (node: INode, depth: number) => boolean | void,
    startNodeId?: NodeId
  ): void {
    const startId = startNodeId || this.rootNodeId;
    if (!startId) return;

    const visited = new Set<NodeId>();
    const stack: Array<{ nodeId: NodeId; depth: number }> = [{ nodeId: startId, depth: 0 }];

    while (stack.length > 0) {
      const { nodeId, depth } = stack.pop()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const node = this.nodes.get(nodeId);
      if (!node) continue;

      const shouldContinue = callback(node, depth);
      if (shouldContinue === false) break;

      for (const depId of node.dependents) {
        stack.push({ nodeId: depId, depth: depth + 1 });
      }
    }
  }

  getRootNode(): INode | undefined {
    return this.rootNodeId ? this.nodes.get(this.rootNodeId) : undefined;
  }

  getAllNodes(): INode[] {
    return Array.from(this.nodes.values());
  }

  clear(): void {
    this.nodes.clear();
    this.rootNodeId = null;
    this.eventEmitter.emit('graph:cleared', {});
  }

  on<E extends keyof IProjectGraphEvents>(
    event: E,
    listener: (data: IProjectGraphEvents[E]) => void
  ): this {
    this.eventEmitter.on(event, listener as any);
    return this;
  }

  off<E extends keyof IProjectGraphEvents>(
    event: E,
    listener: (data: IProjectGraphEvents[E]) => void
  ): this {
    this.eventEmitter.off(event, listener as any);
    return this;
  }

  emit<E extends keyof IProjectGraphEvents>(
    event: E,
    data: IProjectGraphEvents[E]
  ): boolean {
    return this.eventEmitter.emit(event, data);
  }

  serialize(): unknown {
    const nodes = Array.from(this.nodes.entries()).map(([id, node]) => ({
      id,
      ...node,
      dependencies: Array.from(node.dependencies),
      dependents: Array.from(node.dependents),
    }));

    return {
      projectId: this.projectId,
      rootNodeId: this.rootNodeId,
      nodes,
    };
  }

  static deserialize(data: {
    projectId: ProjectId;
    rootNodeId: NodeId | null;
    nodes: Array<{
      id: NodeId;
      type: NodeType;
      metadata: INodeMetadata;
      inputs: NodeData;
      outputs: NodeData;
      dependencies: NodeId[];
      dependents: NodeId[];
    }>;
  }): ProjectGraph {
    const graph = new ProjectGraph(data.projectId);
    graph.rootNodeId = data.rootNodeId;

    for (const nodeData of data.nodes) {
      const node: INode = {
        id: nodeData.id,
        type: nodeData.type,
        metadata: nodeData.metadata,
        inputs: nodeData.inputs,
        outputs: nodeData.outputs,
        dependencies: new Set(nodeData.dependencies),
        dependents: new Set(nodeData.dependents),
      };
      graph.nodes.set(node.id, node);
    }

    graph.eventEmitter.emit('graph:loaded', { projectId: data.projectId });
    return graph;
  }
}
