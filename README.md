# unplugin-pack-orchestrator

<div align="center">

[English](./README.en.md) | **中文**

> 基于 [unplugin](https://github.com/unjs/unplugin) 的通用打包归档插件，支持 **Vite**、**Webpack**、**Rollup**、**ESBuild**，可生成 **ZIP** / **TAR** / **TAR.GZ** / **7Z** 归档文件，运行时零额外依赖。构建完成后自动计算校验和（MD5/SHA1/SHA256），支持通过 `onAfterBuild` 钩子自动重命名归档文件（如追加哈希、版本号），实现产物可追溯。

[报告问题](https://github.com/wangkai000/unplugin-pack-orchestrator/issues) · [功能请求](https://github.com/wangkai000/unplugin-pack-orchestrator/issues)

</div>

---

## 功能特点

- **通用适配** — 通过 unplugin 适配层，一套 API 同时支持 Vite、Webpack、Rollup、ESBuild
- **多格式支持** — ZIP、TAR、TAR.GZ、7Z 四种归档格式
- **智能命名** — 文件名模板支持 `[name]`、`[version]`、`[hash]`、`[timestamp]` 占位符
- **精确过滤** — 基于 fast-glob 的 glob 模式文件过滤
- **生命周期钩子** — 构建前、产物生成后、归档完成后、错误处理
- **校验和** — 自动生成 MD5 / SHA1 / SHA256 哈希值
- **零额外依赖** — 归档创建完全基于 Node.js 内置模块

---

## 安装

```bash
npm install unplugin-pack-orchestrator
# 或
pnpm add unplugin-pack-orchestrator
# 或
yarn add unplugin-pack-orchestrator
```

---

## 快速开始

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
        outDir: 'dist',           // 要打包的源目录
        archiveOutDir: '.',        // 归档文件输出目录，默认项目根目录
        include: ['**/*'],
        exclude: ['**/*.map', '**/*.d.ts', 'node_modules/**'],
        compressionLevel: 9,     // 0-9，数字越大压缩率越高
      },
      hooks: {
        onBeforeBuild: () => console.log('开始构建...'),
        onBundleGenerated: (bundle) => console.log('产物已生成:', bundle),
        onAfterBuild: (path, format, checksums) => {
          console.log('归档完成:', path)
          console.log('MD5:', checksums.md5)
          console.log('SHA256:', checksums.sha256)
        },
        onError: (err) => console.error('错误:', err.message),
      },
    }),
  ],
})
```

> **注意**: Vite 构建完成后插件自动将 `outDir` 目录打包为归档，无需额外操作。

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
        onBeforeBuild: () => console.log('开始打包...'),
        onAfterBuild: (path, format, checksums) => {
          console.log('归档已生成:', path)
        },
        onError: (err) => console.error('打包失败:', err.message),
      },
    }),
  ],
}
```

> **注意**: Rollup 输出到目录时，插件在 `output.dir` 写入完成后触发打包。

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
        onBeforeBuild: () => console.log('Webpack 构建开始'),
        onBundleGenerated: (bundle) => console.log('产物已生成:', bundle),
        onAfterBuild: (path, format, checksums) => {
          console.log('归档已生成:', path)
          console.log('MD5:', checksums.md5)
          console.log('SHA256:', checksums.sha256)
        },
        onError: (err) => console.error('错误:', err.message),
      },
    }),
  ],
}
```

> **注意**: Webpack 使用 CommonJS 导入方式，插件路径为 `unplugin-pack-orchestrator/webpack`。

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
            console.log('归档已生成:', path)
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

> **注意**: ESBuild 使用动态 import，需注意插件路径引用方式。ESBuild 模式支持 `format: '7z'` 格式。

---

## 配置选项

### pack 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|---------|------|
| `format` | `'zip' \| 'tar' \| 'tar.gz' \| '7z'` | `'zip'` | 归档格式 |
| `fileName` | `string` | `'[name]-[version]'` | 输出文件名，支持占位符 |
| `outDir` | `string` | `'dist'` | 要打包的源目录 |
| `archiveOutDir` | `string` | `'.'` | 归档文件输出目录 |
| `compressionLevel` | `number` | `9` | 压缩级别 0-9 |
| `include` | `string[]` | `[]` | 包含的 glob 模式 |
| `exclude` | `string[]` | `[]` | 排除的 glob 模式 |

### fileName 占位符

| 占位符 | 说明 | 示例值 |
|--------|------|--------|
| `[name]` | package.json 中的 name | `my-app` |
| `[version]` | package.json 中的 version | `1.0.0` |
| `[timestamp]` | 当前时间戳（毫秒） | `1714012345678` |
| `[hash]` | 归档内容 MD5 哈希（32 位） | `a1b2c3d4e5f6a7b8...` |
| `[hash:N]` | MD5 哈希前 N 位 | `[hash:8]` → `a1b2c3d4` |

> 不写扩展名时，插件自动根据 `format` 追加后缀。如 `fileName: '[name]-v[version]'` → `my-app-v1.0.0.zip`

### 生命周期钩子

| 钩子 | 参数 | 触发时机 |
|-------|------|---------|
| `onBeforeBuild` | `()` | 构建开始前执行 |
| `onBundleGenerated` | `(bundle: string)` | 产物生成后、压缩前执行 |
| `onAfterBuild` | `(archivePath, format, checksums)` | 归档创建完成后执行 |
| `onError` | `(error: Error)` | 发生错误时执行 |

### onAfterBuild

压缩完成后执行，可返回新路径实现自动重命名（返回值与原路径不同时生效）：

```typescript
// 1. 在扩展名前插入 sha1 哈希
// app.zip → app-3a7b2c1d.zip
onAfterBuild: (path, format, checksums) =>
  path.replace(/(\.(?:zip|tar\.gz|tar|7z))$/, `-${checksums.sha1.slice(0, 8)}$1`);

// 2. 用 MD5 全量替换文件名
// app.zip → a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6.zip
onAfterBuild: (path, format, checksums) =>
  path.replace(/^.+(?=\.\w+$)/, checksums.md5);

// 3. 追加格式和哈希到原始文件名
// app.zip → app-zip-3a7b2c1d.zip
onAfterBuild: (path, format, checksums) =>
  path.replace(/(\.\w+)$/, `-${format}-${checksums.sha256.slice(0, 8)}$1`);

// 4. 完全自定义文件名，用 format 参数自动适配后缀
// app.zip → release-a1b2c3d4e5f6.zip
onAfterBuild: (path, format, checksums) =>
  `release-${checksums.md5.slice(0, 12)}.${format}`;
```

`checksums` 结构：

```typescript
{ md5: string; sha1: string; sha256: string }
```

> ⚠️ `onAfterBuild` 返回的路径后缀必须与打包 `format` 一致（如 `zip` 格式必须以 `.zip` 结尾），否则会输出警告。文件仍会重命名，但后缀不匹配可能导致下游解析异常。

---

## 完整示例

### Vite + tar.gz + 发布流程

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
        onBeforeBuild: () => console.log('开始构建和打包...'),
        onBundleGenerated: (bundle) => console.log('构建产物已生成'),
        onAfterBuild: (path, format, checksums) => {
          console.log('归档完成！')
          console.log('文件:', path)
          console.log('MD5:   ', checksums.md5)
          console.log('SHA256: ', checksums.sha256)
        },
        onError: (err) => console.error('发生错误:', err.message),
      },
    }),
  ],
})
```

### Webpack + 7z + 自动重命名

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
          console.log('已重命名:', newPath)
        },
      },
    }),
  ],
}
```

---

## License

MIT
