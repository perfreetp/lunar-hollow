<script setup lang="ts">
import { computed, ref } from 'vue';
import { useLabStore } from '../stores/lab';
import { configFileName, serializeConfig, summarizeConfig } from '../core/config';
import { PART_INFO } from '../core/rigSpec';
import type { PartKind } from '../core/model';

const store = useLabStore();
const copied = ref(false);
const importText = ref('');
const importError = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const config = computed(() => store.buildConfig());
const summary = computed(() => summarizeConfig(config.value));
const json = computed(() => serializeConfig(config.value));

const connectionRows = computed(() =>
  (['lowerArm', 'upperArm', 'knuckle', 'tieRod'] as PartKind[]).map((part) => {
    const conn = store.assembly.connections[part];
    return {
      part,
      label: PART_INFO[part].label,
      tone: PART_INFO[part].tone,
      socket: conn?.socket ?? '—',
      deviation: conn?.dropDeviation ?? null,
      forced: conn?.forced ?? false,
      installed: Boolean(conn),
    };
  }),
);

async function copyJson() {
  try {
    await navigator.clipboard.writeText(json.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1600);
  } catch {
    copied.value = false;
    store.pushMessage({ level: 'warn', code: 'clipboard', message: '剪贴板不可用，请手动选择文本复制' });
  }
}

