import React, { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  originX: number;
  originY: number;
  phaseX: number;
  phaseY: number;
  speedX: number;
  speedY: number;
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
  isFast: boolean;
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

    // Mouse tracking for subtle interactive life
    const mouse = { x: -1000, y: -1000, radius: 180 };
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    let nodes: Node[] = [];
    let connections: Connection[] = [];
    let electrons: Electron[] = [];

    const initNetwork = () => {
      nodes = [];
      connections = [];
      electrons = [];

      // Generate constellation nodes on the right 55% of screen (over the blue tech wallpaper)
      const count = Math.min(Math.floor((width * height) / 28000), 30);
      const minX = width * 0.48;
      const maxX = width * 0.96;
      const minY = height * 0.08;
      const maxY = height * 0.92;

      for (let i = 0; i < count; i++) {
        const ox = minX + Math.random() * (maxX - minX);
        const oy = minY + Math.random() * (maxY - minY);
        nodes.push({
          x: ox,
          y: oy,
          originX: ox,
          originY: oy,
          phaseX: Math.random() * Math.PI * 2,
          phaseY: Math.random() * Math.PI * 2,
          speedX: Math.random() * 0.008 + 0.004,
          speedY: Math.random() * 0.008 + 0.004,
          baseRadius: Math.random() * 2 + 1.2,
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }

      // Proximity connections
      const maxDist = Math.min(width, height) * 0.28;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
          if (d < maxDist && d > 40) {
            connections.push({ a: i, b: j });
          }
        }
      }

      // Connect isolated nodes
      for (let i = 0; i < nodes.length; i++) {
        const has = connections.some(c => c.a === i || c.b === i);
        if (!has && nodes.length > 1) {
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
          connections.push({ a: i, b: closestIdx });
        }
      }

      // Create lively electrons with dual speed profiles
      const electronCount = Math.min(connections.length, 32);
      for (let i = 0; i < electronCount; i++) {
        const isFast = Math.random() < 0.25; // 25% are fast data pulses
        electrons.push({
          connIndex: Math.floor(Math.random() * connections.length),
          forward: Math.random() > 0.5,
          progress: Math.random(),
          speed: isFast ? (Math.random() * 0.008 + 0.005) : (Math.random() * 0.0025 + 0.0012),
          size: isFast ? 2.4 : (Math.random() * 1.4 + 1.2),
          isFast,
          color: isFast ? '#00f0ff' : '#38bdf8',
        });
      }
    };

    initNetwork();

    let frame = 0;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // 1. Organic gentle node breathing (floating sine wave drift + mouse interaction)
      const maxDist = Math.min(width, height) * 0.28;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        // Organic floating motion around origin
        n.x = n.originX + Math.sin(frame * n.speedX + n.phaseX) * 12;
        n.y = n.originY + Math.cos(frame * n.speedY + n.phaseY) * 10;

        // Subtle interactive mouse reaction
        const mdx = mouse.x - n.x;
        const mdy = mouse.y - n.y;
        const mdist = Math.hypot(mdx, mdy);
        if (mdist < mouse.radius && mdist > 0) {
          const pull = (1 - mdist / mouse.radius) * 8;
          n.x += (mdx / mdist) * pull;
          n.y += (mdy / mdist) * pull;
        }
      }

      // 2. Render connecting cyber lines
      ctx.lineWidth = 0.8;
      for (let k = 0; k < connections.length; k++) {
        const { a, b } = connections[k];
        const n1 = nodes[a];
        const n2 = nodes[b];
        const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y);
        if (dist > maxDist) continue;

        const lineAlpha = (1 - dist / maxDist) * 0.16;
        ctx.strokeStyle = `rgba(0, 212, 255, ${Math.max(0.02, lineAlpha)})`;
        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.stroke();
      }

      // 3. Render constellation nodes with gentle breathing halo
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const pulse = Math.sin(frame * 0.025 + n.pulsePhase);
        const nodeAlpha = 0.35 + pulse * 0.15;

        // Soft outer glow halo
        ctx.fillStyle = `rgba(0, 212, 255, ${Math.max(0.1, nodeAlpha * 0.4)})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.baseRadius * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Node core
        ctx.fillStyle = `rgba(56, 189, 248, ${nodeAlpha})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.baseRadius, 0, Math.PI * 2);
        ctx.fill();

        // Periodic expanding signal ring on key hub nodes
        if (i % 5 === 0) {
          const ringProgress = ((frame * 0.3 + i * 25) % 60);
          const ringRadius = ringProgress * 0.8;
          const ringAlpha = Math.max(0, (1 - ringProgress / 60) * 0.18);

          ctx.strokeStyle = `rgba(0, 240, 255, ${ringAlpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(n.x, n.y, ringRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // 4. Render active electrons cruising along the lines
      for (let i = 0; i < electrons.length; i++) {
        const el = electrons[i];
        if (el.connIndex >= connections.length) continue;

        const { a, b } = connections[el.connIndex];
        const startNode = el.forward ? nodes[a] : nodes[b];
        const targetNode = el.forward ? nodes[b] : nodes[a];

        if (!startNode || !targetNode) continue;

        el.progress += el.speed;

        // Path completion: pick next connection smoothly
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

        const curX = startNode.x + (targetNode.x - startNode.x) * el.progress;
        const curY = startNode.y + (targetNode.y - startNode.y) * el.progress;

        const dx = targetNode.x - startNode.x;
        const dy = targetNode.y - startNode.y;
        const dist = Math.hypot(dx, dy);

        // Fading comet trail
        if (dist > 0) {
          const ux = dx / dist;
          const uy = dy / dist;
          const tailSteps = el.isFast ? 10 : 6;

          for (let t = 1; t <= tailSteps; t++) {
            const trailDist = t * (el.isFast ? 3.0 : 2.2);
            const trailAlpha = (1 - t / tailSteps) * (el.isFast ? 0.35 : 0.22);
            const tx = curX - ux * trailDist;
            const ty = curY - uy * trailDist;

            ctx.fillStyle = `rgba(0, 212, 255, ${trailAlpha})`;
            ctx.beginPath();
            ctx.arc(tx, ty, el.size * (1 - (t / tailSteps) * 0.5), 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Glowing electron head
        const glowRadius = el.size * (el.isFast ? 3.5 : 2.6);
        const glowGrad = ctx.createRadialGradient(curX, curY, 0, curX, curY, glowRadius);
        glowGrad.addColorStop(0, el.color);
        glowGrad.addColorStop(0.5, 'rgba(0, 180, 255, 0.25)');
        glowGrad.addColorStop(1, 'rgba(0, 102, 255, 0)');

        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(curX, curY, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Luminous core
        ctx.fillStyle = el.isFast ? '#ffffff' : 'rgba(224, 242, 254, 0.85)';
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
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1] w-full h-full"
      style={{ opacity: 0.85 }}
    />
  );
}
