import React, { useCallback, useEffect, useRef, useState } from 'react';
import PartsLibrary from './components/PartsLibrary.jsx';
import AssemblyStage from './components/AssemblyStage.jsx';
import DetectionPanel from './components/DetectionPanel.jsx';
import ExportPanel from './components/ExportPanel.jsx';
import FpsMeter from './components/FpsMeter.jsx';
import {
  createBlock,
  getBlockType,
  getColor,
  BLOCK_CATALOG,
  COLOR_CATALOG,
  BASE_PLATE_SIZE,
} from './engine/constants.js';

const EMPTY_STATS = {
  total: 0,
  conflictBlocks: 0,
  unsupported: 0,
  weakBlocks: 0,
  totalBiteStuds: 0,
};

export default function App() {
  const sceneRef = useRef(null);
  const dropRef = useRef(null);
  const [snapThreshold, setSnapThreshold] = useState(0.5);
  const [minBiteFaces, setMinBiteFaces] = useState(1);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [selected, setSelected] = useState(null);
  const [weakList, setWeakList] = useState([]);
  const [planName, setPlanName] = useState('我的拼装方案');
  const minBiteRef = useRef(minBiteFaces);
  minBiteRef.current = minBiteFaces;

  // 统计回调:同步咬合不足列表与橙色告警轮廓
  const handleStats = useCallback((s) => {
    setStats(s);
    const manager = sceneRef.current;
    if (!manager?.analysis) return;
    const weak = [];
    const warnIds = [];
    for (const [id, r] of manager.analysis) {
      const block = manager.blockMeshes.get(id)?.block;
      if (!block) continue;
      if (r.biteFaces < minBiteRef.current) {
        warnIds.push(id);
        weak.push({
          id,
          label: getBlockType(block.typeId).label,
          color: getColor(block.colorId).color,
          biteFaces: r.biteFaces,
          biteStuds: r.biteStuds,
        });
      }
    }
    manager.setWarnIds(warnIds);
    setWeakList(weak);
  }, []);

  useEffect(() => {
    sceneRef.current?.setMinBiteFaces(minBiteFaces);
  }, [minBiteFaces]);

  // R 键旋转选中积木
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'r' || e.key === 'R') {
        sceneRef.current?.rotateSelected();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const m = sceneRef.current;
        if (m?.selectedId) {
          m.removeBlock(m.selectedId);
          setSelected(null);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // 点击零件卡:放到台面中心附近的空位
  const handlePick = (typeId, colorId) => {
    const manager = sceneRef.current;
    if (!manager) return;
    const el = manager.renderer.domElement;
    const rect = el.getBoundingClientRect();
    dropRef.current?.(typeId, colorId, rect.left + rect.width / 2, rect.top + rect.height / 2);
  };

  // 压力测试:一次铺 140 块(含透明件与叠层),验证 120 块以上的拖拽流畅度
  const handleStressTest = () => {
    const manager = sceneRef.current;
    if (!manager) return;
    const blocks = [];
    const colors = COLOR_CATALOG.map((c) => c.id);
    const target = 132;
    let n = 0;
    // 紧凑铺设 2x2 板:步长 2 恰好不重叠,台面每行 16 块,9 行即满足目标
    outer: for (let gy = 0; gy <= BASE_PLATE_SIZE - 2; gy += 2) {
      for (let gx = 0; gx <= BASE_PLATE_SIZE - 2; gx += 2) {
        if (n >= target) break outer;
        blocks.push(createBlock('plate-2x2', colors[n % colors.length], gx, gy, 0, 0));
        n++;
      }
    }
    // 叠一层砖,产生凸点咬合关系
    for (let i = 0; i < 8; i++) {
      blocks.push(
        createBlock('brick-2x2', colors[(i + 2) % colors.length], 2 + i * 3, 2, 1, 0)
      );
    }
    // 故意制造一处实体干涉,便于观察红色高亮
    blocks.push(createBlock('brick-2x4', 'red', 2, 2, 1, 0));
    manager.loadBlocks(blocks);
  };

  const handleImport = (blocks) => {
    sceneRef.current?.loadBlocks(blocks);
    setSelected(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>积木拼装咬合预览工具</h1>
        <div className="header-actions">
          <FpsMeter />
          <button className="btn" onClick={() => sceneRef.current?.resetView()}>
            重置视角
          </button>
          <button className="btn" onClick={handleStressTest}>
            压力测试(140 块)
          </button>
          <button
            className="btn btn-danger"
            onClick={() => {
              sceneRef.current?.clearBlocks();
              setSelected(null);
            }}
          >
            清空拼装台
          </button>
        </div>
      </header>

      <div className="layout">
        <PartsLibrary onPick={handlePick} />

        <main className="stage-wrap">
          <AssemblyStage
            sceneRef={sceneRef}
            snapThreshold={snapThreshold}
            onStats={handleStats}
            onSelect={setSelected}
            registerDrop={(fn) => {
              dropRef.current = fn;
            }}
          />
          <div className="stage-hint">
            左键拖拽积木 · 空白处左键旋转视角 · 滚轮缩放 · R 旋转选中 · Delete 删除
          </div>
        </main>

        <aside className="side">
          <DetectionPanel
            snapThreshold={snapThreshold}
            setSnapThreshold={setSnapThreshold}
            minBiteFaces={minBiteFaces}
            setMinBiteFaces={setMinBiteFaces}
            stats={stats}
            weakList={weakList}
            selected={selected}
          />
          <ExportPanel
            getBlocks={() => sceneRef.current?.getBlocks() ?? []}
            onImport={handleImport}
            planName={planName}
            setPlanName={setPlanName}
          />
        </aside>
      </div>
    </div>
  );
}
