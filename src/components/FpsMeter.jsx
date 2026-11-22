import React, { useEffect, useRef, useState } from 'react';

// 轻量 FPS 指示,验证 120+ 积木场景下的渲染流畅度
export default function FpsMeter() {
  const [fps, setFps] = useState(0);
  const frames = useRef(0);
  const last = useRef(performance.now());

  useEffect(() => {
    let raf;
    const loop = (t) => {
      frames.current++;
      if (t - last.current >= 1000) {
        setFps(Math.round((frames.current * 1000) / (t - last.current)));
        frames.current = 0;
        last.current = t;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <span className={`fps ${fps >= 50 ? 'good' : fps >= 30 ? 'mid' : 'bad'}`}>
      {fps} FPS
    </span>
  );
}
