/**
 * Vite 功能测试 — 验证 onBundleGenerated / [hash] / onAfterBuild
 */
import { build } from 'vite';
import packPlugin from '../dist/vite.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('[vite-test] Starting Vite build...');

try {
  await build({
    root: __dirname,
    logLevel: 'warn',
    plugins: [
      packPlugin({
        pack: {
          format: 'zip',
          fileName: 'vite-build-[name]-[hash:8]',
          outDir: 'dist',
          archiveOutDir: __dirname,
          include: ['**/*'],
          exclude: ['**/*.map'],
        },
        hooks: {
          onBeforeBuild: () => console.log('[vite] onBeforeBuild triggered ✓'),
          onBundleGenerated: (bundle) => {
            console.log('[vite] onBundleGenerated triggered ✓ — keys:', Object.keys(bundle));
          },
          onAfterBuild: (archivePath, format, checksums) => {
            console.log('[vite] onAfterBuild triggered ✓');
            console.log('[vite]   Archive:', archivePath);
            console.log('[vite]   Format:', format);
            console.log('[vite]   MD5:', checksums.md5);
            console.log('[vite]   SHA256:', checksums.sha256);
          },
          onError: (err) => console.error('[vite] ERROR:', err.message),
        },
      }),
    ],
    build: {
      outDir: path.join(__dirname, 'dist'),
    },
  });

  // Validate archive was created
  const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.zip') && f.startsWith('vite-build-'));
  if (files.length > 0) {
    console.log('\n✅ Vite test PASSED — archive:', files[files.length - 1]);
  } else {
    console.error('\n❌ Vite test FAILED — no archive found');
    process.exit(1);
  }
} catch (err) {
  console.error('\n❌ Vite test FAILED:', err.message);
  process.exit(1);
}
