
import { defineConfig } from 'vite';
import packPlugin from 'D:/project1/newAIProject/unplugin-pack-orchestrator/dist/index.js';

export default defineConfig({
  plugins: [
    packPlugin.vite({
      pack: {
        format: 'zip',
        fileName: 'test-[name]-[version]',
        verbose: true,
      },
    }),
  ],
  build: {
    outDir: 'dist',
  },
});
