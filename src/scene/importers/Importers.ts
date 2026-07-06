import { SceneNode, Transform3D } from "../core/types";
import { SceneGraph } from "../graph/SceneGraph";

export class Importers {
  private static instance: Importers | null = null;

  private constructor() {}

  public static getInstance(): Importers {
    if (!Importers.instance) {
      Importers.instance = new Importers();
    }
    return Importers.instance;
  }

  /**
   * Parses wavefont OBJ file structure into vertex vertices geometry mappings
   */
  public parseOBJ(objContent: string): { vertices: number[]; indices: number[]; polygonCount: number } {
    const lines = objContent.split("\n");
    const vertices: number[] = [];
    const indices: number[] = [];
    
    // Virtual mesh coordinates trackers
    let vCount = 0;
    let fCount = 0;

    lines.forEach((line) => {
      const parts = line.trim().split(/\s+/);
      if (parts[0] === "v") {
        // Vertex position
        vertices.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
        vCount++;
      } else if (parts[0] === "f") {
        // Face indices
        const v1 = parseInt(parts[1].split("/")[0]) - 1;
        const v2 = parseInt(parts[2].split("/")[0]) - 1;
        const v3 = parseInt(parts[3].split("/")[0]) - 1;
        indices.push(v1, v2, v3);
        fCount++;
      }
    });

    return {
      vertices,
      indices,
      polygonCount: fCount
    };
  }

  /**
   * Simulates parsing a complete GLTF scene graph hierarchy
   */
  public parseGLTF(gltfContentJson: string): SceneNode[] {
    try {
      const gltf = JSON.parse(gltfContentJson);
      const parsedNodes: SceneNode[] = [];

      if (gltf.nodes) {
        gltf.nodes.forEach((gNode: any, idx: number) => {
          const id = `gltf_node_${idx}_${Date.now()}`;
          const pos = gNode.translation ? { x: gNode.translation[0], y: gNode.translation[1], z: gNode.translation[2] } : { x: 0, y: 0, z: 0 };
          const rot = gNode.rotation ? { x: gNode.rotation[0], y: gNode.rotation[1], z: gNode.rotation[2] } : { x: 0, y: 0, z: 0 };
          const scl = gNode.scale ? { x: gNode.scale[0], y: gNode.scale[1], z: gNode.scale[2] } : { x: 1, y: 1, z: 1 };

          const node: SceneNode = {
            id,
            name: gNode.name || `GLTF_Mesh_Entity_${idx}`,
            type: gNode.mesh !== undefined ? "mesh" : "empty",
            parent: null,
            children: [],
            transform: { position: pos, rotation: rot, scale: scl },
            visible: true,
            selected: false,
            tags: ["gltf_imported", gNode.mesh !== undefined ? "mesh" : "group"],
            layer: "geometry_layer",
            collectionId: "col_default"
          };

          parsedNodes.push(node);
        });

        // Resolve parent-child hierarchies from gltf index trees
        gltf.nodes.forEach((gNode: any, parentIdx: number) => {
          if (gNode.children) {
            gNode.children.forEach((childIdx: number) => {
              if (parsedNodes[parentIdx] && parsedNodes[childIdx]) {
                parsedNodes[childIdx].parent = parsedNodes[parentIdx].id;
                parsedNodes[parentIdx].children.push(parsedNodes[childIdx].id);
              }
            });
          }
        });
      }

      return parsedNodes;
    } catch (e) {
      console.error("[Importers] Error parsing GLTF file contents:", e);
      return [];
    }
  }

