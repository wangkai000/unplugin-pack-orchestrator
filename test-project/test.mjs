import { build } from 'vite';
import path from 'path';
import fs from 'fs';

// Create test dist folder
const distDir = path.resolve(process.cwd(), 'dist');
fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(path.join(distDir, 'index.html'), '<html><body>Hello</body></html>');
fs.writeFileSync(path.join(distDir, 'app.js'), 'console.log("hello");');
fs.mkdirSync(path.join(distDir, 'assets'), { recursive: true });
fs.writeFileSync(path.join(distDir, 'assets', 'style.css'), 'body { color: red; }');

// Import plugin
const { default: packPlugin } = await import('../dist/index.js');

console.log('Testing unplugin-pack-orchestrator...');
console.log('Plugin:', packPlugin);

// Test with vite build
const plugin = packPlugin.vite({
  pack: {
    format: 'zip',
    fileName: 'test-[name]-[version]',
    verbose: true,
  },
});

console.log('Plugin instance:', plugin.name);
console.log('Build test complete!');
