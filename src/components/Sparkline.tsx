import React, { useRef, useEffect } from 'react';

interface SparklineProps {
  values: number[];
  height?: number;
  className?: string;
  isDark?: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({
  values,
  height = 44,
  className = '',
  isDark = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || values.length < 2) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.parentElement?.clientWidth || 200;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min === 0 ? 1 : max - min;
    const pad = 3;

    const isUp = values[values.length - 1] >= values[0];
    const strokeColor = isUp
      ? isDark ? '#3ECF7F' : '#0F8A4A'
      : isDark ? '#FF6B62' : '#C8322B';

    ctx.beginPath();
    let lastX = pad;
    let lastY = height - pad;

    for (let i = 0; i < values.length; i++) {
      const x = (i / (values.length - 1)) * (width - pad * 2) + pad;
      const y = height - ((values[i] - min) / span) * (height - pad * 2) - pad;
      lastX = x;
      lastY = y;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    const fillPath = new Path2D();
    fillPath.moveTo(pad, values[0] ? height - ((values[0] - min) / span) * (height - pad * 2) - pad : height - pad);
    for (let i = 1; i < values.length; i++) {
      const x = (i / (values.length - 1)) * (width - pad * 2) + pad;
      const y = height - ((values[i] - min) / span) * (height - pad * 2) - pad;
      fillPath.lineTo(x, y);
    }
    fillPath.lineTo(lastX, height);
    fillPath.lineTo(pad, height);
    fillPath.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, isUp ? 'rgba(62, 207, 127, 0.22)' : 'rgba(255, 107, 98, 0.22)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fill(fillPath);

    ctx.lineWidth = 2;
    ctx.strokeStyle = strokeColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
    ctx.fillStyle = strokeColor;
    ctx.fill();
  }, [values, height, isDark]);

  if (values.length < 2) {
    return <div style={{ height }} className={`w-full ${className}`} />;
  }

  return <canvas ref={canvasRef} className={`w-full ${className}`} />;
};
