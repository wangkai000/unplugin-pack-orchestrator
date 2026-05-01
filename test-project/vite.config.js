import { defineConfig } from 'vite';
import packPlugin from 'D:/project1/newAIProject/unplugin-pack-orchestrator/dist/vite.js';

export default defineConfig({
  plugins: [
    packPlugin({
      pack: {
        format: 'zip',
        fileName: 'test-[name]-[version]-[hash:8]',
        outDir: 'dist',
        archiveOutDir: '.',
      },
      hooks: {
        onBeforeBuild: () => console.log('[vite] onBeforeBuild ✓'),
        onBundleGenerated: (b) => console.log('[vite] onBundleGenerated ✓ keys:', Object.keys(b)),
        onAfterBuild: (p, f, c) => {
          console.log('[vite] Archive:', p);
          console.log('[vite] MD5:', c.md5);
        },
      },
    }),
  ],
  build: {
    outDir: 'dist',
  },
});
