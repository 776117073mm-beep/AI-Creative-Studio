import { SceneNode, Transform3D, SceneNodeType, Vector3D } from "../core/types";

export class SceneGraph {
  private static instance: SceneGraph | null = null;

  // Scene node storage keyed by ID
  private nodes: Map<string, SceneNode> = new Map();
  
  // Selection set of IDs
  private selectedIds: Set<string> = new Set();

  // Root collections lists
  private collections: Map<string, { id: string; name: string; visible: boolean; nodeIds: string[] }> = new Map();

  // Version history stack for undo/redo and scene version control
  private versionHistory: { timestamp: string; versionId: string; description: string; serializedData: string }[] = [];
  private currentVersionIndex: number = -1;

  private constructor() {
    this.createDefaultCollections();
    this.createInitialDefaultScene();
  }

  public static getInstance(): SceneGraph {
    if (!SceneGraph.instance) {
      SceneGraph.instance = new SceneGraph();
    }
    return SceneGraph.instance;
  }

  private createDefaultCollections(): void {
    this.collections.set("col_default", {
      id: "col_default",
      name: "Default Collection",
      visible: true,
      nodeIds: []
    });
    this.collections.set("col_cameras", {
      id: "col_cameras",
      name: "Cinematic Cameras",
      visible: true,
      nodeIds: []
    });
    this.collections.set("col_lighting", {
      id: "col_lighting",
      name: "Lighting Setup",
      visible: true,
      nodeIds: []
    });
    this.collections.set("col_props", {
      id: "col_props",
      name: "Props & Set Pieces",
      visible: true,
      nodeIds: []
    });
  }

  private createInitialDefaultScene(): void {
    // 1. Perspective Cinema Camera
    const mainCam: SceneNode = {
      id: "cam_cinema_0",
      name: "Cinematic Main Cam",
      type: "camera",
      parent: null,
      children: [],
      transform: {
        position: { x: 0.0, y: 5.0, z: 12.0 },
        rotation: { x: -15.0, y: 0.0, z: 0.0 },
        scale: { x: 1.0, y: 1.0, z: 1.0 }
      },
      visible: true,
      selected: false,
      tags: ["main_camera", "render_target"],
      layer: "camera_layer",
      collectionId: "col_cameras"
    };

    // 2. Directional Rim Light
    const sunLight: SceneNode = {
      id: "light_sun_0",
      name: "Sun Directional Light",
      type: "light",
      parent: null,
      children: [],
      transform: {
        position: { x: 8.0, y: 15.0, z: 8.0 },
        rotation: { x: -45.0, y: 45.0, z: 0.0 },
        scale: { x: 1.0, y: 1.0, z: 1.0 }
      },
      visible: true,
      selected: false,
      tags: ["key_light", "sun"],
      layer: "lighting_layer",
      collectionId: "col_lighting"
    };

    // 3. Cyber Mech Mesh (Default Subject)
    const cyberMech: SceneNode = {
      id: "mesh_mech_0",
      name: "Cyber Mech Guardian",
      type: "mesh",
      parent: null,
      children: [],
      transform: {
        position: { x: 0.0, y: 0.0, z: 0.0 },
        rotation: { x: 0.0, y: 180.0, z: 0.0 },
        scale: { x: 2.0, y: 2.0, z: 2.0 }
      },
      visible: true,
      selected: true,
      tags: ["character", "cyberpunk", "hero"],
      layer: "geometry_layer",
      collectionId: "col_props"
    };

    // 4. Ground Plane
    const ground: SceneNode = {
      id: "mesh_ground_0",
      name: "Mirror Ground Grid",
      type: "mesh",
      parent: null,
      children: [],
      transform: {
        position: { x: 0.0, y: 0.0, z: 0.0 },
        rotation: { x: 0.0, y: 0.0, z: 0.0 },
        scale: { x: 50.0, y: 1.0, z: 50.0 }
      },
      visible: true,
      selected: false,
      tags: ["environment", "static"],
      layer: "geometry_layer",
      collectionId: "col_props"
    };

    this.addNode(mainCam);
    this.addNode(sunLight);
    this.addNode(cyberMech);
    this.addNode(ground);

    this.selectedIds.add(cyberMech.id);

    // Initial backup point
    this.saveVersionPoint("Initial Default Scene State Setup");
  }

  // --- Node CRUD Operations ---

