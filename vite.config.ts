import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages 프로젝트 페이지 대응: 상대 경로로 모든 asset 참조
  base: './',

  build: {
    rollupOptions: {
      // 3개 HTML 파일 모두 빌드 진입점으로 등록 (Vite root 기준 상대 경로)
      input: {
        main:      'index.html',
        turtlesim: 'turtlesim-popup.html',
        rqtGraph:  'rqt-graph-popup.html',
      },
    },
  },
});
