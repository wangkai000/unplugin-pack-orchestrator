# unplugin-pack-orchestrator

<div>

**English** | [简体中文](./README.md)

> A universal pack plugin based on [unplugin](https://github.com/unjs/unplugin) for **Vite**, **Webpack**, **Rollup**, and **ESBuild**. Generates **ZIP** / **TAR** / **TAR.GZ** / **7Z** archives with zero runtime dependencies. Automatically computes checksums (MD5/SHA1/SHA256) after build, and supports auto-renaming archives via the `onAfterBuild` hook (e.g., appending hash or version) for traceable artifacts.

[Issues](https://github.com/wangkai000/unplugin-pack-orchestrator/issues) · [Feature Requests](https://github.com/wangkai000/unplugin-pack-orchestrator/issues)

</div>

---

## Features

- **Universal** — One API for Vite, Webpack, Rollup, and ESBuild via unplugin
- **Multi-format** — ZIP, TAR, TAR.GZ, 7Z
- **Smart naming** — File name templates with `[name]`, `[version]`, `[hash]`, `[timestamp]` placeholders
- **Precise filtering** — Glob-based file include/exclude patterns
- **Lifecycle hooks** — onBeforeBuild, onBundleGenerated, onAfterBuild, onError
- **Checksums** — Auto-generated MD5 / SHA1 / SHA256 hashes
- **Zero extra dependencies** — Archive creation uses only Node.js built-in modules

---

## Install

```bash
npm install unplugin-pack-orchestrator
# or
pnpm add unplugin-pack-orchestrator
# or
yarn add unplugin-pack-orchestrator
```

---

## Quick Start

### Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import packOrchestrator from 'unplugin-pack-orchestrator/vite'

export default defineConfig({
  plugins: [
    packOrchestrator({
      pack: {
        format: 'zip',
        fileName: 'dist-[name]-[version]',
        outDir: 'dist',           // source directory to archive
        archiveOutDir: '.',       // archive output directory, defaults to project root
        include: ['**/*'],
        exclude: ['**/*.map', '**/*.d.ts', 'node_modules/**'],
        compressionLevel: 9,      // 0-9, higher = more compression
      },
      hooks: {
        onBeforeBuild: () => console.log('Build started...'),
        onBundleGenerated: (bundle) => console.log('Bundle generated:', bundle),
        onAfterBuild: (path, format, checksums) => {
          console.log('Archive created:', path)
          console.log('MD5:', checksums.md5)
          console.log('SHA256:', checksums.sha256)
        },
        onError: (err) => console.error('Error:', err.message),
      },
    }),
  ],
})
```

> **Note**: After Vite build completes, the plugin automatically archives the `outDir`. No additional steps needed.

### Rollup

```javascript
// rollup.config.js
import packOrchestrator from 'unplugin-pack-orchestrator/rollup'

export default {
  input: './src/index.js',
  output: { dir: 'dist', format: 'es' },
  plugins: [
    packOrchestrator({
      pack: {
        format: 'tar.gz',
        fileName: 'bundle-[name]-[version]',
        outDir: 'dist',
        archiveOutDir: './releases',
        include: ['**/*'],
        exclude: ['**/*.map', '**/*.d.ts'],
        compressionLevel: 9,
      },
      hooks: {
        onBeforeBuild: () => console.log('Packing...'),
        onAfterBuild: (path, format, checksums) => {
          console.log('Archive created:', path)
        },
        onError: (err) => console.error('Packing failed:', err.message),
      },
    }),
  ],
}
```

> **Note**: When Rollup outputs to a directory, the plugin triggers archiving after writing to `output.dir`.

### Webpack

```javascript
// webpack.config.js
const packOrchestrator = require('unplugin-pack-orchestrator/webpack')

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: 'dist',
    filename: 'bundle.js',
  },
  plugins: [
    packOrchestrator({
      pack: {
        format: 'zip',
        fileName: 'webpack-[name]-[version]-[timestamp]',
        outDir: 'dist',
        archiveOutDir: './dist-archives',
        include: ['**/*'],
        exclude: ['**/*.map', '**/*.d.ts', 'node_modules/**'],
        compressionLevel: 9,
      },
      hooks: {
        onBeforeBuild: () => console.log('Webpack build started'),
        onBundleGenerated: (bundle) => console.log('Bundle generated:', bundle),
        onAfterBuild: (path, format, checksums) => {
          console.log('Archive created:', path)
          console.log('MD5:', checksums.md5)
          console.log('SHA256:', checksums.sha256)
        },
        onError: (err) => console.error('Error:', err.message),
      },
    }),
  ],
}
```

> **Note**: Webpack uses CommonJS import, plugin path is `unplugin-pack-orchestrator/webpack`.

### ESBuild

```javascript
// build.js
const packOrchestrator = require('unplugin-pack-orchestrator/esbuild')

async function build() {
  const result = await import('esbuild').then(esbuild => esbuild.build({
    entryPoints: ['./src/index.js'],
    bundle: true,
    outfile: 'dist/bundle.js',
    platform: 'node',
    target: 'node18',
    plugins: [
      packOrchestrator({
        pack: {
          format: '7z',
          fileName: 'esbuild-[name]-[version]',
          outDir: 'dist',
          archiveOutDir: './artifacts',
          include: ['**/*'],
          exclude: ['**/*.map'],
          compressionLevel: 9,
        },
        hooks: {
          onAfterBuild: (path, format, checksums) => {
            console.log('Archive created:', path)
            console.log('MD5:', checksums.md5)
          },
        },
      }),
    ],
  }))
  await result
}