  public getNodes(): SceneNode[] {
    return Array.from(this.nodes.values());
  }

  public getNode(id: string): SceneNode | undefined {
    return this.nodes.get(id);
  }

  public addNode(node: SceneNode): void {
    // Add to storage
    this.nodes.set(node.id, node);

    // If parent is specified, update parent children list
    if (node.parent) {
      const parentNode = this.nodes.get(node.parent);
      if (parentNode && !parentNode.children.includes(node.id)) {
        parentNode.children.push(node.id);
      }
    }

    // Add to specific collection mapping
    if (node.collectionId) {
      const col = this.collections.get(node.collectionId);
      if (col && !col.nodeIds.includes(node.id)) {
        col.nodeIds.push(node.id);
      }
    } else {
      const col = this.collections.get("col_default");
      if (col) {
        node.collectionId = "col_default";
        col.nodeIds.push(node.id);
      }
    }
  }

  public removeNode(id: string): boolean {
    const node = this.nodes.get(id);
    if (!node) return false;

    // 1. Unlink parent references
    if (node.parent) {
      const parentNode = this.nodes.get(node.parent);
      if (parentNode) {
        parentNode.children = parentNode.children.filter((cid) => cid !== id);
      }
    }

    // 2. Clear parent linkage on children
    node.children.forEach((childId) => {
      const childNode = this.nodes.get(childId);
      if (childNode) {
        childNode.parent = null;
      }
    });

    // 3. Delete from collections
    if (node.collectionId) {
      const col = this.collections.get(node.collectionId);
      if (col) {
        col.nodeIds = col.nodeIds.filter((nid) => nid !== id);
      }
    }

    // 4. Remove selection
    this.selectedIds.delete(id);

    // 5. Remove from main registry
    return this.nodes.delete(id);
  }

  // --- Hierarchy parent/child updates ---

  public reparentNode(nodeId: string, newParentId: string | null): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    // Detect cyclic relationship
    if (newParentId) {
      let tempParentId: string | null = newParentId;
      while (tempParentId) {
        if (tempParentId === nodeId) {
          console.warn(`[SceneGraph] Parent cyclic detected! Cannot parent "${node.name}" under its own subtree.`);
          return false;
        }
        const tempNode = this.nodes.get(tempParentId);
        tempParentId = tempNode ? tempNode.parent : null;
      }
    }

    // Unlink old parent
    if (node.parent) {
      const oldParent = this.nodes.get(node.parent);
      if (oldParent) {
        oldParent.children = oldParent.children.filter((cid) => cid !== nodeId);
      }
    }

    // Assign new parent
    node.parent = newParentId;

    if (newParentId) {
      const newParent = this.nodes.get(newParentId);
      if (newParent && !newParent.children.includes(nodeId)) {
        newParent.children.push(nodeId);
      }
    }

