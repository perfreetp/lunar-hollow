import { useEffect, useRef, useState } from 'react';
import { DrumScene } from './three/DrumScene';
import { useApp } from './store';
import { useSimulation } from './useSimulation';
import { FRAME_TIMES, VIEW_DURATION } from './sim/model';
import { TopBar } from './components/TopBar';
import { LowerDeck } from './components/LowerDeck';
import { ReadoutRail } from './components/ReadoutRail';
import { HintLayer, Hemisphere } from './components/HintLayer';

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<DrumScene | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  useSimulation();

  const sim = useApp((s) => s.sim);
  const config = useApp((s) => s.config);
  const strikes = useApp((s) => s.strikes);
  const selectedStrikeId = useApp((s) => s.selectedStrikeId);
  const exaggeration = useApp((s) => s.exaggeration);
  const colorMode = useApp((s) => s.colorMode);
  const showWireframe = useApp((s) => s.showWireframe);
  const solo = useApp((s) => s.solo);
  const tab = useApp((s) => s.tab);
  const simStatus = useApp((s) => s.simStatus);

  // ---- create the scene once ----------------------------------------
  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new DrumScene(mountRef.current, {
      onPick: (hit) => {
        const st = useApp.getState();
        st.addStrike(hit.rho, hit.theta);
      },
      onHover: () => {},
    });
    sceneRef.current = scene;
    setSceneReady(true);
    const onKey = (e: KeyboardEvent) => {
      const st = useApp.getState();
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        st.togglePlay();
      } else if (e.key === 'ArrowLeft') {
        st.seek(Math.max(0, st.playhead - 0.03));
      } else if (e.key === 'ArrowRight') {
        st.seek(st.playhead + 0.03);
      } else if (e.key === 'r' || e.key === 'R') {
        st.restart();
      } else if (e.key === 'Escape') {
        st.selectStrike(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      scene.dispose();
      sceneRef.current = null;
      setSceneReady(false);
    };
  }, []);

  // ---- push data into the scene ------------------------------------
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !sim) return;
    scene.setHead(sim.basePositions, sim.config);
    scene.setHeadMaterial(sim.config);
    scene.setFrames(
      sim.disp,
      sim.frameCount,
      sim.glow,
      sim.maxGlow,
      sim.strikeIds.map((id, i) => ({
        id,
        disp: sim.perStrikeDisp[i],
        glow: sim.perStrikeGlow[i],
      })),
    );
    // start playback from the top whenever a fresh field arrives
    useApp.getState().seek(0);
  }, [sim]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.setExaggeration(exaggeration);
  }, [exaggeration]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.setColorMode(colorMode);
  }, [colorMode]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.setWireVisible(showWireframe);
  }, [showWireframe]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.setSolo(solo, selectedStrikeId ?? strikes[strikes.length - 1]?.id ?? null);
  }, [solo, selectedStrikeId, strikes]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.setStrikes(strikes.map((s) => ({
      id: s.id,
      rho: s.rho,
      theta: s.theta,
      color: s.color,
      selected: s.id === selectedStrikeId,
      strength: s.strength,
      hardness: s.hardness,
    })));
  }, [strikes, selectedStrikeId]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.setHeadMaterial(config);
  }, [config.materialId, config.finishId]);

  // ---- playback loop -------------------------------------------------
  const playhead = useApp((s) => s.playhead);

  useEffect(() => {
    if (!sceneReady) return;
    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.12, (now - last) / 1000);
      last = now;
      const st = useApp.getState();
      const scene = sceneRef.current;
      if (!scene) return;
      let t = st.playhead;
      if (st.playing) {
        t += dt * st.speed;
        if (t >= VIEW_DURATION) {
          if (st.loop) t = 0;
          else {
            t = VIEW_DURATION;
            useApp.getState().pause();
          }
        }
        useApp.setState({ playhead: t });
      }
      scene.applyFrame(frameForTime(t, st.sim?.frameCount ?? FRAME_TIMES.length), t);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [sceneReady]);

  // ---- keep the scene's frame in sync when the user scrubs -------------
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !sim) return;
    scene.applyFrame(frameForTime(playhead, sim.frameCount), playhead);
  }, [playhead, sim]);

  const showHint = strikes.length === 0;
  const busy = simStatus === 'computing';

  return (
    <div className="app">
      <div className="viewport" ref={mountRef}>
        <div className="viewport-glow" aria-hidden />
        <div className="viewport-vignette" aria-hidden />
        <TopBar />
        {sceneReady && <ReadoutRail />}
        <HintLayer visible={showHint} />
        <div className={`compute-flag ${busy ? 'is-on' : ''}`} aria-live="polite">
          <span className="compute-dot" />
          <span>{busy ? '正在重算形变帧…' : '形变场就绪'}</span>
        </div>
      </div>
      <div className={`lower-shell ${tab === 'io' ? 'is-io' : ''}`}>
        <LowerDeck onPickFromMap={(rho, theta) => useApp.getState().addStrike(rho, theta)} />
      </div>
      <Hemisphere />
    </div>
  );
}

export function frameForTime(t: number, frameCount: number): number {
  const n = Math.max(1, frameCount);
  if (t <= FRAME_TIMES[0]) return 0;
  if (t >= FRAME_TIMES[n - 1]) return n - 1;
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (FRAME_TIMES[mid] <= t) lo = mid;
    else hi = mid;
  }
  const span = FRAME_TIMES[hi] - FRAME_TIMES[lo] || 1;
  const frac = (t - FRAME_TIMES[lo]) / span;
  return lo + frac;
}
