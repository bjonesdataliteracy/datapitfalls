'use client';

import { useEffect, useRef } from 'react';

/** The hero's line-art backdrop: flowing concentric arcs, as in the Data Literacy Lab. */
export function HeroLines() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    function draw() {
      if (!canvas || !ctx) return;
      const r = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, r.width, r.height);
      const cx = r.width * 0.98;
      const cy = r.height * 0.55;
      for (let i = 0; i < 46; i++) {
        const rad = 60 + i * 9;
        const wob = 0.14 + i * 0.004;
        ctx.beginPath();
        for (let a = Math.PI * 0.55; a <= Math.PI * 1.55; a += 0.02) {
          const rr = rad * (1 + wob * Math.sin(a * 3 + i * 0.35));
          const x = cx + rr * Math.cos(a);
          const y = cy + rr * Math.sin(a) * 1.15;
          if (a === Math.PI * 0.55) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        const major = i % 5 === 0;
        ctx.strokeStyle = `rgba(105,223,250,${major ? 0.3 : 0.14})`;
        ctx.lineWidth = major ? 1.2 : 0.8;
        ctx.stroke();
      }
      if (r.width < 700) {
        // On narrow screens the art sits behind the text, so dim it and skip the marker.
        ctx.fillStyle = 'rgba(19,48,77,.55)';
        ctx.fillRect(0, 0, r.width, r.height);
        return;
      }
      ctx.beginPath();
      ctx.arc(cx - 150, cy - 20, 11, 0, Math.PI * 2);
      ctx.fillStyle = '#0d2238';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#69dffa';
      ctx.stroke();
    }

    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, []);

  return <canvas ref={ref} className="hero-lines" aria-hidden="true" />;
}
