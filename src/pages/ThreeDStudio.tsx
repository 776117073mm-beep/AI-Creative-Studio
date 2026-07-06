import { useState, useEffect, useRef } from "react";
import { 
  Box, 
  Lightbulb, 
  Video, 
  Layers, 
  RotateCw, 
  Sparkles,
  Sliders,
  Maximize2,
  Play,
  Pause,
  Plus,
  Trash2,
  FolderOpen,
  Download,
  Info,
  Cpu,
  Bookmark,
  Share2,
  Wind,
  Shield,
  Activity,
  User,
  Heart,
  Search,
  CheckCircle,
  HelpCircle,
  Minimize2
} from "lucide-react";
import { PageId } from "../types";

// Core Scene Engine Imports
import { Vector3D, SceneNode, MaterialConfig, LightNode, TextureConfig, Asset3D, GPUMemoryStats } from "../scene/core/types";
import { SceneGraph } from "../scene/graph/SceneGraph";
import { CameraEngine } from "../scene/camera/CameraEngine";
import { LightEngine } from "../scene/light/LightEngine";
import { MaterialEngine } from "../scene/material/MaterialEngine";
import { TextureEngine } from "../scene/material/TextureEngine";
import { MeshEngine } from "../scene/mesh/MeshEngine";
import { AssetEngine } from "../scene/assets/AssetEngine";
import { Importers } from "../scene/importers/Importers";
import { Exporters } from "../scene/exporters/Exporters";
import { EnvironmentEngine } from "../scene/environment/EnvironmentEngine";
import { SceneAnimator } from "../scene/animation/SceneAnimator";
import { PhysicsEngine } from "../scene/physics/PhysicsEngine";
import { GPUEngine } from "../scene/core/GPUEngine";
import { PluginSDK } from "../scene/core/PluginSDK";

interface ThreeDStudioProps {
  onNavigate: (page: PageId) => void;
}

