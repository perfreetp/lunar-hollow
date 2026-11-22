import { useEffect, useMemo, useRef, useState } from 'react';
import { useToolStore } from '../store';
import type { SceneConfig } from '../types';
import { beamRange } from '../lib/beamMath';
import { SectionTitle } from './controls';

/** 模块四：导出 —— 配置 JSON 下载/剪贴板/文件导入，供他人复用 */
export function ExportPanel() {
  const config = useToolStore((s) => s.config);
  const importConfig = useToolStore((s) => s.importConfig);
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const json = JSON.stringify(config, null, 2);
  const { fileUrl, fileName } = useMemo(() => {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    return { fileUrl: url, fileName: `lighthouse-scene-${new Date().toISOString().slice(0, 10)}.json` };
  }, [json]);
  useEffect(() => () => URL.revokeObjectURL(fileUrl), [fileUrl]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setMessage({ ok: true, text: '配置已复制到剪贴板' });
    } catch {
      setMessage({ ok: false, text: '剪贴板不可用，请改用下载' });
    }
  };

  const onFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as SceneConfig;
      if (!parsed || !Array.isArray(parsed.lighthouses)) throw new Error('缺少 lighthouses 数组');
      importConfig(parsed);
      setMessage({ ok: true, text: `已导入：${parsed.lighthouses.length} 盏灯塔 / ${parsed.reefs?.length ?? 0} 处礁石` });
    } catch (err) {
      setMessage({ ok: false, text: `导入失败：${(err as Error).message}` });
    }
  };

  return (
    <div className="panel">
      <SectionTitle>导出 / 导入</SectionTitle>
      <div className="param-form">
        <p className="tip-line">
          导出的 JSON 包含全部灯塔参数、光束参数、礁石、船位与雾况；他人在本工具导入即可还原场景并继续编辑。
        </p>
        <div className="form-actions">
          <a className="btn btn-primary" href={fileUrl} download={fileName}>
            下载 JSON 配置
          </a>
          <button className="btn" onClick={copy}>
            复制到剪贴板
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            从文件导入
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              e.target.value = '';
            }}
          />
        </div>
        {message && <p className={message.ok ? 'msg-ok' : 'msg-err'}>{message.text}</p>}

        <div className="sub-title">配置预览</div>
        <pre className="json-preview">{json}</pre>

        <div className="sub-title">场景统计</div>
        <div className="readout-grid">
          <Stat label="灯塔数量" value={config.lighthouses.length} />
          <Stat label="礁石数量" value={config.reefs.length} />
          <Stat
            label="最大光束光程"
            value={config.lighthouses.length ? `${beamRange(Math.max(...config.lighthouses.map((l) => l.beam.intensity))).toFixed(0)}m` : '—'}
          />
          <Stat label="雾密度" value={config.environment.fogDensity.toFixed(4)} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="readout">
      <span className="readout-label">{label}</span>
      <span className="readout-value">{value}</span>
    </div>
  );
}
