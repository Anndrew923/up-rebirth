import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  /**
   * Production path normalization:
   * - Use relative base so the build works when deployed under a sub-path
   *   (e.g. Netlify subfolder, GitHub Pages, reverse-proxy prefixes).
   */
  const base = mode === 'production' ? './' : '/';

  return {
    base,
    plugins: [react()],
    server: {
      open: true, // 自動開啟瀏覽器
      port: 5173, // 指定端口（可選，Vite 預設就是 5173）
    },
  };
});
