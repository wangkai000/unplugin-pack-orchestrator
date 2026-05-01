/**
 * ESBuild 全量自测 v2
 * 每次构建后立即验证并删除归档，避免残留干扰
 */
const esbuild = require('esbuild');
const packPlugin = require('../dist/esbuild.cjs');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');

// 准备 dist
if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

// 准备源码
fs.mkdirSync(SRC, { recursive: true });
fs.writeFileSync(path.join(SRC, 'index.js'), 'console.log("hello esbuild");');
fs.writeFileSync(path.join(SRC, 'util.js'), 'module.exports = { add: (a,b) => a+b };');
fs.writeFileSync(path.join(SRC, 'index.d.ts'), 'declare function add(a: number, b: number): number;');
fs.writeFileSync(path.join(SRC, 'index.js.map'), '{}');

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
  console.log(`\n📦 ESBuild Test: ${testName}`);

  // 清理上一次的归档
  cleanupArchives(ROOT, archivePrefix);

  // 清理 dist
  if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

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
    await esbuild.build({
      entryPoints: ['./src/index.js'],
      bundle: true,
      outfile: 'dist/bundle.js',
      platform: 'node',
      plugins: [packPlugin(opts)],
    });

    log(!!hookLog.onBeforeBuild, 'onBeforeBuild triggered');
    log(hookLog.onBundleGenerated > 0, `onBundleGenerated triggered (${hookLog.onBundleGenerated} outputs)`);
    log(!!hookLog.onAfterBuild, 'onAfterBuild triggered');
    log(!!hookLog.onAfterBuild?.md5 && !!hookLog.onAfterBuild?.sha1 && !!hookLog.onAfterBuild?.sha256, 'checksums (md5+sha1+sha256) all present');

    // 验证归档文件
    const archiveName = findLatestArchive(ROOT, archivePrefix);
    log(!!archiveName, `archive created: ${archiveName || 'NOT FOUND'}`);

    if (archiveName) {
      const stat = fs.statSync(path.join(ROOT, archiveName));
      log(stat.size > 0, `archive non-empty: ${(stat.size / 1024).toFixed(2)} KB`);

      // 验证扩展名与 format 匹配
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
  console.log('  ESBuild 全量自测 v2');
  console.log('═══════════════════════════════════════');

  // 1. ZIP + [hash:8]
  await runTest('ZIP + [hash:8]', {
    pack: { format: 'zip', fileName: 'esb-zip-[name]-[hash:8]', outDir: 'dist', archiveOutDir: '.' },
  }, 'esb-zip-');

  // 2. TAR + [name]-[version]
  await runTest('TAR + [name]-[version]', {
    pack: { format: 'tar', fileName: 'esb-tar-[name]-[version]', outDir: 'dist', archiveOutDir: '.' },
  }, 'esb-tar-');

  // 3. TAR.GZ + [timestamp]
  await runTest('TAR.GZ + [timestamp]', {
    pack: { format: 'tar.gz', fileName: 'esb-targz-[timestamp]', outDir: 'dist', archiveOutDir: '.' },
  }, 'esb-targz-');

  // 4. 7Z + [hash] full
  await runTest('7Z + [hash] (full 32-char)', {
    pack: { format: '7z', fileName: 'esb-7z-[hash]', outDir: 'dist', archiveOutDir: '.' },
  }, 'esb-7z-');

  // 5. ZIP + all placeholders
  await runTest('ZIP + all placeholders', {
    pack: { format: 'zip', fileName: 'esb-full-[name]-v[version]-[hash:8]-[timestamp]', outDir: 'dist', archiveOutDir: '.' },
  }, 'esb-full-');

  // 6. ZIP + include/exclude
  await runTest('ZIP + include/exclude glob', {
    pack: {
      format: 'zip', fileName: 'esb-filter-[name]', outDir: 'dist', archiveOutDir: '.',
      include: ['**/*.js'],
      exclude: ['**/*.map', '**/*.d.ts'],
    },
  }, 'esb-filter-');

  // 7. onAfterBuild auto-rename (sha1 prefix before extension)
  currentTest = 'onAfterBuild auto-rename';
  console.log(`\n📦 ESBuild Test: ${currentTest}`);
  cleanupArchives(ROOT, 'esb-rename-');
  if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  try {
    let renamedPath = null;
    await esbuild.build({
      entryPoints: ['./src/index.js'],
      bundle: true,
      outfile: 'dist/bundle.js',
      platform: 'node',
      plugins: [packPlugin({
        pack: { format: 'zip', fileName: 'esb-rename-[name]', outDir: 'dist', archiveOutDir: '.' },
        hooks: {
          onAfterBuild: (archivePath, format, checksums) => {
            renamedPath = archivePath.replace(/(\.zip)$/, `-${checksums.sha1.slice(0, 8)}$1`);
            return renamedPath;
          },
        },
      })],
    });
    const newName = path.basename(renamedPath || '');
    const exists = renamedPath && fs.existsSync(renamedPath);
    log(exists, `auto-rename: ${newName} ${exists ? 'exists' : 'MISSING'}`);
  } catch (err) {
    log(false, `auto-rename error: ${err.message}`);
  }

  // Summary
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log('\n═══════════════════════════════════════');
  console.log(`  ESBuild 结果: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log('  Failed:');
    results.filter(r => !r.pass).forEach(r => console.log(`    ❌ ${r.test}: ${r.msg}`));
  }
  console.log('═══════════════════════════════════════');

  // Final cleanup
  ['esb-zip-', 'esb-tar-', 'esb-targz-', 'esb-7z-', 'esb-full-', 'esb-filter-', 'esb-rename-'].forEach(prefix => {
    cleanupArchives(ROOT, prefix);
  });

  process.exit(failed > 0 ? 1 : 0);
}

main();
