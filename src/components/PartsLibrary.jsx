// 模块一:零件库 —— 常见规格积木,HTML5 拖拽到拼装台
import React, { useState } from 'react';
import { BLOCK_CATALOG, COLOR_CATALOG } from '../engine/constants.js';

const grouped = BLOCK_CATALOG.reduce((acc, t) => {
  (acc[t.category] ??= []).push(t);
  return acc;
}, {});

export default function PartsLibrary({ onPick }) {
  const [colorId, setColorId] = useState('red');
  const [transparent, setTransparent] = useState(false);

  const visibleColors = COLOR_CATALOG.filter((c) =>
    transparent ? c.transparent : !c.transparent
  );
  const activeColor = COLOR_CATALOG.find((c) => c.id === colorId) ?? visibleColors[0];

  return (
    <section className="panel">
      <h2>零件库</h2>

      <div className="color-row">
        <label className="switch-label">
          <input
            type="checkbox"
            checked={transparent}
            onChange={(e) => {
              setTransparent(e.target.checked);
              setColorId(e.target.checked ? 't-blue' : 'red');
            }}
          />
          透明积木
        </label>
      </div>
      <div className="color-swatches">
        {visibleColors.map((c) => (
          <button
            key={c.id}
            className={`swatch ${activeColor.id === c.id ? 'active' : ''}`}
            style={{
              background: `#${c.color.toString(16).padStart(6, '0')}`,
              opacity: c.transparent ? 0.65 : 1,
            }}
            title={c.label}
            onClick={() => setColorId(c.id)}
          />
        ))}
      </div>

      {Object.entries(grouped).map(([category, types]) => (
        <div key={category} className="part-group">
          <h3>{category}</h3>
          <div className="part-grid">
            {types.map((t) => (
              <button
                key={t.id}
                className="part-card"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(
                    'application/x-block',
                    JSON.stringify({ typeId: t.id, colorId: activeColor.id })
                  );
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                onClick={() => onPick?.(t.id, activeColor.id)}
                title={`拖入拼装台,或点击添加到台面中心`}
              >
                <span className="part-dims">
                  {t.w}×{t.d}
                </span>
                <span className="part-label">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="hint">拖拽零件到拼装台自动吸附;点击零件则放到台面中心。</p>
    </section>
  );
}
