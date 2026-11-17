import React, { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  baseRadius: number;
  pulsePhase: number;
}

interface Connection {
  a: number;
  b: number;
}

interface Electron {
  connIndex: number;
  forward: boolean;
  progress: number;
  speed: number;
  size: number;
  color: string;
}

export default function ElectronNetwork() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initNetwork();
    };

    window.addEventListener('resize', handleResize);

    let nodes: Node[] = [];
    let connections: Connection[] = [];
    let electrons: Electron[] = [];

    const initNetwork = () => {
      nodes = [];
      connections = [];
      electrons = [];

      // Only generate nodes on the RIGHT side (where the blue tech network wallpaper lives)
      // Leaving the left side completely calm & dark for effortless reading
      const count = Math.min(Math.floor((width * height) / 36000), 24);
      const minX = width * 0.52;
      const maxX = width * 0.96;
      const minY = height * 0.10;
      const maxY = height * 0.90;

      for (let i = 0; i < count; i++) {
        nodes.push({
          x: minX + Math.random() * (maxX - minX),
          y: minY + Math.random() * (maxY - minY),
          baseRadius: Math.random() * 1.5 + 1.0,
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }

      // Build connections between nearby nodes
      const maxDist = Math.min(width, height) * 0.28;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
          if (d < maxDist && d > 40) {
            connections.push({ a: i, b: j });
          }
        }
      }

      // Connect any isolated nodes
      for (let i = 0; i < nodes.length; i++) {
        const has = connections.some(c => c.a === i || c.b === i);
        if (!has && nodes.length > 1) {
          let nearestDist = Infinity;
          let nearestIdx = (i + 1) % nodes.length;
          for (let j = 0; j < nodes.length; j++) {
            if (i === j) continue;
            const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
            if (d < nearestDist) {
              nearestDist = d;
              nearestIdx = j;
            }
          }
          connections.push({ a: i, b: nearestIdx });
        }
      }

      // Active electrons with slow, graceful, ambient speeds (no fast eye-straining motion)
      const electronCount = Math.min(connections.length, 20);
      const colors = ['#00d4ff', '#38bdf8', '#60a5fa'];

      for (let i = 0; i < electronCount; i++) {
        electrons.push({
          connIndex: Math.floor(Math.random() * connections.length),
          forward: Math.random() > 0.5,
          progress: Math.random(),
          // Slow, peaceful background drift (3x slower than before)
          speed: Math.random() * 0.0016 + 0.0008,
          size: Math.random() * 1.2 + 1.2,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    initNetwork();

    let frame = 0;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      const maxDist = Math.min(width, height) * 0.28;

      // 1. Subtle, delicate connecting lines (ambient background layer)
      ctx.lineWidth = 0.75;
      for (let k = 0; k < connections.length; k++) {
        const { a, b } = connections[k];
        const n1 = nodes[a];
        const n2 = nodes[b];
        const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y);
        if (dist > maxDist) continue;

        const lineAlpha = (1 - dist / maxDist) * 0.12;
        ctx.strokeStyle = `rgba(0, 212, 255, ${Math.max(0.02, lineAlpha)})`;
        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.stroke();
      }

      // 2. Soft, calm nodes (deep in the background)
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const pulse = Math.sin(frame * 0.015 + n.pulsePhase);
        const nodeAlpha = 0.25 + pulse * 0.10;

        ctx.fillStyle = `rgba(56, 189, 248, ${nodeAlpha})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.baseRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Smooth, slow-gliding electrons with gentle soft trails
      for (let i = 0; i < electrons.length; i++) {
        const el = electrons[i];
        if (el.connIndex >= connections.length) continue;

        const { a, b } = connections[el.connIndex];
        const startNode = el.forward ? nodes[a] : nodes[b];
        const targetNode = el.forward ? nodes[b] : nodes[a];

        if (!startNode || !targetNode) continue;

        el.progress += el.speed;

        // When electron reaches target node, smoothly pick next path
        if (el.progress >= 1.0) {
          el.progress = 0;
          const currentIdx = el.forward ? b : a;

          const nextConns: { connIdx: number; forward: boolean }[] = [];
          for (let c = 0; c < connections.length; c++) {
            if (c === el.connIndex) continue;
            if (connections[c].a === currentIdx) {
              nextConns.push({ connIdx: c, forward: true });
            } else if (connections[c].b === currentIdx) {
              nextConns.push({ connIdx: c, forward: false });
            }
          }

          if (nextConns.length > 0) {
            const next = nextConns[Math.floor(Math.random() * nextConns.length)];
            el.connIndex = next.connIdx;
            el.forward = next.forward;
          } else {
            el.forward = !el.forward;
          }
        }

        // Current coordinates
        const curX = startNode.x + (targetNode.x - startNode.x) * el.progress;
        const curY = startNode.y + (targetNode.y - startNode.y) * el.progress;

        const dx = targetNode.x - startNode.x;
        const dy = targetNode.y - startNode.y;
        const dist = Math.hypot(dx, dy);

        // Soft, elegant tail (no harsh glare, perfectly subtle)
        if (dist > 0) {
          const ux = dx / dist;
          const uy = dy / dist;
          const tailSteps = 6;

          for (let t = 1; t <= tailSteps; t++) {
            const trailDist = t * 2.4;
            const trailAlpha = (1 - t / tailSteps) * 0.18;
            const tx = curX - ux * trailDist;
            const ty = curY - uy * trailDist;

            ctx.fillStyle = `rgba(0, 212, 255, ${trailAlpha})`;
            ctx.beginPath();
            ctx.arc(tx, ty, el.size * (1 - (t / tailSteps) * 0.5), 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Soft ambient electron glow (deep background feel)
        const glowGrad = ctx.createRadialGradient(curX, curY, 0, curX, curY, el.size * 2.5);
        glowGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
        glowGrad.addColorStop(0.6, 'rgba(0, 180, 255, 0.15)');
        glowGrad.addColorStop(1, 'rgba(0, 102, 255, 0)');

        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(curX, curY, el.size * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Soft center point
        ctx.fillStyle = 'rgba(224, 242, 254, 0.65)';
        ctx.beginPath();
        ctx.arc(curX, curY, el.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1] w-full h-full"
      style={{ opacity: 0.7 }}
    />
  );
}
