import React, { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
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

      // Distribute nodes across the ENTIRE page (organic live web)
      const count = Math.min(Math.floor((width * height) / 22000), 55);

      for (let i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.35, // subtle breathing drift
          vy: (Math.random() - 0.5) * 0.35,
          baseRadius: Math.random() * 1.5 + 1.2,
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }

      // Build web connections based on proximity
      const maxDist = Math.min(width, height) * 0.22;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.hypot(dx, dy);

          if (dist < maxDist && dist > 35) {
            connections.push({ a: i, b: j });
          }
        }
      }

      // Ensure every node is connected to at least one neighbor
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

      // Create smooth, non-glaring electrons traveling the whole web
      const electronCount = Math.min(connections.length, 45);
      const colors = ['#38bdf8', '#00d4ff', '#60a5fa', '#00e5ff'];

      for (let i = 0; i < electronCount; i++) {
        electrons.push({
          connIndex: Math.floor(Math.random() * connections.length),
          forward: Math.random() > 0.5,
          progress: Math.random(),
          speed: Math.random() * 0.005 + 0.0025, // smooth, gentle cruise
          size: Math.random() * 1.2 + 1.4,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    initNetwork();

    let frame = 0;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // 1. Update node positions with gentle floating drift across the page
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;

        // Bounce gently inside viewport bounds
        if (n.x < 10) { n.x = 10; n.vx *= -1; }
        if (n.x > width - 10) { n.x = width - 10; n.vx *= -1; }
        if (n.y < 10) { n.y = 10; n.vy *= -1; }
        if (n.y > height - 10) { n.y = height - 10; n.vy *= -1; }
      }

      // 2. Draw web lines (subtle & elegant across the entire screen)
      const maxDist = Math.min(width, height) * 0.22;
      ctx.lineWidth = 0.8;

      for (let k = 0; k < connections.length; k++) {
        const { a, b } = connections[k];
        const n1 = nodes[a];
        const n2 = nodes[b];
        const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y);

        if (dist > maxDist) continue;

        // Distance alpha
        const distFactor = 1 - dist / maxDist;

        // On the left side (under text), keep line opacity very soft (0.05 - 0.1)
        // On the right side, keep it slightly more visible (0.1 - 0.2)
        const midX = (n1.x + n2.x) / 2;
        const xFactor = midX < width * 0.5 ? 0.09 : 0.18;
        const lineAlpha = distFactor * xFactor;

        ctx.strokeStyle = `rgba(56, 189, 248, ${Math.max(0.02, lineAlpha)})`;
        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.stroke();
      }

      // 3. Draw soft, muted nodes (not overly bright/shining)
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const pulse = Math.sin(frame * 0.02 + n.pulsePhase);
        const nodeAlpha = (n.x < width * 0.5 ? 0.2 : 0.4) + pulse * 0.1;

        // Gentle soft core (no blinding glare)
        ctx.fillStyle = `rgba(56, 189, 248, ${Math.max(0.1, nodeAlpha)})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.baseRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Draw moving electrons cruising along web connections
      for (let i = 0; i < electrons.length; i++) {
        const el = electrons[i];
        if (el.connIndex >= connections.length) continue;

        const { a, b } = connections[el.connIndex];
        const startNode = el.forward ? nodes[a] : nodes[b];
        const targetNode = el.forward ? nodes[b] : nodes[a];

        if (!startNode || !targetNode) continue;

        el.progress += el.speed;

        // When electron reaches node, smoothly pick an adjacent connected line
        if (el.progress >= 1.0) {
          el.progress = 0;
          const currentIdx = el.forward ? b : a;

          // Find connections that share currentIdx
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
            // Reverse direction along same line
            el.forward = !el.forward;
          }
        }

        // Current position
        const curX = startNode.x + (targetNode.x - startNode.x) * el.progress;
        const curY = startNode.y + (targetNode.y - startNode.y) * el.progress;

        // Direction vector for soft trailing comet tail
        const dx = targetNode.x - startNode.x;
        const dy = targetNode.y - startNode.y;
        const dist = Math.hypot(dx, dy);

        // Soft, non-glaring luminance: left side is softer, right side is balanced
        const baseAlpha = curX < width * 0.5 ? 0.45 : 0.75;

        if (dist > 0) {
          const ux = dx / dist;
          const uy = dy / dist;
          const tailSteps = 8;

          for (let t = 1; t <= tailSteps; t++) {
            const trailDist = t * 2.2;
            const trailAlpha = (1 - t / tailSteps) * (baseAlpha * 0.4);
            const tx = curX - ux * trailDist;
            const ty = curY - uy * trailDist;

            ctx.fillStyle = `rgba(0, 212, 255, ${trailAlpha})`;
            ctx.beginPath();
            ctx.arc(tx, ty, el.size * (1 - (t / tailSteps) * 0.5), 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Electron glowing head (gentle soft radial glow, no harsh blinding flash)
        const glowGrad = ctx.createRadialGradient(curX, curY, 0, curX, curY, el.size * 3);
        glowGrad.addColorStop(0, `rgba(56, 189, 248, ${baseAlpha})`);
        glowGrad.addColorStop(0.5, `rgba(0, 180, 255, ${baseAlpha * 0.35})`);
        glowGrad.addColorStop(1, 'rgba(0, 102, 255, 0)');

        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(curX, curY, el.size * 3, 0, Math.PI * 2);
        ctx.fill();

        // Soft center core
        ctx.fillStyle = `rgba(224, 242, 254, ${baseAlpha})`;
        ctx.beginPath();
        ctx.arc(curX, curY, el.size * 0.75, 0, Math.PI * 2);
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
      style={{ opacity: 0.9 }}
    />
  );
}
