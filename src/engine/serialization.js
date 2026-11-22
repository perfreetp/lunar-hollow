// 方案序列化 / 反序列化:位置、朝向、颜色与咬合关系
import { BLOCK_CATALOG, COLOR_CATALOG, createBlock, resetIdCounter } from './constants.js';
import { analyzeAll } from './collision.js';

const SCHEMA_VERSION = 1;

export function serializePlan(blocks, meta = {}) {
  const { results } = analyzeAll(blocks);
  const relations = [];
  for (const b of blocks) {
    const r = results.get(b.id);
    if (!r) continue;
    relations.push({
      blockId: b.id,
      biteFaces: r.biteFaces,
      biteStuds: r.biteStuds,
      sideFaces: r.sideFaces,
      unsupported: r.unsupported,
      conflicts: r.collisions.map((c) => c.blockId),
    });
  }
  return {
    format: 'block-assembly-plan',
    version: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    meta: {
      name: meta.name || '未命名方案',
      ...meta,
    },
    blockTypes: BLOCK_CATALOG.map(({ id, label, w, d, h }) => ({ id, label, w, d, h })),
    blocks: blocks.map((b) => ({
      id: b.id,
      typeId: b.typeId,
      colorId: b.colorId,
      position: { x: b.x, y: b.y, z: b.z },
      rotation: b.rot,
    })),
    biteRelations: relations,
    stats: {
      count: blocks.length,
      conflictCount: relations.reduce((n, r) => n + r.conflicts.length, 0) / 2,
      unsupportedCount: relations.filter((r) => r.unsupported).length,
    },
  };
}

export function deserializePlan(data) {
  if (!data || data.format !== 'block-assembly-plan') {
    throw new Error('文件格式不匹配,不是本工具导出的方案文件');
  }
  const typeIds = new Set(BLOCK_CATALOG.map((t) => t.id));
  const colorIds = new Set(COLOR_CATALOG.map((c) => c.id));
  const blocks = [];
  let maxNum = 0;
  for (const raw of data.blocks ?? []) {
    if (!typeIds.has(raw.typeId) || !colorIds.has(raw.colorId)) {
      throw new Error(`方案包含未知零件或颜色: ${raw.typeId} / ${raw.colorId}`);
    }
    const b = createBlock(
      raw.typeId,
      raw.colorId,
      raw.position?.x ?? 0,
      raw.position?.y ?? 0,
      raw.position?.z ?? 0,
      raw.rotation ?? 0
    );
    if (raw.id && /^b\d+$/.test(raw.id)) {
      b.id = raw.id;
      maxNum = Math.max(maxNum, Number(raw.id.slice(1)));
    }
    blocks.push(b);
  }
  resetIdCounter(maxNum + 1);
  return { blocks, meta: data.meta ?? {}, stats: data.stats ?? null };
}

export function downloadJSON(plan, filename) {
  const blob = new Blob([JSON.stringify(plan, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.json') ? filename : `${filename}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
