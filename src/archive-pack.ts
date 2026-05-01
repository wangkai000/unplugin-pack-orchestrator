import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import archiver from 'archiver';
import * as tar from 'tar';
import picomatch from 'picomatch';
import _7z from '7zip-min';
import type { ArchiveOptions, ArchiveFormat, PluginHooks } from './types';

function getPackageVersion(rootDir: string): string {
  try {
    const pkgPath = path.join(rootDir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function getPackageName(rootDir: string): string {
  try {
    const pkgPath = path.join(rootDir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return pkg.name || 'app';
  } catch {
    return 'app';
  }
}

function getArchiveExtension(format: ArchiveFormat): string {
  const extensions: Record<ArchiveFormat, string> = {
    'zip': '.zip',
    'tar': '.tar',
    'tar.gz': '.tar.gz',
    '7z': '.7z',
  };
  return extensions[format] || '.zip';
}

function generateArchiveFileName(
  pattern: string,
  rootDir: string,
  format: ArchiveFormat,
  hash?: string
): string {
  const version = getPackageVersion(rootDir);
  const name = getPackageName(rootDir);
  const timestamp = Date.now().toString();
  const fullHash = hash || '';
  const extension = getArchiveExtension(format);

  let fileName = pattern
    .replace(/\[version\]/g, version)
    .replace(/\[name\]/g, name)
    .replace(/\[hash(?::(\d+))?\]/g, (_, len) => fullHash.slice(0, len ? parseInt(len) : undefined))
    .replace(/\[timestamp\]/g, timestamp);

  const extPattern = /\.(zip|tar\.gz|tar|7z)$/;
  if (!extPattern.test(fileName)) {
    fileName += extension;
  }

  return fileName;
}

function calculateChecksums(filePath: string): { md5: string; sha1: string; sha256: string } {
  const buffer = fs.readFileSync(filePath);
  return {
    md5: crypto.createHash('md5').update(buffer).digest('hex'),
    sha1: crypto.createHash('sha1').update(buffer).digest('hex'),
    sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
  };
}

function getFiles(dir: string, baseDir: string): string[] {
  const files: string[] = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relativePath = path.relative(baseDir, fullPath);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getFiles(fullPath, baseDir));
    } else {
      files.push(relativePath);
    }
  }

  return files;
}

function filterFiles(
  files: string[],
  include?: string[],
  exclude?: string[]
): string[] {
  let result = files;

  if (include && include.length > 0) {
    const isMatch = picomatch(include);
    result = result.filter(file => isMatch(file));
  }

  if (exclude && exclude.length > 0) {
    const isMatch = picomatch(exclude);
    result = result.filter(file => !isMatch(file));
  }

  return result;
}

async function createZipArchive(
  sourceDir: string,
  archivePath: string,
  filteredFiles: string[],
  compressionLevel: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(archivePath);
    const archive = archiver('zip', {
      zlib: { level: compressionLevel }
    });

    output.on('close', () => {
      resolve();
    });

    archive.on('error', reject);
    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn(`[unplugin-pack-orchestrator] Warning: ${err.message}`);
      } else {
        reject(err);
      }
    });

    archive.pipe(output);

    for (const file of filteredFiles) {
      const filePath = path.join(sourceDir, file);
      archive.file(filePath, { name: file });
    }

    archive.finalize();
  });
}

async function createTarArchive(
  sourceDir: string,
  archivePath: string,
  filteredFiles: string[],
  gzip: boolean,
  compressionLevel: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(archivePath);

    const pack = tar.c({
      gzip,
      cwd: sourceDir,
      portable: true,
      ...(gzip && { zlib: { level: compressionLevel } }),
    }, filteredFiles);

    pack.pipe(output);

    output.on('close', () => {
      resolve();
    });

    output.on('error', reject);
    pack.on('error', reject);
  });
}

async function create7zArchive(
  sourceDir: string,
  archivePath: string,
  filteredFiles: string[],
): Promise<void> {
  const tmpDir = path.join(sourceDir, '.__7z_tmp__');
  fs.mkdirSync(tmpDir, { recursive: true });

  try {
    for (const file of filteredFiles) {
      const src = path.join(sourceDir, file);
      const dest = path.join(tmpDir, file);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
    }

    await _7z.pack(tmpDir, archivePath);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

export async function createArchive(
  options: ArchiveOptions,
  rootDir: string,
  hooks?: PluginHooks,
  bundleHash?: string
): Promise<string> {
  const outDir = options.outDir || 'dist';
  const fileNamePattern = options.fileName || '[name]-[version]';
  const format: ArchiveFormat = options.format || 'zip';
  const compressionLevel = options.compressionLevel ?? 9;
  const archiveOutDir = path.resolve(rootDir, options.archiveOutDir || '.');

  const sourceDir = path.resolve(rootDir, outDir);

  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Output directory does not exist: ${sourceDir}`);
  }

  if (!fs.existsSync(archiveOutDir)) {
    fs.mkdirSync(archiveOutDir, { recursive: true });
  }

  const allFiles = getFiles(sourceDir, sourceDir);
  const filteredFiles = filterFiles(allFiles, options.include, options.exclude);

  const archiveFileName = generateArchiveFileName(fileNamePattern, rootDir, format, bundleHash);
  const archivePath = path.resolve(archiveOutDir, archiveFileName);

  try {
    switch (format) {
      case 'zip':
        await createZipArchive(sourceDir, archivePath, filteredFiles, compressionLevel);
        break;
      case 'tar':
        await createTarArchive(sourceDir, archivePath, filteredFiles, false, compressionLevel);
        break;
      case 'tar.gz':
        await createTarArchive(sourceDir, archivePath, filteredFiles, true, compressionLevel);
        break;
      case '7z':
        await create7zArchive(sourceDir, archivePath, filteredFiles);
        break;
      default:
        throw new Error(`Unsupported archive format: ${format}`);
    }

    const checksums = calculateChecksums(archivePath);

    let finalPath = archivePath;

    if (hooks?.onAfterBuild) {
      const newPath = await hooks.onAfterBuild(archivePath, format, checksums);
      if (newPath && newPath !== archivePath) {
        const expectedExt = getArchiveExtension(format);
        if (!newPath.endsWith(expectedExt)) {
          console.warn(`[unplugin-pack-orchestrator] onAfterBuild returned path extension "${path.extname(newPath)}" does not match format "${format}" (expected "${expectedExt}")`);
        }
        const finalFilePath = path.isAbsolute(newPath) ? newPath : path.resolve(path.dirname(archivePath), path.basename(newPath));
        fs.renameSync(archivePath, finalFilePath);
        finalPath = finalFilePath;
      }
    }

    return finalPath;
  } catch (error) {
    if (hooks?.onError) {
      await hooks.onError(error as Error);
    }
    throw error;
  }
}