build()
```

> **Note**: ESBuild uses dynamic import, note the plugin path. ESBuild mode supports `format: '7z'`.

---

## Options

### pack

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `format` | `'zip' \| 'tar' \| 'tar.gz' \| '7z'` | `'zip'` | Archive format |
| `fileName` | `string` | `'[name]-[version]'` | Output file name with placeholders |
| `outDir` | `string` | `'dist'` | Source directory to archive |
| `archiveOutDir` | `string` | `'.'` | Archive output directory |
| `compressionLevel` | `number` | `9` | Compression level 0-9 |
| `include` | `string[]` | `[]` | Glob patterns to include |
| `exclude` | `string[]` | `[]` | Glob patterns to exclude |

### fileName Placeholders

| Placeholder | Description | Example |
|:------------|:------------|:--------|
| `[name]` | package.json name | `my-app` |
| `[version]` | package.json version | `1.0.0` |
| `[timestamp]` | Current timestamp (ms) | `1714012345678` |
| `[hash]` | Bundle content MD5 hash (32 chars) | `a1b2c3d4...` |
| `[hash:N]` | First N chars of MD5 hash | `[hash:8]` → `a1b2c3d4` |

If no extension is specified, the plugin automatically appends the correct suffix based on `format`.

### Hooks

| Hook | Parameters | Description |
|:-----|:-----------|:------------|
| `onBeforeBuild` | `()` | Called before build starts |
| `onBundleGenerated` | `(bundle)` | Called after bundle is generated, before archiving |
| `onAfterBuild` | `(archivePath, format, checksums)` | Called after archive is created |
| `onError` | `(error)` | Called on error |

### onAfterBuild

Called after archive is created. Return a new path to auto-rename (takes effect when the returned path differs from the original):

```typescript
// 1. Insert sha1 hash before extension
// app.zip → app-3a7b2c1d.zip
onAfterBuild: (path, format, checksums) =>
  path.replace(/(\.(?:zip|tar\.gz|tar|7z))$/, `-${checksums.sha1.slice(0, 8)}$1`);

// 2. Replace filename entirely with MD5
// app.zip → a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6.zip
onAfterBuild: (path, format, checksums) =>
  path.replace(/^.+(?=\.\w+$)/, checksums.md5);

// 3. Append format and hash to original filename
// app.zip → app-zip-3a7b2c1d.zip
onAfterBuild: (path, format, checksums) =>
  path.replace(/(\.\w+)$/, `-${format}-${checksums.sha256.slice(0, 8)}$1`);

// 4. Fully custom filename using format param for extension
// app.zip → release-a1b2c3d4e5f6.zip
onAfterBuild: (path, format, checksums) =>
  `release-${checksums.md5.slice(0, 12)}.${format}`;
```

`checksums` structure:

```typescript
{ md5: string; sha1: string; sha256: string }
```

> ⚠️ The returned path extension must match the `format` (e.g., `zip` format must end in `.zip`). A warning is emitted on mismatch. The file will still be renamed, but an incorrect extension may cause downstream parsing issues.
---

## Complete Examples

### Vite + tar.gz + Release Pipeline

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import packOrchestrator from 'unplugin-pack-orchestrator/vite'

export default defineConfig({
  plugins: [
    packOrchestrator({
      pack: {
        format: 'tar.gz',
        fileName: 'release-[name]-v[version]-[timestamp]',
        outDir: 'dist',
        archiveOutDir: './releases',
        compressionLevel: 9,
        include: ['**/*'],
        exclude: [
          '**/*.map',
          '**/*.d.ts',
          'node_modules/**',
          '.git/**',
        ],
      },
      hooks: {
        onBeforeBuild: () => console.log('Building and packing...'),
        onBundleGenerated: (bundle) => console.log('Bundle generated'),
        onAfterBuild: (path, format, checksums) => {
          console.log('Archive complete!')
          console.log('File:  ', path)
          console.log('MD5:   ', checksums.md5)
          console.log('SHA256:', checksums.sha256)
        },
        onError: (err) => console.error('Error:', err.message),
      },
    }),
  ],
})
```

### Webpack + 7z + Auto Rename

```javascript
// webpack.config.js
const packOrchestrator = require('unplugin-pack-orchestrator/webpack')
const fs = require('fs')
const path = require('path')

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: 'dist',
    filename: 'bundle.js',
  },
  plugins: [
    packOrchestrator({
      pack: {
        format: '7z',
        fileName: '[name]-[version]',
        outDir: 'dist',
        archiveOutDir: './artifacts',
        include: ['**/*'],
        exclude: ['**/*.map', 'node_modules/**'],
        compressionLevel: 9,
      },
      hooks: {
        onAfterBuild: (archivePath, format, checksums) => {
          const dir = path.dirname(archivePath)
          const ext = path.extname(archivePath)
          const base = path.basename(archivePath, ext)
          const newPath = path.join(dir, `${base}-${checksums.sha256.slice(0, 8)}${ext}`)
          fs.renameSync(archivePath, newPath)
          console.log('Renamed:', newPath)
        },
      },
    }),
  ],
}
```

---

## License

MIT