  /**
   * Core router simulating ingestion and registration of foreign scene asset files
   */
  public importModelFileToScene(
    fileName: string,
    fileSizeMb: number,
    format: "OBJ" | "FBX" | "GLTF" | "GLB" | "USD" | "Alembic"
  ): { success: boolean; nodesAdded: number; totalPolygons: number; message: string } {
    const sceneGraph = SceneGraph.getInstance();
    let nodesAdded = 0;
    let totalPolygons = 0;

    const fileBaseName = fileName.substring(0, fileName.lastIndexOf(".")) || fileName;

    if (format === "OBJ") {
      // Create a single custom mesh node with 12,000 polygons
      const id = `mesh_obj_${Date.now()}`;
      totalPolygons = 12400;
      const objMesh: SceneNode = {
        id,
        name: fileBaseName,
        type: "mesh",
        parent: null,
        children: [],
        transform: {
          position: { x: 0, y: 2, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 }
        },
        visible: true,
        selected: true,
        tags: ["obj_import", "static"],
        layer: "geometry_layer",
        collectionId: "col_props"
      };

      sceneGraph.addNode(objMesh);
      sceneGraph.clearSelection();
      sceneGraph.setSelected(id, true);
      nodesAdded = 1;

    } else if (format === "GLTF" || format === "GLB") {
      // Create a small hierachical structure: 1 Root Empty node + 2 Children Mesh nodes
      const rootId = `gltf_root_${Date.now()}`;
      const child1Id = `gltf_arm_${Date.now()}`;
      const child2Id = `gltf_shield_${Date.now()}`;
      totalPolygons = 45800;

      const rootNode: SceneNode = {
        id: rootId,
        name: `${fileBaseName}_Root`,
        type: "empty",
        parent: null,
        children: [child1Id, child2Id],
        transform: { position: { x: 0, y: 1.5, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        visible: true, selected: true, tags: ["gltf_import", "root"], layer: "geometry_layer", collectionId: "col_props"
      };

      const armNode: SceneNode = {
        id: child1Id,
        name: `${fileBaseName}_Armature`,
        type: "mesh",
        parent: rootId,
        children: [],
        transform: { position: { x: -1.2, y: 0, z: 0.5 }, rotation: { x: 15, y: 30, z: 0 }, scale: { x: 0.8, y: 0.8, z: 0.8 } },
        visible: true, selected: false, tags: ["gltf_import", "submesh"], layer: "geometry_layer", collectionId: "col_props"
      };

      const shieldNode: SceneNode = {
        id: child2Id,
        name: `${fileBaseName}_Shield`,
        type: "mesh",
        parent: rootId,
        children: [],
        transform: { position: { x: 1.2, y: 0.2, z: -0.2 }, rotation: { x: -5, y: -45, z: 0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        visible: true, selected: false, tags: ["gltf_import", "submesh"], layer: "geometry_layer", collectionId: "col_props"
      };

      sceneGraph.addNode(rootNode);
      sceneGraph.addNode(armNode);
      sceneGraph.addNode(shieldNode);

      sceneGraph.clearSelection();
      sceneGraph.setSelected(rootId, true);
      nodesAdded = 3;

    } else if (format === "FBX") {
      // Standard bone-rig fbx import structure
      const fbxId = `mesh_fbx_${Date.now()}`;
      totalPolygons = 68000;
      const fbxMesh: SceneNode = {
        id: fbxId,
        name: fileBaseName,
        type: "mesh",
        parent: null,
        children: [],
        transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 90, z: 0 }, scale: { x: 1.5, y: 1.5, z: 1.5 } },
        visible: true, selected: true, tags: ["fbx_import", "rigged"], layer: "geometry_layer", collectionId: "col_props"
      };

      sceneGraph.addNode(fbxMesh);
      sceneGraph.clearSelection();
      sceneGraph.setSelected(fbxId, true);
      nodesAdded = 1;

    } else if (format === "USD") {
      // USD Stage layered structure
      const usdRootId = `usd_stage_${Date.now()}`;
      totalPolygons = 120500;
      const usdMesh: SceneNode = {
        id: usdRootId,
        name: `${fileBaseName}_USD_Stage`,
        type: "mesh",
        parent: null,
        children: [],
        transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        visible: true, selected: true, tags: ["usd_stage", "complex"], layer: "geometry_layer", collectionId: "col_props"
      };

      sceneGraph.addNode(usdMesh);
      sceneGraph.clearSelection();
      sceneGraph.setSelected(usdRootId, true);
      nodesAdded = 1;

    } else { // Alembic point cache cache
      const abcId = `mesh_abc_${Date.now()}`;
      totalPolygons = 240000; // heavy particle geometries
      const abcMesh: SceneNode = {
        id: abcId,
        name: `${fileBaseName}_AlembicCache`,
        type: "mesh",
        parent: null,
        children: [],
        transform: { position: { x: 0, y: 1.0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } },
        visible: true, selected: true, tags: ["alembic_cache", "fluid_mesh"], layer: "geometry_layer", collectionId: "col_props"
      };

      sceneGraph.addNode(abcMesh);
      sceneGraph.clearSelection();
      sceneGraph.setSelected(abcId, true);
      nodesAdded = 1;
    }

    // Capture backup checkpoint
    sceneGraph.saveVersionPoint(`Imported model file: ${fileName}`);

    return {
      success: true,
      nodesAdded,
      totalPolygons,
      message: `Parsed ${format} file successful. Added ${nodesAdded} nodes to active collection. Compiled ${totalPolygons.toLocaleString()} triangles.`
    };
  }
}
