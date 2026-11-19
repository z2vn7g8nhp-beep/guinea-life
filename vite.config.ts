import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const isPages = mode === 'pages';
  const base = process.env.VITE_BASE_PATH || (isPages ? '/guinea-life/' : '/');
  const rootDir = fs.realpathSync(import.meta.dirname);

  return {
    root: rootDir,
    base,
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'pages-spa-fallback',
        apply: 'build',
        closeBundle(error?: Error) {
          if (error) return;
          const distDir = path.resolve(rootDir, 'dist');
          if (isPages && fs.existsSync(distDir)) {
            fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
            const indexHtml = path.join(distDir, 'index.html');
            if (fs.existsSync(indexHtml)) {
              fs.copyFileSync(indexHtml, path.join(distDir, '404.html'));
            }
          }
        },
      },
    ],
  };
});
