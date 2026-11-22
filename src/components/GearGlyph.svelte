<script>
  // 轻量齿轮示意图（与 three.js 几何同齿数参数）
  export let z = 12;
  const rp = z / 2;
  const ra = rp + 1;
  const pts = [];
  const pitch = (Math.PI * 2) / z;
  for (let k = 0; k < z; k++) {
    const c = k * pitch;
    const half = pitch * 0.21;
    pts.push([rp, c - half], [ra, c - half * 0.6], [ra, c + half * 0.6], [rp, c + half]);
  }
  let d = '';
  pts.forEach(([r, a], i) => {
    const x = (r * Math.cos(a)) / (ra / 10.5);
    const y = (r * Math.sin(a)) / (ra / 10.5);
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
  });
  d += 'Z';
</script>

<path {d} fill="rgba(224,154,61,0.25)" stroke="#e09a3d" stroke-width="0.7" />
<circle r="{2.2}" fill="none" stroke="#93a1b5" stroke-width="0.8" />
<circle r="0.9" fill="#93a1b5" />
