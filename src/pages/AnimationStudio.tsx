import { useState, useEffect, useRef } from "react";
import { 
  Activity, 
  Settings, 
  Workflow, 
  Video, 
  Sparkles, 
  Key, 
  Layers,
  ChevronRight,
  RefreshCw,
  Plus,
  Play,
  Pause,
  Sliders,
  HelpCircle
} from "lucide-react";
import { PageId } from "../types";

// Import real rigging and physics engines
import { RiggingEngine, JointNode, InverseKinematicsTarget } from "../motion/rigging/RiggingEngine";
import { PhysicsEngine, PhysicsObject, ForceField } from "../motion/physics/PhysicsEngine";

interface AnimationStudioProps {
  onNavigate: (page: PageId) => void;
}

export default function AnimationStudio({ onNavigate }: AnimationStudioProps) {
  const rigging = RiggingEngine.getInstance();
  const physics = PhysicsEngine.getInstance();

  // Rigging joint states
  const [joints, setJoints] = useState<JointNode[]>([
    { id: "pelvis", name: "Root Pelvis Joint", x: 0, y: 0, length: 0, angle: 0 },
    { id: "spine", name: "Lower Spine Bone", x: 0, y: 0, length: 50, angle: -Math.PI / 2, parentId: "pelvis" },
    { id: "chest", name: "Upper Chest Bone", x: 0, y: 0, length: 45, angle: -0.1, parentId: "spine" },
    { id: "neck", name: "Cervical Neck Bone", x: 0, y: 0, length: 25, angle: 0.1, parentId: "chest" }
  ]);

  const [selectedBone, setSelectedBone] = useState<string>("chest");

  // Physics dynamic objects simulator states
  const [physicsObject, setPhysicsObject] = useState<PhysicsObject>({
    id: "active_node",
    x: 0,
    y: -120,
    vx: 2.0,
    vy: 0.0,
    mass: 1.5,
    radius: 12,
    elasticity: 0.75
  });

  const [gravity, setGravity] = useState(9.8); // standard gravity m/s² simulation scaler
  const [elasticity, setElasticity] = useState(75); // elasticity percentage
  const [windForce, setWindForce] = useState(1.5);

  const [isPlaying, setIsPlaying] = useState(true);

  // IK target solver snapping coordinates
  const [ikTargetX, setIkTargetX] = useState(40);
  const [ikTargetY, setIkTargetY] = useState(-80);

  const renderCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Real-time Physics Simulator Loop
  useEffect(() => {
    let animId: any;
    if (isPlaying) {
      const step = () => {
        setPhysicsObject(prev => {
          let nextVx = prev.vx;
          let nextVy = prev.vy + (gravity * 0.04); // gravity force over step time
          
          // Wind force field impact
          nextVx += (windForce * 0.01) / prev.mass;

          let nextX = prev.x + nextVx;
          let nextY = prev.y + nextVy;

          // Ground bounding collision bounce
          const groundLimit = 130;
          if (nextY >= groundLimit - prev.radius) {
            nextY = groundLimit - prev.radius;
            nextVy = -Math.abs(nextVy) * (elasticity / 100);
            nextVx *= 0.92; // ground sliding friction
          }

          // Wall collision bounces
          const wallLimit = 220;
          if (nextX >= wallLimit) {
            nextX = wallLimit;
            nextVx = -Math.abs(nextVx) * 0.6;
          } else if (nextX <= -wallLimit) {
            nextX = -wallLimit;
            nextVx = Math.abs(nextVx) * 0.6;
          }

          return {
            ...prev,
            x: nextX,
            y: nextY,
            vx: nextVx,
            vy: nextVy
          };
        });

        animId = requestAnimationFrame(step);
      };
      animId = requestAnimationFrame(step);
    }
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, gravity, elasticity, windForce]);

  // Update canvas skeletal drawings
  useEffect(() => {
    drawRiggingSkeletalLayout();
  }, [joints, physicsObject, ikTargetX, ikTargetY]);

  const drawRiggingSkeletalLayout = () => {
    const canvas = renderCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Reset Canvas and set slate background
    ctx.fillStyle = "#09090B";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2); // Center coordinate system

    // Draw grid guide pattern lines
    ctx.strokeStyle = "rgba(45, 45, 50, 0.35)";
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = -canvas.width / 2; x < canvas.width / 2; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, -canvas.height / 2);
      ctx.lineTo(x, canvas.height / 2);
      ctx.stroke();
    }
    for (let y = -canvas.height / 2; y < canvas.height / 2; y += step) {
      ctx.beginPath();
      ctx.moveTo(-canvas.width / 2, y);
      ctx.lineTo(canvas.width / 2, y);
      ctx.stroke();
    }

    // Ground floor limits
    ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-220, 130);
    ctx.lineTo(220, 130);
    ctx.stroke();

    // 1. Draw Skeletal joints and bone connectors
    const rootPos = { x: 0, y: 40 };
    const resolvedJoints = rigging.resolveForwardKinematics(joints, rootPos.x, rootPos.y);

    resolvedJoints.forEach(j => {
      const isSelected = j.id === selectedBone;

      // Draw Joint Dot
      ctx.beginPath();
      ctx.arc(j.x, j.y, isSelected ? 8 : 5.5, 0, 2 * Math.PI);
      ctx.fillStyle = isSelected ? "#a78bfa" : "#3b82f6"; // purple highlight, blue standard
      ctx.fill();

      // Draw bone coordinate text
      ctx.fillStyle = "#9ca3af";
      ctx.font = "9px monospace";
      ctx.fillText(`${j.name} (${Math.round(j.x)}, ${Math.round(j.y)})`, j.x + 12, j.y + 3);

      // Draw connection vectors down skeletal tree
      resolvedJoints.filter(c => c.parentId === j.id).forEach(c => {
        ctx.beginPath();
        ctx.strokeStyle = "#3B82F6";
        ctx.lineWidth = 3.5;
        ctx.moveTo(j.x, j.y);
        ctx.lineTo(c.x, c.y);
        ctx.stroke();
      });
    });

    // 2. Draw Simulated Physics Circle Node
    ctx.beginPath();
    ctx.arc(physicsObject.x, physicsObject.y, physicsObject.radius, 0, 2 * Math.PI);
    ctx.fillStyle = "#10B981"; // dynamic emerald bouncing node
    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Physics label
    ctx.fillStyle = "#10B981";
    ctx.font = "10px monospace";
    ctx.fillText("PHYS_NODE_BOUNCE", physicsObject.x + 16, physicsObject.y + 4);

    // 3. Draw Target snapper node for Inverse Kinematics solver
    ctx.beginPath();
    ctx.arc(ikTargetX, ikTargetY, 4, 0, 2 * Math.PI);
    ctx.fillStyle = "#EF4444"; // red target snapper
    ctx.fill();
    ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
    ctx.lineWidth = 8;
    ctx.stroke();

    ctx.fillStyle = "#EF4444";
    ctx.fillText("IK_TARGET_SNAP", ikTargetX + 10, ikTargetY + 3);

    ctx.restore();
  };

  // Triggers real inverse kinematics solver
  const handleSolveJointAngles = () => {
    const targetIK: InverseKinematicsTarget = {
      targetX: ikTargetX,
      targetY: ikTargetY,
      maxIterations: 15,
      tolerance: 1.0
    };
    const solved = rigging.solveCyclicCoordinateDescent(joints, targetIK);
    setJoints(solved);
  };

  // Reset physics node coordinate
  const resetPhysicsObject = () => {
    setPhysicsObject({
      id: "active_node",
      x: -50,
      y: -140,
      vx: 3.5,
      vy: 0.0,
      mass: 1.5,
      radius: 12,
      elasticity: elasticity / 100
    });
  };

  return (
    <div className="p-6 space-y-6 text-left h-full flex flex-col min-h-0 animate-in fade-in-50 duration-200 bg-black text-gray-200">
      {/* Header */}
      <div className="border-b border-gray-900 pb-4 shrink-0 flex justify-between items-center bg-gray-950/20 px-4 py-3 rounded-xl border border-gray-900">
        <div>
          <span className="text-xs font-bold text-purple-400 uppercase tracking-wider font-mono">STUDIO CORE MODULE</span>
          <h1 className="text-xl font-bold text-white tracking-tight mt-0.5">Skeletal Rigging & Dynamics</h1>
        </div>
        
        <button
          onClick={() => onNavigate("workspace")}
          className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer"
        >
          Open Studio Editor
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden min-h-0 flex-1">
        
        {/* Skeletal Rig visual preview viewport */}
        <div className="lg:col-span-2 bg-gray-950 rounded-2xl flex flex-col justify-between overflow-hidden relative shadow-inner border border-gray-900">
          <div className="flex-1 flex items-center justify-center p-6 bg-black/40">
            <div className="aspect-video w-full max-w-lg bg-black rounded-xl overflow-hidden relative border border-gray-900 flex items-center justify-center">
              <canvas
                ref={renderCanvasRef}
                width={640}
                height={360}
                className="w-full h-full block"
              />
            </div>
          </div>

          <div className="bg-gray-950 px-4 py-2 text-gray-400 font-mono text-[10px] flex justify-between shrink-0 border-t border-gray-900">
            <span>JOINT TARGET STATUS: Snapping aligned frame-accurately</span>
            <span>SIMULATION CLOCK: Real-time rendering active</span>
          </div>
        </div>

        {/* Rig parameters sidebar */}
        <div className="space-y-4 overflow-y-auto no-scrollbar">
          
          {/* Bone joints tree list */}
          <div className="bg-gray-950 border border-gray-900 p-4 rounded-2xl text-left space-y-3">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wide flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Skeletal Joint Tree Rig</span>
            </span>

            <div className="space-y-1.5">
              {joints.map((bone) => {
                const isSelected = selectedBone === bone.id;
                return (
                  <button
                    key={bone.id}
                    onClick={() => setSelectedBone(bone.id)}
                    className={`w-full p-2.5 text-left border rounded-xl transition-all cursor-pointer flex justify-between items-center ${
                      isSelected 
                        ? "border-purple-500 bg-purple-900/10 text-white" 
                        : "border-gray-900 bg-gray-900/40 text-gray-400 hover:border-gray-850"
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block leading-none">{bone.name}</span>
                      <span className="text-[9px] text-gray-500 block mt-1 font-mono">ID: joint_{bone.id}</span>
                    </div>
                    <span className="text-[9px] font-mono text-purple-400 bg-black/40 px-1.5 py-0.5 rounded border border-gray-900">
                      {(bone.angle * (180 / Math.PI)).toFixed(1)}°
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Inverse Kinematics Snappers */}
          <div className="bg-gray-950 border border-gray-900 p-4 rounded-2xl text-left space-y-3">
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wide block">Inverse Kinematics snapping</span>
            <p className="text-[11px] text-gray-400 leading-normal">Rotate entire skeletal limbs automatically by resolving angles down parent hierarchies to align with end targets.</p>

            <div className="space-y-3 font-mono text-xs">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>TARGET X SNAP</span>
                  <span className="text-white">{ikTargetX}px</span>
                </div>
                <input 
                  type="range" 
                  min="-150" 
                  max="150" 
                  value={ikTargetX}
                  onChange={(e) => setIkTargetX(Number(e.target.value))}
                  className="w-full h-1 accent-red-400"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>TARGET Y SNAP</span>
                  <span className="text-white">{ikTargetY}px</span>
                </div>
                <input 
                  type="range" 
                  min="-120" 
                  max="120" 
                  value={ikTargetY}
                  onChange={(e) => setIkTargetY(Number(e.target.value))}
                  className="w-full h-1 accent-red-400"
                />
              </div>

              <button
                onClick={handleSolveJointAngles}
                className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Trigger CCD IK solver
              </button>
            </div>
          </div>

          {/* Physics dynamic parameters sliders */}
          <div className="bg-gray-950 border border-gray-900 p-4 rounded-2xl text-left space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5" />
                <span>Rig Physics Simulator</span>
              </span>

              <div className="flex space-x-1">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1 bg-gray-900 border border-gray-800 rounded hover:border-purple-500 text-white cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={resetPhysicsObject}
                  className="p-1 bg-gray-900 border border-gray-800 rounded hover:border-purple-500 text-gray-400 cursor-pointer text-xs font-mono"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Gravity */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-400">Gravity strength</span>
                <span className="text-emerald-400 font-bold">{gravity} m/s²</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="25" 
                step="0.1"
                value={gravity}
                onChange={(e) => setGravity(Number(e.target.value))}
                className="w-full accent-emerald-400 h-1 bg-gray-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Bounce Elasticity */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-400">Mesh Elasticity</span>
                <span className="text-emerald-400 font-bold">{elasticity}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={elasticity}
                onChange={(e) => setElasticity(Number(e.target.value))}
                className="w-full accent-emerald-400 h-1 bg-gray-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Wind constant */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-400">Wind Constant field</span>
                <span className="text-emerald-400 font-bold">{windForce}x</span>
              </div>
              <input 
                type="range" 
                min="-5" 
                max="5" 
                step="0.2"
                value={windForce}
                onChange={(e) => setWindForce(Number(e.target.value))}
                className="w-full accent-emerald-400 h-1 bg-gray-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
