import { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Pause, 
  Plus, 
  Trash, 
  Settings, 
  Sparkles, 
  Activity, 
  Layers, 
  Type, 
  Box, 
  Compass, 
  Code, 
  RefreshCw, 
  Key, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Sliders, 
  Sun, 
  Video,
  Scissors,
  Share2,
  Tv,
  HelpCircle
} from "lucide-react";
import { PageId } from "../types";

// Import core types and engines
import { MotionLayer, MotionTextLayer, MotionShapeLayer, MotionParticleLayer } from "../motion/core/MotionTypes";
import { AnimationEngine } from "../motion/animation/AnimationEngine";
import { GraphEditorEngine } from "../motion/keyframes/GraphEditorEngine";
import { TextEngine } from "../motion/text/TextEngine";
import { ShapeEngine } from "../motion/shapes/ShapeEngine";
import { VectorEngine } from "../motion/vector/VectorEngine";
import { CameraEngine, CameraMatrix } from "../motion/camera/CameraEngine";
import { LightEngine, Light3DSource } from "../motion/lights/LightEngine";
import { RiggingEngine, JointNode } from "../motion/rigging/RiggingEngine";
import { ExpressionEngine } from "../motion/expressions/ExpressionEngine";
import { ParticleEngine, ParticleEmitterConfig } from "../motion/particles/ParticleEngine";
import { PhysicsEngine } from "../motion/physics/PhysicsEngine";
import { TemplateSystem } from "../motion/templates/TemplateSystem";
import { PluginSDK } from "../motion/plugins/PluginSDK";

interface MotionGraphicsProps {
  onNavigate: (page: PageId) => void;
}

