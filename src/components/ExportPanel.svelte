<script>
  import { store, serializeConfig, downloadConfig, importConfig, ConfigImportError } from '../lib/store.js';

  let showJson = false;
  let jsonText = '';
  let importErr = '';
  let importOk = '';
  let fileInput;

  function toggleJson() {
    showJson = !showJson;
    if (showJson) jsonText = serializeConfig();
  }

  function copyJson() {
    const text = serializeConfig();
    navigator.clipboard?.writeText(text).then(
      () => { importOk = '已复制到剪贴板'; setTimeout(() => (importOk = ''), 2000); },
      () => { jsonText = text; showJson = true; }
    );
  }

  function onFile(e) {
    importErr = '';
    importOk = '';
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importConfig(String(reader.result));
        importOk = `已导入配置：${file.name}`;
      } catch (err) {
        importErr = err instanceof ConfigImportError ? err.message : '导入失败';
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }
</script>

<section class="card">
  <h3 class="panel-title">④ 配置导出 / 分享</h3>
  <p class="muted intro">
    序列化齿轮布局、齿数、主动轮与全部传动关系为 JSON，可发给他人直接导入还原。
  </p>

  <div class="stats">
    <div><b>{$store.gears.length}</b><span>齿轮</span></div>
    <div><b>{$store.snapshot.edges.length}</b><span>啮合边</span></div>
    <div><b>{$store.windTurns}</b><span>发条圈数</span></div>
  </div>

  <div class="btns">
    <button class="primary" on:click={downloadConfig}>⬇ 下载 .json</button>
    <button on:click={copyJson}>⧉ 复制配置</button>
    <button on:click={toggleJson}>{showJson ? '收起 JSON' : '查看 JSON'}</button>
  </div>

  {#if showJson}
    <textarea readonly bind:value={jsonText} rows="14" spellcheck="false"></textarea>
  {/if}

  <div class="import">
    <h4>导入配置</h4>
    <input type="file" accept="application/json,.json" bind:this={fileInput} on:change={onFile} />
    {#if importErr}<p class="err">{importErr}</p>{/if}
    {#if importOk}<p class="ok">{importOk}</p>{/if}
  </div>
</section>

<section class="card help">
  <h3 class="panel-title">操作速查</h3>
  <ul class="muted">
    <li>左侧齿轮库 <b>拖拽</b> 到画布放置</li>
    <li>拖动齿轮调整轴位，自动吸附网格</li>
    <li>中心距 = 两轮分度圆半径之和时自动啮合</li>
    <li>间隙超 ±0.18 单位时底部出现告警</li>
    <li>点选齿轮后可改齿数、设为主动轮、删除（Delete 键）</li>
    <li>重叠齿轮自动分配不同深度层，表达前后遮挡</li>
  </ul>
</section>

<style>
  .card { background: var(--panel-2); border: 1px solid var(--line); border-radius: 8px; padding: 10px; }
  .intro { font-size: 11px; line-height: 1.6; margin: 0 0 10px; }
  .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 10px; }
  .stats div {
    background: var(--bg); border: 1px solid var(--line); border-radius: 7px;
    padding: 8px 4px; text-align: center;
  }
  .stats b { display: block; font-size: 17px; color: var(--accent); }
  .stats span { font-size: 10.5px; color: var(--muted); }
  .btns { display: flex; flex-direction: column; gap: 7px; }
  textarea {
    width: 100%; margin-top: 8px;
    background: var(--bg); color: #b8c6da;
    border: 1px solid var(--line); border-radius: 6px;
    font-family: Consolas, monospace; font-size: 10.5px;
    padding: 8px; resize: vertical;
  }
  .import { margin-top: 12px; }
  .import h4 { margin: 0 0 6px; font-size: 12px; }
  .err { color: var(--err); font-size: 11px; }
  .ok { color: var(--ok); font-size: 11px; }
  .help ul { padding-left: 16px; margin: 0; font-size: 11px; line-height: 1.8; }
</style>
