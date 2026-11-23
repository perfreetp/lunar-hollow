// 扫描支座位置 + 缸轴方向,找行程单调增的布置
const L_ROD = 3.0, R_C = 4.0;
const CLOSED = Math.atan2(-2, 12);

function Cof(thetaDeg) {
  const a = CLOSED - thetaDeg * Math.PI / 180;
  return [-12 + R_C * Math.cos(a), 8.5, R_C * Math.sin(a)];
}
function sOf(thetaDeg, A, d) {
  const C = Cof(thetaDeg);
  const ac = [C[0] - A[0], 0, C[2] - A[2]];
  const p = ac[0] * d[0] + ac[2] * d[2];
  const q = ac[0] ** 2 + ac[2] ** 2 - L_ROD ** 2;
  const disc = p * p - q;
  if (disc < 0) return null;
  return p - Math.sqrt(disc);
}

const results = [];
for (let ax = -14; ax <= -12; ax += 0.5) {
  for (let az = -2; az <= 8; az += 1) {
    const A = [ax, 8.5, az];
    for (let deg = 0; deg < 360; deg += 5) {
      const d = [Math.cos(deg * Math.PI / 180), 0, Math.sin(deg * Math.PI / 180)];
      let sPrev = -1e9, mono = true, sMin = 1e9, sMax = -1e9;
      for (let t = 0; t <= 90; t += 2) {
        const s = sOf(t, A, d);
        if (s === null) { mono = false; break; }
        if (s < sPrev - 1e-9) { mono = false; break; }
        sPrev = s; sMin = Math.min(sMin, s); sMax = Math.max(sMax, s);
      }
      const stroke = sMax - sMin;
      if (mono && stroke > 0.8 && stroke < 2.5 && sMin > 2.0) {
        // B 点不要离墙太远(不伸到河道中线以外)
        results.push({ A, deg, d, stroke, sMin, sMax });
      }
    }
  }
}
results.sort((a, b) => Math.abs(a.stroke - 1.5) - Math.abs(b.stroke - 1.5));
for (const r of results.slice(0, 5)) {
  console.log(`A=(${r.A[0]},8.5,${r.A[2]}) 方向角=${r.deg}° d=(${r.d[0].toFixed(3)},0,${r.d[2].toFixed(3)}) s: ${r.sMin.toFixed(3)}→${r.sMax.toFixed(3)} 行程=${r.stroke.toFixed(3)}`);
}
if (results.length) {
  const r = results[0];
  for (const t of [0, 15, 30, 45, 60, 75, 90]) {
    const s = sOf(t, r.A, r.d);
    const B = [r.A[0] + s * r.d[0], 8.5, r.A[2] + s * r.d[2]];
    console.log(`  θ=${t}: s=${s.toFixed(3)} B=(${B[0].toFixed(2)},${B[2].toFixed(2)})`);
  }
}
console.log(`共 ${results.length} 组单调解`);