export default function MotionGraphics({ onNavigate }: MotionGraphicsProps) {
  // Engines Instances
  const anim = AnimationEngine.getInstance();
  const graph = GraphEditorEngine.getInstance();
  const textEng = TextEngine.getInstance();
  const shapeEng = ShapeEngine.getInstance();
  const vectorEng = VectorEngine.getInstance();
  const cameraEng = CameraEngine.getInstance();
  const lightEng = LightEngine.getInstance();
  const riggingEng = RiggingEngine.getInstance();
  const exprEng = ExpressionEngine.getInstance();
  const particleEng = ParticleEngine.getInstance();
  const physicsEng = PhysicsEngine.getInstance();
  const templates = TemplateSystem.getInstance();
  const sdk = PluginSDK.getInstance();

  // Playback States
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const maxFrames = 240; // 10 seconds at 24fps

  // Composition Layers
  const [layers, setLayers] = useState<MotionLayer[]>(() => {
    // Set up default elegant starting composition
    const titleLayer: MotionTextLayer = {
      id: "layer_title",
      name: "Cinematic Title",
      type: "text",
      blendMode: "normal",
      startTime: 0,
      duration: 10,
      zIndex: 2,
      visible: true,
      locked: false,
      text: "CREATIVE ENGINE",
      fontFamily: "Space Grotesk",
      fontSize: 34,
      fontWeight: "bold",
      tracking: 6,
      leading: 40,
      alignment: "center",
      textboxWidth: 600,
      textboxHeight: 80,
      fillColor: "#ffffff",
      strokeColor: "#8B5CF6",
      strokeWidth: 1.5,
      kerning: true,
      baselineShift: 0,
      transform: anim.createTransformGroup()
    };
    // Slide in keyframes for title
    anim.addKeyframe(titleLayer.transform.positionX, 0, -250, "bezier");
    anim.addKeyframe(titleLayer.transform.positionY, 0, -80, "bezier");
    const titleEndX = anim.addKeyframe(titleLayer.transform.positionX, 35, 0, "bezier");
    titleEndX.controlIn = { x: 0.1, y: 0.9 };

    const shapeLayer: MotionShapeLayer = {
      id: "layer_backing",
      name: "Ambient Star Ring",
      type: "shape",
      shapeType: "star",
      blendMode: "screen",
      startTime: 0,
      duration: 10,
      zIndex: 1,
      visible: true,
      locked: false,
      roundedCorners: 0,
      fillColor: "#3B82F6",
      strokeColor: "#ff007f",
      strokeWidth: 2,
      transform: anim.createTransformGroup()
    };
    anim.addKeyframe(shapeLayer.transform.rotationZ, 0, 0, "linear");
    anim.addKeyframe(shapeLayer.transform.rotationZ, maxFrames, 360, "linear");
    anim.addKeyframe(shapeLayer.transform.scaleX, 0, 0.7);
    anim.addKeyframe(shapeLayer.transform.scaleY, 0, 0.7);

    return [shapeLayer, titleLayer];
  });

  const [selectedLayerId, setSelectedLayerId] = useState<string>("layer_title");
  const [activeTab, setActiveTab] = useState<"shapes" | "text" | "templates" | "particles" | "plugins">("shapes");

  // Camera Parameters
  const [cameraMatrix, setCameraMatrix] = useState<CameraMatrix>({
    x: 0, y: 0, z: -400, pitch: 0, yaw: 0, roll: 0
  });
  const [orbitEnabled, setOrbitEnabled] = useState(false);
  const [cameraShake, setCameraShake] = useState(0);

  // Expression parameters
  const [expressionInput, setExpressionInput] = useState("wiggle(4, 30)");
  const [expressionError, setExpressionError] = useState<string | null>(null);

  // Bezier coordinates for Easing Graph editor
  const [bezierInX, setBezierInX] = useState(33);
  const [bezierInY, setBezierInY] = useState(0);
  const [bezierOutX, setBezierOutX] = useState(67);
  const [bezierOutY, setBezierOutY] = useState(100);

  // Particle System Parameters
  const [gravityY, setGravityY] = useState(0.2);
  const [emitterRate, setEmitterRate] = useState(0.8);
  const [windX, setWindX] = useState(0.05);

  // Skeletal Rigging Bone nodes
  const [joints, setJoints] = useState<JointNode[]>([
    { id: "root", name: "Root Hip Joint", x: 0, y: 150, length: 0, angle: 0 },
    { id: "bone1", name: "Torso Bone", x: 0, y: 150, length: 60, angle: -Math.PI / 2, parentId: "root" },
    { id: "bone2", name: "Head Bone", x: 0, y: 90, length: 30, angle: -Math.PI / 2, parentId: "bone1" }
  ]);
  const [ikTarget, setIkTarget] = useState({ x: 30, y: 40 });

  const viewportCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Retrieve selected layer
  const activeLayer = layers.find(l => l.id === selectedLayerId);

  // Trigger Playback Intervals
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentFrame((prev) => (prev >= maxFrames ? 0 : prev + 1));
      }, 42); // ~24 fps execution
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Update Canvas rendering on state adjustments
  useEffect(() => {
    renderCanvasFrame();
  }, [currentFrame, layers, cameraMatrix, orbitEnabled, gravityY, emitterRate, windX, joints, ikTarget]);

  // Orbit camera rotation
  useEffect(() => {
    let animId: any;
    if (orbitEnabled) {
      const updateOrbit = () => {
        setCameraMatrix(prev => ({
          ...prev,
          yaw: (prev.yaw + 0.8) % 360,
          pitch: Math.sin(Date.now() * 0.001) * 15
        }));
        animId = requestAnimationFrame(updateOrbit);
      };
      animId = requestAnimationFrame(updateOrbit);
    }
    return () => cancelAnimationFrame(animId);
  }, [orbitEnabled]);

  // Renders the entire composition frame dynamically onto viewport HTML5 Canvas
  const renderCanvasFrame = () => {
    const canvas = viewportCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Reset canvas buffers
    ctx.fillStyle = "#0A0A0C"; // Elegant deep charcoal void
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Setup Grid guides
    ctx.strokeStyle = "rgba(40, 40, 45, 0.4)";
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Save initial coordinates
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2); // Center coordinate origin

    // Apply procedural Camera shakes
    if (cameraShake > 0) {
      const shake = cameraEng.computeCameraShake(6, cameraShake, currentFrame);
      ctx.translate(shake.x, shake.y);
    }

    // Process ambient illumination shadow mapping or light points
    const activeLightSource: Light3DSource = {
      id: "env_main_light",
      type: "point",
      color: { r: 0.95, g: 0.88, b: 1.0 },
      intensity: 1.5,
      position: { x: 120, y: -150, z: -100 },
      direction: { x: 0, y: 0, z: 1 }
    };

    // Render layers sorted by custom zIndex
    const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

    sortedLayers.forEach((layer) => {
      if (!layer.visible) return;

      // Evaluate animated properties at current playhead frame
      let px = anim.evaluateProperty(layer.transform.positionX, currentFrame);
      let py = anim.evaluateProperty(layer.transform.positionY, currentFrame);
      let scaleX = anim.evaluateProperty(layer.transform.scaleX, currentFrame);
      let scaleY = anim.evaluateProperty(layer.transform.scaleY, currentFrame);
      let rotZ = anim.evaluateProperty(layer.transform.rotationZ, currentFrame);
      let opacity = anim.evaluateProperty(layer.transform.opacity, currentFrame);
      let skewX = anim.evaluateProperty(layer.transform.skewX, currentFrame);

      // Evaluate dynamic Expressions Sandbox if configured
      if (layer.transform.positionX.expressions) {
        const result = exprEng.evaluateExpression(layer.transform.positionX.expressions, {
          time: currentFrame / 24,
          frame: currentFrame,
          value: px,
          index: layer.zIndex,
          fps: 24,
          layerName: layer.name,
          getPropertyValue: () => 0
        });
        px = result;
      }

      // Draw projected 3D coordinates using Camera matrix
      const projected = cameraEng.project3DPoint(px, py, 0, cameraMatrix, 60, canvas.width, canvas.height);
      
      ctx.save();
      
      // Multi-layer blending support
      if (layer.blendMode === "screen") ctx.globalCompositeOperation = "screen";
      if (layer.blendMode === "multiply") ctx.globalCompositeOperation = "multiply";
      if (layer.blendMode === "add") ctx.globalCompositeOperation = "lighter";

      ctx.globalAlpha = opacity / 100;

      // Transform drawing coordinate matrices
      ctx.translate(px, py);
      ctx.rotate(rotZ * (Math.PI / 180));
      ctx.scale(scaleX, scaleY);
      if (skewX !== 0) ctx.transform(1, 0, Math.tan(skewX * (Math.PI / 180)), 1, 0, 0);

      // --- LAYER SPECIFIC RENDERING RENDERS ---
      if (layer.type === "shape") {
        const shLayer = layer as MotionShapeLayer;
        ctx.beginPath();
        
        // Build Shape Path
        const w = 120;
        const h = 120;
        const path = shapeEng.buildShapePath(ctx, shLayer, w, h);

        // Apply fills and shading metrics
        shapeEng.applyFillStyle(ctx, shLayer, { x: -w/2, y: -h/2, w, h });
        ctx.fill(path);

        if (shLayer.strokeWidth > 0) {
          ctx.strokeStyle = shLayer.strokeColor;
          ctx.lineWidth = shLayer.strokeWidth;
          ctx.stroke(path);
        }
      } 
      else if (layer.type === "text") {
        const txLayer = layer as MotionTextLayer;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `${txLayer.fontWeight} ${txLayer.fontSize}px ${txLayer.fontFamily}`;

        // Fill and Stroke Title characters
        ctx.fillStyle = txLayer.fillColor;
        ctx.fillText(txLayer.text, 0, 0);

        if (txLayer.strokeWidth > 0) {
          ctx.strokeStyle = txLayer.strokeColor;
          ctx.lineWidth = txLayer.strokeWidth;
          ctx.strokeText(txLayer.text, 0, 0);
        }
      }

      ctx.restore();
    });

    // --- RENDER DYNAMIC PHYSICS PARTICLES ---
    const particles = particleEng.stepSimulation({
      x: 0,
      y: -180,
      rate: emitterRate,
      type: "circle",
      radius: 40,
      startSize: 6,
      endSize: 1,
      startColor: "#a78bfa",
      endColor: "#3b82f6",
      gravityX: windX,
      gravityY,
      initialVelocityX: 0,
      initialVelocityY: -1,
      velocityVar: 1.5
    }, 220, windX);

    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
      ctx.fillStyle = p.color;
      ctx.fill();
    });

    // Draw Ground boundary bar for particles collision
    ctx.strokeStyle = "rgba(139, 92, 246, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-canvas.width / 2 + 50, 220);
    ctx.lineTo(canvas.width / 2 - 50, 220);
    ctx.stroke();

    // --- RENDER BONE RIGGING SKELETAL SPLAY ---
    const resolvedJoints = riggingEng.resolveForwardKinematics(joints, 0, -40);
    resolvedJoints.forEach(j => {
      ctx.beginPath();
      ctx.arc(j.x, j.y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = "#10b981"; // Emerald joint points
      ctx.fill();

      // Find children lines
      resolvedJoints.filter(c => c.parentId === j.id).forEach(c => {
        ctx.beginPath();
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 3;
        ctx.moveTo(j.x, j.y);
        ctx.lineTo(c.x, c.y);
        ctx.stroke();
      });
    });

    // Restores coordinates matrix
    ctx.restore();
  };

  // Add new Shape layer helper
  const handleAddShape = (type: "rectangle" | "ellipse" | "star") => {
    const newShape: MotionShapeLayer = {
      id: `shape_${Math.random().toString(36).substr(2, 9)}`,
      name: `Custom ${type}`,
      type: "shape",
      shapeType: type,
      blendMode: "normal",
      startTime: 0,
      duration: 10,
      zIndex: layers.length + 1,
      visible: true,
      locked: false,
      roundedCorners: type === "rectangle" ? 12 : 0,
      fillColor: "#EC4899", // bright hot pink
      strokeColor: "#ffffff",
      strokeWidth: 1.5,
      transform: anim.createTransformGroup()
    };
    newShape.transform.positionX.value = (Math.random() - 0.5) * 120;
    newShape.transform.positionY.value = (Math.random() - 0.5) * 100;

    setLayers([...layers, newShape]);
    setSelectedLayerId(newShape.id);
  };

  // Add text layer helper
  const handleAddText = () => {
    const newText: MotionTextLayer = {
      id: `text_${Math.random().toString(36).substr(2, 9)}`,
      name: "Point Text Element",
      type: "text",
      blendMode: "normal",
      startTime: 0,
      duration: 10,
      zIndex: layers.length + 1,
      visible: true,
      locked: false,
      text: "ENTER TITLE HERE",
      fontFamily: "Space Grotesk",
      fontSize: 24,
      fontWeight: "bold",
      tracking: 3,
      leading: 28,
      alignment: "center",
      textboxWidth: 400,
      textboxHeight: 50,
      fillColor: "#10B981",
      strokeColor: "#ffffff",
      strokeWidth: 0,
      kerning: true,
      baselineShift: 0,
      transform: anim.createTransformGroup()
    };
    setLayers([...layers, newText]);
    setSelectedLayerId(newText.id);
  };

  // Apply Neon Lower-Third Template package
  const handleApplyTemplate = (templateId: string) => {
    const t = templates.getTemplate(templateId);
    if (t) {
      const generated = t.generateLayers(800, 480);
      setLayers([...layers, ...generated]);
    }
  };

  // Apply specific keyframe eases
  const applySelectedCurveEase = (type: "linear" | "easeIn" | "easeOut" | "custom") => {
    if (!activeLayer) return;

    // Apply bezier values to the selected layer's keyframes
    const targetProp = activeLayer.transform.positionX;
    targetProp.keyframes.forEach(kf => {
      kf.easing = type;
      if (type === "custom") {
        kf.controlIn = { x: bezierInX / 100, y: bezierInY / 100 };
        kf.controlOut = { x: bezierOutX / 100, y: bezierOutY / 100 };
      }
    });

    setLayers([...layers]);
  };

  // Safe expression evaluator trigger
  const handleApplyExpression = () => {
    if (!activeLayer) return;
    setExpressionError(null);

    // Validate syntax first by trying a dry-run evaluate
    try {
      const dryContext = {
        time: 0,
        frame: 0,
        value: 100,
        index: 1,
        fps: 24,
        layerName: activeLayer.name,
        getPropertyValue: () => 0
      };
      exprEng.evaluateExpression(expressionInput, dryContext);
      
      // Inject expression script directly into the PositionX channel
      activeLayer.transform.positionX.expressions = expressionInput;
      setLayers([...layers]);
    } catch (e: any) {
      setExpressionError(e?.message || "Invalid expression syntax");
    }
  };

  // Triggers bone snapping IK Cyclic Coordinate Descent Solver
  const handleSolveJointSnapping = () => {
    const targetIK = { targetX: ikTarget.x, targetY: ikTarget.y, maxIterations: 12, tolerance: 1.0 };
    const solved = riggingEng.solveCyclicCoordinateDescent(joints, targetIK);
    setJoints(solved);
  };

  // Clears active expressions
  const clearExpression = () => {
    if (activeLayer) {
      activeLayer.transform.positionX.expressions = undefined;
      setLayers([...layers]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black text-gray-200 overflow-hidden font-sans">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-900 bg-gray-950 shrink-0">
        <div className="flex items-center space-x-3">
          <Tv className="w-5 h-5 text-purple-400" />
          <div>
            <h1 className="text-sm font-bold text-gray-100 tracking-tight">AI Cinematic Motion graphics</h1>
            <p className="text-[10px] text-gray-400 font-mono">WORKSPACE CORE v3.5e • SYSTEM COMPACT</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate("workspace")}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            <span>Back to Main Studio</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left sidebar, Center Canvas player, Right property panel */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        
        {/* Left Side: Libraries & Asset Presets */}
        <div className="w-72 border-r border-gray-900 bg-gray-950 flex flex-col shrink-0">
          <div className="flex border-b border-gray-900 text-xs shrink-0 bg-gray-900/50">
            {(["shapes", "text", "templates", "particles", "plugins"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 text-center font-semibold uppercase tracking-wider text-[9px] transition-all cursor-pointer ${
                  activeTab === tab 
                    ? "border-b-2 border-purple-500 text-purple-400 bg-black/40" 
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-left no-scrollbar">
            {activeTab === "shapes" && (
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block">Vector Shape Generator</span>
                <p className="text-[11px] text-gray-400 leading-relaxed">Select a primitive layout node to spawn customizable shape curves into canvas coordinates.</p>
                
                <div className="grid grid-cols-1 gap-2.5">
                  <button
                    onClick={() => handleAddShape("rectangle")}
                    className="flex items-center justify-between p-3 bg-gray-900 hover:bg-gray-850 border border-gray-800 rounded-xl transition cursor-pointer group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Box className="w-4 h-4 text-blue-400 group-hover:scale-110 transition" />
                      <span className="text-xs font-medium">Rounded Rectangle</span>
                    </div>
                    <Plus className="w-3.5 h-3.5 text-gray-500" />
                  </button>

                  <button
                    onClick={() => handleAddShape("ellipse")}
                    className="flex items-center justify-between p-3 bg-gray-900 hover:bg-gray-850 border border-gray-800 rounded-xl transition cursor-pointer group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Activity className="w-4 h-4 text-pink-400 group-hover:scale-110 transition" />
                      <span className="text-xs font-medium">Bezier Ellipse</span>
                    </div>
                    <Plus className="w-3.5 h-3.5 text-gray-500" />
                  </button>

                  <button
                    onClick={() => handleAddShape("star")}
                    className="flex items-center justify-between p-3 bg-gray-900 hover:bg-gray-850 border border-gray-800 rounded-xl transition cursor-pointer group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Sparkles className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition" />
                      <span className="text-xs font-medium">N-Point Star Spines</span>
                    </div>
                    <Plus className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                </div>
              </div>
            )}

            {activeTab === "text" && (
              <div className="space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block">Cinematic Typography</span>
                <p className="text-[11px] text-gray-400 leading-relaxed">Add high-fidelity titles. Fully supports word spacing tracking, kerning offsets, and line-height values.</p>

                <button
                  onClick={handleAddText}
                  className="w-full flex items-center justify-center space-x-2 p-3 bg-purple-600/25 hover:bg-purple-600/35 border border-purple-500/40 rounded-xl transition cursor-pointer"
                >
                  <Type className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold">Inject Text Block</span>
                </button>
              </div>
            )}

            {activeTab === "templates" && (
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block">Broadcast templates</span>
                <p className="text-[11px] text-gray-400 leading-relaxed">Apply precomp presets comprising multiple coordinated asset shapes and motion sequences.</p>

                <div className="space-y-2">
                  {templates.getTemplates().map(tpl => (
                    <button
                      key={tpl.id}
                      onClick={() => handleApplyTemplate(tpl.id)}
                      className="w-full flex p-2.5 bg-gray-900 hover:bg-gray-850 border border-gray-800 rounded-xl text-left items-center space-x-3 transition cursor-pointer"
                    >
                      <img 
                        src={tpl.thumbnail} 
                        alt={tpl.name} 
                        className="w-12 h-12 rounded-lg object-cover border border-gray-700 shrink-0"
                      />
                      <div>
                        <span className="text-xs font-bold text-gray-100 block leading-tight">{tpl.name}</span>
                        <span className="text-[9px] text-purple-400 font-mono mt-0.5 block">{tpl.category.toUpperCase()}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "particles" && (
              <div className="space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block">Procedural Physics Simulation</span>
                <p className="text-[11px] text-gray-400 leading-relaxed">Simulates falling particle elements bouncing elastically off physical ground boundary lines.</p>

                <div className="space-y-3 font-mono text-xs">
                  {/* Gravity */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>GRAVITY Y (m/s²)</span>
                      <span className="text-white">{gravityY}x</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="1.5" 
                      step="0.05"
                      value={gravityY}
                      onChange={(e) => setGravityY(Number(e.target.value))}
                      className="w-full accent-purple-500 h-1 bg-gray-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Wind */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>WIND CONSTANT X</span>
                      <span className="text-white">{windX}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="-0.5" 
                      max="0.5" 
                      step="0.02"
                      value={windX}
                      onChange={(e) => setWindX(Number(e.target.value))}
                      className="w-full accent-purple-500 h-1 bg-gray-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Flow Rate */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>EMITTER RATE</span>
                      <span className="text-white">{emitterRate} parts/frame</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.1" 
                      max="4.0" 
                      step="0.1"
                      value={emitterRate}
                      onChange={(e) => setEmitterRate(Number(e.target.value))}
                      className="w-full accent-purple-500 h-1 bg-gray-800 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "plugins" && (
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block">Motion Developer SDK Plugins</span>
                <p className="text-[11px] text-gray-400 leading-relaxed">Apply customized effects registered via external developer SDK modules.</p>

                <div className="space-y-2">
                  {sdk.getEffects().map(effect => (
                    <button
                      key={effect.id}
                      onClick={() => {
                        if (activeLayer) {
                          // Apply custom plugin trigger
                          effect.applyEffect(activeLayer, currentFrame, { frequency: 6, amount: 45 });
                          setLayers([...layers]);
                        }
                      }}
                      className="w-full p-3 bg-gray-900 border border-gray-800 hover:border-purple-500/40 rounded-xl text-left transition cursor-pointer"
                    >
                      <span className="text-xs font-bold text-gray-200 block">{effect.name}</span>
                      <span className="text-[9px] text-gray-400 mt-1 block leading-normal">{effect.author} • v{effect.version}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Canvas Viewport */}
        <div className="flex-1 bg-gray-900 flex flex-col min-w-0">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-950/70 border-b border-gray-900 shrink-0">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Realtime Composition Viewer</span>
            <div className="flex items-center space-x-2 text-[10px] font-mono text-gray-400">
              <span className="px-2 py-0.5 bg-gray-900 rounded border border-gray-800 text-purple-400">FPS: 24.00</span>
              <span>RENDER: GPU-ACCELERATED</span>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
            <div className="aspect-video w-full max-w-2xl bg-black rounded-2xl overflow-hidden shadow-2xl relative border border-gray-800">
              <canvas
                ref={viewportCanvasRef}
                width={800}
                height={450}
                className="w-full h-full block"
              />
            </div>
          </div>

          {/* Quick playback strip */}
          <div className="bg-gray-950/80 border-t border-gray-900 px-6 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center transition cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
              </button>
              
              <div className="text-xs font-mono">
                <span className="text-gray-100 font-bold">{currentFrame}</span>
                <span className="text-gray-500"> / {maxFrames}f</span>
              </div>
            </div>

            {/* Micro Scrub Timeline bar */}
            <div className="flex-1 mx-6 relative">
              <input 
                type="range" 
                min="0" 
                max={maxFrames} 
                value={currentFrame}
                onChange={(e) => setCurrentFrame(Number(e.target.value))}
                className="w-full h-1 accent-purple-500 bg-gray-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Properties & Parameters controls */}
        <div className="w-80 border-l border-gray-900 bg-gray-950 flex flex-col shrink-0 overflow-y-auto no-scrollbar">
          <div className="p-4 space-y-4 text-left">
            
            {/* Active properties header */}
            <div className="border-b border-gray-900 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block">Inspector Panel</span>
              <h3 className="text-xs font-bold text-gray-100 mt-1">
                {activeLayer ? activeLayer.name : "No Layer Selected"}
              </h3>
            </div>

            {activeLayer && (
              <div className="space-y-4">
                
                {/* Transform properties */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">Spatial Transform</span>
                  
                  {/* Position X */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-gray-400">Position X offset</span>
                      <span className="text-white">{Math.round(activeLayer.transform.positionX.value)}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="-300" 
                      max="300" 
                      value={activeLayer.transform.positionX.value}
                      onChange={(e) => {
                        activeLayer.transform.positionX.value = Number(e.target.value);
                        setLayers([...layers]);
                      }}
                      className="w-full h-1 bg-gray-800 accent-purple-500 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Rotation */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-gray-400">Rotation Z</span>
                      <span className="text-white">{Math.round(activeLayer.transform.rotationZ.value)}°</span>
                    </div>
                    <input 
                      type="range" 
                      min="-180" 
                      max="180" 
                      value={activeLayer.transform.rotationZ.value}
                      onChange={(e) => {
                        activeLayer.transform.rotationZ.value = Number(e.target.value);
                        setLayers([...layers]);
                      }}
                      className="w-full h-1 bg-gray-800 accent-purple-500 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Scale */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-gray-400">Uniform Scale factor</span>
                      <span className="text-white">{activeLayer.transform.scaleX.value.toFixed(2)}x</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.2" 
                      max="2.5" 
                      step="0.05"
                      value={activeLayer.transform.scaleX.value}
                      onChange={(e) => {
                        activeLayer.transform.scaleX.value = Number(e.target.value);
                        activeLayer.transform.scaleY.value = Number(e.target.value);
                        setLayers([...layers]);
                      }}
                      className="w-full h-1 bg-gray-800 accent-purple-500 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                {/* Typography specifics if active is text */}
                {activeLayer.type === "text" && (
                  <div className="space-y-3 bg-gray-900/40 p-3 rounded-xl border border-gray-900">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wide block">Typography attributes</span>
                    
                    {/* Text field */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-gray-400">TEXT VALUE</span>
                      <input 
                        type="text" 
                        value={(activeLayer as MotionTextLayer).text}
                        onChange={(e) => {
                          (activeLayer as MotionTextLayer).text = e.target.value;
                          setLayers([...layers]);
                        }}
                        className="w-full bg-black border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs focus:border-purple-500 outline-none"
                      />
                    </div>

                    {/* Character Tracking */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-gray-400">
                        <span>TRACKING (KERNING)</span>
                        <span>{(activeLayer as MotionTextLayer).tracking}px</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="20" 
                        value={(activeLayer as MotionTextLayer).tracking}
                        onChange={(e) => {
                          (activeLayer as MotionTextLayer).tracking = Number(e.target.value);
                          setLayers([...layers]);
                        }}
                        className="w-full h-1 bg-gray-800 accent-purple-500 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* Expressions console Sandbox block */}
                <div className="space-y-3 bg-gray-900/40 p-3 rounded-xl border border-gray-900">
                  <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-wide block">Expressions Math runtime</span>
                  <p className="text-[10px] text-gray-400 leading-normal">Write standard procedural codes linking properties dynamically. Supports: `wiggle(f, amp)` and trigonometric oscillators.</p>
                  
                  <textarea
                    value={expressionInput}
                    onChange={(e) => setExpressionInput(e.target.value)}
                    className="w-full h-16 bg-black text-gray-300 font-mono text-xs p-2 rounded-lg border border-gray-800 focus:border-purple-500 outline-none resize-none"
                  />

                  {expressionError && (
                    <span className="text-[10px] font-mono text-red-400 block">{expressionError}</span>
                  )}

                  <div className="flex space-x-2">
                    <button
                      onClick={handleApplyExpression}
                      className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition cursor-pointer text-center"
                    >
                      Apply Expression
                    </button>
                    <button
                      onClick={clearExpression}
                      className="px-2 py-1.5 bg-gray-800 hover:bg-gray-750 text-gray-400 text-xs font-bold rounded-lg transition cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* 3D Camera & Shading */}
                <div className="space-y-3 bg-gray-900/40 p-3 rounded-xl border border-gray-900">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wide block">3D Camera & Shading</span>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Orbit Camera rotation</span>
                    <button
                      onClick={() => setOrbitEnabled(!orbitEnabled)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                        orbitEnabled ? "bg-purple-600 text-white" : "bg-gray-850 text-gray-400"
                      }`}
                    >
                      {orbitEnabled ? "ACTIVE" : "OFF"}
                    </button>
                  </div>

                  {/* Camera Shake slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-gray-400">
                      <span>CAMERA SHAKE AMPLITUDE</span>
                      <span>{cameraShake}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="15" 
                      value={cameraShake}
                      onChange={(e) => setCameraShake(Number(e.target.value))}
                      className="w-full h-1 bg-gray-800 accent-purple-500 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                {/* Rigging Inverse Kinematics solver */}
                <div className="space-y-3 bg-gray-900/40 p-3 rounded-xl border border-gray-900">
                  <span className="text-[10px] font-bold text-green-400 uppercase tracking-wide block">Rigging Joint Controller</span>
                  <p className="text-[10px] text-gray-400 leading-normal">Solve joint rotations using CCD (Cyclic Coordinate Descent) solver to snap to targets.</p>

                  <div className="flex space-x-2 text-xs font-mono">
                    <div className="flex-1 space-y-1">
                      <span className="text-[9px] text-gray-500 block">SNAP X: {ikTarget.x}</span>
                      <input 
                        type="range" 
                        min="-100" 
                        max="100" 
                        value={ikTarget.x}
                        onChange={(e) => setIkTarget({ ...ikTarget, x: Number(e.target.value) })}
                        className="w-full h-1 accent-green-400"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <span className="text-[9px] text-gray-500 block">SNAP Y: {ikTarget.y}</span>
                      <input 
                        type="range" 
                        min="-100" 
                        max="100" 
                        value={ikTarget.y}
                        onChange={(e) => setIkTarget({ ...ikTarget, y: Number(e.target.value) })}
                        className="w-full h-1 accent-green-400"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSolveJointSnapping}
                    className="w-full py-1.5 bg-green-700/30 hover:bg-green-700/40 border border-green-500/40 text-green-400 text-xs font-bold rounded-lg transition cursor-pointer"
                  >
                    Solve Joint Snapping
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Panel: Multi-track timeline & Cubic Bezier Graph editor */}
      <div className="h-64 border-t border-gray-900 bg-gray-950 flex flex-col shrink-0 overflow-hidden">
        
        {/* Navigation tabs for Bottom editor */}
        <div className="flex items-center justify-between px-6 py-2 bg-gray-900/50 border-b border-gray-900 shrink-0">
          <div className="flex space-x-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            <span className="text-purple-400 border-b-2 border-purple-500 pb-1 flex items-center space-x-1">
              <Key className="w-3.5 h-3.5" />
              <span>Multi-track Layer lanes</span>
            </span>
          </div>

          <span className="text-[9px] font-mono text-gray-500 uppercase">Cubic Spline Easing Graph Panel</span>
        </div>

        {/* Bottom Workspace Split: Left Layer tracks, Right Spline graph editor */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          
          {/* Timeline tracks list */}
          <div className="w-1/2 border-r border-gray-900 flex flex-col min-h-0 bg-black/30 overflow-y-auto no-scrollbar">
            <div className="p-4 space-y-2">
              {layers.map(layer => {
                const isSelected = layer.id === selectedLayerId;
                return (
                  <div
                    key={layer.id}
                    onClick={() => setSelectedLayerId(layer.id)}
                    className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition ${
                      isSelected 
                        ? "bg-purple-900/10 border-purple-500/50 text-white" 
                        : "bg-gray-900/50 border-gray-800 text-gray-400 hover:border-gray-700"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      {layer.type === "text" ? <Type className="w-4 h-4 text-purple-400" /> : <Box className="w-4 h-4 text-blue-400" />}
                      <span className="text-xs font-bold">{layer.name}</span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs">
                      <span className="font-mono text-[10px] text-gray-500">Z: {layer.zIndex}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setLayers(layers.filter(l => l.id !== layer.id));
                        }}
                        className="text-gray-500 hover:text-red-400 transition"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cubic Bezier spline editor panel */}
          <div className="w-1/2 p-4 flex flex-col justify-between overflow-hidden bg-black/10">
            <div className="flex-1 relative flex items-center justify-center p-4 border border-gray-900 rounded-xl bg-gray-950/40 overflow-hidden max-h-36">
              
              <svg className="w-full h-full max-h-28 text-gray-700" viewBox="0 0 200 100">
                {/* Horizontal reference lines */}
                <line x1="10" y1="90" x2="190" y2="90" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                <line x1="10" y1="10" x2="190" y2="10" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />

                {/* Main Curve path */}
                <path 
                  d={`M 10 90 C ${bezierInX} ${100 - bezierInY}, ${bezierOutX} ${100 - bezierOutY}, 190 10`} 
                  fill="none" 
                  stroke="#8B5CF6" 
                  strokeWidth="2.5"
                />

                {/* Handle lines */}
                <line x1="10" y1="90" x2={bezierInX} y2={100 - bezierInY} stroke="#ff007f" strokeWidth="1" strokeDasharray="2,2" />
                <line x1="190" y1="10" x2={bezierOutX} y2={100 - bezierOutY} stroke="#3b82f6" strokeWidth="1" strokeDasharray="2,2" />

                {/* Handle anchors */}
                <circle cx="10" cy="90" r="4.5" fill="#a78bfa" />
                <circle cx={bezierInX} cy={100 - bezierInY} r="5.5" fill="#ff007f" />
                <circle cx={bezierOutX} cy={100 - bezierOutY} r="5.5" fill="#3b82f6" />
                <circle cx="190" cy="10" r="4.5" fill="#3b82f6" />
              </svg>
            </div>

            {/* Bezier preset selection buttons */}
            <div className="flex items-center justify-between text-xs font-mono shrink-0 pt-2.5">
              <div className="flex space-x-1.5">
                <button
                  onClick={() => { setBezierInX(25); setBezierInY(0); setBezierOutX(25); setBezierOutY(100); applySelectedCurveEase("easeIn"); }}
                  className="px-2 py-1 bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-300 text-[10px] rounded cursor-pointer"
                >
                  Ease In
                </button>
                <button
                  onClick={() => { setBezierInX(0); setBezierInY(0); setBezierOutX(75); setBezierOutY(100); applySelectedCurveEase("easeOut"); }}
                  className="px-2 py-1 bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-300 text-[10px] rounded cursor-pointer"
                >
                  Ease Out
                </button>
                <button
                  onClick={() => { setBezierInX(42); setBezierInY(0); setBezierOutX(58); setBezierOutY(100); applySelectedCurveEase("custom"); }}
                  className="px-2 py-1 bg-gray-900 border border-gray-800 hover:border-gray-700 text-purple-400 text-[10px] rounded cursor-pointer"
                >
                  Smooth Ease
                </button>
              </div>

              <div className="flex space-x-3 text-gray-500 text-[10px]">
                <span>In: ({Math.round(bezierInX)}, {Math.round(bezierInY)})</span>
                <span>Out: ({Math.round(bezierOutX)}, {Math.round(bezierOutY)})</span>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
