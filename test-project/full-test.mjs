/**
 * Vite 全量自测 v2
 */
import { build } from 'vite';
import packPlugin from '../dist/vite.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

const SRC = path.join(ROOT, 'src');
fs.mkdirSync(SRC, { recursive: true });
fs.writeFileSync(path.join(SRC, 'main.js'), 'console.log("hello vite"); document.getElementById("app").textContent = "OK";');
fs.writeFileSync(path.join(ROOT, 'index.html'), '<!DOCTYPE html><html><head><title>Vite</title></head><body><div id="app"></div><script type="module" src="./src/main.js"></script></body></html>');

const results = [];
let currentTest = '';

function log(pass, msg) {
  const icon = pass ? '✅' : '❌';
  console.log(`  ${icon} ${msg}`);
  results.push({ test: currentTest, pass, msg });
}

function cleanupArchives(dir, prefix) {
  const files = fs.readdirSync(dir).filter(f =>
    f.startsWith(prefix) && (f.endsWith('.zip') || f.endsWith('.tar') || f.endsWith('.7z') || f.endsWith('.tar.gz'))
  );
  for (const f of files) fs.unlinkSync(path.join(dir, f));
}

function findLatestArchive(dir, prefix) {
  const files = fs.readdirSync(dir).filter(f =>
    f.startsWith(prefix) && (f.endsWith('.zip') || f.endsWith('.tar') || f.endsWith('.7z') || f.endsWith('.tar.gz'))
  );
  return files.length > 0 ? files[files.length - 1] : null;
}

async function runTest(testName, pluginOpts, archivePrefix) {
  currentTest = testName;
  console.log(`\n📦 Vite Test: ${testName}`);

  cleanupArchives(ROOT, archivePrefix);
  const distDir = path.join(ROOT, 'dist');
  if (fs.existsSync(distDir)) fs.rmSync(distDir, { recursive: true, force: true });

  const hookLog = {};
  const opts = {
    ...pluginOpts,
    hooks: {
      onBeforeBuild: () => { hookLog.onBeforeBuild = true; },
      onBundleGenerated: (bundle) => { hookLog.onBundleGenerated = Object.keys(bundle).length; },
      onAfterBuild: (archivePath, format, checksums) => {
        hookLog.onAfterBuild = { format, path: archivePath, md5: checksums.md5, sha1: checksums.sha1, sha256: checksums.sha256 };
      },
      onError: (err) => { hookLog.onError = err.message; },
    },
  };

  try {
    await build({
      root: ROOT,
      logLevel: 'silent',
      plugins: [packPlugin(opts)],
      build: { outDir: distDir },
    });

    log(!!hookLog.onBeforeBuild, 'onBeforeBuild triggered');
    log(hookLog.onBundleGenerated > 0, `onBundleGenerated triggered (${hookLog.onBundleGenerated} chunks)`);
    log(!!hookLog.onAfterBuild, 'onAfterBuild triggered');
    log(!!hookLog.onAfterBuild?.md5 && !!hookLog.onAfterBuild?.sha1 && !!hookLog.onAfterBuild?.sha256, 'checksums all present');

    const archiveName = findLatestArchive(ROOT, archivePrefix);
    log(!!archiveName, `archive created: ${archiveName || 'NOT FOUND'}`);

    if (archiveName) {
      const stat = fs.statSync(path.join(ROOT, archiveName));
      log(stat.size > 0, `archive non-empty: ${(stat.size / 1024).toFixed(2)} KB`);
      const format = opts.pack?.format || 'zip';
      const expectedExt = { zip: '.zip', tar: '.tar', 'tar.gz': '.tar.gz', '7z': '.7z' }[format];
      log(archiveName.endsWith(expectedExt), `extension matches format (${expectedExt})`);
    }

    log(!hookLog.onError, 'no error');
    return { hookLog, archiveName };
  } catch (err) {
    log(false, `build error: ${err.message}`);
    return { hookLog, archiveName: null };
  }
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  Vite 全量自测 v2');
  console.log('═══════════════════════════════════════');

  await runTest('ZIP + [hash:8]', {
    pack: { format: 'zip', fileName: 'vt-zip-[name]-[hash:8]', outDir: 'dist', archiveOutDir: '.' },
  }, 'vt-zip-');

  await runTest('TAR + [name]-[version]', {
    pack: { format: 'tar', fileName: 'vt-tar-[name]-[version]', outDir: 'dist', archiveOutDir: '.' },
  }, 'vt-tar-');

  await runTest('TAR.GZ + [timestamp]', {
    pack: { format: 'tar.gz', fileName: 'vt-targz-[timestamp]', outDir: 'dist', archiveOutDir: '.' },
  }, 'vt-targz-');

  await runTest('7Z + [hash]', {
    pack: { format: '7z', fileName: 'vt-7z-[hash]', outDir: 'dist', archiveOutDir: '.' },
  }, 'vt-7z-');

  await runTest('ZIP + all placeholders', {
    pack: { format: 'zip', fileName: 'vt-full-[name]-v[version]-[hash:8]-[timestamp]', outDir: 'dist', archiveOutDir: '.' },
  }, 'vt-full-');

  await runTest('ZIP + include/exclude', {
    pack: {
      format: 'zip', fileName: 'vt-filter-[name]', outDir: 'dist', archiveOutDir: '.',
      include: ['**/*.js'],
      exclude: ['**/*.map'],
    },
  }, 'vt-filter-');

  // onAfterBuild auto-rename
  currentTest = 'onAfterBuild auto-rename';
  console.log(`\n📦 Vite Test: ${currentTest}`);
  cleanupArchives(ROOT, 'vt-rename-');
  const distDir = path.join(ROOT, 'dist');
  if (fs.existsSync(distDir)) fs.rmSync(distDir, { recursive: true, force: true });

  try {
    let renamedPath = null;
    await build({
      root: ROOT,
      logLevel: 'silent',
      plugins: [packPlugin({
        pack: { format: 'zip', fileName: 'vt-rename-[name]', outDir: 'dist', archiveOutDir: '.' },
        hooks: {
          onAfterBuild: (archivePath, format, checksums) => {
            renamedPath = archivePath.replace(/(\.zip)$/, `-${checksums.md5.slice(0, 8)}$1`);
            return renamedPath;
          },
        },
      })],
      build: { outDir: distDir },
    });
    const exists = renamedPath && fs.existsSync(renamedPath);
    log(exists, `auto-rename: ${path.basename(renamedPath || '')} ${exists ? 'exists' : 'MISSING'}`);
  } catch (err) {
    log(false, `auto-rename error: ${err.message}`);
  }

  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log('\n═══════════════════════════════════════');
  console.log(`  Vite 结果: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log('  Failed:');
    results.filter(r => !r.pass).forEach(r => console.log(`    ❌ ${r.test}: ${r.msg}`));
  }
  console.log('═══════════════════════════════════════');

  ['vt-zip-', 'vt-tar-', 'vt-targz-', 'vt-7z-', 'vt-full-', 'vt-filter-', 'vt-rename-'].forEach(prefix => {
    cleanupArchives(ROOT, prefix);
  });

  process.exit(failed > 0 ? 1 : 0);
}

main();
