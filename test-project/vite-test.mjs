import { build } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(__dirname, '../test-project');

// Create a minimal Vite project
const srcDir = path.join(projectDir, 'src');
fs.mkdirSync(srcDir, { recursive: true });

fs.writeFileSync(path.join(projectDir, 'index.html'), `
<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body><div id="app"></div><script src="./src/main.js"><\/script></body>
</html>
`);

fs.writeFileSync(path.join(srcDir, 'main.js'), `
console.log('Hello from unplugin-pack-orchestrator test!');
`);

fs.writeFileSync(path.join(projectDir, 'vite.config.js'), `
import { defineConfig } from 'vite';
import packPlugin from './dist/index.js';

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
`);

console.log('Running Vite build with unplugin-pack-orchestrator...');

try {
  await build({
    root: projectDir,
    logLevel: 'info',
  });

  // Check if archive was created
  const files = fs.readdirSync(projectDir);
  const zipFiles = files.filter(f => f.endsWith('.zip'));

  console.log('\n✅ Build completed!');
  console.log('ZIP files found:', zipFiles);

  if (zipFiles.length > 0) {
    const zipPath = path.join(projectDir, zipFiles[0]);
    const stats = fs.statSync(zipPath);
    console.log(`Archive: ${zipFiles[0]} (${(stats.size / 1024).toFixed(2)} KB)`);
  }
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
