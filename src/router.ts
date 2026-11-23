import { createRouter, createWebHashHistory } from 'vue-router';
import ConfigPage from './pages/ConfigPage.vue';
import ControlPage from './pages/ControlPage.vue';
import ReplayPage from './pages/ReplayPage.vue';
import ExportPage from './pages/ExportPage.vue';

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/config' },
    { path: '/config', name: 'config', component: ConfigPage, meta: { title: '场景与船舶配置' } },
    { path: '/control', name: 'control', component: ControlPage, meta: { title: '过闸流程控制' } },
    { path: '/replay', name: 'replay', component: ReplayPage, meta: { title: '时间轴回放' } },
    { path: '/export', name: 'export', component: ExportPage, meta: { title: '仿真结果导出' } },
  ],
});