export default function ThreeDStudio({ onNavigate }: ThreeDStudioProps) {
  // Singleton instance cache
  const sceneGraph = SceneGraph.getInstance();
  const cameraEngine = CameraEngine.getInstance();
  const lightEngine = LightEngine.getInstance();
  const matEngine = MaterialEngine.getInstance();
  const texEngine = TextureEngine.getInstance();
  const meshEngine = MeshEngine.getInstance();
  const assetEngine = AssetEngine.getInstance();
  const importers = Importers.getInstance();
  const exporters = Exporters.getInstance();
  const envEngine = EnvironmentEngine.getInstance();
  const animator = SceneAnimator.getInstance();
  const physicsEngine = PhysicsEngine.getInstance();
  const gpuEngine = GPUEngine.getInstance();
  const pluginSDK = PluginSDK.getInstance();

  // --- Dynamic State ---
  const [activeTab, setActiveTab] = useState<"assets" | "materials" | "lighting" | "environment" | "plugins">("assets");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("mesh_mech_0");
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0.0);
  const [physicsActive, setPhysicsActive] = useState<boolean>(false);
  const [assetSearch, setAssetSearch] = useState<string>("");
  const [selectedAssetType, setSelectedAssetType] = useState<string>("all");
  const [gpuStats, setGpuStats] = useState<GPUMemoryStats>(gpuEngine.getStats());
  const [sceneVersionIndex, setSceneVersionIndex] = useState<number>(sceneGraph.getActiveVersionIndex());
  
  // Importer state
  const [importFileName, setImportFileName] = useState<string>("cyborg_head.obj");
  const [importFormat, setImportFormat] = useState<"OBJ" | "FBX" | "GLTF" | "GLB" | "USD" | "Alembic">("OBJ");
  const [importFeedback, setImportFeedback] = useState<string | null>(null);

  // Exporter state
  const [exportFormat, setExportFormat] = useState<"OBJ" | "FBX" | "GLTF" | "GLB" | "USD" | "Alembic">("GLTF");
  const [exportFeedback, setExportFeedback] = useState<{ size: string; message: string } | null>(null);

  // Selected object properties binders
  const [posX, setPosX] = useState<number>(0);
  const [posY, setPosY] = useState<number>(0);
  const [posZ, setPosZ] = useState<number>(0);
  const [rotX, setRotX] = useState<number>(0);
  const [rotY, setRotY] = useState<number>(0);
  const [rotZ, setRotZ] = useState<number>(0);
  const [sclX, setSclX] = useState<number>(1);
  const [sclY, setSclY] = useState<number>(1);
  const [sclZ, setSclZ] = useState<number>(1);
  const [nodeName, setNodeName] = useState<string>("");
  const [nodeLayer, setNodeLayer] = useState<string>("geometry_layer");
  const [nodeTags, setNodeTags] = useState<string>("");

  // Material coefficients binders for selected object
  const [matAlbedoR, setMatAlbedoR] = useState<number>(200);
  const [matAlbedoG, setMatAlbedoG] = useState<number>(200);
  const [matAlbedoB, setMatAlbedoB] = useState<number>(200);
  const [matMetallic, setMatMetallic] = useState<number>(0.5);
  const [matRoughness, setMatRoughness] = useState<number>(0.5);
  const [matEmissionIntensity, setMatEmissionIntensity] = useState<number>(0);
  const [matOpacity, setMatOpacity] = useState<number>(1);

  // Light params binder
  const [lightIntensity, setLightIntensity] = useState<number>(4.5);
  const [lightColorR, setLightColorR] = useState<number>(255);
  const [lightColorG, setLightColorG] = useState<number>(255);
  const [lightColorB, setLightColorB] = useState<number>(255);

  // Camera settings binders
  const [camType, setCamType] = useState<"perspective" | "orthographic">("perspective");
  const [camFov, setCamFov] = useState<number>(45);
  const [camFocalLength, setCamFocalLength] = useState<number>(35);
  const [camShake, setCamShake] = useState<number>(0.1);
  const [camSafeArea, setCamSafeArea] = useState<boolean>(true);

  // Interactive 3D Canvas Projection viewport reference
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(Date.now());

  // Force trigger react update
  const [tick, setTick] = useState<number>(0);
  const forceUpdate = () => setTick((prev) => prev + 1);

  // --- Initialize Node Binders when selection shifts ---
  useEffect(() => {
    if (!selectedNodeId) return;
    const node = sceneGraph.getNode(selectedNodeId);
    if (!node) return;

    setNodeName(node.name);
    setPosX(node.transform.position.x);
    setPosY(node.transform.position.y);
    setPosZ(node.transform.position.z);
    setRotX(node.transform.rotation.x);
    setRotY(node.transform.rotation.y);
    setRotZ(node.transform.rotation.z);
    setSclX(node.transform.scale.x);
    setSclY(node.transform.scale.y);
    setSclZ(node.transform.scale.z);
    setNodeLayer(node.layer);
    setNodeTags(node.tags.join(", "));

    // Bind PBR Material if node has one
    if (node.type === "mesh") {
      const mesh = node as any;
      if (mesh.materialId) {
        const mat = matEngine.getMaterial(mesh.materialId);
        if (mat) {
          setMatAlbedoR(mat.albedo.r);
          setMatAlbedoG(mat.albedo.g);
          setMatAlbedoB(mat.albedo.b);
          setMatMetallic(mat.metallic);
          setMatRoughness(mat.roughness);
          setMatEmissionIntensity(mat.emissionIntensity);
          setMatOpacity(mat.opacity);
        }
      }
    }

    // Bind lighting if node is light
    if (node.type === "light") {
      const light = node as LightNode;
      setLightIntensity(light.lightParams.intensity);
      setLightColorR(light.lightParams.color.r);
      setLightColorG(light.lightParams.color.g);
      setLightColorB(light.lightParams.color.b);
    }
  }, [selectedNodeId, tick]);

  // --- Real-time Animation Render Loop ---
  useEffect(() => {
    const loop = () => {
      const now = Date.now();
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      // 1. Advance timeline animation keyframes
      if (isPlaying) {
        setCurrentTime((prev) => {
          const next = prev + dt;
          animator.evaluateSceneTracksAtTime(next);
          return next > 10.0 ? 0.0 : next;
        });
      }

      // 2. Advance physics mechanics
      if (physicsActive) {
        physicsEngine.stepPhysicsSimulation(dt);
      }

      // 3. Advance texture loading streams
      texEngine.advanceStreamingTick(dt);

      // 4. Synchronize GPU allocation stats dynamically based on geometry complexities
      gpuEngine.recalculateVRAMAllocations(
        sceneGraph.getNodes().length,
        texEngine.getCachedTextures().length
      );
      setGpuStats(gpuEngine.getStats());

      // 5. Draw 3D projected coordinates on vector HTML5 canvas
      render3DViewport();

      frameIdRef.current = requestAnimationFrame(loop);
    };

    frameIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
    };
  }, [isPlaying, physicsActive]);

  // --- Real-time Viewport Projection Matrix Drawing ---
  const render3DViewport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clear background with ambient skydome gradient colors
    const env = envEngine.getConfig();
    const skyGrad = EnvironmentEngine.getSkyColorGradient(env.skyPreset);

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, skyGrad.top);
    grad.addColorStop(1, skyGrad.bottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Apply procedural hand-held lens shake vector
    const shakeOffset = cameraEngine.getShakeOffset(currentTime);
    const camPos = cameraEngine.getPosition();
    const camRot = cameraEngine.getRotation();

    const actualCamPos: Vector3D = {
      x: camPos.x + shakeOffset.x,
      y: camPos.y + shakeOffset.y,
      z: camPos.z + shakeOffset.z
    };

    // Draw floor reflection grid
    if (env.groundVisible) {
      drawGroundReflectionGrid(ctx, w, h, actualCamPos, camRot, env.groundReflection);
    }

    // Draw active lights icons
    lightEngine.getLights().forEach((light) => {
      if (light.visible) {
        drawProjectedLightIcon(ctx, w, h, light, actualCamPos, camRot);
      }
    });

    // Draw all active Mesh Nodes in Scene Graph with depth sorted wireframes
    const nodes = sceneGraph.getNodes();
    
    // Simple Depth Sorting relative to Camera
    const sortedNodes = [...nodes]
      .filter((n) => n.visible && (n.type === "mesh" || n.type === "empty"))
      .map((n) => {
        const dx = n.transform.position.x - actualCamPos.x;
        const dy = n.transform.position.y - actualCamPos.y;
        const dz = n.transform.position.z - actualCamPos.z;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        return { node: n, dist };
      })
      .sort((a, b) => b.dist - a.dist); // Render back-to-front

    sortedNodes.forEach(({ node }) => {
      // Evaluate Level of Detail (LOD) level dynamically
      const lod = MeshEngine.selectLODLevel(actualCamPos, node.transform.position, cameraEngine.getParams().focalLength);
      
      if (lod !== "lod_cull") {
        drawProjectedMeshWireframe(ctx, w, h, node, actualCamPos, camRot, lod);
      }
    });

    // Draw viewport Safe Area guidelines overlays
    if (cameraEngine.getParams().safeArea) {
      const guides = cameraEngine.getSafeAreaGuides(w, h);
      ctx.strokeStyle = "rgba(100, 255, 100, 0.25)";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      
      // Action Safe
      ctx.strokeRect(guides.actionSafe.x, guides.actionSafe.y, guides.actionSafe.w, guides.actionSafe.h);
      
      // Title Safe
      ctx.strokeStyle = "rgba(100, 255, 100, 0.45)";
      ctx.strokeRect(guides.titleSafe.x, guides.titleSafe.y, guides.titleSafe.w, guides.titleSafe.h);
      ctx.setLineDash([]);

      // Draw Center crosshair
      ctx.strokeStyle = "rgba(100, 255, 100, 0.35)";
      ctx.beginPath();
      ctx.moveTo(w / 2 - 10, h / 2);
      ctx.lineTo(w / 2 + 10, h / 2);
      ctx.moveTo(w / 2, h / 2 - 10);
      ctx.lineTo(w / 2, h / 2 + 10);
      ctx.stroke();
    }

    // Draw Selected outline highlight box
    if (selectedNodeId) {
      const selNode = sceneGraph.getNode(selectedNodeId);
      if (selNode && selNode.visible) {
        drawSelectedBoundingBoxHighlight(ctx, w, h, selNode, actualCamPos, camRot);
      }
    }
  };

  // --- Ground reflection wire plane drawer ---
  const drawGroundReflectionGrid = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    camPos: Vector3D,
    camRot: Vector3D,
    reflectivity: number
  ) => {
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 * reflectivity})`;
    ctx.lineWidth = 1;

    // Draw simple grid floor lines
    const gridSize = 40;
    const step = 4;
    const yGrid = 0.0;

    for (let x = -gridSize; x <= gridSize; x += step) {
      ctx.beginPath();
      let first = true;
      for (let z = -gridSize; z <= gridSize; z += step) {
        const pt = project3DTo2D({ x, y: yGrid, z }, camPos, camRot, w, h);
        if (pt) {
          if (first) {
            ctx.moveTo(pt.x, pt.y);
            first = false;
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        }
      }
      ctx.stroke();
    }

    for (let z = -gridSize; z <= gridSize; z += step) {
      ctx.beginPath();
      let first = true;
      for (let x = -gridSize; x <= gridSize; x += step) {
        const pt = project3DTo2D({ x, y: yGrid, z }, camPos, camRot, w, h);
        if (pt) {
          if (first) {
            ctx.moveTo(pt.x, pt.y);
            first = false;
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        }
      }
      ctx.stroke();
    }
  };

  // --- Projected light icon emitter draw ---
  const drawProjectedLightIcon = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    light: LightNode,
    camPos: Vector3D,
    camRot: Vector3D
  ) => {
    const pt = project3DTo2D(light.transform.position, camPos, camRot, w, h);
    if (!pt) return;

    ctx.fillStyle = `rgb(${light.lightParams.color.r}, ${light.lightParams.color.g}, ${light.lightParams.color.b})`;
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Small label
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "8px monospace";
    ctx.textAlign = "center";
    ctx.fillText(light.name, pt.x, pt.y - 10);
  };

  // --- Bounding selection drawer ---
  const drawSelectedBoundingBoxHighlight = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    node: SceneNode,
    camPos: Vector3D,
    camRot: Vector3D
  ) => {
    const p = node.transform.position;
    const s = node.transform.scale;

    // Create 8 points of bounding box
    const pts = [
      { x: p.x - s.x, y: p.y - s.y, z: p.z - s.z },
      { x: p.x + s.x, y: p.y - s.y, z: p.z - s.z },
      { x: p.x + s.x, y: p.y + s.y, z: p.z - s.z },
      { x: p.x - s.x, y: p.y + s.y, z: p.z - s.z },
      { x: p.x - s.x, y: p.y - s.y, z: p.z + s.z },
      { x: p.x + s.x, y: p.y - s.y, z: p.z + s.z },
      { x: p.x + s.x, y: p.y + s.y, z: p.z + s.z },
      { x: p.x - s.x, y: p.y + s.y, z: p.z + s.z }
    ];

    const projPts = pts.map((pt) => project3DTo2D(pt, camPos, camRot, w, h));

    ctx.strokeStyle = "#fbbf24"; // Amber high fidelity highlight outline
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    // Draw bounding box faces
    const lines = [
      [0, 1], [1, 2], [2, 3], [3, 0], // Back
      [4, 5], [5, 6], [6, 7], [7, 4], // Front
      [0, 4], [1, 5], [2, 6], [3, 7]  // Connectors
    ];

    lines.forEach(([i1, i2]) => {
      const p1 = projPts[i1];
      const p2 = projPts[i2];
      if (p1 && p2) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    });

    ctx.setLineDash([]);
  };

  // --- Projected custom wireframe meshes rasterizer drawer ---
  const drawProjectedMeshWireframe = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    node: SceneNode,
    camPos: Vector3D,
    camRot: Vector3D,
    lod: string
  ) => {
    const p = node.transform.position;
    const r = node.transform.rotation;
    const s = node.transform.scale;

    // Default Material attributes fallback
    let albedoColor = "rgba(255, 255, 255, 0.4)";
    let isGlowing = false;
    let opacityValue = 1.0;

    if (node.type === "mesh") {
      const mesh = node as any;
      if (mesh.materialId) {
        const mat = matEngine.getMaterial(mesh.materialId);
        if (mat) {
          albedoColor = `rgba(${mat.albedo.r}, ${mat.albedo.g}, ${mat.albedo.b}, ${mat.opacity})`;
          opacityValue = mat.opacity;
          if (mat.emissionIntensity > 1.5) {
            isGlowing = true;
          }
        }
      }
    }

    // Set styling parameters based on LOD resolution
    ctx.strokeStyle = albedoColor;
    ctx.lineWidth = lod === "lod_high" ? 1.5 : lod === "lod_medium" ? 1.0 : 0.75;
    
    if (isGlowing) {
      ctx.shadowColor = "rgba(255, 120, 0, 0.85)";
      ctx.shadowBlur = 10;
    } else {
      ctx.shadowBlur = 0;
    }

    // Fetch geometry arrays depending on geometry names
    const geoName = (node as any).geometryType || "cube";

    if (geoName === "cube" || node.type === "empty") {
      // Draw cube lines
      const localVertices = [
        { x: -1, y: -1, z: -1 }, { x: 1, y: -1, z: -1 }, { x: 1, y: 1, z: -1 }, { x: -1, y: 1, z: -1 },
        { x: -1, y: -1, z: 1 },  { x: 1, y: -1, z: 1 },  { x: 1, y: 1, z: 1 },  { x: -1, y: 1, z: 1 }
      ];

      const projected = localVertices.map((v) => {
        // Translate local -> global scale, rotation, translation
        const glob = localToGlobal(v, p, r, s);
        return project3DTo2D(glob, camPos, camRot, w, h);
      });

      const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0], // back
        [4, 5], [5, 6], [6, 7], [7, 4], // front
        [0, 4], [1, 5], [2, 6], [3, 7]  // connectors
      ];

      edges.forEach(([i1, i2]) => {
        const p1 = projected[i1];
        const p2 = projected[i2];
        if (p1 && p2) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      });

    } else if (geoName === "sphere") {
      // Draw Sphere rings based on LOD complexity
      const ringCount = lod === "lod_high" ? 12 : lod === "lod_medium" ? 8 : 4;
      const ptsPerRing = lod === "lod_high" ? 18 : lod === "lod_medium" ? 12 : 6;

      for (let i = 0; i < ringCount; i++) {
        const theta = (i / ringCount) * Math.PI;
        ctx.beginPath();
        let first = true;
        for (let j = 0; j <= ptsPerRing; j++) {
          const phi = (j / ptsPerRing) * Math.PI * 2;
          const localV = {
            x: Math.sin(theta) * Math.cos(phi),
            y: Math.cos(theta),
            z: Math.sin(theta) * Math.sin(phi)
          };
          const glob = localToGlobal(localV, p, r, s);
          const pt = project3DTo2D(glob, camPos, camRot, w, h);
          if (pt) {
            if (first) {
              ctx.moveTo(pt.x, pt.y);
              first = false;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          }
        }
        ctx.stroke();
      }

    } else if (geoName === "torus") {
      // Draw Concentric Torus loops
      const majorSegments = lod === "lod_high" ? 14 : 8;
      const minorSegments = lod === "lod_high" ? 10 : 6;
      const rMajor = 1.0;
      const rMinor = 0.35;

      for (let i = 0; i < majorSegments; i++) {
        const u = (i / majorSegments) * Math.PI * 2;
        ctx.beginPath();
        let first = true;
        for (let j = 0; j <= minorSegments; j++) {
          const v = (j / minorSegments) * Math.PI * 2;
          const localV = {
            x: (rMajor + rMinor * Math.cos(v)) * Math.cos(u),
            y: rMinor * Math.sin(v),
            z: (rMajor + rMinor * Math.cos(v)) * Math.sin(u)
          };
          const glob = localToGlobal(localV, p, r, s);
          const pt = project3DTo2D(glob, camPos, camRot, w, h);
          if (pt) {
            if (first) {
              ctx.moveTo(pt.x, pt.y);
              first = false;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          }
        }
        ctx.stroke();
      }

    } else {
      // Draw custom cinematic objects (Cyber Mech armor, Recon Drone)
      // Represent detailed tech silhouettes by creating layered polygons
      const complexity = geoName === "cyber_mech" ? 3 : geoName === "scifi_drone" ? 2 : 4;
      
      for (let l = 0; l < complexity; l++) {
        const layerY = (l - complexity / 2) * 0.8;
        ctx.beginPath();
        let first = true;
        const vertexResolution = 8;
        for (let idx = 0; idx <= vertexResolution; idx++) {
          const angle = (idx / vertexResolution) * Math.PI * 2;
          const scaleOffset = 1.0 - Math.abs(layerY) * 0.4;
          const localV = {
            x: Math.cos(angle) * scaleOffset * 0.9,
            y: layerY,
            z: Math.sin(angle) * scaleOffset * 0.9
          };

          // Append greebles wings detailing for drones/mechs
          if (geoName === "scifi_drone" && idx % 2 === 0) {
            localV.x *= 1.8; // extend wings
          }

          const glob = localToGlobal(localV, p, r, s);
          const pt = project3DTo2D(glob, camPos, camRot, w, h);
          if (pt) {
            if (first) {
              ctx.moveTo(pt.x, pt.y);
              first = false;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          }
        }
        ctx.stroke();
      }

      // Add center spine vector column
      const basePt = project3DTo2D(localToGlobal({ x: 0, y: -1.2, z: 0 }, p, r, s), camPos, camRot, w, h);
      const topPt = project3DTo2D(localToGlobal({ x: 0, y: 1.2, z: 0 }, p, r, s), camPos, camRot, w, h);
      if (basePt && topPt) {
        ctx.beginPath();
        ctx.moveTo(basePt.x, basePt.y);
        ctx.lineTo(topPt.x, topPt.y);
        ctx.stroke();
      }
    }

    ctx.shadowBlur = 0; // reset glow
  };

  // --- Coordinate transform helpers math ---
  const localToGlobal = (v: Vector3D, pos: Vector3D, rot: Vector3D, scale: Vector3D): Vector3D => {
    // 1. Scale
    let x = v.x * scale.x;
    let y = v.y * scale.y;
    let z = v.z * scale.z;

    // Convert degrees to radians
    const rx = (rot.x * Math.PI) / 180;
    const ry = (rot.y * Math.PI) / 180;
    const rz = (rot.z * Math.PI) / 180;

    // 2. Rotate Pitch (X)
    let y1 = y * Math.cos(rx) - z * Math.sin(rx);
    let z1 = y * Math.sin(rx) + z * Math.cos(rx);
    y = y1; z = z1;

    // 3. Rotate Yaw (Y)
    let x1 = x * Math.cos(ry) + z * Math.sin(ry);
    let z2 = -x * Math.sin(ry) + z * Math.cos(ry);
    x = x1; z = z2;

    // 4. Rotate Roll (Z)
    let x2 = x * Math.cos(rz) - y * Math.sin(rz);
    let y2 = x * Math.sin(rz) + y * Math.cos(rz);
    x = x2; y = y2;

    // 5. Translate
    return {
      x: x + pos.x,
      y: y + pos.y,
      z: z + pos.z
    };
  };

  const project3DTo2D = (
    v: Vector3D,
    camPos: Vector3D,
    camRot: Vector3D,
    w: number,
    h: number
  ): { x: number; y: number } | null => {
    // Transform coordinates relative to camera space translate
    let dx = v.x - camPos.x;
    let dy = v.y - camPos.y;
    let dz = v.z - camPos.z;

    // Reverse Camera Angles rotate matrices
    const rx = -(camRot.x * Math.PI) / 180;
    const ry = -(camRot.y * Math.PI) / 180;
    const rz = -(camRot.z * Math.PI) / 180;

    // Rotate Camera Yaw (Y)
    let x1 = dx * Math.cos(ry) + dz * Math.sin(ry);
    let z1 = -dx * Math.sin(ry) + dz * Math.cos(ry);
    dx = x1; dz = z1;

    // Rotate Camera Pitch (X)
    let y1 = dy * Math.cos(rx) - dz * Math.sin(rx);
    let z2 = dy * Math.sin(rx) + dz * Math.cos(rx);
    dy = y1; dz = z2;

    // Rotate Camera Roll (Z)
    let x2 = dx * Math.cos(rz) - dy * Math.sin(rz);
    let y2 = dx * Math.sin(rz) + dy * Math.cos(rz);
    dx = x2; dy = y2;

    // Cull points behind focal near plane
    if (dz <= 0.1) return null;

    // Projection mathematics based on active focal fov depth scale
    const params = cameraEngine.getParams();
    let fScale = 400; // perspective default multiplier

    if (params.type === "perspective") {
      fScale = (w / 2) / Math.tan(((params.fov / 2) * Math.PI) / 180);
      const projX = (dx * fScale) / dz + w / 2;
      const projY = (-dy * fScale) / dz + h / 2;
      return { x: projX, y: projY };
    } else {
      // Orthographic orthoscale projection
      const size = params.orthoScale * 10;
      const projX = (dx * size) + w / 2;
      const projY = (-dy * size) + h / 2;
      return { x: projX, y: projY };
    }
  };

  // --- Node properties updates triggers ---
  const handleUpdateNodeTransform = () => {
    if (!selectedNodeId) return;
    const node = sceneGraph.getNode(selectedNodeId);
    if (node) {
      node.name = nodeName;
      node.transform.position = { x: posX, y: posY, z: posZ };
      node.transform.rotation = { x: rotX, y: rotY, z: rotZ };
      node.transform.scale = { x: sclX, y: sclY, z: sclZ };
      node.layer = nodeLayer;
      
      const parsedTags = nodeTags.split(",").map((t) => t.trim()).filter((t) => t !== "");
      node.tags = parsedTags;

      sceneGraph.saveVersionPoint(`Updated node transform: ${nodeName}`);
      setSceneVersionIndex(sceneGraph.getActiveVersionIndex());
      forceUpdate();
    }
  };

  // --- Shader materials settings triggers ---
  const handleUpdatePBRMaterial = () => {
    if (!selectedNodeId) return;
    const node = sceneGraph.getNode(selectedNodeId);
    if (node && node.type === "mesh") {
      const mesh = node as any;
      if (mesh.materialId) {
        const mat = matEngine.getMaterial(mesh.materialId);
        if (mat) {
          mat.albedo = { r: matAlbedoR, g: matAlbedoG, b: matAlbedoB };
          mat.metallic = matMetallic;
          mat.roughness = matRoughness;
          mat.emissionIntensity = matEmissionIntensity;
          mat.opacity = matOpacity;

          sceneGraph.saveVersionPoint(`Modified PBR Material: ${mat.name}`);
          setSceneVersionIndex(sceneGraph.getActiveVersionIndex());
          forceUpdate();
        }
      }
    }
  };

  // --- Add custom geometry node templates ---
  const handleAddGeometryPrimitive = (type: "cube" | "sphere" | "torus" | "scifi_drone" | "cyber_mech" | "temple_ruins") => {
    const id = `mesh_${type}_${Date.now()}`;
    const name = `Virtual_${type}_${sceneGraph.getNodes().length}`;

    // Link template materials context
    let matId = "mat_chrome";
    if (type === "cyber_mech") matId = "mat_gold";
    if (type === "scifi_drone") matId = "mat_hologram";
    if (type === "temple_ruins") matId = "mat_lava_rock";

    const meshNode: SceneNode = {
      id,
      name,
      type: "mesh",
      parent: null,
      children: [],
      transform: {
        position: { x: (Math.random() - 0.5) * 8, y: type === "temple_ruins" ? 0 : 2.5, z: (Math.random() - 0.5) * 6 },
        rotation: { x: 0, y: Math.random() * 360, z: 0 },
        scale: type === "cube" ? { x: 1, y: 1, z: 1 } : type === "sphere" ? { x: 1.2, y: 1.2, z: 1.2 } : { x: 1.8, y: 1.8, z: 1.8 }
      },
      visible: true,
      selected: true,
      tags: ["geometry", type, "added_runtime"],
      layer: "geometry_layer",
      collectionId: "col_props"
    };

    (meshNode as any).geometryType = type;
    (meshNode as any).materialId = matId;

    sceneGraph.addNode(meshNode);
    sceneGraph.clearSelection();
    sceneGraph.setSelected(id, true);
    setSelectedNodeId(id);

    sceneGraph.saveVersionPoint(`Added geometry primitive: ${name}`);
    setSceneVersionIndex(sceneGraph.getActiveVersionIndex());
    forceUpdate();
  };

  // --- Add custom plugin procedural geometry greebles ---
  const handleAddProceduralPluginGreebles = () => {
    // Ensure Greebles plugin is loaded
    const isPluginEnabled = pluginSDK.getPlugins().find((p) => p.id === "pl_scifi_gen")?.enabled;
    if (!isPluginEnabled) {
      pluginSDK.togglePlugin("pl_scifi_gen");
    }

    const node = pluginSDK.createProceduralGeometry("SciFi_Greeble_Box", "Procedural_Wall");
    if (node) {
      sceneGraph.clearSelection();
      sceneGraph.setSelected(node.id, true);
      setSelectedNodeId(node.id);
      
      sceneGraph.saveVersionPoint("Injected Procedural Greebles plugin node");
      setSceneVersionIndex(sceneGraph.getActiveVersionIndex());
      forceUpdate();
    }
  };

  // --- Delete selected node ---
  const handleDeleteNode = () => {
    if (!selectedNodeId) return;
    const success = sceneGraph.removeNode(selectedNodeId);
    if (success) {
      setSelectedNodeId(null);
      sceneGraph.saveVersionPoint("Deleted node from scene tree");
      setSceneVersionIndex(sceneGraph.getActiveVersionIndex());
      forceUpdate();
    }
  };

  // --- Group Selected Elements ---
  const handleGroupSelected = () => {
    const groupId = sceneGraph.groupSelectedNodes("Composite Asset Group");
    if (groupId) {
      setSelectedNodeId(groupId);
      setSceneVersionIndex(sceneGraph.getActiveVersionIndex());
      forceUpdate();
    }
  };

  // --- Model file importer router trigger ---
  const handleImportFile = () => {
    setImportFeedback("Parsing file format headers...");
    setTimeout(() => {
      const res = importers.importModelFileToScene(importFileName, 12.5, importFormat);
      if (res.success) {
        setImportFeedback(res.message);
        const nodes = sceneGraph.getNodes();
        // Select newest added node
        if (nodes.length > 0) {
          setSelectedNodeId(nodes[nodes.length - 1].id);
        }
        setSceneVersionIndex(sceneGraph.getActiveVersionIndex());
        forceUpdate();
      } else {
        setImportFeedback("Error importing 3D structure data.");
      }
    }, 800);
  };

  // --- Model file exporter trigger ---
  const handleExportScene = () => {
    const res = exporters.executeSceneExportSimulation(exportFormat);
    if (res.success) {
      const sizeMb = (res.byteSize / (1024 * 1024)).toFixed(2);
      setExportFeedback({
        size: `${sizeMb} MB`,
        message: `Successfully bundled scene structures into binary ${exportFormat} export layout template!`
      });
    }
  };

  // --- Scene History version controller ---
  const handleHistoryUndo = () => {
    const success = sceneGraph.undoVersion();
    if (success) {
      setSceneVersionIndex(sceneGraph.getActiveVersionIndex());
      forceUpdate();
    }
  };

  const handleHistoryRedo = () => {
    const success = sceneGraph.redoVersion();
    if (success) {
      setSceneVersionIndex(sceneGraph.getActiveVersionIndex());
      forceUpdate();
    }
  };

  const handleLoadVersionIndex = (idx: number) => {
    const success = sceneGraph.loadVersionIndex(idx);
    if (success) {
      setSceneVersionIndex(idx);
      forceUpdate();
    }
  };

  // --- Active bookmark jump ---
  const handleJumpToCameraBookmark = (id: string) => {
    cameraEngine.jumpToBookmark(id);
    forceUpdate();
  };

  // --- Launch dynamic rigid kinetic force ---
  const handleApplyPhysicsKineticPush = () => {
    if (!selectedNodeId) return;
    physicsEngine.applyLinearImpulse(selectedNodeId, { x: (Math.random() - 0.5) * 8, y: 15.0, z: (Math.random() - 0.5) * 6 });
  };

  // --- Switch graphics rendering pipelines ---
  const handleSwitchGPUDriver = (mode: GPUMemoryStats["mode"]) => {
    gpuEngine.toggleDriverAPI(mode);
    forceUpdate();
  };

  // --- Apply specific lighting rig template presets ---
  const handleApplyLightingRig = (rig: "studio_three_point" | "cyber_street_neon" | "sunset_silhouette" | "flat_ambient") => {
    lightEngine.applyLightingRigPreset(rig);
    sceneGraph.saveVersionPoint(`Changed lighting rig preset: ${rig}`);
    setSceneVersionIndex(sceneGraph.getActiveVersionIndex());
    forceUpdate();
  };

  return (
    <div className="flex flex-col h-screen bg-black text-gray-200 select-none overflow-hidden font-sans">
      
      {/* 1. Header Toolbar Controls */}
      <header className="flex justify-between items-center px-4 py-2 border-b border-gray-800 bg-gray-950 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-1 bg-yellow-500 rounded-lg">
            <Sparkles className="w-5 h-5 text-black" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-yellow-500 uppercase tracking-widest font-mono block">MOTION GRAPHICS & VFX CORE</span>
            <h1 className="text-sm font-bold text-white tracking-tight -mt-0.5">3D Scene & Spatial Engine Studio</h1>
          </div>
        </div>

        {/* Undo/Redo & Global Navigation Actions */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-gray-900 border border-gray-800 rounded-lg p-0.5 text-xs font-mono">
            <button 
              onClick={handleHistoryUndo}
              className="px-2 py-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-all cursor-pointer"
              title="Undo Scene Edit"
            >
              Undo
            </button>
            <span className="text-gray-700">|</span>
            <span className="px-2 text-yellow-500 text-[10px]">
              v{sceneVersionIndex + 1}/{sceneGraph.getVersionPoints().length}
            </span>
            <span className="text-gray-700">|</span>
            <button 
              onClick={handleHistoryRedo}
              className="px-2 py-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-all cursor-pointer"
              title="Redo Scene Edit"
            >
              Redo
            </button>
          </div>

          <button
            onClick={() => onNavigate("workspace")}
            className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-1.5"
          >
            <span>Workspace Editor</span>
          </button>
        </div>
      </header>

      {/* 2. Main Studio Grid Workspace */}
      <div className="flex flex-1 min-h-0 overflow-hidden bg-gray-950">
        
        {/* LEFT COLUMN: Asset Library & PBR Material Config Panels */}
        <aside className="w-80 border-r border-gray-800 bg-gray-900 flex flex-col min-h-0">
          
          {/* Sub Navigation Tabs */}
          <div className="grid grid-cols-5 gap-0.5 p-1 bg-gray-950 border-b border-gray-800 text-[10px] uppercase font-bold tracking-wider text-center">
            {(["assets", "materials", "lighting", "environment", "plugins"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 transition-all cursor-pointer rounded ${
                  activeTab === tab 
                    ? "bg-gray-800 text-white border-b-2 border-yellow-500" 
                    : "text-gray-400 hover:text-white hover:bg-gray-900"
                }`}
              >
                {tab.substring(0, 4)}
              </button>
            ))}
          </div>

          {/* Tab Contents View */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
            
            {/* TAB A: 3D ASSETS BROWSER */}
            {activeTab === "assets" && (
              <div className="space-y-4 text-left">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Add Geometry Mesh Primatives</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => handleAddGeometryPrimitive("cube")}
                      className="p-3 bg-gray-800 border border-gray-700 hover:border-yellow-500 hover:bg-gray-700/50 rounded-xl text-center transition-all cursor-pointer group"
                    >
                      <Box className="w-5 h-5 text-gray-400 group-hover:text-yellow-500 mx-auto mb-1" />
                      <span className="text-xs font-semibold block text-white">Unit Cube</span>
                      <span className="text-[8px] font-mono text-gray-500">12 polys</span>
                    </button>
                    <button 
                      onClick={() => handleAddGeometryPrimitive("sphere")}
                      className="p-3 bg-gray-800 border border-gray-700 hover:border-yellow-500 hover:bg-gray-700/50 rounded-xl text-center transition-all cursor-pointer group"
                    >
                      <RotateCw className="w-5 h-5 text-gray-400 group-hover:text-yellow-500 mx-auto mb-1" />
                      <span className="text-xs font-semibold block text-white">Quad Sphere</span>
                      <span className="text-[8px] font-mono text-gray-500">1,280 polys</span>
                    </button>
                    <button 
                      onClick={() => handleAddGeometryPrimitive("torus")}
                      className="p-3 bg-gray-800 border border-gray-700 hover:border-yellow-500 hover:bg-gray-700/50 rounded-xl text-center transition-all cursor-pointer group"
                    >
                      <RotateCw className="w-5 h-5 text-gray-400 group-hover:text-yellow-500 mx-auto mb-1 rotate-45" />
                      <span className="text-xs font-semibold block text-white">Chamber Torus</span>
                      <span className="text-[8px] font-mono text-gray-500">2,560 polys</span>
                    </button>
                    <button 
                      onClick={() => handleAddGeometryPrimitive("cyber_mech")}
                      className="p-3 bg-yellow-500/10 border border-yellow-500/30 hover:border-yellow-500 hover:bg-yellow-500/20 rounded-xl text-center transition-all cursor-pointer group"
                    >
                      <Sparkles className="w-5 h-5 text-yellow-500 mx-auto mb-1 animate-pulse" />
                      <span className="text-xs font-semibold block text-white">Cyber Mech</span>
                      <span className="text-[8px] font-mono text-gray-400">86k polys</span>
                    </button>
                    <button 
                      onClick={() => handleAddGeometryPrimitive("scifi_drone")}
                      className="p-3 bg-gray-800 border border-gray-700 hover:border-yellow-500 hover:bg-gray-700/50 rounded-xl text-center transition-all cursor-pointer group"
                    >
                      <Cpu className="w-5 h-5 text-gray-400 group-hover:text-yellow-500 mx-auto mb-1" />
                      <span className="text-xs font-semibold block text-white">Recon Drone</span>
                      <span className="text-[8px] font-mono text-gray-500">32k polys</span>
                    </button>
                    <button 
                      onClick={() => handleAddGeometryPrimitive("temple_ruins")}
                      className="p-3 bg-gray-800 border border-gray-700 hover:border-yellow-500 hover:bg-gray-700/50 rounded-xl text-center transition-all cursor-pointer group"
                    >
                      <Layers className="w-5 h-5 text-gray-400 group-hover:text-yellow-500 mx-auto mb-1" />
                      <span className="text-xs font-semibold block text-white">Temple Ruins</span>
                      <span className="text-[8px] font-mono text-gray-500">154k polys</span>
                    </button>
                  </div>
                </div>

                {/* Live Asset querying list */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">3D Space Library Explorer</span>
                    <span className="text-[9px] font-mono text-gray-400">{assetEngine.getAssets().length} assets</span>
                  </div>

                  <div className="flex items-center bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1">
                    <Search className="w-3.5 h-3.5 text-gray-500 mr-1.5" />
                    <input 
                      type="text" 
                      placeholder="Search spatial assets..." 
                      value={assetSearch}
                      onChange={(e) => setAssetSearch(e.target.value)}
                      className="w-full bg-transparent text-xs text-white outline-none border-none py-1 focus:ring-0"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-1">
                    {["all", "mesh", "material", "environment"].map((type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedAssetType(type)}
                        className={`py-1 text-[9px] uppercase font-bold rounded cursor-pointer ${
                          selectedAssetType === type 
                            ? "bg-gray-800 text-white border border-gray-700" 
                            : "bg-gray-950 text-gray-500 hover:text-gray-300"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
                    {assetEngine.queryAssets(assetSearch, selectedAssetType).map((asset) => (
                      <div 
                        key={asset.id}
                        className="p-2 bg-gray-950 hover:bg-gray-800/80 border border-gray-800 hover:border-gray-700 rounded-lg flex justify-between items-center group transition-all"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{asset.thumbnail}</span>
                          <div>
                            <span className="text-xs font-semibold block text-white">{asset.name}</span>
                            <span className="text-[8px] font-mono text-gray-500">{asset.type.toUpperCase()} • {(asset.sizeBytes / (1024 * 1024)).toFixed(1)}MB</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            assetEngine.toggleFavorite(asset.id);
                            forceUpdate();
                          }}
                          className="p-1 hover:bg-gray-800 rounded transition-all cursor-pointer"
                        >
                          <Heart className={`w-3.5 h-3.5 ${asset.isFavorite ? "text-red-500 fill-red-500" : "text-gray-600 group-hover:text-gray-400"}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB B: PBR SHADER MATERIALS EDITOR */}
            {activeTab === "materials" && (
              <div className="space-y-4 text-left">
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">PBR Material Coefficients</span>
                    <button
                      onClick={() => {
                        const newInstId = matEngine.createMaterialInstance("mat_chrome", "Polished_Steel_Instance");
                        if (newInstId && selectedNodeId) {
                          const node = sceneGraph.getNode(selectedNodeId);
                          if (node && node.type === "mesh") {
                            (node as any).materialId = newInstId;
                            sceneGraph.saveVersionPoint("Created new material instance linkage");
                            forceUpdate();
                          }
                        }
                      }}
                      className="text-[9px] bg-gray-800 border border-gray-700 px-2 py-0.5 rounded text-gray-300 hover:text-white transition-all cursor-pointer"
                    >
                      + New Instance
                    </button>
                  </div>

                  {/* Albedo Color selector */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 font-mono block">Albedo Factor Color (R,G,B)</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg border border-gray-700" style={{ backgroundColor: `rgb(${matAlbedoR}, ${matAlbedoG}, ${matAlbedoB})` }} />
                      <div className="grid grid-cols-3 gap-1 flex-1">
                        <div>
                          <span className="text-[8px] font-mono text-gray-500">R: {matAlbedoR}</span>
                          <input 
                            type="range" min="0" max="255" value={matAlbedoR} 
                            onChange={(e) => { setMatAlbedoR(Number(e.target.value)); handleUpdatePBRMaterial(); }}
                            className="w-full accent-yellow-500 h-1 cursor-pointer" 
                          />
                        </div>
                        <div>
                          <span className="text-[8px] font-mono text-gray-500">G: {matAlbedoG}</span>
                          <input 
                            type="range" min="0" max="255" value={matAlbedoG} 
                            onChange={(e) => { setMatAlbedoG(Number(e.target.value)); handleUpdatePBRMaterial(); }}
                            className="w-full accent-yellow-500 h-1 cursor-pointer" 
                          />
                        </div>
                        <div>
                          <span className="text-[8px] font-mono text-gray-500">B: {matAlbedoB}</span>
                          <input 
                            type="range" min="0" max="255" value={matAlbedoB} 
                            onChange={(e) => { setMatAlbedoB(Number(e.target.value)); handleUpdatePBRMaterial(); }}
                            className="w-full accent-yellow-500 h-1 cursor-pointer" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Metallic factor */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-gray-400">Specular Metallic Factor</span>
                      <span className="text-yellow-500 font-bold">{matMetallic.toFixed(2)}</span>
                    </div>
                    <input 
                      type="range" min="0" max="1" step="0.01" value={matMetallic} 
                      onChange={(e) => { setMatMetallic(Number(e.target.value)); handleUpdatePBRMaterial(); }}
                      className="w-full accent-yellow-500 h-1 cursor-pointer" 
                    />
                  </div>

                  {/* Roughness factor */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-gray-400">Diffuse Roughness Factor</span>
                      <span className="text-yellow-500 font-bold">{matRoughness.toFixed(2)}</span>
                    </div>
                    <input 
                      type="range" min="0" max="1" step="0.01" value={matRoughness} 
                      onChange={(e) => { setMatRoughness(Number(e.target.value)); handleUpdatePBRMaterial(); }}
                      className="w-full accent-yellow-500 h-1 cursor-pointer" 
                    />
                  </div>

                  {/* Emission Intensity factor */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-gray-400">Luminous Emission Intensity</span>
                      <span className="text-yellow-500 font-bold">{matEmissionIntensity.toFixed(1)}W</span>
                    </div>
                    <input 
                      type="range" min="0" max="10" step="0.1" value={matEmissionIntensity} 
                      onChange={(e) => { setMatEmissionIntensity(Number(e.target.value)); handleUpdatePBRMaterial(); }}
                      className="w-full accent-yellow-500 h-1 cursor-pointer" 
                    />
                  </div>

                  {/* Opacity factor */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-gray-400">Refractive Opacity Blending</span>
                      <span className="text-yellow-500 font-bold">{Math.round(matOpacity * 100)}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="1" step="0.01" value={matOpacity} 
                      onChange={(e) => { setMatOpacity(Number(e.target.value)); handleUpdatePBRMaterial(); }}
                      className="w-full accent-yellow-500 h-1 cursor-pointer" 
                    />
                  </div>
                </div>

                {/* Preconfigured materials quick selection library */}
                <div className="space-y-2 border-t border-gray-800 pt-3">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Predefined Material Shaders</span>
                  <div className="space-y-1 max-h-36 overflow-y-auto no-scrollbar">
                    {matEngine.getMaterials().map((mat) => (
                      <button
                        key={mat.id}
                        onClick={() => {
                          if (selectedNodeId) {
                            const node = sceneGraph.getNode(selectedNodeId);
                            if (node && node.type === "mesh") {
                              (node as any).materialId = mat.id;
                              sceneGraph.saveVersionPoint(`Assigned material: ${mat.name}`);
                              forceUpdate();
                            }
                          }
                        }}
                        className="w-full p-2 bg-gray-950 hover:bg-gray-800 border border-gray-800 rounded-lg text-left flex justify-between items-center transition-all cursor-pointer"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-3.5 h-3.5 rounded-full border border-gray-700" style={{ backgroundColor: `rgb(${mat.albedo.r}, ${mat.albedo.g}, ${mat.albedo.b})` }} />
                          <span className="text-xs font-semibold text-white">{mat.name}</span>
                        </div>
                        <span className="text-[8px] font-mono text-gray-500 uppercase">
                          {mat.metallic > 0.8 ? "Metal" : mat.transparent ? "Glass" : "Clay"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB C: LIGHTING & LIGHT LINKING SETUP */}
            {activeTab === "lighting" && (
              <div className="space-y-4 text-left">
                
                {/* Switch lighting rigs */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Three-Point Lighting Setup Rigs</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "studio_three_point", label: "Studio 3-Point" },
                      { id: "cyber_street_neon", label: "Cyber Neon Pink" },
                      { id: "sunset_silhouette", label: "Sunset Backlight" },
                      { id: "flat_ambient", label: "Flat Overhead" }
                    ].map((rig) => (
                      <button
                        key={rig.id}
                        onClick={() => handleApplyLightingRig(rig.id as any)}
                        className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-yellow-500 rounded-lg text-center transition-all text-xs font-bold text-white cursor-pointer"
                      >
                        {rig.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Edit active light coordinates */}
                {selectedNodeId && sceneGraph.getNode(selectedNodeId)?.type === "light" && (
                  <div className="space-y-3 border-t border-gray-800 pt-3">
                    <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-wide flex items-center space-x-1">
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>Edit Light Parameters</span>
                    </span>

                    {/* Light intensity */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-gray-400">Radiant Energy Intensity</span>
                        <span className="text-yellow-500 font-bold">{lightIntensity.toFixed(1)} lm</span>
                      </div>
                      <input 
                        type="range" min="0" max="20" step="0.1" value={lightIntensity} 
                        onChange={(e) => {
                          const nextVal = Number(e.target.value);
                          setLightIntensity(nextVal);
                          const node = sceneGraph.getNode(selectedNodeId) as LightNode;
                          if (node) {
                            node.lightParams.intensity = nextVal;
                            forceUpdate();
                          }
                        }}
                        className="w-full accent-yellow-500 h-1 cursor-pointer" 
                      />
                    </div>

                    {/* Light color red */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-gray-400">Light Color Tint</span>
                        <span className="text-yellow-500 font-bold">rgb({lightColorR}, {lightColorG}, {lightColorB})</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <div>
                          <span className="text-[8px] font-mono text-gray-500">R: {lightColorR}</span>
                          <input 
                            type="range" min="0" max="255" value={lightColorR} 
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              setLightColorR(v);
                              const node = sceneGraph.getNode(selectedNodeId) as LightNode;
                              if (node) { node.lightParams.color.r = v; forceUpdate(); }
                            }}
                            className="w-full h-1 accent-yellow-500 cursor-pointer" 
                          />
                        </div>
                        <div>
                          <span className="text-[8px] font-mono text-gray-500">G: {lightColorG}</span>
                          <input 
                            type="range" min="0" max="255" value={lightColorG} 
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              setLightColorG(v);
                              const node = sceneGraph.getNode(selectedNodeId) as LightNode;
                              if (node) { node.lightParams.color.g = v; forceUpdate(); }
                            }}
                            className="w-full h-1 accent-yellow-500 cursor-pointer" 
                          />
                        </div>
                        <div>
                          <span className="text-[8px] font-mono text-gray-500">B: {lightColorB}</span>
                          <input 
                            type="range" min="0" max="255" value={lightColorB} 
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              setLightColorB(v);
                              const node = sceneGraph.getNode(selectedNodeId) as LightNode;
                              if (node) { node.lightParams.color.b = v; forceUpdate(); }
                            }}
                            className="w-full h-1 accent-yellow-500 cursor-pointer" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB D: ENVIRONMENT SETTINGS */}
            {activeTab === "environment" && (
              <div className="space-y-4 text-left">
                
                {/* Sky Environment presets */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide font-mono">Atmosphere Skydome Presets</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: "sunset", label: "🌇 Warm Sunset" },
                      { id: "cyberpunk_street", label: "🌃 Cyber Night" },
                      { id: "nebula", label: "🌌 Deep Space" },
                      { id: "daylight", label: "☀️ Clean Daylight" },
                      { id: "studio", label: "🎙️ Dark Studio" }
                    ].map((sky) => (
                      <button
                        key={sky.id}
                        onClick={() => {
                          envEngine.updateConfig({ skyPreset: sky.id as any });
                          forceUpdate();
                        }}
                        className={`p-2.5 text-xs text-left font-bold border rounded-lg transition-all cursor-pointer ${
                          envEngine.getConfig().skyPreset === sky.id 
                            ? "bg-gray-800 border-yellow-500 text-white" 
                            : "bg-gray-950 border-gray-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        {sky.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fog attributes */}
                <div className="space-y-3 border-t border-gray-800 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Atmosphere Fog & Climatology</span>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={envEngine.getConfig().fogEnabled}
                        onChange={(e) => {
                          envEngine.updateConfig({ fogEnabled: e.target.checked });
                          forceUpdate();
                        }}
                        className="rounded bg-gray-950 border-gray-800 text-yellow-500 accent-yellow-500"
                      />
                      <span className="text-[10px] text-gray-400">Enable</span>
                    </label>
                  </div>

                  {envEngine.getConfig().fogEnabled && (
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-gray-400">Volumetric Density</span>
                          <span className="text-yellow-500 font-bold">{(envEngine.getConfig().fogDensity * 100).toFixed(1)}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="0.3" step="0.005" value={envEngine.getConfig().fogDensity}
                          onChange={(e) => {
                            envEngine.updateConfig({ fogDensity: Number(e.target.value) });
                            forceUpdate();
                          }}
                          className="w-full accent-yellow-500 h-1 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Ground reflection controls */}
                <div className="space-y-3 border-t border-gray-800 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Mirror Ground Reflections</span>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={envEngine.getConfig().groundVisible}
                        onChange={(e) => {
                          envEngine.updateConfig({ groundVisible: e.target.checked });
                          forceUpdate();
                        }}
                        className="rounded bg-gray-950 border-gray-800 text-yellow-500 accent-yellow-500"
                      />
                      <span className="text-[10px] text-gray-400">Visible</span>
                    </label>
                  </div>

                  {envEngine.getConfig().groundVisible && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-gray-400">Specular Mirror Albedo</span>
                        <span className="text-yellow-500 font-bold">{Math.round(envEngine.getConfig().groundReflection * 100)}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="1" step="0.05" value={envEngine.getConfig().groundReflection}
                        onChange={(e) => {
                          envEngine.updateConfig({ groundReflection: Number(e.target.value) });
                          forceUpdate();
                        }}
                        className="w-full accent-yellow-500 h-1 cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB E: PLUGINS MANAGER */}
            {activeTab === "plugins" && (
              <div className="space-y-4 text-left">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">3D Studio Extension Plugins</span>
                  <div className="space-y-2">
                    {pluginSDK.getPlugins().map((p) => (
                      <div 
                        key={p.id}
                        className={`p-3 border rounded-xl transition-all ${
                          p.enabled 
                            ? "bg-yellow-500/5 border-yellow-500/30" 
                            : "bg-gray-950 border-gray-800"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-bold text-white block">{p.name}</span>
                            <span className="text-[8px] font-mono text-gray-500 block mt-0.5">BY {p.author.toUpperCase()} • v{p.version}</span>
                          </div>
                          <button
                            onClick={() => {
                              pluginSDK.togglePlugin(p.id);
                              forceUpdate();
                            }}
                            className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase cursor-pointer ${
                              p.enabled 
                                ? "bg-yellow-500 text-black hover:bg-yellow-400" 
                                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                            }`}
                          >
                            {p.enabled ? "Enabled" : "Disabled"}
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">{p.description}</p>
                        
                        {/* Procedural action injection triggers */}
                        {p.enabled && p.id === "pl_scifi_gen" && (
                          <button
                            onClick={handleAddProceduralPluginGreebles}
                            className="mt-2.5 w-full py-1 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-500 rounded text-[10px] font-mono font-bold cursor-pointer"
                          >
                            Inject Procedural Greeble Wall
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* CENTER VIEWPORT: Cinematic 3D Canvas Projection & Timeline Controller */}
        <main className="flex-1 flex flex-col min-w-0 bg-gray-950 border-r border-gray-800 relative">
          
          {/* 3D Wireframe Canvas Stage */}
          <div className="flex-1 relative flex items-center justify-center p-4 min-h-0 bg-black/90">
            <canvas
              ref={canvasRef}
              width={760}
              height={440}
              className="w-full h-full max-w-4xl rounded-2xl border border-gray-800 bg-black shadow-inner shadow-black"
            />

            {/* Viewport Floating stats overlay info */}
            <div className="absolute top-6 left-6 p-3 bg-black/85 backdrop-blur-md rounded-xl border border-gray-800 space-y-1 font-mono text-[9px] text-gray-400 text-left pointer-events-none shadow-xl">
              <span className="text-yellow-500 text-[10px] font-bold block mb-1">CINEMATIC VIEWPORT</span>
              <div>CAMERA: {cameraEngine.getParams().type.toUpperCase()} ({cameraEngine.getParams().focalLength}mm lens)</div>
              <div>POSITION: {cameraEngine.getPosition().x.toFixed(1)}, {cameraEngine.getPosition().y.toFixed(1)}, {cameraEngine.getPosition().z.toFixed(1)}</div>
              <div>DRAW CALLS: {gpuStats.drawCallsCount} buffers</div>
              <div>TRIANGLES: {(sceneGraph.getNodes().filter(n => n.type === "mesh").length * 1284).toLocaleString()} polys</div>
              <div>HARDWARE DRIVER: {gpuStats.mode.toUpperCase()}</div>
            </div>

            {/* Camera View Bookmarks quick selector */}
            <div className="absolute top-6 right-6 flex space-x-1">
              {cameraEngine.getBookmarks().map((bm) => (
                <button
                  key={bm.id}
                  onClick={() => handleJumpToCameraBookmark(bm.id)}
                  className="px-2 py-1 bg-black/85 backdrop-blur-md hover:bg-gray-800 border border-gray-800 text-[9px] font-mono font-semibold text-gray-300 rounded hover:text-white transition-all cursor-pointer"
                  title={`Jump view coordinates to ${bm.name}`}
                >
                  {bm.name.replace("Est. ", "").replace("Tactical ", "").replace("Dutch ", "")}
                </button>
              ))}
            </div>

            {/* Render loop diagnostics status */}
            <div className="absolute bottom-6 left-6 flex items-center space-x-2 bg-black/80 border border-gray-800 px-3 py-1.5 rounded-lg pointer-events-none text-[10px]">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="font-mono text-gray-300 uppercase tracking-widest">REAL-TIME SHADER MATRIX CONNECTED</span>
            </div>
          </div>

          {/* 3. MULTI-TRACK MOTION TIMELINE */}
          <footer className="h-44 bg-gray-900 border-t border-gray-800 flex flex-col shrink-0">
            
            {/* Playback Controls Row */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-950">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1.5 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg transition-all cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black" />}
                </button>

                <div className="text-xs font-mono">
                  <span className="text-white font-bold">{currentTime.toFixed(2)}s</span>
                  <span className="text-gray-500"> / 10.00s</span>
                </div>
              </div>

              {/* Sub-engine triggers toggles */}
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={physicsActive}
                    onChange={(e) => setPhysicsActive(e.target.checked)}
                    className="rounded bg-gray-950 border-gray-800 text-yellow-500 accent-yellow-500 cursor-pointer"
                  />
                  <span className="text-xs text-gray-300 font-semibold font-mono">Dynamics Engine Integration</span>
                </label>

                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">
                  KEYFRAME SEQUENCE REGISTRY
                </div>
              </div>
            </div>

            {/* Interactive Timeline Tracks View */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2 select-none">
              
              {/* Scrubbing timeline scale rail */}
              <div className="relative h-4 bg-gray-950 rounded-lg overflow-hidden border border-gray-800">
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10" 
                  style={{ left: `${(currentTime / 10.0) * 100}%` }}
                />
                
                {/* Timeline scale ticks */}
                <div className="absolute inset-0 flex justify-between px-2 text-[8px] font-mono text-gray-600 items-center">
                  <span>0.00s</span>
                  <span>1.00s</span>
                  <span>2.00s</span>
                  <span>3.00s</span>
                  <span>4.00s</span>
                  <span>5.00s</span>
                  <span>6.00s</span>
                  <span>7.00s</span>
                  <span>8.00s</span>
                  <span>9.00s</span>
                  <span>10.00s</span>
                </div>
              </div>

              {/* Tracks container */}
              <div className="space-y-1">
                {animator.getTracks().map((track) => (
                  <div key={track.id} className="flex items-center space-x-3 bg-gray-950/40 p-1.5 rounded-lg border border-gray-800/40 hover:bg-gray-950/70 transition-all">
                    
                    {/* Track info */}
                    <div className="w-36 text-left shrink-0">
                      <span className="text-[10px] font-bold block text-white truncate">{track.targetNodeId.replace("_", " ").toUpperCase()}</span>
                      <span className="text-[8px] font-mono text-gray-500 block truncate">{track.property}</span>
                    </div>

                    {/* Keyframe Track Rail */}
                    <div className="flex-1 h-3.5 bg-gray-950/80 rounded-md relative overflow-hidden border border-gray-900/60">
                      
                      {/* Interactive dynamic playhead */}
                      <div 
                        className="absolute top-0 bottom-0 w-px bg-red-500/50" 
                        style={{ left: `${(currentTime / 10.0) * 100}%` }}
                      />

                      {/* Display keyframes circles */}
                      {track.keyframes.map((kf, kIdx) => (
                        <div
                          key={kIdx}
                          className="absolute w-2 h-2 bg-yellow-500 rounded-full border border-black -mt-1 top-1/2 transform -translate-y-1/2 shadow-sm shadow-black cursor-pointer hover:bg-yellow-400"
                          style={{ left: `${(kf.timeSec / 10.0) * 100}%` }}
                          title={`Keyframe at ${kf.timeSec}s`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </footer>
        </main>

        {/* RIGHT COLUMN: Node Properties Editor & GPU Hardware Stats */}
        <aside className="w-80 border-l border-gray-800 bg-gray-900 flex flex-col min-h-0">
          
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 text-left">
            
            {/* SECTION 1: SELECTED NODE PROPERTIES */}
            <div className="space-y-3 bg-gray-950/50 p-3 rounded-xl border border-gray-800">
              <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Entity Attributes</span>
                {selectedNodeId && (
                  <button 
                    onClick={handleDeleteNode}
                    className="p-1 hover:bg-gray-800 rounded text-gray-500 hover:text-red-500 transition-all cursor-pointer"
                    title="Delete Selected Node"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {selectedNodeId ? (
                <div className="space-y-3">
                  
                  {/* Entity Name input */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-gray-500 block">Node Entity Name</span>
                    <input 
                      type="text" 
                      value={nodeName}
                      onChange={(e) => { setNodeName(e.target.value); handleUpdateNodeTransform(); }}
                      className="w-full bg-gray-900 border border-gray-800 text-xs text-white rounded px-2 py-1 outline-none focus:border-yellow-500"
                    />
                  </div>

                  {/* Position translations */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-gray-500 block">Spatial Position Coordinates</span>
                    <div className="grid grid-cols-3 gap-1 text-center font-mono">
                      <div>
                        <span className="text-[8px] text-gray-500">X</span>
                        <input 
                          type="number" step="0.5" value={posX} 
                          onChange={(e) => { setPosX(Number(e.target.value)); handleUpdateNodeTransform(); }}
                          className="w-full bg-gray-900 border border-gray-800 text-xs text-white rounded p-1 outline-none text-center"
                        />
                      </div>
                      <div>
                        <span className="text-[8px] text-gray-500">Y</span>
                        <input 
                          type="number" step="0.5" value={posY} 
                          onChange={(e) => { setPosY(Number(e.target.value)); handleUpdateNodeTransform(); }}
                          className="w-full bg-gray-900 border border-gray-800 text-xs text-white rounded p-1 outline-none text-center"
                        />
                      </div>
                      <div>
                        <span className="text-[8px] text-gray-500">Z</span>
                        <input 
                          type="number" step="0.5" value={posZ} 
                          onChange={(e) => { setPosZ(Number(e.target.value)); handleUpdateNodeTransform(); }}
                          className="w-full bg-gray-900 border border-gray-800 text-xs text-white rounded p-1 outline-none text-center"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rotation coordinates */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-gray-500 block">Euler Rotation Angles (degrees)</span>
                    <div className="grid grid-cols-3 gap-1 text-center font-mono">
                      <div>
                        <span className="text-[8px] text-gray-500">Pitch (X)</span>
                        <input 
                          type="number" step="5" value={rotX} 
                          onChange={(e) => { setRotX(Number(e.target.value)); handleUpdateNodeTransform(); }}
                          className="w-full bg-gray-900 border border-gray-800 text-xs text-white rounded p-1 outline-none text-center"
                        />
                      </div>
                      <div>
                        <span className="text-[8px] text-gray-500">Yaw (Y)</span>
                        <input 
                          type="number" step="5" value={rotY} 
                          onChange={(e) => { setRotY(Number(e.target.value)); handleUpdateNodeTransform(); }}
                          className="w-full bg-gray-900 border border-gray-800 text-xs text-white rounded p-1 outline-none text-center"
                        />
                      </div>
                      <div>
                        <span className="text-[8px] text-gray-500">Roll (Z)</span>
                        <input 
                          type="number" step="5" value={rotZ} 
                          onChange={(e) => { setRotZ(Number(e.target.value)); handleUpdateNodeTransform(); }}
                          className="w-full bg-gray-900 border border-gray-800 text-xs text-white rounded p-1 outline-none text-center"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bounding box scales */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-gray-500 block">Dimensional Scaling</span>
                    <div className="grid grid-cols-3 gap-1 text-center font-mono">
                      <div>
                        <span className="text-[8px] text-gray-500">Width</span>
                        <input 
                          type="number" step="0.1" value={sclX} 
                          onChange={(e) => { setSclX(Number(e.target.value)); handleUpdateNodeTransform(); }}
                          className="w-full bg-gray-900 border border-gray-800 text-xs text-white rounded p-1 outline-none text-center"
                        />
                      </div>
                      <div>
                        <span className="text-[8px] text-gray-500">Height</span>
                        <input 
                          type="number" step="0.1" value={sclY} 
                          onChange={(e) => { setSclY(Number(e.target.value)); handleUpdateNodeTransform(); }}
                          className="w-full bg-gray-900 border border-gray-800 text-xs text-white rounded p-1 outline-none text-center"
                        />
                      </div>
                      <div>
                        <span className="text-[8px] text-gray-500">Depth</span>
                        <input 
                          type="number" step="0.1" value={sclZ} 
                          onChange={(e) => { setSclZ(Number(e.target.value)); handleUpdateNodeTransform(); }}
                          className="w-full bg-gray-900 border border-gray-800 text-xs text-white rounded p-1 outline-none text-center"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Group Selected action */}
                  <button
                    onClick={handleGroupSelected}
                    className="w-full py-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs font-bold text-white rounded-lg transition-all cursor-pointer"
                  >
                    Group Selected Nodes
                  </button>
                </div>
              ) : (
                <div className="py-6 text-center text-gray-500 space-y-1.5">
                  <Info className="w-5 h-5 text-gray-600 mx-auto" />
                  <span className="text-xs font-semibold block text-gray-400">No node selected</span>
                  <span className="text-[9px] block">Click an asset in the viewport list below</span>
                </div>
              )}
            </div>

            {/* SECTION 2: INTEGRATED PHYSICAL DYNAMICS */}
            {selectedNodeId && physicsEngine.getPhysicsParams(selectedNodeId) && (
              <div className="space-y-3 bg-gray-950/50 p-3 rounded-xl border border-gray-800 text-left">
                <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono flex items-center space-x-1">
                    <Wind className="w-3.5 h-3.5 text-blue-400" />
                    <span>Dynamic Physics Properties</span>
                  </span>
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={physicsEngine.getPhysicsParams(selectedNodeId)?.enabled || false}
                      onChange={(e) => {
                        const params = physicsEngine.getPhysicsParams(selectedNodeId);
                        if (params) {
                          params.enabled = e.target.checked;
                          if (e.target.checked && !physicsActive) {
                            setPhysicsActive(true);
                          }
                          forceUpdate();
                        }
                      }}
                      className="rounded bg-gray-950 border-gray-800 text-yellow-500 accent-yellow-500 cursor-pointer"
                    />
                    <span className="text-[9px] text-gray-400 font-bold uppercase font-mono">Active</span>
                  </label>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[8px] font-mono text-gray-500 block">Mass Coefficient</span>
                      <input 
                        type="number" 
                        value={physicsEngine.getPhysicsParams(selectedNodeId)?.mass || 10} 
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const p = physicsEngine.getPhysicsParams(selectedNodeId);
                          if (p) { p.mass = val; forceUpdate(); }
                        }}
                        className="w-full bg-gray-900 border border-gray-800 text-xs text-white rounded p-1 outline-none text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[8px] font-mono text-gray-500 block">Elastic Bounciness</span>
                      <input 
                        type="number" step="0.05"
                        value={physicsEngine.getPhysicsParams(selectedNodeId)?.restitution || 0.5} 
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const p = physicsEngine.getPhysicsParams(selectedNodeId);
                          if (p) { p.restitution = val; forceUpdate(); }
                        }}
                        className="w-full bg-gray-900 border border-gray-800 text-xs text-white rounded p-1 outline-none text-center"
                      />
                    </div>
                  </div>

                  {/* Physics Impulse Trigger */}
                  <button
                    onClick={handleApplyPhysicsKineticPush}
                    disabled={!physicsEngine.getPhysicsParams(selectedNodeId)?.enabled}
                    className="w-full py-1 bg-blue-500/10 hover:bg-blue-500/20 disabled:opacity-30 border border-blue-500/30 text-blue-400 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Launch Vector Kinetic Impulse
                  </button>
                </div>
              </div>
            )}

            {/* SECTION 3: MODEL IMPORTER / EXPORTER PANEL */}
            <div className="space-y-3 bg-gray-950/50 p-3 rounded-xl border border-gray-800">
              <div className="pb-2 border-b border-gray-800 flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono flex items-center space-x-1">
                  <FolderOpen className="w-3.5 h-3.5 text-yellow-500" />
                  <span>Ingestion & Codec Exporters</span>
                </span>
              </div>

              {/* Loader section */}
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-gray-500 uppercase block">Simulate Import Parser</span>
                <div className="flex space-x-1.5">
                  <input 
                    type="text" 
                    value={importFileName}
                    onChange={(e) => setImportFileName(e.target.value)}
                    className="flex-1 bg-gray-900 border border-gray-800 text-[10px] text-white rounded px-2 py-1 outline-none"
                  />
                  <select
                    value={importFormat}
                    onChange={(e: any) => setImportFormat(e.target.value)}
                    className="bg-gray-900 border border-gray-800 text-[10px] text-white rounded p-1 outline-none"
                  >
                    {["OBJ", "FBX", "GLTF", "GLB", "USD", "Alembic"].map((fmt) => (
                      <option key={fmt} value={fmt}>{fmt}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleImportFile}
                  className="w-full py-1 bg-yellow-500 text-black text-xs font-bold rounded-lg hover:bg-yellow-400 transition-all cursor-pointer"
                >
                  Parse & Link Model
                </button>
                {importFeedback && (
                  <p className="text-[9px] font-mono text-gray-400 leading-relaxed bg-black/60 p-1.5 rounded border border-gray-800 mt-1">{importFeedback}</p>
                )}
              </div>

              {/* Exporter section */}
              <div className="space-y-2 border-t border-gray-800 pt-2">
                <span className="text-[9px] font-bold text-gray-500 uppercase block">Scene Complier Exporter</span>
                <div className="flex items-center justify-between space-x-2">
                  <select
                    value={exportFormat}
                    onChange={(e: any) => setExportFormat(e.target.value)}
                    className="bg-gray-900 border border-gray-800 text-[10px] text-white rounded p-1 outline-none w-24"
                  >
                    {["OBJ", "FBX", "GLTF", "GLB", "USD", "Alembic"].map((fmt) => (
                      <option key={fmt} value={fmt}>{fmt}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleExportScene}
                    className="flex-1 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs font-bold text-white rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5 mr-1 text-gray-400" />
                    <span>Compile Export</span>
                  </button>
                </div>
                {exportFeedback && (
                  <div className="p-2 bg-yellow-500/5 rounded border border-yellow-500/20 text-left space-y-1 mt-1">
                    <div className="flex justify-between items-center text-[9px] font-mono">
                      <span className="text-yellow-500 font-bold">SIZE: {exportFeedback.size}</span>
                      <span className="text-gray-500">COMPILED</span>
                    </div>
                    <p className="text-[9px] text-gray-400 leading-normal">{exportFeedback.message}</p>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 4: REAL-TIME GPU VRAM MONITOR & HARDWARE DRIVER */}
            <div className="space-y-3 bg-gray-950/50 p-3 rounded-xl border border-gray-800">
              <div className="pb-2 border-b border-gray-800 flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono flex items-center space-x-1">
                  <Cpu className="w-3.5 h-3.5 text-green-400" />
                  <span>GPU Memory Diagnostics</span>
                </span>
                <span className="text-[9px] bg-green-500/10 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded font-mono uppercase tracking-widest font-bold">
                  {gpuStats.mode.replace("_3D", "")}
                </span>
              </div>

              <div className="space-y-3 font-mono text-[10px]">
                {/* VRAM memory stats */}
                <div className="space-y-1 text-left">
                  <div className="flex justify-between text-[9px]">
                    <span className="text-gray-500">Allocated VRAM Memory Pool</span>
                    <span className="text-gray-300">{(gpuStats.vramAllocatedBytes / (1024 * 1024)).toFixed(0)}MB / 8GB</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-950 rounded-full overflow-hidden border border-gray-900">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all duration-300" 
                      style={{ width: `${(gpuStats.vramAllocatedBytes / gpuStats.vramTotalBytes) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-left text-gray-400 text-[9px]">
                  <div>DRAW CALLS: <span className="text-white font-bold">{gpuStats.drawCallsCount}</span></div>
                  <div>USAGE CAP: <span className="text-white font-bold">{gpuStats.gpuUsagePercent}%</span></div>
                  <div>PIPELINES: <span className="text-white font-bold">{gpuStats.activePipelinesCount} binds</span></div>
                  <div>THREADS: <span className="text-white font-bold">{gpuStats.activeThreads} CPU</span></div>
                </div>

                {/* Driver API toggling switcher */}
                <div className="space-y-1.5 border-t border-gray-800 pt-2 text-left">
                  <span className="text-[8px] font-bold text-gray-500 uppercase block">Switch Renderer Platform Driver</span>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: "WebGL_3D", label: "WebGL" },
                      { id: "WebGPU_Vulkan", label: "WebGPU" },
                      { id: "Software_Rasterizer", label: "CPU S/W" }
                    ].map((api) => (
                      <button
                        key={api.id}
                        onClick={() => handleSwitchGPUDriver(api.id as any)}
                        className={`py-1 rounded text-[9px] font-bold cursor-pointer transition-all ${
                          gpuStats.mode === api.id 
                            ? "bg-green-500 text-black border border-green-400" 
                            : "bg-gray-950 text-gray-500 border border-gray-800 hover:text-white"
                        }`}
                      >
                        {api.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </aside>

      </div>

      {/* 4. Active Scene Objects Hierarchy List Footer Bar */}
      <footer className="h-10 bg-gray-950 border-t border-gray-800 shrink-0 flex items-center justify-between px-4 font-mono text-[10px]">
        <div className="flex items-center space-x-2">
          <span className="text-gray-500 uppercase font-bold text-[9px]">Scene Tree Node Hierarchy:</span>
          <div className="flex items-center space-x-1.5 max-w-2xl overflow-x-auto no-scrollbar py-1">
            {sceneGraph.getNodes().map((node) => (
              <button
                key={node.id}
                onClick={() => {
                  setSelectedNodeId(node.id);
                  sceneGraph.clearSelection();
                  sceneGraph.setSelected(node.id, true);
                  forceUpdate();
                }}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer border ${
                  selectedNodeId === node.id 
                    ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-500 font-bold" 
                    : "bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200"
                }`}
              >
                {node.type === "camera" ? "📹 " : node.type === "light" ? "💡 " : "📦 "}
                {node.name}
              </button>
            ))}
          </div>
        </div>

        <div className="text-gray-500 text-[9px] flex items-center space-x-3">
          <span>PIPELINE: VULKAN CORE MATRIX VERIFIED</span>
          <span className="text-gray-700">|</span>
          <span>STATUS: FILM_GRADE ENGINE OPERATIONAL</span>
        </div>
      </footer>
    </div>
  );
}
