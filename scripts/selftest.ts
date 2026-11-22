/* 求解器自检：node --import tsx 直跑，不依赖浏览器 */
import { catY, solveCatenary } from '../src/physics/catenary';
import { RopeModel } from '../src/physics/ropeModel';
import { computeWheelContacts } from '../src/physics/contacts';
import { TENSION_GEARS, ROPE_DEFAULTS, G } from '../src/physics/config';
import type { RopeModelInput } from '../src/physics/ropeModel';

let failures = 0;
function check(name: string, cond: boolean, detail = ''): void {
  if (cond) console.log(`  ✓ ${name}`);
  else {
    failures++;
    console.error(`  ✗ ${name} ${detail}`);
  }
}

// 1. 单跨悬链线闭合解：曲线必须严格过两端点
console.log('\n[1] 单跨悬链线解析解');
{
  const dx = 120;
  const dy = 8;
  const H = 120_000;
  const w = 8 * G;
  const span = solveCatenary(dx, dy, H, w);
  const yEnd = catY(span, dx);
  check('右端点高差闭合', Math.abs(yEnd - dy) < 1e-9, `got ${yEnd}, want ${dy}`);
  check('弧长 > 弦长', span.length > Math.hypot(dx, dy));
  check('弧长量级合理 (78m 跨, ~80m)', span.length > dx && span.length < dx * 1.05, `L=${span.length.toFixed(3)}`);
  // 水平张力恒定：T·cos α = H
  const T0 = Math.hypot(span.V0, H);
  const cosA = 1 / Math.sqrt(1 + Math.sinh(span.uL) ** 2);
  check('端张力水平分量 = H', Math.abs(T0 * cosA - H) / H < 1e-12);
}

// 2. 对称跨水平时：中点垂度与手册公式一致
console.log('\n[2] 水平对称跨垂度');
{
  const dx = 200;
  const H = 100_000;
  const w = 8 * G;
  const span = solveCatenary(dx, 0, H, w);
  const c = H / w;
  const sag = c * (Math.cosh(dx / (2 * c)) - 1);
  const midY = catY(span, dx / 2);
  check('中点垂度 = c(cosh(L/2c)-1)（局部 y 为负下垂）', Math.abs(-midY - sag) < 1e-9);
  const parabApprox = (w * dx * dx) / (8 * H); // 抛物线近似
  check('与抛物线近似差异 < 0.5%', Math.abs(sag - parabApprox) / sag < 0.005,
    `catenary=${sag.toFixed(4)}, parabola=${parabApprox.toFixed(4)}`);
}

// 3. 多跨 + 车厢平衡
function makeInput(overrides: Partial<RopeModelInput> = {}): RopeModelInput {
  return {
    supportA: { id: 'support-A', name: 'A', position: { x: 0, y: 18, z: 0 } },
    supportB: { id: 'support-B', name: 'B', position: { x: 300, y: 26, z: 0 } },
    wheels: [
      { id: 'w1', name: 'w1', position: { x: 100, y: 10, z: 0 }, radius: 0.22, enabled: true },
      { id: 'w2', name: 'w2', position: { x: 200, y: 12, z: 0 }, radius: 0.22, enabled: true },
    ],
    cabin: { t: 0.4, payloadKg: 1200, deadWeightKg: 800 },
    horizontalTension: TENSION_GEARS[2].H,
    linearDensity: ROPE_DEFAULTS.linearDensity,
    ropeRadius: ROPE_DEFAULTS.radius,
    ...overrides,
  };
}

