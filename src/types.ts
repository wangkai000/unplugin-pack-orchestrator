/** Supported archive formats */
export type ArchiveFormat = 'zip' | 'tar' | 'tar.gz' | '7z';

export interface ArchiveOptions {
  /** Output directory to archive (relative to project root) */
  outDir?: string;
  /** Archive file name pattern, supports [version], [name], [hash], [hash:N], [timestamp] */
  fileName?: string;
  /** Archive format (default: 'zip') */
  format?: ArchiveFormat;
  /** Compression level (0-9, default: 9) */
  compressionLevel?: number;
  /** Glob patterns to include */
  include?: string[];
  /** Glob patterns to exclude */
  exclude?: string[];
  /** Output directory for archive file */
  archiveOutDir?: string;
}

/** Archive checksums */
export interface ArchiveChecksums {
  /** MD5 checksum (32 chars) */
  md5: string;
  /** SHA-1 checksum (40 chars) */
  sha1: string;
  /** SHA-256 checksum (64 chars) */
  sha256: string;
}

export interface PluginHooks {
  /** Called before build starts */
  onBeforeBuild?: () => void | Promise<void>;
  /** Called when bundle is generated */
  onBundleGenerated?: (bundle: Record<string, unknown>) => void | Promise<void>;
  /**
   * Called after archive is created
   * @param archivePath - Archive file path
   * @param format - Archive format
   * @param checksums - Archive checksums (md5/sha1/sha256)
   * @returns Return new path to auto-rename, or void to keep original
   */
  onAfterBuild?: (archivePath: string, format: ArchiveFormat, checksums: ArchiveChecksums) => string | void | Promise<string | void>;
  /** Called on error */
  onError?: (error: Error) => void | Promise<void>;
}

export interface PackOrchestratorOptions {
  /** Archive packaging configuration */
  pack?: ArchiveOptions;
  /** Hook callbacks */
  hooks?: PluginHooks;
}
