import { SceneGraph } from "../graph/SceneGraph";
import { MaterialEngine } from "../material/MaterialEngine";
import { LightEngine } from "../light/LightEngine";
import { CameraEngine } from "../camera/CameraEngine";

export class Exporters {
  private static instance: Exporters | null = null;

  private constructor() {}

  public static getInstance(): Exporters {
    if (!Exporters.instance) {
      Exporters.instance = new Exporters();
    }
    return Exporters.instance;
  }

  /**
   * Compiles and outputs the active scene graph as a standard Wavefront OBJ file
   */
  public exportToOBJ(): string {
    const sceneGraph = SceneGraph.getInstance();
    const nodes = sceneGraph.getNodes().filter((n) => n.type === "mesh" && n.visible);

    let output = "# AI Creative Studio 3D Scene Exporter v1.0\n";
    output += `# Export Date: ${new Date().toISOString()}\n`;
    output += `# Number of Meshes exported: ${nodes.length}\n\n`;

    let vertexOffset = 1;

    nodes.forEach((node) => {
      output += `o ${node.name.replace(/\s+/g, "_")}\n`;
      
      // Virtual box vertices list translation:
      const p = node.transform.position;
      const s = node.transform.scale;

      const v = [
        { x: p.x - s.x, y: p.y - s.y, z: p.z + s.z },
        { x: p.x + s.x, y: p.y - s.y, z: p.z + s.z },
        { x: p.x + s.x, y: p.y + s.y, z: p.z + s.z },
        { x: p.x - s.x, y: p.y + s.y, z: p.z + s.z },
        { x: p.x - s.x, y: p.y - s.y, z: p.z - s.z },
        { x: p.x + s.x, y: p.y - s.y, z: p.z - s.z },
        { x: p.x + s.x, y: p.y + s.y, z: p.z - s.z },
        { x: p.x - s.x, y: p.y + s.y, z: p.z - s.z }
      ];

      v.forEach((vertex) => {
        output += `v ${vertex.x.toFixed(4)} ${vertex.y.toFixed(4)} ${vertex.z.toFixed(4)}\n`;
      });

      output += `\n# Faces mapping cube polygons\n`;
      const faces = [
        [1, 2, 3, 4], // Front
        [5, 8, 7, 6], // Back
        [1, 5, 6, 2], // Bottom
        [2, 6, 7, 3], // Right
        [3, 7, 8, 4], // Top
        [4, 8, 5, 1]  // Left
      ];

      faces.forEach((f) => {
        output += `f ${f[0] + vertexOffset - 1} ${f[1] + vertexOffset - 1} ${f[2] + vertexOffset - 1} ${f[3] + vertexOffset - 1}\n`;
      });

      vertexOffset += 8;
      output += "\n";
    });

    return output;
  }

  /**
   * Compiles the entire Scene state graph including cameras, lights, and PBR shaders as a fully structured GLTF JSON
   */
  public exportToGLTF(): string {
    const sceneGraph = SceneGraph.getInstance();
    const matEngine = MaterialEngine.getInstance();
    const lightEngine = LightEngine.getInstance();
    const camEngine = CameraEngine.getInstance();

    const nodes = sceneGraph.getNodes();
    const gltfNodes: any[] = [];
    const gltfMaterials: any[] = [];

    // Compile active materials used in scene
    matEngine.getMaterials().forEach((mat) => {
      gltfMaterials.push({
        name: mat.name,
        pbrMetallicRoughness: {
          baseColorFactor: [mat.albedo.r / 255, mat.albedo.g / 255, mat.albedo.b / 255, mat.opacity],
          metallicFactor: mat.metallic,
          roughnessFactor: mat.roughness
        },
        emissiveFactor: [mat.emissionColor.r / 255, mat.emissionColor.g / 255, mat.emissionColor.b / 255]
      });
    });

    // Compile active nodes with transforms
    nodes.forEach((node) => {
      gltfNodes.push({
        name: node.name,
        translation: [node.transform.position.x, node.transform.position.y, node.transform.position.z],
        rotation: [node.transform.rotation.x, node.transform.rotation.y, node.transform.rotation.z],
        scale: [node.transform.scale.x, node.transform.scale.y, node.transform.scale.z],
        extras: {
          type: node.type,
          visible: node.visible,
          layer: node.layer,
          tags: node.tags
        }
      });
    });

    const gltfOutput = {
      asset: {
        generator: "AI Creative Studio 3D Cinematic Engine v1.0",
        version: "2.0"
      },
      scene: 0,
      scenes: [
        {
          nodes: Array.from({ length: gltfNodes.length }).map((_, i) => i)
        }
      ],
      nodes: gltfNodes,
      materials: gltfMaterials,
      extras: {
        cameraParams: camEngine.getParams(),
        hdriIntensity: lightEngine.getHdriIntensity(),
        hdriPreset: lightEngine.getActiveHdriPreset()
      }
    };

    return JSON.stringify(gltfOutput, null, 2);
  }

  /**
   * Compiles and outputs dynamic diagnostics summary mapping binary structures
   */
  public executeSceneExportSimulation(
    format: "OBJ" | "FBX" | "GLTF" | "GLB" | "USD" | "Alembic"
  ): { success: boolean; byteSize: number; outputString: string; metadata: any } {
    const sceneGraph = SceneGraph.getInstance();
    const count = sceneGraph.getNodes().length;

    let byteSize = 1024 * 45; // default 45KB
    let outputString = "";

    if (format === "OBJ") {
      outputString = this.exportToOBJ();
      byteSize = outputString.length;
    } else if (format === "GLTF") {
      outputString = this.exportToGLTF();
      byteSize = outputString.length;
    } else if (format === "GLB") {
      outputString = this.exportToGLTF(); // standard text fallback representation
      byteSize = Math.round(outputString.length * 0.85); // simulated binary optimization
    } else if (format === "FBX") {
      outputString = `; FBX Binary Scene Export\n; Generated by AI Creative Studio\n; Nodes Count: ${count}\n`;
      byteSize = 1024 * 1024 * 1.8; // ~1.8MB
    } else if (format === "USD") {
      outputString = `#usda 1.0\n# USD Cinematic Stage Exporter\ndef Xform "Scene_Root"\n{\n`;
      sceneGraph.getNodes().forEach((n) => {
        outputString += `  def Xform "${n.name.replace(/\s+/g, "_")}"\n  {\n`;
        outputString += `    double3 xformOp:translate = (${n.transform.position.x}, ${n.transform.position.y}, ${n.transform.position.z})\n`;
        outputString += `  }\n`;
      });
      outputString += `}\n`;
      byteSize = outputString.length;
    } else { // Alembic cache mesh vertices timeline sequence
      outputString = `// Alembic Geometry Cache sequence v1.5\n// Tracks: vertex frame sequences\n`;
      byteSize = 1024 * 1024 * 14.2; // 14.2MB binary cache
    }

    return {
      success: true,
      byteSize,
      outputString,
      metadata: {
        nodesExportedCount: count,
        exporterVersion: "1.0",
        fileExtension: format.toLowerCase(),
        checksum: `sha256_${Math.random().toString(36).substring(3, 11)}`
      }
    };
  }
}
