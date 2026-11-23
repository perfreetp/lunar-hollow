<script setup lang="ts">
import type { Toast } from '../state/store'

defineProps<{ toasts: Toast[] }>()
const emit = defineEmits<{ (e: 'dismiss', id: number): void }>()

const ICONS: Record<Toast['kind'], string> = {
  success: 'M5 13l4 4L19 7',
  error: 'M6 6l12 12M18 6L6 18',
  warn: 'M12 4v9m0 4v.5',
  info: 'M12 8v.5M12 11v6',
}
</script>

<template>
  <div class="toasts" aria-live="polite">
    <transition-group name="toast">
      <div v-for="t in toasts" :key="t.id" class="toast" :class="t.kind" role="status">
        <svg class="ico" viewBox="0 0 24 24" width="15" height="15">
          <path :d="ICONS[t.kind]" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
        <div class="body">
          <p class="title">{{ t.title }}</p>
          <p v-if="t.detail" class="detail">{{ t.detail }}</p>
        </div>
        <button class="x" aria-label="关闭提示" @click="emit('dismiss', t.id)">×</button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toasts {
  position: fixed;
  right: 18px;
  bottom: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 60;
  width: min(360px, calc(100vw - 36px));
  pointer-events: none;
}
.toast {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 10px 11px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 0 14px 34px rgba(2, 6, 23, 0.5);
  pointer-events: auto;
}
.ico {
  flex: none;
  margin-top: 1px;
}
.toast.success {
  border-color: rgba(52, 211, 153, 0.4);
}
.toast.success .ico {
  color: #34d399;
}
.toast.error {
  border-color: rgba(248, 113, 113, 0.45);
}
.toast.error .ico {
  color: #f87171;
}
.toast.warn {
  border-color: rgba(251, 191, 36, 0.45);
}
.toast.warn .ico {
  color: #fbbf24;
}
.toast.info .ico {
  color: #38bdf8;
}
.body {
  flex: 1;
  min-width: 0;
}
.title {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: #f1f5f9;
}
.detail {
  margin: 2px 0 0;
  font-size: 11px;
  line-height: 1.5;
  color: #94a3b8;
  word-break: break-word;
}
.x {
  flex: none;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 5px;
  background: transparent;
  color: #64748b;
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
}
.x:hover {
  color: #f8fafc;
  background: rgba(148, 163, 184, 0.14);
}
.toast-enter-active,
.toast-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(12px);
}
</style>
