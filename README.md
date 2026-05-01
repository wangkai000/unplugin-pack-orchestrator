# unplugin-pack-orchestrator

<div align="center">

**[English](#english) | [中文](#中文)**

</div>

---

<a name="english"></a>
## English

A universal bundler plugin based on [unplugin](https://github.com/unjs/unplugin), supporting **Vite**, **Webpack**, **Rollup**, and **ESBuild** for archive packaging (ZIP / TAR / TAR.GZ / 7Z).

### Installation

```bash
npm install unplugin-pack-orchestrator
```

### Usage by Bundler

#### Vite

```js
// vite.config.js
import { defineConfig } from 'vite';
import packPlugin from 'unplugin-pack-orchestrator/vite';

export default defineConfig({
  plugins: [
    packPlugin({
      pack: {
        format: 'zip',                    // zip | tar | tar.gz | 7z
        fileName: 'dist-[name]-[version]', // placeholders supported
        outDir: 'dist',                   // directory to archive
        archiveOutDir: '.',               // where to put the archive
        include: ['**/*'],                // glob patterns to include
        exclude: ['**/*.map'],            // glob patterns to exclude
      },
    }),
  ],
});
```

#### Rollup

```js
// rollup.config.js
import packPlugin from 'unplugin-pack-orchestrator/rollup';

export default {
  input: './src/main.js',
  output: { dir: 'dist', format: 'es' },
  plugins: [
    packPlugin({
      pack: {
        format: 'zip',
        fileName: 'bundle-[name]',
        outDir: 'dist',
      },
    }),
  ],
};
```

#### Webpack

```js
// webpack.config.js
const { default: packPlugin } = require('unplugin-pack-orchestrator/webpack');
const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: { path: path.resolve(__dirname, 'dist'), filename: 'bundle.js' },
  plugins: [
    packPlugin({
      pack: {
        format: 'zip',
        fileName: 'webpack-[name]',
        outDir: 'dist',
      },
    }),
  ],
};
```

#### ESBuild

```js
// build.js
const esbuild = require('esbuild');
const packPlugin = require('unplugin-pack-orchestrator/esbuild').default;

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
          fileName: 'esbuild-[name]',
          outDir: 'dist',
        },
      }),
    ],
  });
}

build();
```

### Configuration

#### `pack` Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `format` | `'zip' \| 'tar' \| 'tar.gz' \| '7z'` | `'zip'` | Archive format |
| `fileName` | `string` | `'[name]-[version]'` | File name template. Supports `[name]`, `[version]`, `[hash]`, `[timestamp]` |
| `outDir` | `string` | `'dist'` | Directory to archive |
| `archiveOutDir` | `string` | `'.'` | Where to place the generated archive |
| `compressionLevel` | `number` | `9` | Compression level (0-9) |
| `include` | `string[]` | - | Glob patterns to include |
| `exclude` | `string[]` | - | Glob patterns to exclude |

#### Hooks

| Hook | When Called |
|------|-------------|
| `onBeforeBuild` | Before build starts |
| `onBundleGenerated` | After bundle is generated |
| `onAfterBuild` | After archive is created |
| `onError` | On error |

### Example

```js
packPlugin({
  pack: {
    format: 'tar.gz',
    fileName: 'release-[name]-[version]-[timestamp]',
    outDir: 'dist',
    archiveOutDir: 'releases',
    include: ['**/*'],
    exclude: ['**/*.map', '**/*.d.ts'],
  },
  hooks: {
    onAfterBuild: (archivePath, format, checksums) => {
      console.log(`Archive created: ${archivePath}`);
      console.log(`MD5: ${checksums.md5}`);
    },
  },
  verbose: true,
})
```

---

<a name="中文"></a>
## 中文

基于 [unplugin](https://github.com/unjs/unplugin) 的通用打包归档插件，支持 **Vite**、**Webpack**、**Rollup**、**ESBuild** 等多种构建工具，生成 ZIP / TAR / TAR.GZ / 7Z 归档。

### 安装

```bash
npm install unplugin-pack-orchestrator
```

### 按构建工具使用

#### Vite

```js
// vite.config.js
import { defineConfig } from 'vite';
import packPlugin from 'unplugin-pack-orchestrator/vite';

export default defineConfig({
  plugins: [
    packPlugin({
      pack: {
        format: 'zip',                    // zip | tar | tar.gz | 7z
        fileName: 'dist-[name]-[version]', // 支持占位符
        outDir: 'dist',                   // 要打包的目录
        archiveOutDir: '.',               // 归档文件输出目录
        include: ['**/*'],                // 包含的文件 glob 模式
        exclude: ['**/*.map'],            // 排除的文件 glob 模式
      },
    }),
  ],
});
```

#### Rollup

```js
// rollup.config.js
import packPlugin from 'unplugin-pack-orchestrator/rollup';

export default {
  input: './src/main.js',
  output: { dir: 'dist', format: 'es' },
  plugins: [
    packPlugin({
      pack: {
        format: 'zip',
        fileName: 'bundle-[name]',
        outDir: 'dist',
      },
    }),
  ],
};
```

#### Webpack

```js
// webpack.config.js
const { default: packPlugin } = require('unplugin-pack-orchestrator/webpack');
const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: { path: path.resolve(__dirname, 'dist'), filename: 'bundle.js' },
  plugins: [
    packPlugin({
      pack: {
        format: 'zip',
        fileName: 'webpack-[name]',
        outDir: 'dist',
      },
    }),
  ],
};
```

#### ESBuild

```js
// build.js
const esbuild = require('esbuild');
const packPlugin = require('unplugin-pack-orchestrator/esbuild').default;

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
          fileName: 'esbuild-[name]',
          outDir: 'dist',
        },
      }),
    ],
  });
}

build();
```

### 配置说明

#### `pack` 选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `format` | `'zip' \| 'tar' \| 'tar.gz' \| '7z'` | `'zip'` | 归档格式 |
| `fileName` | `string` | `'[name]-[version]'` | 文件名模板，支持 `[name]` `[version]` `[hash]` `[timestamp]` |
| `outDir` | `string` | `'dist'` | 要打包的输出目录 |
| `archiveOutDir` | `string` | `'.'` | 归档文件输出目录 |
| `compressionLevel` | `number` | `9` | 压缩级别 (0-9) |
| `include` | `string[]` | - | 包含的文件 glob 模式 |
| `exclude` | `string[]` | - | 排除的文件 glob 模式 |

#### 生命周期钩子

| 钩子 | 触发时机 |
|------|---------|
| `onBeforeBuild` | 构建开始前 |
| `onBundleGenerated` | 产物生成后 |
| `onAfterBuild` | 归档完成后 |
| `onError` | 发生错误时 |

### 完整示例

```js
packPlugin({
  pack: {
    format: 'tar.gz',
    fileName: 'release-[name]-[version]-[timestamp]',
    outDir: 'dist',
    archiveOutDir: 'releases',
    include: ['**/*'],
    exclude: ['**/*.map', '**/*.d.ts'],
  },
  hooks: {
    onAfterBuild: (archivePath, format, checksums) => {
      console.log(`归档完成: ${archivePath}`);
      console.log(`MD5: ${checksums.md5}`);
    },
  },
  verbose: true,
})
```

---

## License

MIT
