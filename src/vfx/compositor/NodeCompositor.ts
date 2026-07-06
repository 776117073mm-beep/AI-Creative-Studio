import { VFXNode, VFXConnection, VFXDataType } from "../types";

export class NodeCompositor {
  private static instance: NodeCompositor | null = null;
  private nodes: Map<string, VFXNode> = new Map();
  private connections: Map<string, VFXConnection> = new Map();
  private evaluationCache: Map<string, any> = new Map();

  constructor() {
    this.createDefaultVFXGraph();
  }

  public static getInstance(): NodeCompositor {
    if (!NodeCompositor.instance) {
      NodeCompositor.instance = new NodeCompositor();
    }
    return NodeCompositor.instance;
  }

  /**
   * Initializes a professional cinematic VFX compositing node graph pipeline
   */
  public createDefaultVFXGraph(): void {
    this.nodes.clear();
    this.connections.clear();
    this.evaluationCache.clear();

    // 1. Source Plate Node
    this.addNode({
      id: "vfx_node_source",
      name: "Source Video Plate",
      type: "SourceNode",
      parameters: { clipId: "green_screen_clip_1", frameOffset: 0 },
      inputs: [],
      outputs: [
        { id: "src_rgba", name: "RGBA Plate", type: "rgb", value: null, isConnected: false }
      ],
      position: { x: 50, y: 150 }
    });

    // 2. Bezier Rotoscoping garbage matte Node
    this.addNode({
      id: "vfx_node_roto",
      name: "Garbage Matte Roto",
      type: "RotoNode",
      parameters: { curveId: "curve_screen_matte" },
      inputs: [],
      outputs: [
        { id: "roto_alpha", name: "Matte Alpha", type: "alpha", value: null, isConnected: false }
      ],
      position: { x: 50, y: 350 }
    });

    // 3. Green Screen Keyer Node
    this.addNode({
      id: "vfx_node_keyer",
      name: "Delta Chroma Keyer",
      type: "KeyerNode",
      parameters: { tolerance: 42, softness: 15, spillSuppression: 0.8 },
      inputs: [
        { id: "key_in_plate", name: "Source RGB", type: "rgb", value: null, isConnected: false },
        { id: "key_in_garbage", name: "Roto Matte Mask", type: "alpha", value: null, isConnected: false }
      ],
      outputs: [
        { id: "key_out_rgb", name: "Keyed RGBA", type: "rgb", value: null, isConnected: false },
        { id: "key_out_alpha", name: "Clean Alpha", type: "alpha", value: null, isConnected: false }
      ],
      position: { x: 280, y: 150 }
    });

    // 4. Particle Emitter Node
    this.addNode({
      id: "vfx_node_particles",
      name: "3D Particle Generator",
      type: "ParticleNode",
      parameters: { emitterId: "emitter_sparks" },
      inputs: [
        { id: "part_in_matte", name: "Collision Mask", type: "alpha", value: null, isConnected: false }
      ],
      outputs: [
        { id: "part_out_rgb", name: "Rendered Particles", type: "rgb", value: null, isConnected: false }
      ],
      position: { x: 280, y: 400 }
    });

    // 5. Multi-Pass Merge Node (Combines keyed plate + particle visual layers)
    this.addNode({
      id: "vfx_node_merge",
      name: "Layer Merge Compositor",
      type: "MultiPassMergeNode",
      parameters: { blendMode: "overlay" },
      inputs: [
        { id: "merge_bg", name: "Backdrop BG", type: "rgb", value: null, isConnected: false },
        { id: "merge_fg", name: "Foreground Plate", type: "rgb", value: null, isConnected: false }
      ],
      outputs: [
        { id: "merge_out", name: "Composited Frame", type: "rgb", value: null, isConnected: false }
      ],
      position: { x: 520, y: 240 }
    });

    // 6. Final VFX Output Terminal Node
    this.addNode({
      id: "vfx_node_output",
      name: "VFX Composite Output",
      type: "OutputNode",
      parameters: { exportBitDepth: "16bit_Float" },
      inputs: [
        { id: "out_composited", name: "Composited RGB", type: "rgb", value: null, isConnected: false }
      ],
      outputs: [],
      position: { x: 740, y: 240 }
    });

    // Connect node graph terminals in the Directed Acyclic Graph (DAG)
    this.connectTerminals("vfx_node_source", "src_rgba", "vfx_node_keyer", "key_in_plate");
    this.connectTerminals("vfx_node_roto", "roto_alpha", "vfx_node_keyer", "key_in_garbage");
    this.connectTerminals("vfx_node_keyer", "key_out_rgb", "vfx_node_merge", "merge_bg");
    this.connectTerminals("vfx_node_particles", "part_out_rgb", "vfx_node_merge", "merge_fg");
    this.connectTerminals("vfx_node_merge", "merge_out", "vfx_node_output", "out_composited");
  }

  public addNode(node: VFXNode): void {
    this.nodes.set(node.id, node);
    this.invalidateCache();
  }

  public getNodes(): VFXNode[] {
    return Array.from(this.nodes.values());
  }

  public getNode(nodeId: string): VFXNode | undefined {
    return this.nodes.get(nodeId);
  }

  public removeNode(nodeId: string): boolean {
    if (this.nodes.delete(nodeId)) {
      // Clean stale connection pipelines attached to this node
      this.getConnections().forEach((conn) => {
        if (conn.fromNodeId === nodeId || conn.toNodeId === nodeId) {
          this.disconnectTerminals(conn.id);
        }
      });
      this.invalidateCache();
      return true;
    }
    return false;
  }

