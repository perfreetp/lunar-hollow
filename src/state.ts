import { createStore } from 'solid-js/store';
import type { BarSpec, ViewMode } from './types';

interface AppState {
  mode: ViewMode;
  outline: boolean;
  bars: BarSpec[];
  selectedId: string | null;
  /** 任意扶手参数变化时递增，驱动检查面板刷新 */
  specVersion: number;
  sceneInfo: string;
}

export const [state, setState] = createStore<AppState>({
  mode: 'normal',
  outline: true,
  bars: [],
  selectedId: null,
  specVersion: 0,
  sceneInfo: '默认浴室场景',
});
