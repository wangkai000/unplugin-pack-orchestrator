/**
 * Webpack 全量自测 v2
 */
const packPlugin = require('../dist/webpack.cjs');
const path = require('path');
const fs = require('fs');
const webpack = require('webpack');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');

if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
fs.mkdirSync(SRC, { recursive: true });
fs.writeFileSync(path.join(SRC, 'index.js'), 'console.log("hello webpack"); module.exports = { add: (a,b) => a+b };');

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

function runWebpack(config) {
  return new Promise((resolve, reject) => {
    webpack(config, (err, stats) => {
      if (err) reject(err);
      else if (stats.hasErrors()) reject(new Error(stats.toJson().errors[0]?.message || 'unknown'));
      else resolve(stats);
    });
  });
}

async function runTest(testName, pluginOpts, archivePrefix) {
  currentTest = testName;
  console.log(`\n📦 Webpack Test: ${testName}`);

  cleanupArchives(ROOT, archivePrefix);
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
    await runWebpack({
      mode: 'production',
      entry: './src/index.js',
      output: { path: DIST, filename: 'bundle.js' },
      plugins: [packPlugin(opts)],
    });

    log(!!hookLog.onBeforeBuild, 'onBeforeBuild triggered');
    log(hookLog.onBundleGenerated > 0, `onBundleGenerated triggered (${hookLog.onBundleGenerated} assets)`);
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
  console.log('  Webpack 全量自测 v2');
  console.log('═══════════════════════════════════════');

  await runTest('ZIP + [hash:8]', {
    pack: { format: 'zip', fileName: 'wp-zip-[name]-[hash:8]', outDir: 'dist', archiveOutDir: '.' },
  }, 'wp-zip-');

  await runTest('TAR + [name]-[version]', {
    pack: { format: 'tar', fileName: 'wp-tar-[name]-[version]', outDir: 'dist', archiveOutDir: '.' },
  }, 'wp-tar-');

  await runTest('TAR.GZ + [timestamp]', {
    pack: { format: 'tar.gz', fileName: 'wp-targz-[timestamp]', outDir: 'dist', archiveOutDir: '.' },
  }, 'wp-targz-');

  await runTest('7Z + [hash]', {
    pack: { format: '7z', fileName: 'wp-7z-[hash]', outDir: 'dist', archiveOutDir: '.' },
  }, 'wp-7z-');

  await runTest('ZIP + all placeholders', {
    pack: { format: 'zip', fileName: 'wp-full-[name]-v[version]-[hash:8]-[timestamp]', outDir: 'dist', archiveOutDir: '.' },
  }, 'wp-full-');

  await runTest('ZIP + include/exclude', {
    pack: {
      format: 'zip', fileName: 'wp-filter-[name]', outDir: 'dist', archiveOutDir: '.',
      include: ['**/*.js'],
      exclude: ['**/*.map'],
    },
  }, 'wp-filter-');

  // onAfterBuild auto-rename
  currentTest = 'onAfterBuild auto-rename';
  console.log(`\n📦 Webpack Test: ${currentTest}`);
  cleanupArchives(ROOT, 'wp-rename-');
  if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  try {
    let renamedPath = null;
    await runWebpack({
      mode: 'production',
      entry: './src/index.js',
      output: { path: DIST, filename: 'bundle.js' },
      plugins: [packPlugin({
        pack: { format: 'zip', fileName: 'wp-rename-[name]', outDir: 'dist', archiveOutDir: '.' },
        hooks: {
          onAfterBuild: (archivePath, format, checksums) => {
            renamedPath = archivePath.replace(/(\.zip)$/, `-${checksums.sha1.slice(0, 8)}$1`);
            return renamedPath;
          },
        },
      })],
    });
    const exists = renamedPath && fs.existsSync(renamedPath);
    log(exists, `auto-rename: ${path.basename(renamedPath || '')} ${exists ? 'exists' : 'MISSING'}`);
  } catch (err) {
    log(false, `auto-rename error: ${err.message}`);
  }

  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log('\n═══════════════════════════════════════');
  console.log(`  Webpack 结果: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log('  Failed:');
    results.filter(r => !r.pass).forEach(r => console.log(`    ❌ ${r.test}: ${r.msg}`));
  }
  console.log('═══════════════════════════════════════');

  ['wp-zip-', 'wp-tar-', 'wp-targz-', 'wp-7z-', 'wp-full-', 'wp-filter-', 'wp-rename-'].forEach(prefix => {
    cleanupArchives(ROOT, prefix);
  });

  process.exit(failed > 0 ? 1 : 0);
}

main();
