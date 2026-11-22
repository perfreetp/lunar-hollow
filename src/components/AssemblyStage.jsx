// 模块二:拼装台 —— three.js 画布,旋转/缩放视角、拖入落点
import React, { useEffect, useRef } from 'react';
import { SceneManager } from '../three/SceneManager.js';
import { createBlock } from '../engine/constants.js';

export default function AssemblyStage({
  sceneRef,
  snapThreshold,
  onStats,
  onSelect,
  registerDrop,
}) {
  const containerRef = useRef(null);
  const managerRef = useRef(null);

  useEffect(() => {
    const manager = new SceneManager(containerRef.current, {
      onStats,
      onSelect,
    });
    managerRef.current = manager;
    sceneRef.current = manager;
    // 调试与端到端测试入口
    window.__scene = manager;

    // 零件库 HTML5 拖拽落点:预览吸附位置 -> 创建积木
    registerDrop((typeId, colorId, clientX, clientY) => {
      const preview = manager.previewLibraryDrop(typeId, colorId, clientX, clientY);
      if (!preview) return;
      const p = preview.block;
      const block = createBlock(p.typeId, p.colorId, p.x, p.y, p.z, p.rot);
      manager.addBlock(block);
    });

    return () => {
      manager.dispose();
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    managerRef.current?.setSnapThreshold(snapThreshold);
  }, [snapThreshold]);

  return (
    <div
      className="stage"
      ref={containerRef}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('application/x-block')) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
        }
      }}
      onDrop={(e) => {
        const raw = e.dataTransfer.getData('application/x-block');
        if (!raw) return;
        e.preventDefault();
        const { typeId, colorId } = JSON.parse(raw);
        registerDrop.current?.(typeId, colorId, e.clientX, e.clientY);
      }}
    />
  );
}
