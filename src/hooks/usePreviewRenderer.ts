import { useCallback, useEffect, useRef, useState } from "react";
import { LivePreviewMixer } from "../../core/engine/rendering";
import { Timeline } from "../../core/state/timeline";

export function usePreviewRenderer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timelineRef = useRef<Timeline | null>(null);
  const currentTimeRef = useRef<number>(0);
  const animationFrame = useRef<number | null>(null);
  const mixerRef = useRef<LivePreviewMixer | null>(null);
  const [isReady, setIsReady] = useState(false);

  const initCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    canvasRef.current = canvas;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      mixerRef.current = new LivePreviewMixer();
      setIsReady(true);
    }
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const width = Math.max(1, canvas.clientWidth * window.devicePixelRatio);
    const height = Math.max(1, canvas.clientHeight * window.devicePixelRatio);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  }, []);

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const timeline = timelineRef.current;
    const currentTime = currentTimeRef.current;
    if (!canvas || !timeline || !mixerRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    resizeCanvas();
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    ctx.fillStyle = "#07131d";
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    for (let x = 0; x < canvas.clientWidth; x += 70) {
      ctx.fillRect(x, canvas.clientHeight * 0.15, 2, canvas.clientHeight * 0.7);
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "600 14px Inter, system-ui";
    ctx.fillText(`Frame: ${Math.round(currentTime * 24)}`, 24, 34);
    ctx.fillText(`Tracks: ${timeline.tracks.length}`, 24, 56);
    ctx.fillText(`Cursor: ${currentTime.toFixed(2)}s`, 24, 78);

    const activeClips = mixerRef.current.getActiveClips(timeline, currentTime);
    activeClips.forEach((clip, idx) => {
      const x = 40 + (idx * 120) % (canvas.clientWidth - 200);
      const y = 120 + Math.sin(currentTime + idx) * 14;
      ctx.fillStyle = "rgba(94, 67, 255, 0.28)";
      ctx.fillRect(x, y, 140, 26);
      ctx.fillStyle = "#fff";
      ctx.fillText(clip.id, x + 12, y + 18);
    });
  }, [resizeCanvas]);

  const setRenderContext = useCallback((timeline: Timeline, currentTime: number) => {
    timelineRef.current = timeline;
    currentTimeRef.current = currentTime;
  }, []);

  const startLoop = useCallback(() => {
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }
    const loop = () => {
      renderFrame();
      animationFrame.current = requestAnimationFrame(loop);
    };
    animationFrame.current = requestAnimationFrame(loop);
  }, [renderFrame]);

  const stopLoop = useCallback(() => {
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }
  }, []);

  useEffect(() => {
    window.addEventListener("resize", resizeCanvas);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      stopLoop();
    };
  }, [resizeCanvas, stopLoop]);

  return {
    canvasRef,
    initCanvas,
    setRenderContext,
    startLoop,
    stopLoop,
    isReady,
    renderFrame
  };
}
