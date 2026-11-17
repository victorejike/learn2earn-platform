import React, { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  radius: number;
  pulsePhase: number;
}

interface Electron {
  startNodeIndex: number;
  targetNodeIndex: number;
  progress: number;
  speed: number;
  size: number;
  color: string;
  tailLength: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  decay: number;
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
      buildNetwork();
    };

    window.addEventListener('resize', handleResize);

    // Network nodes matching the right-hand constellation in the background image
    let nodes: Node[] = [];
    let connections: [number, number][] = [];
    let electrons: Electron[] = [];
    let sparks: Spark[] = [];

    const buildNetwork = () => {
      nodes = [];
      connections = [];
      electrons = [];

      // Generate nodes primarily on the right 60% of the viewport (matching the tech wallpaper constellation)
      const nodeCount = Math.min(Math.floor((width * height) / 28000), 32);
      const minX = width * 0.45;
      const maxX = width * 0.96;
      const minY = height * 0.08;
      const maxY = height * 0.92;

      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          x: minX + Math.random() * (maxX - minX),
          y: minY + Math.random() * (maxY - minY),
          radius: Math.random() * 2 + 1.5,
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }

      // Connect nodes that are within range
      const maxDist = Math.min(width, height) * 0.28;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist && dist > 40) {
            connections.push([i, j]);
          }
        }
      }

      // If a node has no connection, connect to closest node
      for (let i = 0; i < nodes.length; i++) {
        const hasConn = connections.some(([a, b]) => a === i || b === i);
        if (!hasConn && nodes.length > 1) {
          let closestDist = Infinity;
          let closestIdx = (i + 1) % nodes.length;
          for (let j = 0; j < nodes.length; j++) {
            if (i === j) continue;
            const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
            if (d < closestDist) {
              closestDist = d;
              closestIdx = j;
            }
          }
          connections.push([i, closestIdx]);
        }
      }

      // Create active electrons traveling along the connections
      const electronCount = Math.min(connections.length, 36);
      const electronColors = ['#00f0ff', '#38bdf8', '#60a5fa', '#ffffff', '#00d4ff'];

      for (let i = 0; i < electronCount; i++) {
        const conn = connections[i % connections.length];
        const forward = Math.random() > 0.5;
        electrons.push({
          startNodeIndex: forward ? conn[0] : conn[1],
          targetNodeIndex: forward ? conn[1] : conn[0],
          progress: Math.random(),
          speed: (Math.random() * 0.007 + 0.003),
          size: Math.random() * 1.8 + 1.8,
          color: electronColors[Math.floor(Math.random() * electronColors.length)],
          tailLength: Math.floor(Math.random() * 12 + 10),
        });
      }
    };

    buildNetwork();

    let frame = 0;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // 1. Draw subtle glowing connection lines between nodes
      ctx.lineWidth = 0.75;
      for (let k = 0; k < connections.length; k++) {
        const [a, b] = connections[k];
        const n1 = nodes[a];
        const n2 = nodes[b];
        const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y);
        const maxDist = Math.min(width, height) * 0.28;
        const lineAlpha = (1 - dist / maxDist) * 0.18;

        ctx.strokeStyle = `rgba(0, 212, 255, ${Math.max(0.04, lineAlpha)})`;
        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.stroke();
      }

      // 2. Draw subtle pulsing node halos
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const pulse = Math.sin(frame * 0.03 + n.pulsePhase);
        const alpha = 0.25 + pulse * 0.15;
        const r = n.radius + Math.max(0, pulse * 1.5);

        // Core dot
        ctx.fillStyle = `rgba(56, 189, 248, ${alpha + 0.3})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Expanding faint radar ripple on some hubs
        if (i % 4 === 0) {
          const rippleR = ((frame * 0.4 + i * 20) % 50);
          const rippleAlpha = Math.max(0, (1 - rippleR / 50) * 0.2);
          ctx.strokeStyle = `rgba(0, 240, 255, ${rippleAlpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(n.x, n.y, rippleR, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // 3. Draw active electrons moving along network lines
      for (let i = 0; i < electrons.length; i++) {
        const el = electrons[i];
        const nStart = nodes[el.startNodeIndex];
        const nTarget = nodes[el.targetNodeIndex];

        if (!nStart || !nTarget) continue;

        el.progress += el.speed;

        // When electron reaches target node, choose a new connected path
        if (el.progress >= 1.0) {
          el.progress = 0;
          el.startNodeIndex = el.targetNodeIndex;

          // Find adjacent nodes
          const nextTargets: number[] = [];
          for (const [a, b] of connections) {
            if (a === el.startNodeIndex && b !== el.targetNodeIndex) nextTargets.push(b);
            if (b === el.startNodeIndex && a !== el.targetNodeIndex) nextTargets.push(a);
          }

          if (nextTargets.length > 0) {
            el.targetNodeIndex = nextTargets[Math.floor(Math.random() * nextTargets.length)];
          } else {
            // Swap direction if dead end
            const temp = el.startNodeIndex;
            el.startNodeIndex = el.targetNodeIndex;
            el.targetNodeIndex = temp;
          }

          // Emit a small spark on node arrival
          if (Math.random() > 0.4) {
            for (let s = 0; s < 3; s++) {
              const angle = Math.random() * Math.PI * 2;
              const spd = Math.random() * 1.5 + 0.5;
              sparks.push({
                x: nTarget.x,
                y: nTarget.y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                alpha: 0.9,
                decay: Math.random() * 0.04 + 0.03,
                size: Math.random() * 1.5 + 1,
                color: el.color,
              });
            }
          }
        }

        // Current position of electron
        const curX = nStart.x + (nTarget.x - nStart.x) * el.progress;
        const curY = nStart.y + (nTarget.y - nStart.y) * el.progress;

        // Draw electron tail (fading trail behind it)
        const dx = (nTarget.x - nStart.x);
        const dy = (nTarget.y - nStart.y);
        const totalDist = Math.hypot(dx, dy);

        if (totalDist > 0) {
          const ux = dx / totalDist;
          const uy = dy / totalDist;

          for (let t = 1; t <= el.tailLength; t++) {
            const tailDist = t * 1.8;
            const tailAlpha = (1 - t / el.tailLength) * 0.45;
            const tx = curX - ux * tailDist;
            const ty = curY - uy * tailDist;

            ctx.fillStyle = `rgba(0, 212, 255, ${tailAlpha})`;
            ctx.beginPath();
            ctx.arc(tx, ty, el.size * (1 - (t / el.tailLength) * 0.6), 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Draw glowing electron head
        // Outer glow
        const glowGrad = ctx.createRadialGradient(curX, curY, 0, curX, curY, el.size * 3.5);
        glowGrad.addColorStop(0, el.color);
        glowGrad.addColorStop(0.3, 'rgba(0, 212, 255, 0.6)');
        glowGrad.addColorStop(1, 'rgba(0, 102, 255, 0)');

        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(curX, curY, el.size * 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Bright electric core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(curX, curY, el.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Update and render active sparks
      for (let s = sparks.length - 1; s >= 0; s--) {
        const spark = sparks[s];
        spark.x += spark.vx;
        spark.y += spark.vy;
        spark.alpha -= spark.decay;

        if (spark.alpha <= 0) {
          sparks.splice(s, 1);
          continue;
        }

        ctx.fillStyle = `rgba(0, 240, 255, ${spark.alpha})`;
        ctx.beginPath();
        ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
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
      style={{ opacity: 0.95 }}
    />
  );
}