function download() {
  const cfg = config.value;
  const blob = new Blob([serializeConfig(cfg)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = configFileName(cfg);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  store.markExported(cfg);
  store.pushMessage({ level: 'info', code: 'export', message: `已导出 ${configFileName(cfg)}` });
}

function onFile(evt: Event) {
  const input = evt.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const ok = store.importConfigText(String(reader.result ?? ''));
    importError.value = ok ? null : '配置解析失败，详见右侧提示';
  };
  reader.onerror = () => (importError.value = '读取文件失败');
  reader.readAsText(file, 'utf-8');
  input.value = '';
}

function importPaste() {
  if (!importText.value.trim()) return;
  const ok = store.importConfigText(importText.value);
  importError.value = ok ? null : '配置解析失败，详见右侧提示';
  if (ok) importText.value = '';
}

const shareUrl = computed(() => {
  // Compact share token: the config JSON, base64'd for pasting anywhere.
  const cfg = config.value;
  const token = btoa(unescape(encodeURIComponent(JSON.stringify(cfg))));
  return token;
});

const shareCopied = ref(false);
async function copyShare() {
  try {
    await navigator.clipboard.writeText(shareUrl.value);
    shareCopied.value = true;
    setTimeout(() => (shareCopied.value = false), 1600);
  } catch {
    store.pushMessage({ level: 'warn', code: 'clipboard', message: '剪贴板不可用，请手动复制分享串' });
  }
}

const validation = computed(() => store.connectionIssues);

const dimensionRows = computed(() => [
  { key: 'lowerArmLength', label: '下摆臂长', v: store.dims.lowerArmLength },
  { key: 'upperArmLength', label: '上摆臂长', v: store.dims.upperArmLength },
  { key: 'tieRodLength', label: '拉杆长', v: store.dims.tieRodLength },
  { key: 'kingpinLength', label: '主销长', v: store.dims.kingpinLength },
  { key: 'hubOffset', label: '轮心偏距', v: store.dims.hubOffset },
  { key: 'hubHeight', label: '轮心高度', v: store.dims.hubHeight },
]);
</script>

<template>
  <section class="panel export-panel" data-testid="export-panel">
    <header class="panel-head">
      <div>
        <h2>配置导出</h2>
        <p>把连杆尺寸、连接关系与行程参数序列化为可分享的配置文件</p>
      </div>
      <span class="sig mono" data-testid="signature">{{ store.signature }}</span>
    </header>

    <div class="export-grid">
      <div class="export-block">
        <div class="block-head">
          <span>元信息</span>
          <span class="mono">{{ config.exportedAt.slice(0, 19).replace('T', ' ') }}</span>
        </div>
        <label class="field">
          <span>方案名称</span>
          <input v-model="store.meta.title" maxlength="60" data-testid="meta-title" />
        </label>
        <label class="field">
          <span>备注</span>
          <textarea v-model="store.meta.note" rows="2" maxlength="240" placeholder="例如：前直轴长行程，赛道验证" />
        </label>
        <div class="export-actions">
          <button class="primary" data-testid="download" @click="download">下载配置文件</button>
          <button class="ghost-btn" data-testid="copy-json" @click="copyJson">{{ copied ? '已复制' : '复制 JSON' }}</button>
          <button class="ghost-btn" data-testid="copy-share" @click="copyShare">{{ shareCopied ? '已复制分享串' : '复制分享串' }}</button>
        </div>
        <p class="file-name mono">{{ configFileName(config) }}</p>
      </div>

      <div class="export-block">
        <div class="block-head">
          <span>尺寸摘要</span>
          <span class="mono">mm</span>
        </div>
        <div class="summary-grid">
          <div v-for="row in summary" :key="row.label" class="summary-row">
            <span>{{ row.label }}</span>
            <b class="mono">{{ row.value }}</b>
          </div>
        </div>
        <div class="block-head sub">
          <span>连接关系</span>
          <span class="mono">{{ store.assembly.order.length }}/4</span>
        </div>
        <ul class="conn-list">
          <li v-for="row in connectionRows" :key="row.part" :class="{ missing: !row.installed }">
            <i :style="{ background: row.tone }" />
            <strong>{{ row.label }}</strong>
            <span class="mono">{{ row.socket }}</span>
            <b v-if="row.deviation !== null" class="mono" :class="{ bad: row.deviation > store.assembly.toleranceMm && !row.forced }">
              {{ row.deviation.toFixed(1) }} mm
            </b>
            <span v-else class="mono dim">未连接</span>
          </li>
        </ul>
        <div class="dim-table">
          <div v-for="row in dimensionRows" :key="row.key" class="dim-cell">
            <span>{{ row.label }}</span>
            <b class="mono">{{ row.v.toFixed(1) }}</b>
          </div>
        </div>
      </div>
    </div>

    <div class="export-block">
      <div class="block-head">
        <span>配置预览</span>
        <span class="mono">{{ (json.length / 1024).toFixed(1) }} KB</span>
      </div>
      <pre class="json-preview" data-testid="json-preview">{{ json }}</pre>
    </div>

    <div class="export-block import-block">
      <div class="block-head">
        <span>导入配置</span>
        <span class="mono">拖入或粘贴</span>
      </div>
      <div class="import-row">
        <button class="ghost-btn" @click="fileInput?.click()">选择文件…</button>
        <input ref="fileInput" type="file" accept="application/json,.json" class="hidden-input" data-testid="import-file" @change="onFile" />
        <span class="mono dim">.rcs.json / .json</span>
      </div>
      <textarea v-model="importText" rows="4" class="import-text" data-testid="import-text" placeholder="在此粘贴配置 JSON 后点击导入" />
      <div class="import-actions">
        <button class="primary" data-testid="import-apply" @click="importPaste">导入粘贴内容</button>
        <span v-if="importError" class="import-error">{{ importError }}</span>
      </div>
      <ul v-if="store.messages.length" class="import-log">
        <li v-for="(m, i) in store.messages.slice(0, 5)" :key="i" :class="m.level">{{ m.message }}</li>
      </ul>
    </div>

    <div class="validation">
      <div class="block-head">
        <span>校验</span>
        <span class="mono">{{ validation.filter((v) => v.level === 'warn').length }} 项警告</span>
      </div>
      <ul>
        <li v-for="v in validation" :key="v.part" :class="v.level">
          <i />
          {{ PART_INFO[v.part].label }}：{{ v.message }}
        </li>
        <li v-if="!store.assemblyComplete" class="warn">
          <i />
          装配未完成（{{ store.assembly.order.length }}/4），导出配置将缺少部分连接关系
        </li>
      </ul>
    </div>
  </section>
</template>
