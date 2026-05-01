// Bug4 fixed: require() now returns the function directly
// Both forms work: require(...) or require(...).default
const packPlugin = require('../dist/webpack.cjs');
const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  plugins: [
    packPlugin({
      pack: {
        format: 'zip',
        // [hash] requires onBundleGenerated to fire first (Bug3 fixed via emit hook)
        fileName: 'webpack-test-[name]-[hash:8]',
        outDir: 'dist',
      },
      hooks: {
        // Bug3 fixed: onBundleGenerated now triggers via compiler.hooks.emit
        onBundleGenerated: (bundle) => console.log('[webpack] onBundleGenerated keys:', Object.keys(bundle).length),
        onAfterBuild: (archivePath, format, checksums) => {
          console.log('[webpack] Archive:', archivePath);
          console.log('[webpack] MD5:', checksums.md5);
          console.log('[webpack] SHA256:', checksums.sha256);
        },
        onError: (err) => console.error('[webpack] Error:', err.message),
      },
    }),
  ],
};