  public updateNodeParameter(nodeId: string, paramName: string, value: any): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.parameters[paramName] = value;
      this.invalidateCache();
    }
  }

  /**
   * Links a direct route between node output and node input ports
   */
  public connectTerminals(
    fromNodeId: string,
    fromTerminalId: string,
    toNodeId: string,
    toTerminalId: string
  ): VFXConnection {
    const connId = `conn_vfx_${fromNodeId}_${fromTerminalId}_to_${toNodeId}_${toTerminalId}`;
    const conn: VFXConnection = {
      id: connId,
      fromNodeId,
      fromTerminalId,
      toNodeId,
      toTerminalId
    };

    // Update connection status inside terminals
    const fromNode = this.nodes.get(fromNodeId);
    const toNode = this.nodes.get(toNodeId);

    if (fromNode) {
      const out = fromNode.outputs.find((o) => o.id === fromTerminalId);
      if (out) {
        out.isConnected = true;
        out.connectedToId = toTerminalId;
        out.connectedNodeId = toNodeId;
      }
    }

    if (toNode) {
      const inp = toNode.inputs.find((i) => i.id === toTerminalId);
      if (inp) {
        inp.isConnected = true;
        inp.connectedToId = fromTerminalId;
        inp.connectedNodeId = fromNodeId;
      }
    }

    this.connections.set(connId, conn);
    this.invalidateCache();
    return conn;
  }

  public disconnectTerminals(connectionId: string): boolean {
    const conn = this.connections.get(connectionId);
    if (conn) {
      const fromNode = this.nodes.get(conn.fromNodeId);
      const toNode = this.nodes.get(conn.toNodeId);

      if (fromNode) {
        const out = fromNode.outputs.find((o) => o.id === conn.fromTerminalId);
        if (out) {
          out.isConnected = false;
          out.connectedToId = undefined;
          out.connectedNodeId = undefined;
        }
      }

      if (toNode) {
        const inp = toNode.inputs.find((i) => i.id === conn.toTerminalId);
        if (inp) {
          inp.isConnected = false;
          inp.connectedToId = undefined;
          inp.connectedNodeId = undefined;
        }
      }

      this.connections.delete(connectionId);
      this.invalidateCache();
      return true;
    }
    return false;
  }

  public getConnections(): VFXConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Sorts entire VFX Node Graph topologically (Depth First Traversal)
   * Resolves exact compilation execution priority stack for rendering
   */
  public computeExecutionStack(): string[] {
    const stack: string[] = [];
    const visited: Set<string> = new Set();
    const tempVisited: Set<string> = new Set();

    const visit = (nodeId: string) => {
      if (tempVisited.has(nodeId)) {
        throw new Error("Cyclic Dependency Detected inside VFX pipeline node network!");
      }
      if (!visited.has(nodeId)) {
        tempVisited.add(nodeId);

        const node = this.nodes.get(nodeId);
        if (node) {
          node.inputs.forEach((inp) => {
            if (inp.isConnected && inp.connectedNodeId) {
              visit(inp.connectedNodeId);
            }
          });
        }

        tempVisited.delete(nodeId);
        visited.add(nodeId);
        stack.push(nodeId);
      }
    };

    // Sink search starting from OutputNode
    this.nodes.forEach((node, id) => {
      if (node.type === "OutputNode") {
        visit(id);
      }
    });

    // Floating isolated islands fallback
    this.nodes.forEach((_, id) => {
      if (!visited.has(id)) {
        visit(id);
      }
    });

    return stack;
  }

  /**
   * Cascade values topologically and evaluate all parameters non-destructively
   */
  public evaluateVFXGraph(): Record<string, any> {
    const stack = this.computeExecutionStack();
    const results: Record<string, any> = {};

    stack.forEach((nodeId) => {
      const node = this.nodes.get(nodeId);
      if (!node) return;

      // 1. Gather input parameters from connecting terminals
      node.inputs.forEach((inp) => {
        if (inp.isConnected && inp.connectedNodeId && inp.connectedToId) {
          const parentOutputs = this.evaluationCache.get(inp.connectedNodeId);
          if (parentOutputs && parentOutputs[inp.connectedToId] !== undefined) {
            inp.value = parentOutputs[inp.connectedToId];
          }
        }
      });

      // 2. Perform node operation math simulations
      const outputsObj: Record<string, any> = {};
      node.outputs.forEach((out) => {
        if (node.type === "SourceNode") {
          outputsObj[out.id] = { width: 1920, height: 1080, bits: 16, platePath: "plates/green_screen.exr" };
        } else if (node.type === "KeyerNode") {
          outputsObj[out.id] = {
            spillSuppressionApplied: node.parameters.spillSuppression || 0.8,
            keyTolerance: node.parameters.tolerance || 42,
            matteResolution: "1920x1080"
          };
        } else if (node.type === "RotoNode") {
          outputsObj[out.id] = { activeBezierCurve: node.parameters.curveId };
        } else if (node.type === "ParticleNode") {
          outputsObj[out.id] = { particlesDrawCount: 2000, colorProfile: "ACES_cg" };
        } else if (node.type === "MultiPassMergeNode") {
          outputsObj[out.id] = { compositedLayersCount: 2, blendType: node.parameters.blendMode };
        } else {
          outputsObj[out.id] = { evaluated: true };
        }
        out.value = outputsObj[out.id];
      });

      this.evaluationCache.set(nodeId, outputsObj);
      results[nodeId] = outputsObj;
    });

    return results;
  }

  private invalidateCache(): void {
    this.evaluationCache.clear();
  }
}
