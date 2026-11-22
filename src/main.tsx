import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { useToolStore } from './store';
import './styles.css';

// 调试钩子：供自动化冒烟测试读取状态（不影响生产逻辑）
(window as unknown as { __LH_STORE__?: unknown }).__LH_STORE__ = useToolStore;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
