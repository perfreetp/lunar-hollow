// 模块三:咬合检测 —— 吸附阈值、最低咬合面设定、实时统计与告警列表
import React from 'react';

export default function DetectionPanel({
  snapThreshold,
  setSnapThreshold,
  minBiteFaces,
  setMinBiteFaces,
  stats,
  weakList,
  selected,
}) {
  const conflict = stats.conflictBlocks > 0;
  return (
    <section className="panel">
      <h2>咬合检测</h2>

      <div className="control">
        <label>
          吸附阈值: <b>{snapThreshold.toFixed(2)}</b> 凸点
        </label>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          value={snapThreshold}
          onChange={(e) => setSnapThreshold(Number(e.target.value))}
        />
        <p className="hint">拖拽位置距最近凸点小于该值时自动吸附。</p>
      </div>

      <div className="control">
        <label>
          最低咬合面: <b>{minBiteFaces}</b>
        </label>
        <input
          type="range"
          min="0"
          max="4"
          step="1"
          value={minBiteFaces}
          onChange={(e) => setMinBiteFaces(Number(e.target.value))}
        />
        <p className="hint">单块积木咬合面数低于此值将以橙色轮廓提示。</p>
      </div>

      <div className={`stat-grid ${conflict ? 'has-conflict' : ''}`}>
        <div className="stat">
          <span className="stat-num">{stats.total}</span>
          <span className="stat-label">积木总数</span>
        </div>
        <div className={`stat ${conflict ? 'stat-danger' : ''}`}>
          <span className="stat-num">{stats.conflictBlocks}</span>
          <span className="stat-label">冲突块数</span>
        </div>
        <div className={`stat ${stats.unsupported > 0 ? 'stat-warn' : ''}`}>
          <span className="stat-num">{stats.unsupported}</span>
          <span className="stat-label">悬空块数</span>
        </div>
        <div className="stat">
          <span className="stat-num">{stats.totalBiteStuds}</span>
          <span className="stat-label">咬合凸点</span>
        </div>
      </div>

      {conflict && (
        <div className="alert alert-danger">
          检测到 {stats.conflictBlocks} 块积木发生实体干涉,冲突凸点已用红色圆盘与红色轮廓标出。
        </div>
      )}
      {stats.unsupported > 0 && (
        <div className="alert alert-warn">
          {stats.unsupported} 块积木下方缺少支撑(悬空)。
        </div>
      )}

      <h3>咬合不足提示 ({weakList.length})</h3>
      <div className="weak-list">
        {weakList.length === 0 && <p className="hint">所有积木均满足咬合面要求。</p>}
        {weakList.map((item) => (
          <div key={item.id} className="weak-item">
            <span
              className="dot"
              style={{
                background: `#${item.color.toString(16).padStart(6, '0')}`,
              }}
            />
            <span>{item.label}</span>
            <span className="weak-meta">
              {item.biteFaces} 面 / {item.biteStuds} 凸点
            </span>
          </div>
        ))}
      </div>

      {selected && (
        <div className="selected-info">
          <h3>当前选中</h3>
          <p>
            {selected.typeId} · 位置({selected.x}, {selected.y}, {selected.z}) · 朝向{' '}
            {selected.rot * 90}°
          </p>
          <p className="hint">按 R 键可将选中积木旋转 90°。</p>
        </div>
      )}
    </section>
  );
}