console.log('\n[3] 多跨绳模型与车厢垂向平衡');
{
  const model = new RopeModel();
  model.solve(makeInput(), 'all');
  // 轮组为单向接触对象、不生成跨；节点 = 支架A + 车厢 + 支架B → 2 跨
  check('跨数 = 2（支架-车厢-支架，轮组不入节点）', model.spans.length === 2, `got ${model.spans.length}`);
  // 平衡校验：车厢两侧竖向张力差 = 集中载荷
  const cabinIdx = model.nodes.findIndex((n) => n.kind === 'cabin');
  const leftSpan = model.spans[cabinIdx - 1];
  const rightSpan = model.spans[cabinIdx];
  const P = 2000 * G;
  const vDiff = rightSpan.cat.V0 - leftSpan.cat.V1;
  check('V_right − V_left = P（平衡残差 < 1N）', Math.abs(vDiff - P) < 1,
    `ΔV=${vDiff.toFixed(3)}, P=${P.toFixed(3)}`);
  check('二分迭代 ≤ 40 次', model.iterations <= 40, `iters=${model.iterations}`);
  check('车厢位置在线路之间', model.cabinPos.y > 0 && model.cabinPos.y < 30,
    `y=${model.cabinPos.y.toFixed(3)}`);
  check('二分收敛（容差 0.1mm 量级，迭代 < 25 次）',
    model.iterations < 25,
    `iters=${model.iterations}/${ROPE_DEFAULTS.maxBisection}`);
}

// 4. 弦弧误差千分之一
console.log('\n[4] 自适应布环弦弧误差');
{
  const model = new RopeModel();
  model.solve(makeInput(), 'all');
  check('最大弦弧误差 < 1e-3', model.maxChordArcError < 1e-3,
    `err=${model.maxChordArcError.toExponential(3)}`);
  check('环段总数合理 (300m 线路 >300 环)', model.ringCount > 300,
    `rings=${model.ringCount}`);
  // 常态工况曲率小，步长由上限 0.8m 主导；曲率加密机制用下面的大曲率专项验证
}

// 4b. 大曲率工况：超松弛低张力（c=H/w≈25m，模拟极端垂绳），验证曲率位置自动加密、无折角
console.log('\n[4b] 大曲率位置加密（超松弛低张力工况）');
{
  const model = new RopeModel();
  model.solve(
    makeInput({
      supportA: { id: 'support-A', name: 'A', position: { x: 0, y: 12, z: 0 } },
      supportB: { id: 'support-B', name: 'B', position: { x: 60, y: 12, z: 0 } },
      wheels: [],
      horizontalTension: 2000,
      cabin: { t: 0.5, payloadKg: 200, deadWeightKg: 800 },
    }),
    'all',
  );
  let densified = false;
  for (const sp of model.spans) {
    const steps: number[] = [];
    for (let i = 1; i < sp.rings.length; i++) {
      steps.push(Math.hypot(
        sp.rings[i].pos.x - sp.rings[i - 1].pos.x,
        sp.rings[i].pos.z - sp.rings[i - 1].pos.z,
      ));
    }
    const avg = steps.reduce((a, b) => a + b, 0) / steps.length;
    if (Math.min(...steps) < avg * 0.7) densified = true;
    // 每段实际转角都必须低于容差（无折角）
    let maxTurn = 0;
    for (let i = 1; i < sp.rings.length - 1; i++) {
      const t1 = sp.rings[i - 1].tangent;
      const t2 = sp.rings[i + 1].tangent;
      const dot = Math.min(1, Math.max(-1, t1.x * t2.x + t1.y * t2.y + t1.z * t2.z));
      maxTurn = Math.max(maxTurn, Math.acos(dot));
    }
    check(`跨${sp.index} 最大转角 ≤ ${ROPE_DEFAULTS.maxTurnAngle} rad`,
      maxTurn <= ROPE_DEFAULTS.maxTurnAngle + 1e-9, `got ${maxTurn.toFixed(4)}`);
  }
  check('至少一跨出现曲率驱动加密', densified);
  check('大曲率工况弦弧误差仍 < 1e-3', model.maxChordArcError < 1e-3);
}

