import packPlugin from '../dist/rollup.js';

export default {
  input: './src/main.js',
  output: {
    dir: 'dist',
    format: 'es',
  },
  plugins: [
    packPlugin({
      pack: {
        format: 'zip',
        fileName: 'rollup-test-[name]-[hash:8]',
        outDir: 'dist',
      },
      hooks: {
        onBundleGenerated: (bundle) => console.log('[rollup] onBundleGenerated keys:', Object.keys(bundle)),
        onAfterBuild: (path, format, checksums) => {
          console.log('[rollup] Archive:', path);
          console.log('[rollup] MD5:', checksums.md5);
        },
        onError: (err) => console.error('[rollup] Error:', err.message),
      },
    }),
  ],
};
