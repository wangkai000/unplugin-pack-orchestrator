import type { UnpluginFactory, UnpluginInstance } from 'unplugin';
import { createArchive } from './archive-pack';
import type { PackOrchestratorOptions, ArchiveFormat, ArchiveChecksums } from './types';

export const packOrchestratorFactory: UnpluginFactory<PackOrchestratorOptions> = (options = {}, meta) => {
  const {
    pack = {},
    hooks = {},
  } = options;

  let rootDir = process.cwd();
  let bundleHash: string | undefined;

  const name = 'unplugin-pack-orchestrator';

  return {
    name,

    enforce: 'post',

    buildStart() {
      if (hooks.onBeforeBuild) {
        hooks.onBeforeBuild();
      }
    },

    buildEnd() {
      // Capture root directory from meta if available
      if (meta.framework === 'vite') {
        // Vite specific: root is available in configResolved
      }
    },

    generateBundle(_options, bundle) {
      if (hooks.onBundleGenerated) {
        hooks.onBundleGenerated(bundle as Record<string, unknown>);
      }

      // Generate hash from bundle content
      const crypto = require('crypto');
      const hash = crypto.createHash('md5');
      for (const fileName of Object.keys(bundle).sort()) {
        hash.update(fileName);
      }
      bundleHash = hash.digest('hex');
    },

    async closeBundle() {
      if (!pack || Object.keys(pack).length === 0) return;

      try {
        await createArchive(pack, rootDir, hooks, bundleHash);
      } catch (error) {
        console.error(`[${name}] Archive failed:`, error);
        if (hooks.onError) {
          await hooks.onError(error as Error);
        }
      }
    },

    // Vite specific hook
    vite: {
      configResolved(config) {
        rootDir = config.root;
      },
    },

    // Webpack specific hook
    webpack(compiler) {
      rootDir = compiler.context || process.cwd();

      compiler.hooks.done.tapPromise(name, async (stats) => {
        if (!pack || Object.keys(pack).length === 0) return;

        try {
          await createArchive(pack, rootDir, hooks, bundleHash);
        } catch (error) {
          console.error(`[${name}] Archive failed:`, error);
          if (hooks.onError) {
            await hooks.onError(error as Error);
          }
        }
      });
    },

    // Rollup specific hook
    rollup: {
      options(options) {
        if (options.cwd) {
          rootDir = options.cwd;
        }
      },
    },

    // esbuild specific hook
    esbuild: {
      setup(build) {
        rootDir = build.initialOptions.absWorkingDir || process.cwd();

        build.onEnd(async () => {
          if (!pack || Object.keys(pack).length === 0) return;

          try {
            await createArchive(pack, rootDir, hooks, bundleHash);
          } catch (error) {
            console.error(`[${name}] Archive failed:`, error);
            if (hooks.onError) {
              await hooks.onError(error as Error);
            }
          }
        });
      },
    },
  };
};

export const unpluginPackOrchestrator: UnpluginInstance<PackOrchestratorOptions> = createUnplugin(packOrchestratorFactory);

// Import createUnplugin at the top level
import { createUnplugin } from 'unplugin';

// Named exports
export { packOrchestratorFactory };
export type { PackOrchestratorOptions, ArchiveFormat, ArchiveChecksums };
