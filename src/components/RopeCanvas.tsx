import { useEffect, useRef } from 'react';
import { RopewayScene } from '../three/RopewayScene';

export function RopeCanvas() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const scene = new RopewayScene(ref.current);
    return () => scene.dispose();
  }, []);

  return <div ref={ref} className="canvas-wrap" />;
}
