// 导出工具:截图 PNG、干涉报告 JSON
import { solveKinematics } from '../kinematics';
import type { InterferenceReport } from '../manifoldService';
import { angle, poses } from '../store';

function download(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function exportScreenshot(dataUrl: string, tag = '') {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  download(dataUrl, `miter-gate_${angle().toFixed(1)}deg${tag ? '_' + tag : ''}_${stamp}.png`);
}

export function exportInterferenceReport(report: InterferenceReport) {
  const kin = solveKinematics(report.thetaDeg);
  const payload = {
    报告类型: '船闸人字门启闭机构干涉检查报告',
    生成时间: new Date().toISOString(),
    开度_度: report.thetaDeg,
    检查部件对数: report.checkedPairs,
    干涉数量: report.hits.length,
    运动学读数: kin.sides.map((s) => ({
      侧别: s.side.name,
      支铰转角_度: s.hingeRotationDeg,
      连杆长度_m: Number(s.rodLength.toFixed(4)),
      活塞杆伸出量_m: Number(s.rodExtension.toFixed(4)),
      活塞行程_m: Number(s.stroke.toFixed(4)),
      机构可达: s.reachable,
    })),
    干涉列表: report.hits.map((h) => ({
      部件A: h.a,
      部件B: h.b,
      干涉体积_m3: Number(h.volume.toFixed(6)),
    })),
    已保存姿态: poses(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  download(url, `interference-report_${report.thetaDeg.toFixed(1)}deg_${stamp}.json`);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
