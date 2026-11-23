import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import { restoreResult } from './store';
import './style.css';

void restoreResult();

createApp(App).use(router).mount('#app');