    return true;
  }

  public groupSelectedNodes(groupName: string = "Scene Group"): string | null {
    const selectedList = this.getSelectedNodes();
    if (selectedList.length === 0) return null;

    // Create container "empty" node
    const groupId = `group_${Date.now()}`;
    
    // Average center position
    let sumX = 0, sumY = 0, sumZ = 0;
    selectedList.forEach((n) => {
      sumX += n.transform.position.x;
      sumY += n.transform.position.y;
      sumZ += n.transform.position.z;
    });
    const avgPos: Vector3D = {
      x: sumX / selectedList.length,
      y: sumY / selectedList.length,
      z: sumZ / selectedList.length
    };

    const groupNode: SceneNode = {
      id: groupId,
      name: groupName,
      type: "empty",
      parent: null,
      children: [],
      transform: {
        position: avgPos,
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      },
      visible: true,
      selected: false,
      tags: ["group", "procedural"],
      layer: "geometry_layer",
      collectionId: selectedList[0].collectionId || "col_default"
    };

    this.addNode(groupNode);

    // Parent selected nodes under group
    selectedList.forEach((n) => {
      // Offset individual translation relative to group center
      n.transform.position.x -= avgPos.x;
      n.transform.position.y -= avgPos.y;
      n.transform.position.z -= avgPos.z;
      this.reparentNode(n.id, groupId);
    });

    // Reset selection to the group node
    this.clearSelection();
    this.setSelected(groupId, true);

    return groupId;
  }

  // --- Selection and Visibility ---

  public getSelectedNodes(): SceneNode[] {
    return Array.from(this.selectedIds)
      .map((id) => this.nodes.get(id))
      .filter((n): n is SceneNode => !!n);
  }

  public getSelectedIds(): string[] {
    return Array.from(this.selectedIds);
  }

  public setSelected(id: string, select: boolean, additive: boolean = false): void {
    if (!additive) {
      this.clearSelection();
    }

    const node = this.nodes.get(id);
    if (node) {
      node.selected = select;
      if (select) {
        this.selectedIds.add(id);
      } else {
        this.selectedIds.delete(id);
      }
    }
  }

  public clearSelection(): void {
    this.nodes.forEach((node) => {
      node.selected = false;
    });
    this.selectedIds.clear();
  }

  public toggleVisibility(id: string): void {
    const node = this.nodes.get(id);
    if (node) {
      node.visible = !node.visible;
    }
  }

  // --- Collections, Layers & Tag Filters ---

  public getCollections() {
    return Array.from(this.collections.values());
  }

  public createCollection(name: string): string {
    const id = `col_${Date.now()}`;
    this.collections.set(id, {
      id,
      name,
      visible: true,
      nodeIds: []
    });
    return id;
  }

  public moveNodeToCollection(nodeId: string, colId: string): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    // Remove from old collection
    if (node.collectionId) {
      const oldCol = this.collections.get(node.collectionId);
      if (oldCol) {
        oldCol.nodeIds = oldCol.nodeIds.filter((nid) => nid !== nodeId);
      }
    }

    const newCol = this.collections.get(colId);
    if (newCol) {
      node.collectionId = colId;
      if (!newCol.nodeIds.includes(nodeId)) {
        newCol.nodeIds.push(nodeId);
      }
      return true;
    }
    return false;
  }

  public getNodesByTag(tag: string): SceneNode[] {
    return this.getNodes().filter((n) => n.tags.includes(tag));
  }

  public getNodesByLayer(layer: string): SceneNode[] {
    return this.getNodes().filter((n) => n.layer === layer);
  }

  // --- Serialization & Version Controls ---

  public serializeScene(): string {
    const nodesArray = this.getNodes();
    const collectionsArray = this.getCollections();

    const data = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      collections: collectionsArray,
      nodes: nodesArray
    };

    return JSON.stringify(data, null, 2);
  }

  public deserializeScene(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.nodes) return false;

      this.nodes.clear();
      this.selectedIds.clear();
      this.collections.clear();

      // Repopulate collections
      if (parsed.collections) {
        parsed.collections.forEach((col: any) => {
          this.collections.set(col.id, col);
        });
      } else {
        this.createDefaultCollections();
      }

      // Repopulate nodes
      parsed.nodes.forEach((node: SceneNode) => {
        this.nodes.set(node.id, node);
        if (node.selected) {
          this.selectedIds.add(node.id);
        }
      });

      return true;
    } catch (e) {
      console.error("[SceneGraph] Deserialize scene error:", e);
      return false;
    }
  }

  public saveVersionPoint(description: string): string {
    const versionId = `ver_${Date.now()}`;
    const data = this.serializeScene();

    // If we've made changes after undoing, truncate remaining forward redo stack
    if (this.currentVersionIndex < this.versionHistory.length - 1) {
      this.versionHistory = this.versionHistory.slice(0, this.currentVersionIndex + 1);
    }

    this.versionHistory.push({
      timestamp: new Date().toLocaleTimeString(),
      versionId,
      description,
      serializedData: data
    });

    this.currentVersionIndex = this.versionHistory.length - 1;
    return versionId;
  }

  public getVersionPoints() {
    return this.versionHistory;
  }

  public getActiveVersionIndex(): number {
    return this.currentVersionIndex;
  }

  public loadVersionIndex(index: number): boolean {
    if (index >= 0 && index < this.versionHistory.length) {
      const ver = this.versionHistory[index];
      const success = this.deserializeScene(ver.serializedData);
      if (success) {
        this.currentVersionIndex = index;
      }
      return success;
    }
    return false;
  }

  public undoVersion(): boolean {
    if (this.currentVersionIndex > 0) {
      return this.loadVersionIndex(this.currentVersionIndex - 1);
    }
    return false;
  }

  public redoVersion(): boolean {
    if (this.currentVersionIndex < this.versionHistory.length - 1) {
      return this.loadVersionIndex(this.currentVersionIndex + 1);
    }
    return false;
  }
}
