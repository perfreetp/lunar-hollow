declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, unknown>;
  export default component;
}

interface HTMLCanvasElement {
  /** SceneCanvas 组件挂载的场景管理器（调试/自动化测试用） */
  __sceneManager?: import('./render/SceneManager').SceneManager;
}
