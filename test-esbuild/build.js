const esbuild = require('esbuild');
// Bug4 fixed: require() now returns the function directly (not { default: fn })
const packPlugin = require('../dist/esbuild.cjs');

async function build() {
  await esbuild.build({
    entryPoints: ['./src/index.js'],
    bundle: true,
    outfile: 'dist/bundle.js',
    platform: 'node',
    plugins: [
      packPlugin({
        pack: {
          format: 'zip',
          // [hash] now works: Bug1 fixed (metafile:true forced in plugin setup)
          fileName: 'esbuild-test-[name]-[hash:8]',
          outDir: 'dist',
        },
        hooks: {
          onBundleGenerated: (bundle) => console.log('[esbuild] onBundleGenerated keys:', Object.keys(bundle)),
          onAfterBuild: (path, format, checksums) => {
            console.log('[esbuild] Archive:', path);
            console.log('[esbuild] MD5:', checksums.md5);
            console.log('[esbuild] SHA256:', checksums.sha256);
          },
        },
      }),
    ],
  });
  console.log('Build complete!');
}

build().catch(console.error);
