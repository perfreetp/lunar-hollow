import { reactive, readonly, markRaw, shallowRef, type DeepReadonly } from 'vue';
import type { ProjectConfig, CellReadout, GlareReadout } from '../core/types';
import { defaultProject, exportScheme, importScheme } from '../core/scheme';
import type { SceneManager } from '../render/SceneManager';

/**
 * 全局响应式状态与变更调度。
 * 场景管理器不是响应式数据，放在 shallowRef 里用 markRaw 冻结；
 * 配置是普通 reactive 对象，按变更类型触发不同粒度的场景重建。
 */

interface StoreState {
  engineKind: 'webgpu' | 'webgl2' | 'pending';
  hovered: CellReadout | null;
  glare: GlareReadout | null;
  selectedCell: number | null;
  errorMessage: string | null;
}

const config = reactive<ProjectConfig>(defaultProject());

const state = reactive<StoreState>({
  engineKind: 'pending',
  hovered: null,
  glare: null,
  selectedCell: null,
  errorMessage: null,
});

const sceneManager = shallowRef<SceneManager | null>(null);

export function useStore() {
  function setSceneManager(mgr: SceneManager | null): void {
    sceneManager.value = mgr ? markRaw(mgr) : null;
  }

  function setEngineKind(kind: 'webgpu' | 'webgl2'): void {
    state.engineKind = kind;
  }

  function setGlare(g: GlareReadout | null): void {
    state.glare = g;
  }

  function setHovered(r: CellReadout | null): void {
    state.hovered = r;
  }

  function selectCell(index: number | null): void {
    state.selectedCell = index;
  }

  /** 结构性变更（网格/房间/双层）：全量重建 */
  function rebuildAll(): void {
    sceneManager.value?.rebuildAll();
  }

  /** 玻璃参数变更：只重建玻璃与光斑 */
  function rebuildGlass(): void {
    sceneManager.value?.rebuildGlass();
  }

  /** 日照变更：只重算光斑与眩光 */
  function rebuildSun(): void {
    sceneManager.value?.rebuildSun();
  }

  function replaceConfig(next: ProjectConfig): void {
    // 字段级拷贝，保持 reactive 代理引用稳定
    Object.assign(config, next);
    sceneManager.value?.setConfig(config);
  }

  function exportToFile(): string {
    return exportScheme(config, new Date().toISOString());
  }

  function importFromText(text: string): boolean {
    try {
      const config = importScheme(text);
      replaceConfig(config);
      state.errorMessage = null;
      return true;
    } catch (e) {
      state.errorMessage = e instanceof Error ? e.message : String(e);
      return false;
    }
  }

  function clearError(): void {
    state.errorMessage = null;
  }

  return {
    config,
    state: readonly(state) as DeepReadonly<StoreState>,
    setSceneManager,
    setEngineKind,
    setGlare,
    setHovered,
    selectCell,
    rebuildAll,
    rebuildGlass,
    rebuildSun,
    replaceConfig,
    exportToFile,
    importFromText,
    clearError,
  };
}
