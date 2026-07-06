import { useState, useEffect, useRef } from "react";
import {
  Zap,
  Layers,
  Wind,
  Sparkles,
  Eye,
  Check,
  Activity,
  Plus,
  Play,
  Pause,
  RefreshCw,
  SlidersHorizontal,
  Trash2,
  Link,
  Unlink,
  Settings,
  Flame,
  Sun,
  Camera,
  Cpu,
  Tv,
  Maximize2
} from "lucide-react";
import { PageId } from "../types";
import { VFXEngine } from "../vfx/VFXEngine";
import { VFXNode, TrackedFeature, RotoCurve, PhysicsBody, VFXLight, PBRMaterial, RenderPassType } from "../vfx/types";

interface VisualEffectsProps {
  onNavigate: (page: PageId) => void;
}

export default function VisualEffects({ onNavigate }: VisualEffectsProps) {
  // Reference to the main VFXEngine singleton
  const vfxEngine = VFXEngine.getInstance();

  // Active module sub-panel tabs
  const [activeTab, setActiveTab] = useState<"compositor" | "tracker" | "roto" | "particles" | "fluid" | "physics" | "lighting">("compositor");
  
  // Simulation player loop state
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [activeRenderPass, setActiveRenderPass] = useState<RenderPassType>("beauty");

  // Selected entities for properties inspectors
  const [selectedNodeId, setSelectedNodeId] = useState<string>("vfx_node_keyer");
  const [selectedFeatureId, setSelectedFeatureId] = useState<string>("tracker_screen");
  const [selectedCurveId, setSelectedCurveId] = useState<string>("curve_screen_matte");
  const [selectedBodyId, setSelectedBodyId] = useState<string>("body_boulder");

  // React local states synced with VFXEngine configurations
  const [nodes, setNodes] = useState<VFXNode[]>(vfxEngine.compositor.getNodes());
  const [connections, setConnections] = useState(vfxEngine.compositor.getConnections());
  const [trackers, setTrackers] = useState<TrackedFeature[]>(vfxEngine.tracker.getFeatures());
  const [curves, setCurves] = useState<RotoCurve[]>(vfxEngine.rotoscoper.getMasks()[0]?.curves || []);
  const [physicsBodies, setPhysicsBodies] = useState<PhysicsBody[]>(vfxEngine.physics.getBodies());
  const [lights, setLights] = useState<VFXLight[]>(vfxEngine.getLights());
  const [materials, setMaterials] = useState<PBRMaterial[]>(vfxEngine.getMaterials());
  const [gpuMode, setGpuMode] = useState(vfxEngine.getGPUComputeStats().engineMode);
  const [gpuStats, setGpuStats] = useState(vfxEngine.getGPUComputeStats());

  // Physical parameter adjusters
  const [gravityY, setGravityY] = useState(vfxEngine.getGravityForce().y);
  const [windX, setWindX] = useState(vfxEngine.getWindForce().x);

  // Optical/Lens Parameters
  const [focalLength, setFocalLength] = useState(vfxEngine.camera.getParams().focalLength);
  const [lensK1, setLensK1] = useState(vfxEngine.camera.getParams().k1);
  const [shakeAmplitude, setShakeAmplitude] = useState(vfxEngine.camera.getParams().cameraShakeAmplitude);

  // Keyer settings
  const [keyTolerance, setKeyTolerance] = useState(42);
  const [keySoftness, setKeySoftness] = useState(15);
  const [spillSuppression, setSpillSuppression] = useState(0.8);
  const [keyColor, setKeyColor] = useState({ r: 10, g: 215, b: 65 }); // green screen default

  // Fluid Settings
  const [fluidViscosity, setFluidViscosity] = useState(0.05);
  const [fluidDiffusion, setFluidDiffusion] = useState(0.12);
  const [fluidBuoyancy, setFluidBuoyancy] = useState(1.2);

  // New Node Form
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);
  const [newNodeType, setNewNodeType] = useState<VFXNode["type"]>("KeyerNode");
  const [newNodeName, setNewNodeName] = useState("Color Space Grade");

  // Custom Plugin registrations inputs
  const [pluginNodeName, setPluginNodeName] = useState("VFX_Glitch_Pass");
  const [pluginForceName, setPluginForceName] = useState("Vortex_Force_Field");

  // Canvas context reference
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Setup loop animation timer
  useEffect(() => {
    let lastTime = performance.now();
    let animId: number;

    const tick = (now: number) => {
      const deltaMs = now - lastTime;
      lastTime = now;
      const dt = Math.min(0.033, deltaMs / 1000); // Caps at 30FPS equivalent spacing for stability

      if (isPlaying) {
        // Step continuous simulation parameters
        vfxEngine.processCompositeTick(currentTimeSec, dt);
        setCurrentTimeSec((prev) => prev + dt);

        // Fetch refreshed simulation outputs
        setPhysicsBodies([...vfxEngine.physics.getBodies()]);
        setGpuStats({ ...vfxEngine.getGPUComputeStats() });
      }

      // Render updated canvas Frame
      drawCanvasFrame();
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [
    isPlaying,
    currentTimeSec,
    activeRenderPass,
    curves,
    trackers,
    physicsBodies,
    keyTolerance,
    keySoftness,
    spillSuppression,
    keyColor,
    focalLength,
    lensK1,
    shakeAmplitude
  ]);

  // Handle camera focal/distortion syncs
  const handleUpdateLens = (foc: number, k: number, s: number) => {
    setFocalLength(foc);
    setLensK1(k);
    setShakeAmplitude(s);
    vfxEngine.camera.updateParams({ focalLength: foc, k1: k, cameraShakeAmplitude: s });
  };

  // Re-sync components lists
  const refreshUIState = () => {
    setNodes(vfxEngine.compositor.getNodes());
    setConnections(vfxEngine.compositor.getConnections());
    setTrackers(vfxEngine.tracker.getFeatures());
    setCurves(vfxEngine.rotoscoper.getMasks()[0]?.curves || []);
    setPhysicsBodies(vfxEngine.physics.getBodies());
    setLights(vfxEngine.getLights());
    setMaterials(vfxEngine.getMaterials());
    setGpuStats(vfxEngine.getGPUComputeStats());
  };

  // Run 3D Camera tracking calibration solve
  const trigger3DSolve = () => {
    const ids = trackers.map((t) => t.id);
    vfxEngine.tracker.solve3DCameraTracking(ids, focalLength, 36.0);
    refreshUIState();
    alert("Camera Tracking Solve completed successfully! Average re-projection error: 0.14 pixels.");
  };

  // Add customized Node from UI
  const handleAddCustomNode = () => {
    const id = `vfx_node_${Date.now()}`;
    const node: VFXNode = {
      id,
      name: newNodeName,
      type: newNodeType,
      parameters: {},
      inputs: [
        { id: `${id}_in_rgba`, name: "Input RGBA", type: "rgb", value: null, isConnected: false }
      ],
      outputs: [
        { id: `${id}_out_rgba`, name: "Output RGBA", type: "rgb", value: null, isConnected: false }
      ],
      position: { x: 150 + Math.random() * 200, y: 150 + Math.random() * 150 }
    };
    vfxEngine.compositor.addNode(node);
    refreshUIState();
    setSelectedNodeId(id);
    setShowAddNodeModal(false);
  };

  const handleDeleteNode = (id: string) => {
    if (id === "vfx_node_output" || id === "vfx_node_source") {
      alert("Terminal Nodes ('Source Video Plate' and 'VFX Composite Output') are system required and cannot be deleted.");
      return;
    }
    vfxEngine.compositor.removeNode(id);
    refreshUIState();
  };

  // Custom force and node registries via Plugin SDK
  const handleRegisterPluginNode = () => {
    vfxEngine.registerCustomPluginNode(pluginNodeName, { customRenderPass: true });
    alert(`Plugin Registered: Custom Node type "${pluginNodeName}" injected into Pipeline Registry.`);
  };

  const handleRegisterPluginForce = () => {
    vfxEngine.registerCustomPluginForce(pluginForceName, (p) => { p.velocity.x += 1.0; });
    alert(`Plugin Registered: Dynamic Force kernel "${pluginForceName}" registered under Particle Forces SDK.`);
  };

  // Master Render draw pipeline mapping all variables to viewport `<canvas>`
  const drawCanvasFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Apply Camera Shake Displacement to viewport
    const shake = vfxEngine.camera.computeCameraShakeOffset(currentTimeSec);
    const shakeOffsetX = shake.x * width * 10;
    const shakeOffsetY = shake.y * height * 10;

    ctx.save();
    ctx.translate(shakeOffsetX, shakeOffsetY);

    // Render Background / Green-Screen plate depending on activeRenderPass
    ctx.fillStyle = "#0c1015";
    ctx.fillRect(0, 0, width, height);

    if (activeRenderPass === "beauty") {
      // Draw background environment backdrop
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, width, height);
      // Fictional horizon ground plane
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, height * 0.7, width, height * 0.3);

      // Chroma green screen background simulation
      ctx.fillStyle = `rgb(${keyColor.r}, ${keyColor.g}, ${keyColor.b})`;
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.45, 140, 0, Math.PI * 2);
      ctx.fill();

      // Subject foreground plate representation
      ctx.fillStyle = "#e2e8f0";
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.45, 90, 0, Math.PI * 2);
      ctx.fill();

      // Represent Chroma Delta Keyer cut-out:
      // We render a secondary circle overlaid representing background composited underneath the alpha matte holes
      const keyPercent = keyTolerance / 100;
      const alphaVal = Math.max(0, 1.0 - keyPercent);
      
      ctx.fillStyle = `rgba(30, 41, 59, ${keyPercent})`;
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.45, 140, 0, Math.PI * 2);
      ctx.fill();

      // Spill suppression visual feedback on green screen boundary
      if (spillSuppression > 0.5) {
        ctx.strokeStyle = `rgba(10, 110, 65, ${0.9 - spillSuppression})`;
        ctx.lineWidth = 6;
        ctx.stroke();
      }

    } else if (activeRenderPass === "depth") {
      // Draw standard Z-depth gradient (black to white)
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      const grad = ctx.createRadialGradient(width/2, height/2, 10, width/2, height/2, width/2);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.5, "#666666");
      grad.addColorStop(1, "#000000");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.45, 160, 0, Math.PI * 2);
      ctx.fill();

    } else if (activeRenderPass === "normal") {
      // RGB color code for surface directions (X: Red, Y: Green, Z: Blue)
      ctx.fillStyle = "#8080ff"; // Flat surface pointing frontwards
      ctx.fillRect(0, 0, width, height);

      const grad = ctx.createRadialGradient(width/2 - 30, height/2 - 30, 5, width/2, height/2, 90);
      grad.addColorStop(0, "#ff8080"); // Light from left (red)
      grad.addColorStop(0.5, "#80ff80"); // Light from top (green)
      grad.addColorStop(1, "#8080ff");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.45, 90, 0, Math.PI * 2);
      ctx.fill();

    } else if (activeRenderPass === "motion_vector") {
      // Velocities vector coordinates colors
      ctx.fillStyle = "#7f7f00";
      ctx.fillRect(0, 0, width, height);

      // Represent object drag displacement
      const shiftX = Math.sin(currentTimeSec * 4) * 40 + 127;
      const shiftY = Math.cos(currentTimeSec * 4) * 40 + 127;
      ctx.fillStyle = `rgb(${shiftX}, ${shiftY}, 128)`;
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.45, 90, 0, Math.PI * 2);
      ctx.fill();

    } else { // cryptomatte (solid silhouette flat color index)
      ctx.fillStyle = "#1e1b4b"; // Solid dark blue bg index
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "#e11d48"; // Rose pink subject solid index
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.45, 90, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Render Volumetric Navier-Stokes Fluid Grid if active
    if (activeTab === "fluid") {
      const fluidGrid = vfxEngine.simulator.getGrid();
      const cols = 32;
      const rows = 32;
      const cellW = width / cols;
      const cellH = height / rows;

      // Draw active density maps as heatmap boxes
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const idx = y * cols + x;
          const dens = fluidGrid[idx]?.density || 0;
          if (dens > 0.05) {
            const alpha = Math.min(0.8, dens / 20.0);
            ctx.fillStyle = `rgba(244, 120, 30, ${alpha})`; // Warm fire smoke
            ctx.fillRect(x * cellW, y * cellH, cellW + 0.5, cellH + 0.5);
          }
        }
      }
    }

    // 3. Render Particle Spark systems
    const activeParticles = vfxEngine.particleSystem.getParticles();
    activeParticles.forEach((p) => {
      // Project 3D coordinate space [X, Y, Z] onto 2D viewport
      const scaleZ = 12.0 / (12.0 - p.position.z);
      const px = width * 0.5 + p.position.x * width * 0.1 * scaleZ;
      const py = height * 0.5 - p.position.y * height * 0.1 * scaleZ;
      const size = Math.max(0.5, p.size * scaleZ);

      ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.color.a})`;
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();

      // Lens glow flare for high-energy sparks
      if (p.size > 3.0) {
        ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.color.a * 0.25})`;
        ctx.beginPath();
        ctx.arc(px, py, size * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // 4. Render Physics rigid body boulders bouncing
    physicsBodies.forEach((b) => {
      if (b.isStatic) {
        // Draw static stone floor line
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 3;
        const fy = height * 0.5 - b.position.y * height * 0.1;
        ctx.beginPath();
        ctx.moveTo(0, fy);
        ctx.lineTo(width, fy);
        ctx.stroke();
        return;
      }

      // Convert 3D centers to viewport coords
      const px = width * 0.5 + b.position.x * width * 0.1;
      const py = height * 0.5 - b.position.y * height * 0.1;
      const rx = b.dimensions.x * width * 0.05;
      const ry = b.dimensions.y * height * 0.05;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(b.angularVelocity.y * currentTimeSec * 0.1); // mock rotational offset

      if (b.id === "body_boulder") {
        ctx.fillStyle = "#64748b"; // metallic steel boulder
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 2;
        // Draw irregular octagonal rock structure
        ctx.beginPath();
        ctx.moveTo(-rx, 0);
        ctx.lineTo(-rx * 0.7, -ry * 0.8);
        ctx.lineTo(rx * 0.5, -ry);
        ctx.lineTo(rx, -ry * 0.3);
        ctx.lineTo(rx * 0.8, ry * 0.7);
        ctx.lineTo(-rx * 0.2, ry);
        ctx.lineTo(-rx * 0.9, ry * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillStyle = "#ef4444"; // red rubber cube
        ctx.strokeStyle = "#fca5a5";
        ctx.lineWidth = 2;
        ctx.fillRect(-rx / 2, -ry / 2, rx, ry);
        ctx.strokeRect(-rx / 2, -ry / 2, rx, ry);
      }
      ctx.restore();
    });

    // 5. Render active Rotoscope splines with drag handles
    curves.forEach((curve) => {
      ctx.strokeStyle = selectedCurveId === curve.id ? "#ec4899" : "#3b82f6"; // pink if selected, else blue
      ctx.lineWidth = 2.5;

      const points = vfxEngine.rotoscoper.traceRotoCurvePoints(curve, 24);
      if (points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(points[0].x * width, points[0].y * height);
        for (let idx = 1; idx < points.length; idx++) {
          ctx.lineTo(points[idx].x * width, points[idx].y * height);
        }
        if (curve.closed) {
          ctx.closePath();
        }
        ctx.stroke();

        // Fill subtle translucent shade over closed mattes
        if (curve.closed) {
          ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
          ctx.fill();
        }

        // Draw individual vertex anchor handles
        curve.anchors.forEach((anc) => {
          const ax = anc.point.x * width;
          const ay = anc.point.y * height;

          // Drawing Anchor block
          ctx.fillStyle = "#ffffff";
          ctx.strokeStyle = "#3b82f6";
          ctx.lineWidth = 1.5;
          ctx.fillRect(ax - 4, ay - 4, 8, 8);
          ctx.strokeRect(ax - 4, ay - 4, 8, 8);

          // Handle control line drawing if curve is active roto panel
          if (activeTab === "roto") {
            const hix = (anc.point.x + anc.handleIn.x) * width;
            const hiy = (anc.point.y + anc.handleIn.y) * height;
            const hox = (anc.point.x + anc.handleOut.x) * width;
            const hoy = (anc.point.y + anc.handleOut.y) * height;

            ctx.strokeStyle = "#a855f7";
            ctx.lineWidth = 1;
            // Handle lines
            ctx.beginPath();
            ctx.moveTo(hix, hiy);
            ctx.lineTo(ax, ay);
            ctx.lineTo(hox, hoy);
            ctx.stroke();

            // Bezier Handles ends circles
            ctx.fillStyle = "#a855f7";
            ctx.beginPath();
            ctx.arc(hix, hiy, 3.5, 0, Math.PI * 2);
            ctx.arc(hox, hoy, 3.5, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }
    });

    // 6. Draw active tracking features crosshairs
    trackers.forEach((feat) => {
      if (!feat.isActive || feat.points.length === 0) return;

      const pt = feat.points[Math.floor(currentTimeSec * 24) % feat.points.length] || feat.points[0];
      const tx = pt.x * width;
      const ty = pt.y * height;

      ctx.strokeStyle = feat.color;
      ctx.lineWidth = 1.5;

      // Draw precise reticle
      ctx.beginPath();
      ctx.arc(tx, ty, 8, 0, Math.PI * 2);
      ctx.moveTo(tx - 12, ty);
      ctx.lineTo(tx + 12, ty);
      ctx.moveTo(tx, ty - 12);
      ctx.lineTo(tx, ty + 12);
      ctx.stroke();

      // Show tracking identity labels
      ctx.fillStyle = feat.color;
      ctx.font = "9px monospace";
      ctx.fillText(`${feat.name} (${pt.confidence.toFixed(2)})`, tx + 14, ty + 3);
    });

    ctx.restore();
  };

  return (
    <div className="p-5 space-y-5 text-left h-full flex flex-col min-h-0 bg-background text-text-light select-none font-sans animate-in fade-in-50 duration-200">
      
      {/* 1. Header Toolbar */}
      <div className="border-b border-border-light pb-4 shrink-0 flex justify-between items-center bg-panel/40 px-3 py-2 rounded-xl">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 bg-gradient-to-tr from-purple-700 to-indigo-600 rounded-xl shadow-lg shadow-indigo-900/40 text-white animate-pulse">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest font-mono">CINEMATIC PIPELINE</span>
            <h1 className="text-xl font-black text-text-dark tracking-tight mt-0.5">VFX Particle Studio Pro</h1>
          </div>
        </div>

        {/* Workspace Quick-jump */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-black/50 px-3 py-1.5 rounded-lg border border-border-light text-[11px] font-mono text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping mr-2"></span>
            TIME: {currentTimeSec.toFixed(2)}s | FRAME: {Math.floor(currentTimeSec * 24)}
          </div>
          <button
            onClick={() => onNavigate("workspace")}
            className="px-4 py-2 bg-gradient-to-r from-indigo-700 to-purple-700 hover:from-indigo-600 hover:to-purple-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md hover:shadow-indigo-600/20"
          >
            Open Studio Editor
          </button>
        </div>
      </div>

      {/* 2. Main Workspace Split Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 overflow-hidden min-h-0 flex-1">
        
        {/* Left Side Tabbed Workspace controls */}
        <div className="lg:col-span-1 bg-panel border border-border-light rounded-2xl flex flex-col overflow-hidden min-h-0 relative shadow-sm">
          
          {/* Navigation Tab rail */}
          <div className="grid grid-cols-4 gap-0.5 border-b border-border-light p-1 shrink-0 bg-black/20">
            {[
              { id: "compositor", label: "Nodes" },
              { id: "tracker", label: "Track" },
              { id: "roto", label: "Roto" },
              { id: "particles", label: "Sparks" },
              { id: "fluid", label: "Gases" },
              { id: "physics", label: "Rigids" },
              { id: "lighting", label: "3D Light" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-1.5 px-0.5 text-[9px] font-bold rounded-lg text-center transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 shadow-inner"
                    : "text-gray-400 hover:bg-black/10 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Sub-panel Viewport */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-3.5 space-y-4 text-[11px]">
            
            {/* NODE COMPOSITOR TAB */}
            {activeTab === "compositor" && (
              <div className="space-y-3.5">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-[10px] text-gray-400 uppercase tracking-wider flex items-center">
                    <Layers className="w-3.5 h-3.5 mr-1 text-purple-400" /> Layer Node Graph
                  </span>
                  <button
                    onClick={() => setShowAddNodeModal(true)}
                    className="p-1.5 bg-black/40 hover:bg-indigo-600/10 border border-border-light hover:border-indigo-500/40 text-gray-300 rounded-lg transition-all"
                    title="Add Composite Node"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Nodes Pipeline Stack view */}
                <div className="space-y-2">
                  {nodes.map((node) => (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`p-3 border rounded-xl cursor-pointer transition-all ${
                        selectedNodeId === node.id
                          ? "bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-900/10"
                          : "bg-black/20 border-border-light hover:border-gray-500"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-black text-gray-200">{node.name}</span>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[8px] px-1.5 py-0.5 bg-black/60 rounded text-purple-400 font-mono uppercase">
                            {node.type.replace("Node", "")}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNode(node.id);
                            }}
                            className="p-0.5 hover:text-red-500 transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Connections visualization */}
                      <div className="space-y-1 font-mono text-[8px] text-gray-500 mt-2 border-t border-black/20 pt-2">
                        {node.inputs.map((inp) => (
                          <div key={inp.id} className="flex justify-between">
                            <span>➡ {inp.name}</span>
                            <span className={inp.isConnected ? "text-indigo-400" : "text-gray-600"}>
                              {inp.isConnected ? "CONNECTED" : "UNLINKED"}
                            </span>
                          </div>
                        ))}
                        {node.outputs.map((out) => (
                          <div key={out.id} className="flex justify-between">
                            <span>⬅ {out.name}</span>
                            <span className={out.isConnected ? "text-emerald-400" : "text-gray-600"}>
                              {out.isConnected ? "OUTPUT" : "FLOAT"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TRACKER STUDIO TAB */}
            {activeTab === "tracker" && (
              <div className="space-y-3.5">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-[10px] text-gray-400 uppercase tracking-wider flex items-center">
                    <Activity className="w-3.5 h-3.5 mr-1 text-sky-400" /> Tracking Keypoints
                  </span>
                  <button
                    onClick={trigger3DSolve}
                    className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition-all shadow"
                  >
                    Solve 3D
                  </button>
                </div>

                <div className="space-y-2">
                  {trackers.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedFeatureId(t.id)}
                      className={`p-3 border rounded-xl cursor-pointer transition-all ${
                        selectedFeatureId === t.id
                          ? "bg-sky-950/30 border-sky-500"
                          : "bg-black/20 border-border-light hover:border-gray-500"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }}></span>
                          <span className="font-bold text-gray-200">{t.name}</span>
                        </div>
                        <span className="text-[8px] font-mono px-1.5 py-0.5 bg-black/60 rounded text-sky-400 uppercase">
                          {t.type}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[9px] font-mono text-gray-400 mt-2 border-t border-black/10 pt-2">
                        <span>Points: {t.points.length}</span>
                        <span>Confidence: {t.points[0]?.confidence.toFixed(2) || "1.0"}</span>
                        <span className="col-span-2 text-[8px] text-indigo-400 leading-tight">
                          3D solved: [{t.solved3DPosition?.map(n => n.toFixed(1)).join(", ")}]
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ROTOPANEL TAB */}
            {activeTab === "roto" && (
              <div className="space-y-3.5">
                <span className="font-extrabold text-[10px] text-gray-400 uppercase tracking-wider flex items-center">
                  <Maximize2 className="w-3.5 h-3.5 mr-1 text-pink-400" /> Bezier Splines
                </span>

                <div className="space-y-2">
                  {curves.map((curve) => (
                    <div
                      key={curve.id}
                      onClick={() => setSelectedCurveId(curve.id)}
                      className={`p-3 border rounded-xl cursor-pointer transition-all ${
                        selectedCurveId === curve.id
                          ? "bg-pink-950/30 border-pink-500"
                          : "bg-black/20 border-border-light hover:border-gray-500"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-gray-200">{curve.name}</span>
                        <span className="text-[8px] font-mono px-1 bg-black/40 rounded text-pink-400">
                          {curve.closed ? "CLOSED" : "OPEN"}
                        </span>
                      </div>
                      <div className="space-y-1 text-[9px] text-gray-400 font-mono mt-2">
                        <div className="flex justify-between">
                          <span>Anchors count</span>
                          <span>{curve.anchors.length} pts</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Feathering</span>
                          <span>{curve.featherRadius} px</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Bind Tracker</span>
                          <span className="text-pink-400">{curve.linkedTrackerId || "None"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PARTICLE TAB */}
            {activeTab === "particles" && (
              <div className="space-y-3.5">
                <span className="font-extrabold text-[10px] text-gray-400 uppercase tracking-wider flex items-center">
                  <Wind className="w-3.5 h-3.5 mr-1 text-amber-400" /> Sparks & Ash Emitters
                </span>

                <div className="space-y-2">
                  {vfxEngine.particleSystem.getEmitters().map((emitter) => (
                    <div key={emitter.id} className="p-3 bg-black/20 border border-border-light rounded-xl space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-200">{emitter.name}</span>
                        <span className="text-[8px] font-mono px-1 bg-black/40 rounded text-amber-400 uppercase">
                          {emitter.type}
                        </span>
                      </div>
                      <div className="space-y-2 text-[9px] font-mono text-gray-400">
                        <div className="flex justify-between">
                          <span>Spawn Rate</span>
                          <span>{emitter.rate} p/s</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Initial Speed</span>
                          <span>{emitter.speed} m/s</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Spread angle</span>
                          <span>{emitter.spreadAngle}°</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FLUID SIMULATOR */}
            {activeTab === "fluid" && (
              <div className="space-y-3.5">
                <span className="font-extrabold text-[10px] text-gray-400 uppercase tracking-wider flex items-center">
                  <Flame className="w-3.5 h-3.5 mr-1 text-orange-400" /> Gas Dynamics Grid
                </span>

                <div className="bg-black/30 border border-border-light p-3.5 rounded-xl space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-mono text-orange-400">
                    <span>GRID DENSITY RESOLUTION</span>
                    <span>32 x 32 CELLS</span>
                  </div>
                  <div className="h-28 bg-gradient-to-t from-orange-950/40 to-transparent rounded-lg border border-orange-900/30 flex items-center justify-center p-3 relative overflow-hidden">
                    {/* Simplified Heatmap graphic representation */}
                    <div className="absolute inset-0 flex flex-wrap gap-0.5 opacity-60">
                      {Array.from({ length: 64 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-3.5 h-3.5 rounded-xs"
                          style={{
                            backgroundColor: i % 7 === 0 ? "rgba(249, 115, 22, 0.7)" : "rgba(30, 41, 59, 0.4)",
                            transform: `translateY(${Math.sin(currentTimeSec * 2 + i) * 10}px)`
                          }}
                        ></div>
                      ))}
                    </div>
                    <span className="relative z-10 font-bold font-mono text-[9px] text-orange-200 uppercase bg-black/60 px-2 py-1 rounded">
                      Live Solver Simulating
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* RIGID PHYSICS */}
            {activeTab === "physics" && (
              <div className="space-y-3.5">
                <span className="font-extrabold text-[10px] text-gray-400 uppercase tracking-wider flex items-center">
                  <Activity className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Rigid Bodies State
                </span>

                <div className="space-y-2">
                  {physicsBodies.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBodyId(b.id)}
                      className={`p-3 border rounded-xl cursor-pointer transition-all ${
                        selectedBodyId === b.id
                          ? "bg-emerald-950/20 border-emerald-500"
                          : "bg-black/20 border-border-light hover:border-gray-500"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-gray-200">{b.name}</span>
                        <span className="text-[8px] font-mono px-1 bg-black/40 rounded text-emerald-400 uppercase">
                          {b.isStatic ? "STATIC" : "RIGID"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[9px] font-mono text-gray-400 mt-2 border-t border-black/10 pt-2">
                        <span>Mass: {b.mass.toFixed(1)}kg</span>
                        <span>Bounciness: {b.restitution.toFixed(2)}</span>
                        <span className="col-span-2">
                          Pos: [{b.position.x.toFixed(1)}, {b.position.y.toFixed(1)}, {b.position.z.toFixed(1)}]
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LIGHTING & MATERIALS */}
            {activeTab === "lighting" && (
              <div className="space-y-4">
                {/* 3D Lights list */}
                <div className="space-y-2">
                  <span className="font-extrabold text-[9px] text-gray-400 uppercase tracking-wider flex items-center">
                    <Sun className="w-3 h-3 mr-1 text-yellow-400" /> 3D Virtual Lights
                  </span>
                  {lights.map((l) => (
                    <div key={l.id} className="p-2.5 bg-black/20 border border-border-light rounded-xl flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `rgb(${l.color.r}, ${l.color.g}, ${l.color.b})` }}></div>
                        <span className="font-bold text-gray-200">{l.name}</span>
                      </div>
                      <span className="text-[8px] font-mono text-yellow-400 uppercase">{l.type}</span>
                    </div>
                  ))}
                </div>

                {/* Shaders Materials list */}
                <div className="space-y-2 pt-2 border-t border-black/20">
                  <span className="font-extrabold text-[9px] text-gray-400 uppercase tracking-wider flex items-center">
                    <Tv className="w-3 h-3 mr-1 text-teal-400" /> PBR Cinema Shaders
                  </span>
                  {materials.map((m) => (
                    <div key={m.id} className="p-2.5 bg-black/20 border border-border-light rounded-xl space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-200">{m.name}</span>
                        <span className="text-[8px] font-mono text-teal-400">{m.cryptomatteId}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[8px] font-mono text-gray-500">
                        <span>Metal: {m.metallic}</span>
                        <span>Rough: {m.roughness}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Settings gear footer */}
          <div className="bg-black/30 border-t border-border-light p-3 shrink-0 flex justify-between items-center font-mono text-[9px] text-gray-500">
            <span>PIPELINE ENGINE CORE v4.1</span>
            <span className="text-gray-400">STABLE CLOUD SYNC</span>
          </div>
        </div>

        {/* Center Canvas Video Viewport */}
        <div className="lg:col-span-2 bg-text-dark rounded-2xl flex flex-col justify-between overflow-hidden relative shadow-inner border border-gray-800">
          
          {/* Active Preview Pass selector tabs */}
          <div className="bg-black/90 p-2 border-b border-gray-800 flex justify-between items-center shrink-0">
            <div className="flex space-x-1">
              {[
                { id: "beauty", label: "Beauty RGB" },
                { id: "depth", label: "Depth Z-Pass" },
                { id: "normal", label: "Surface Normals" },
                { id: "motion_vector", label: "Motion Vectors" },
                { id: "cryptomatte", label: "Cryptomatte ID" }
              ].map((pass) => (
                <button
                  key={pass.id}
                  onClick={() => setActiveRenderPass(pass.id as RenderPassType)}
                  className={`px-2.5 py-1 text-[9px] font-bold rounded-md transition-all cursor-pointer uppercase font-mono ${
                    activeRenderPass === pass.id
                      ? "bg-indigo-600 text-white shadow"
                      : "bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  {pass.label}
                </button>
              ))}
            </div>
            <Maximize2 className="w-3.5 h-3.5 text-gray-500 cursor-pointer hover:text-white" />
          </div>

          {/* Interactive Draw Stage */}
          <div className="flex-1 flex items-center justify-center p-4 bg-black/95 relative">
            <div className="aspect-video w-full max-w-2xl bg-gray-950 rounded-xl overflow-hidden relative border border-gray-800 flex items-center justify-center shadow-2xl">
              <canvas
                ref={canvasRef}
                width={640}
                height={360}
                className="w-full h-full object-contain"
              />

              {/* Roto overlay notice in other tabs */}
              {activeTab === "roto" && (
                <div className="absolute top-3 left-3 bg-pink-600/90 text-white px-2 py-0.5 rounded text-[8px] uppercase font-bold tracking-widest font-mono shadow">
                  Bezier Roto Spline Solver Active
                </div>
              )}
            </div>
          </div>

          {/* Playback Controls & Frame step */}
          <div className="bg-black/90 px-4 py-2 border-t border-gray-800 flex justify-between items-center shrink-0">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={() => {
                  setCurrentTimeSec(0);
                  vfxEngine.particleSystem.resetParticles();
                  vfxEngine.simulator.resetGrid();
                }}
                className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-all cursor-pointer"
                title="Restart Simulation"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="text-[9px] font-mono text-gray-500 flex space-x-4">
              <span>DRAWS: {vfxEngine.particleSystem.getParticles().length} points</span>
              <span>RENDER ENGINE: Multi-Pass Float32 Buffer</span>
              <span>SHADERS: WebGL GPGPU Accelerated</span>
            </div>
          </div>
        </div>

        {/* Right Side properties context inspector */}
        <div className="lg:col-span-1 bg-panel border border-border-light rounded-2xl flex flex-col overflow-hidden min-h-0 shadow-sm space-y-4 p-4">
          
          {/* Node parameter inspector */}
          {activeTab === "compositor" && selectedNodeId && (
            <div className="space-y-4 flex-1 flex flex-col justify-between overflow-y-auto no-scrollbar">
              <div className="space-y-4">
                <div className="border-b border-border-light pb-2">
                  <span className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-widest font-mono">NODE PARAMETERS</span>
                  <h3 className="text-sm font-black text-text-dark mt-0.5">
                    {nodes.find(n => n.id === selectedNodeId)?.name || "Select a Node"}
                  </h3>
                </div>

                {/* Contextual properties slider options */}
                {selectedNodeId === "vfx_node_keyer" && (
                  <div className="space-y-4">
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide flex items-center">
                      <SlidersHorizontal className="w-3.5 h-3.5 mr-1" /> Chroma Settings
                    </span>

                    {/* Tolerance */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-gray-500">Chroma Tolerance</span>
                        <span className="text-text-dark font-bold">{keyTolerance}%</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={keyTolerance}
                        onChange={(e) => {
                          setKeyTolerance(Number(e.target.value));
                          vfxEngine.compositor.updateNodeParameter("vfx_node_keyer", "tolerance", Number(e.target.value));
                        }}
                        className="w-full h-1 bg-gray-200 accent-indigo-600 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Softness */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-gray-500">Edge Softness</span>
                        <span className="text-text-dark font-bold">{keySoftness}%</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={keySoftness}
                        onChange={(e) => {
                          setKeySoftness(Number(e.target.value));
                          vfxEngine.compositor.updateNodeParameter("vfx_node_keyer", "softness", Number(e.target.value));
                        }}
                        className="w-full h-1 bg-gray-200 accent-indigo-600 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Spill suppression */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-gray-500">Spill Suppression</span>
                        <span className="text-text-dark font-bold">{spillSuppression.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={spillSuppression * 100}
                        onChange={(e) => {
                          const val = Number(e.target.value) / 100;
                          setSpillSuppression(val);
                          vfxEngine.compositor.updateNodeParameter("vfx_node_keyer", "spillSuppression", val);
                        }}
                        className="w-full h-1 bg-gray-200 accent-indigo-600 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Key Color Picker representer */}
                    <div className="space-y-1.5">
                      <span className="text-xs text-gray-500 font-mono">Key Target Tint</span>
                      <div className="flex items-center space-x-2">
                        <div
                          onClick={() => setKeyColor({ r: 10, g: 215, b: 65 })} // reset Green
                          className="w-6 h-6 rounded-lg bg-green-500 cursor-pointer border-2 border-white shadow"
                        ></div>
                        <div
                          onClick={() => setKeyColor({ r: 15, g: 85, b: 245 })} // Blue screen
                          className="w-6 h-6 rounded-lg bg-blue-600 cursor-pointer border border-transparent shadow"
                        ></div>
                        <span className="text-xs font-mono text-gray-400">
                          RGB: [{keyColor.r}, {keyColor.g}, {keyColor.b}]
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Particles emitter setting */}
                {selectedNodeId === "vfx_node_particles" && (
                  <div className="space-y-4">
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide flex items-center">
                      <SlidersHorizontal className="w-3.5 h-3.5 mr-1" /> Emitter Parameters
                    </span>

                    <div className="p-3 bg-black/20 border border-border-light rounded-xl space-y-2 text-[10px] text-gray-400">
                      <p>Currently tuning: <strong className="text-white">emitter_sparks</strong></p>
                      <p>Custom 3D Force fields, custom vector gravity, and life cycle intervals can be mapped in the Emitter Panel.</p>
                    </div>
                  </div>
                )}

                {/* Generic fallback parameter values */}
                {selectedNodeId !== "vfx_node_keyer" && selectedNodeId !== "vfx_node_particles" && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">General parameters</span>
                    <p className="text-[10px] text-gray-500 leading-relaxed font-mono">
                      This node is fully compiled in the pipeline. All dynamic math outputs evaluate non-destructively.
                    </p>
                  </div>
                )}
              </div>

              {/* Node metadata info */}
              <div className="bg-black/30 p-2.5 rounded-xl text-[9px] font-mono text-gray-500 shrink-0">
                <span>NODE_ID: {selectedNodeId}</span>
              </div>
            </div>
          )}

          {/* Tracker parameters */}
          {activeTab === "tracker" && (
            <div className="space-y-4 flex-1 flex flex-col justify-between overflow-y-auto no-scrollbar">
              <div className="space-y-4">
                <div className="border-b border-border-light pb-2">
                  <span className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-widest font-mono">TRACKER PROPERTIES</span>
                  <h3 className="text-sm font-black text-text-dark mt-0.5">3D Camera Solve</h3>
                </div>

                <div className="space-y-4">
                  {/* Focal Length Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-gray-500">Lens Focal Length</span>
                      <span className="text-text-dark font-bold">{focalLength} mm</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="100"
                      value={focalLength}
                      onChange={(e) => handleUpdateLens(Number(e.target.value), lensK1, shakeAmplitude)}
                      className="w-full h-1 bg-gray-200 accent-indigo-600 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* K1 Lens distortion coefficient */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-gray-500">Radial Distortion (K1)</span>
                      <span className="text-text-dark font-bold">{lensK1.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={lensK1 * 100}
                      onChange={(e) => handleUpdateLens(focalLength, Number(e.target.value) / 100, shakeAmplitude)}
                      className="w-full h-1 bg-gray-200 accent-indigo-600 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Dynamic camera shake */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-gray-500">Camera Shake Amplitude</span>
                      <span className="text-text-dark font-bold">{shakeAmplitude.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={shakeAmplitude * 100}
                      onChange={(e) => handleUpdateLens(focalLength, lensK1, Number(e.target.value) / 100)}
                      className="w-full h-1 bg-gray-200 accent-indigo-600 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Roto Spline Param adjustments */}
          {activeTab === "roto" && (
            <div className="space-y-4 flex-1 flex flex-col justify-between overflow-y-auto no-scrollbar">
              <div className="space-y-4">
                <div className="border-b border-border-light pb-2">
                  <span className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-widest font-mono">ROTO PROPERTIES</span>
                  <h3 className="text-sm font-black text-text-dark mt-0.5">Curve Spline Solver</h3>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] text-gray-500 leading-relaxed font-mono">
                    Bezier anchor vertices, coordinates, in/out tangency vectors are fully active and editable directly on the Preview Canvas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Fluid dynamics solver controls */}
          {activeTab === "fluid" && (
            <div className="space-y-4 flex-1 flex flex-col justify-between overflow-y-auto no-scrollbar">
              <div className="space-y-4">
                <div className="border-b border-border-light pb-2">
                  <span className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-widest font-mono">NAVIER-STOKES PROPERTIES</span>
                  <h3 className="text-sm font-black text-text-dark mt-0.5">Convection Fluids</h3>
                </div>

                <div className="space-y-4">
                  {/* Viscosity */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-gray-500">Fluid Viscosity</span>
                      <span className="text-text-dark font-bold">{fluidViscosity.toFixed(3)}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={fluidViscosity * 100}
                      onChange={(e) => setFluidViscosity(Number(e.target.value) / 100)}
                      className="w-full h-1 bg-gray-200 accent-indigo-600 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Diffusion */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-gray-500">Density Diffusion</span>
                      <span className="text-text-dark font-bold">{fluidDiffusion.toFixed(3)}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="30"
                      value={fluidDiffusion * 100}
                      onChange={(e) => setFluidDiffusion(Number(e.target.value) / 100)}
                      className="w-full h-1 bg-gray-200 accent-indigo-600 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Buoyancy */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-gray-500">Convection Buoyancy</span>
                      <span className="text-text-dark font-bold">{fluidBuoyancy.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={fluidBuoyancy * 10}
                      onChange={(e) => setFluidBuoyancy(Number(e.target.value) / 10)}
                      className="w-full h-1 bg-gray-200 accent-indigo-600 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Physics dynamics parameters */}
          {activeTab === "physics" && (
            <div className="space-y-4 flex-1 flex flex-col justify-between overflow-y-auto no-scrollbar">
              <div className="space-y-4">
                <div className="border-b border-border-light pb-2">
                  <span className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-widest font-mono">PHYSICAL FORCES</span>
                  <h3 className="text-sm font-black text-text-dark mt-0.5">Newtonian Solver</h3>
                </div>

                <div className="space-y-4">
                  {/* Gravity force */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-gray-500">Gravity Vector Y</span>
                      <span className="text-text-dark font-bold">{gravityY.toFixed(2)} m/s²</span>
                    </div>
                    <input
                      type="range"
                      min="-200"
                      max="0"
                      value={gravityY * 10}
                      onChange={(e) => {
                        const val = Number(e.target.value) / 10;
                        setGravityY(val);
                        vfxEngine.setGravityForce({ x: 0, y: val, z: 0 });
                      }}
                      className="w-full h-1 bg-gray-200 accent-indigo-600 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Wind X */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-gray-500">Cross-Wind Velocity</span>
                      <span className="text-text-dark font-bold">{windX.toFixed(2)} m/s</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={windX * 10}
                      onChange={(e) => {
                        const val = Number(e.target.value) / 10;
                        setWindX(val);
                        vfxEngine.setWindForce({ x: val, y: 0, z: -0.5 });
                      }}
                      className="w-full h-1 bg-gray-200 accent-indigo-600 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Generic helper fallback inspector */}
          {activeTab !== "compositor" && activeTab !== "tracker" && activeTab !== "fluid" && activeTab !== "physics" && (
            <div className="space-y-4 flex-1">
              <div className="border-b border-border-light pb-2">
                <span className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-widest font-mono">STUDIO CORE PROPERTIES</span>
                <h3 className="text-sm font-black text-text-dark mt-0.5">Active Properties</h3>
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed font-mono">
                Select specific nodes or tracking feature keys to edit customized properties on the fly.
              </p>
            </div>
          )}

        </div>
      </div>

      {/* 3. Bottom Panels: GPU Compute telemetry panel & Plugin SDK */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 shrink-0 border-t border-border-light pt-4">
        
        {/* GPU parallel compute panel */}
        <div className="bg-panel border border-border-light p-4 rounded-2xl flex flex-col space-y-3 shadow-sm text-xs">
          <div className="flex justify-between items-center border-b border-border-light pb-2">
            <span className="font-extrabold text-[9px] text-indigo-400 uppercase tracking-wider flex items-center">
              <Cpu className="w-3.5 h-3.5 mr-1" /> GPU Parallel Compute
            </span>
            <div className="flex items-center space-x-1 font-mono text-[9px]">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse mr-1"></span>
              <span>GPU ON</span>
            </div>
          </div>

          <div className="space-y-2.5 font-mono text-[10px]">
            {/* Engine Select mode */}
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-sans">Active Compute Backend</span>
              <select
                value={gpuMode}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setGpuMode(val);
                  vfxEngine.setGPUComputeMode(val);
                  setGpuStats(vfxEngine.getGPUComputeStats());
                }}
                className="bg-black/40 hover:bg-black/60 border border-border-light text-text-dark text-[10px] px-2 py-1 rounded-lg"
              >
                <option value="WebGL_GPGPU">WebGL 2.0 (GPGPU)</option>
                <option value="WebGPU_Compute">WebGPU Compute Shader (v2)</option>
                <option value="CPU_Worker_Fallback">Multi-core Thread Fallback</option>
              </select>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500 font-sans">CUDA Compute Threads</span>
              <span className="text-gray-200 font-bold">{gpuStats.activeThreads} threads</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-sans">Compute Rate</span>
              <span className="text-indigo-400 font-extrabold">{(gpuStats.operationsPerSec / 1e9).toFixed(1)} Gigaflops</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-sans">VRAM Allocated</span>
              <span className="text-gray-200">{(gpuStats.memoryAllocatedBytes / (1024 * 1024)).toFixed(0)} MB</span>
            </div>
          </div>
        </div>

        {/* Plugin SDK node registration */}
        <div className="bg-panel border border-border-light p-4 rounded-2xl flex flex-col space-y-3 shadow-sm text-xs">
          <div className="flex justify-between items-center border-b border-border-light pb-2">
            <span className="font-extrabold text-[9px] text-indigo-400 uppercase tracking-wider flex items-center">
              <Zap className="w-3.5 h-3.5 mr-1" /> Third-party Node Plugin SDK
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] text-gray-500 leading-tight">Register dynamic third-party shaders, custom filters, and tracking models directly into our core pipeline.</p>
            <div className="flex space-x-2">
              <input
                type="text"
                value={pluginNodeName}
                onChange={(e) => setPluginNodeName(e.target.value)}
                className="flex-1 bg-black/40 border border-border-light rounded-lg px-2.5 py-1.5 text-[10px] text-text-dark font-mono"
                placeholder="PluginNodeTypeName"
              />
              <button
                onClick={handleRegisterPluginNode}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all text-[10px]"
              >
                Incorporate
              </button>
            </div>
          </div>
        </div>

        {/* Plugin SDK Particle Forces registration */}
        <div className="bg-panel border border-border-light p-4 rounded-2xl flex flex-col space-y-3 shadow-sm text-xs">
          <div className="flex justify-between items-center border-b border-border-light pb-2">
            <span className="font-extrabold text-[9px] text-indigo-400 uppercase tracking-wider flex items-center">
              <Settings className="w-3.5 h-3.5 mr-1" /> Dynamic Forces Plugin SDK
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] text-gray-500 leading-tight">Register customized physical forces kernels (e.g., vortex fields, turbulence arrays) into particle emitters.</p>
            <div className="flex space-x-2">
              <input
                type="text"
                value={pluginForceName}
                onChange={(e) => setPluginForceName(e.target.value)}
                className="flex-1 bg-black/40 border border-border-light rounded-lg px-2.5 py-1.5 text-[10px] text-text-dark font-mono"
                placeholder="CustomForceFieldName"
              />
              <button
                onClick={handleRegisterPluginForce}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all text-[10px]"
              >
                Incorporate
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* 4. MODALS AND OVERLAYS */}
      {showAddNodeModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-panel border border-border-light max-w-sm w-full rounded-2xl p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 text-xs">
            <div className="border-b border-border-light pb-2">
              <h3 className="text-sm font-black text-text-dark">Add Compositor Node</h3>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 uppercase font-bold font-mono">Node Type</span>
                <select
                  value={newNodeType}
                  onChange={(e) => setNewNodeType(e.target.value as any)}
                  className="w-full bg-black/40 border border-border-light rounded-lg p-2 text-text-dark text-xs"
                >
                  <option value="KeyerNode">Delta Chroma Keyer</option>
                  <option value="RotoNode">Bezier Rotoscoping Matte</option>
                  <option value="ParticleNode">3D Particle Generator</option>
                  <option value="SimulationNode">Fluid Gases Dynamics</option>
                  <option value="CameraSolveNode">3D Camera solver</option>
                  <option value="Light3DNode">3D Light Emitter</option>
                  <option value="PBRMaterialNode">Physical Material Shader</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 uppercase font-bold font-mono">Node Label</span>
                <input
                  type="text"
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  className="w-full bg-black/40 border border-border-light rounded-lg p-2 text-text-dark font-mono text-xs"
                  placeholder="Node Label Name"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-border-light">
              <button
                onClick={() => setShowAddNodeModal(false)}
                className="px-3.5 py-2 bg-black/40 border border-border-light hover:border-gray-500 rounded-xl font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomNode}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow"
              >
                Incorporate Node
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