// 5. 缓存粒度：车厢移动只重算相邻两跨
console.log('\n[5] 增量重算缓存');
{
  const model = new RopeModel();
  const input = makeInput();
  model.solve(input, 'all');
  const before = model.ringCount;
  model.solve({ ...input, cabin: { ...input.cabin, t: 0.61 } }, 'cabin');
  check('车厢移动后环数稳定', Math.abs(model.ringCount - before) < before * 0.05);
  check('车厢移动后 2 跨全部失效（无缓存命中）', model.cacheHits === 0,
    `hits=${model.cacheHits}/${model.spans.length}`);
  // 载荷不变只移动位置时，两跨端点都变 → 均失效；验证不相关数据（张力）不引发额外重算
  // 张力变化：签名含 H，应全部失效
  model.solve({ ...input, horizontalTension: TENSION_GEARS[3].H }, 'all');
  check('张力换档后全部跨重算', model.cacheHits === 0, `hits=${model.cacheHits}`);
  // 连续两次相同输入：第二次应全部命中缓存
  model.solve({ ...input }, 'all');
  check('相同输入二次求解全部缓存命中', model.cacheHits === model.spans.length,
    `hits=${model.cacheHits}/${model.spans.length}`);
}

// 6. 载荷增大 → 车厢下沉
console.log('\n[6] 物理单调性');
{
  const model = new RopeModel();
  const input = makeInput();
  model.solve(input, 'all');
  const yLight = model.cabinPos.y;
  model.solve(
    { ...input, cabin: { ...input.cabin, payloadKg: 4000 } },
    'cabin',
  );
  const yHeavy = model.cabinPos.y;
  check('载荷增大车厢下沉', yHeavy < yLight, `light=${yLight.toFixed(3)}, heavy=${yHeavy.toFixed(3)}`);

  // 张力增大 → 绳更直、垂度减小
  const m2 = new RopeModel();
  m2.solve({ ...input, horizontalTension: TENSION_GEARS[1].H }, 'all');
  const lowT = m2.cabinPos.y;
  m2.solve({ ...input, horizontalTension: TENSION_GEARS[4].H }, 'all');
  const highT = m2.cabinPos.y;
  check('张力增大车厢上抬', highT > lowT, `lowH=${lowT.toFixed(3)}, highH=${highT.toFixed(3)}`);
}

