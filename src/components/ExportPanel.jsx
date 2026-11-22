// 模块四:方案导出/导入 —— 序列化位置、朝向与咬合关系
import React, { useRef } from 'react';
import { serializePlan, deserializePlan, downloadJSON } from '../engine/serialization.js';

export default function ExportPanel({ getBlocks, onImport, planName, setPlanName }) {
  const fileRef = useRef(null);

  const handleExport = () => {
    const blocks = getBlocks();
    if (blocks.length === 0) {
      alert('拼装台为空,没有可导出的积木。');
      return;
    }
    const plan = serializePlan(blocks, { name: planName });
    const safe = planName.replace(/[\\/:*?"<>|]/g, '_') || 'block-plan';
    downloadJSON(plan, `${safe}.json`);
  };

  const handleImportFile = async (file) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const { blocks, meta, stats } = deserializePlan(data);
      onImport(blocks, meta, stats);
    } catch (err) {
      alert(`导入失败: ${err.message}`);
    }
  };

  return (
    <section className="panel">
      <h2>方案导出</h2>
      <div className="control">
        <label>方案名称</label>
        <input
          className="text-input"
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          placeholder="我的拼装方案"
        />
      </div>

      <div className="button-column">
        <button className="btn btn-primary" onClick={handleExport}>
          导出方案 JSON
        </button>
        <button className="btn" onClick={() => fileRef.current?.click()}>
          导入方案文件
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImportFile(f);
            e.target.value = '';
          }}
        />
      </div>

      <p className="hint">
        导出内容包含每块积木的类型、颜色、网格位置、90° 朝向,以及预计算的咬合面/凸点与冲突关系,可直接分享给他人导入查看。
      </p>
    </section>
  );
}
