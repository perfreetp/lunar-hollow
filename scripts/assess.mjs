/**
 * 交互验证（通过 App 暴露的同一 store 实例，避免模块重复实例）：
 *  A) 重叠齿轮自动分层  B) 间隙告警与静止
 *  C) 改齿数全链速比联动  D) 导出/导入往返一致
 */
const HELPER = `
  window.__getState = () => { let v; window.__appStore.subscribe((s) => { v = s; })(); return v; };
  const A = window.__storeActions;
`;

const EXPR = `(async () => {
  ${HELPER}
  const out = {};
  const get = () => window.__getState();

  // A) 分层（重叠齿轮已由 runner 预先添加为 gear-4）
  let s = get();
  const g1 = s.gears[0];
  const overlap = s.gears.find((g) => g.id === window.__overlap);
  out.layerA = {
    overlapLayer: s.snapshot.layers.get(overlap.id),
    g1Layer: s.snapshot.layers.get(g1.id),
    differ: s.snapshot.layers.get(overlap.id) !== s.snapshot.layers.get(g1.id),
    hasOverlapIssue: s.snapshot.issues.some((i) => i.type === 'overlap')
  };

  // B) 偏远齿轮：间隙/未连通告警 + 静止
  const farId = A.addGear(12, g1.gridX + 60, g1.gridY + 40);
  s = get();
  out.gapWarn = {
    hasGapOrDisconnect: s.snapshot.issues.some((i) => i.type === 'gap' || i.type === 'disconnected'),
    farGearStatic: s.snapshot.ratios.get(farId) === 0
  };

  // C) 改齿数联动
  const g2 = s.gears.find((g) => g.label === '齿轮 2');
  const before = s.snapshot.ratios.get(g2.id);
  A.setTeeth(g1.id, 18);
  s = get();
  const afterOldPos = s.snapshot.ratios.get(g2.id);
  A.moveGear(g2.id, g1.gridX + 42, g1.gridY); // 18/24 理想啮合位
  s = get();
  out.teethLinkage = {
    before: Number(before.toFixed(4)),
    afterTeethChangeOldPos: Number(afterOldPos.toFixed(4)),
    ratioAfterReposition: Number(s.snapshot.ratios.get(g2.id).toFixed(4)),
    expected: Number((-18 / 24).toFixed(4)),
    matchesExpected: Math.abs(s.snapshot.ratios.get(g2.id) - -18 / 24) < 1e-9
  };

  // D) 导出/导入往返（同 store 实例）
  const json = A.serializeConfig();
  const parsed = JSON.parse(json);
  out.exportShape = {
    schema: parsed.schema,
    gearCount: parsed.gears.length,
    hasTransmission: Array.isArray(parsed.transmission),
    hasLayout: parsed.gears.every((g) => 'gridX' in g && 'teeth' in g)
  };
  A.importConfig(json);
  const s2 = get();
  out.importRoundtrip = {
    sameGearCount: s2.gears.length === parsed.gears.length,
    sameDriver: s2.driverId === parsed.driverId,
    sameTeeth: s2.gears.every((g) => parsed.gears.find((p) => p.id === g.id)?.teeth === g.teeth),
    edgesMatch: s2.snapshot.edges.length === parsed.transmission.length
  };

  return out;
})()`;

export async function runAssessments(call) {
  const r = await call('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: EXPR
  });
  if (r.exceptionDetails) {
    throw new Error('page exception: ' + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text));
  }
  return r.result.value;
}