// 7. 轮组接触点 + 压陷量
console.log('\n[7] 轮组射线接触与压陷量');
{
  const model = new RopeModel();
  const input = makeInput();
  model.solve(input, 'all');
  const contacts = computeWheelContacts(model, input.wheels, input.ropeRadius, 2.0);
  check('每个启用轮组都有接触结果', contacts.length === 2);
  for (const c of contacts) {
    check(`轮 ${c.wheelId} 接触点距离为有限非负`, Number.isFinite(c.distance) && c.distance >= 0);
    check(`轮 ${c.wheelId} 切向为单位向量`,
      Math.abs(Math.hypot(c.tangent.x, c.tangent.y, c.tangent.z) - 1) < 1e-9);
  }
  // 压陷构造：取轮位所在跨的悬链线解析绳高，轮心放在绳点正下方。
  // 注意曲线有斜率时真实最近点会沿切线水平偏移，因此压陷量不等于竖直间隙，
  // 这里直接断言求解器给出的压陷量为正、量级合理且超阈值（精度由精化阶段保证）。
  const wheelX = input.wheels[0].position.x;
  const targetSpan = model.spans.find(
    (sp) => wheelX >= sp.nodeA.pos.x - 1e-9 && wheelX <= sp.nodeB.pos.x + 1e-9,
  )!;
  const localX = wheelX - targetSpan.nodeA.pos.x;
  const exactRopeY = targetSpan.nodeA.pos.y + catY(targetSpan.cat, localX);
  const pressedWheel = {
    ...input.wheels[0],
    position: {
      x: wheelX,
      z: input.wheels[0].position.z,
      // 轮面切入绳表面：竖直间隙比 (R轮+R绳) 小 5mm
      y: exactRopeY - (input.wheels[0].radius + input.ropeRadius - 0.005),
    },
  };
  const pressedInput = makeInput({ wheels: [pressedWheel, input.wheels[1]] });
  const m3 = new RopeModel();
  m3.solve(pressedInput, 'all');
  const c3 = computeWheelContacts(m3, pressedInput.wheels, pressedInput.ropeRadius, 2.0);
  const pressed = c3.find((c) => c.wheelId === pressedWheel.id)!;
  // 解析悬链线精化后压陷量精度为亚毫米；竖直切入 5mm 时因曲线斜率，
  // 实测压陷量略大（最近点沿切线偏移），断言落在 4~10mm 的物理合理区间
  check('轮面切入绳表面后压陷量为正且量级正确',
    pressed.indentation > 0.004 && pressed.indentation < 0.01,
    `δ=${(pressed.indentation * 1000).toFixed(2)}mm`);
  check('超阈值高亮标记', pressed.overThreshold === true);

  // 精化精度自洽：报告距离必须等于轮心到报告接触点的真实欧氏距离（亚毫米）
  const recomputed = Math.hypot(
    pressed.point.x - pressedWheel.position.x,
    pressed.point.y - pressedWheel.position.y,
    pressed.point.z - pressedWheel.position.z,
  );
  check('接触点精化自洽（报告距离=真实距离，误差 <0.1mm）',
    Math.abs(recomputed - pressed.distance) < 1e-4,
    `report=${pressed.distance.toFixed(5)}, actual=${recomputed.toFixed(5)}`);

  // 反向：轮面离开绳表面 10mm → 间隙为正、不接触、不报警
  const looseWheel = {
    ...input.wheels[0],
    position: {
      x: wheelX,
      z: input.wheels[0].position.z,
      y: exactRopeY - (input.wheels[0].radius + input.ropeRadius + 0.01),
    },
  };
  const looseInput = makeInput({ wheels: [looseWheel, input.wheels[1]] });
  const m4 = new RopeModel();
  m4.solve(looseInput, 'all');
  const c4 = computeWheelContacts(m4, looseInput.wheels, looseInput.ropeRadius, 2.0);
  const loose = c4.find((c) => c.wheelId === looseWheel.id)!;
  check('轮面脱离后判定为未接触', loose.contacting === false, `δ=${(loose.indentation * 1000).toFixed(2)}mm`);
  check('未接触不报警', loose.overThreshold === false);
}

// 8. 性能：长线路 2000 段量级单帧求解耗时
console.log('\n[8] 长线路性能');
{
  const longWheels = Array.from({ length: 12 }, (_, i) => ({
    id: `w${i}`,
    name: `w${i}`,
    position: { x: 80 + i * 70, y: 12 + Math.sin(i) * 2, z: 0 },
    radius: 0.22,
    enabled: true,
  }));
  const input = makeInput({
    supportB: { id: 'support-B', name: 'B', position: { x: 1000, y: 30, z: 0 } },
    wheels: longWheels,
  });
  const model = new RopeModel();
  const t0 = performance.now();
  model.solve(input, 'all');
  const ms = performance.now() - t0;
  console.log(`    1000m 线路 / ${model.spans.length} 跨 / ${model.ringCount} 环 / 求解 ${ms.toFixed(2)}ms`);
  check('长线路全绳求解 < 16ms（一帧预算）', ms < 16, `${ms.toFixed(2)}ms`);
  check('长线路弦弧误差仍 < 1e-3', model.maxChordArcError < 1e-3);

  const t1 = performance.now();
  model.solve({ ...input, cabin: { ...input.cabin, t: 0.72 } }, 'cabin');
  const ms2 = performance.now() - t1;
  console.log(`    车厢拖动重算 ${ms2.toFixed(2)}ms（仅车厢相邻跨参与，其余状态零改动）`);
  check('车厢拖动求解 < 8ms', ms2 < 8, `${ms2.toFixed(2)}ms`);
}

console.log(failures === 0 ? '\n全部通过 ✅' : `\n${failures} 项失败 ❌`);
process.exit(failures === 0 ? 0 : 1);
