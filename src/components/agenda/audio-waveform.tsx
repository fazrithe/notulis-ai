"use client";

import * as React from "react";

/** Visualizer waveform sederhana berbasis Web Audio AnalyserNode + canvas. */
export function AudioWaveform({ analyser, active }: { analyser: AnalyserNode | null; active: boolean }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const frameRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    const bufferLength = analyser?.frequencyBinCount ?? 64;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
      if (!ctx || !canvas) return;
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const barCount = 40;
      const gap = 3 * dpr;
      const barWidth = width / barCount - gap;

      if (analyser && active) {
        analyser.getByteFrequencyData(dataArray);
      }

      for (let i = 0; i < barCount; i++) {
        let value = 0.08;
        if (analyser && active) {
          const idx = Math.floor((i / barCount) * bufferLength);
          value = Math.max(0.08, dataArray[idx] / 255);
        } else {
          value = 0.08 + Math.sin(Date.now() / 400 + i) * 0.02;
        }
        const barHeight = value * height;
        const x = i * (barWidth + gap);
        const y = (height - barHeight) / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, "oklch(0.55 0.22 292)");
        gradient.addColorStop(1, "oklch(0.72 0.13 210)");
        ctx.fillStyle = active ? gradient : "rgba(148,148,158,0.35)";

        const radius = Math.min(barWidth / 2, 4 * dpr);
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, radius);
        ctx.fill();
      }

      frameRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      window.removeEventListener("resize", resize);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [analyser, active]);

  return <canvas ref={canvasRef} className="h-16 w-full" />;
}
