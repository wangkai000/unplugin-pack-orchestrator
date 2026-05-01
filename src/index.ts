import { createUnplugin, type UnpluginFactory, type UnpluginInstance } from 'unplugin';
import { createHash } from 'crypto';
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

    generateBundle(_options: any, bundle: any) {
      if (hooks.onBundleGenerated) {
        hooks.onBundleGenerated(bundle as Record<string, unknown>);
      }

      const hash = createHash('md5');
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

    vite: {
      configResolved(config: any) {
        rootDir = config.root;
      },
    },

    webpack(compiler: any) {
      rootDir = compiler.context || process.cwd();

      compiler.hooks.emit.tapPromise(name, async (compilation: any) => {
        // Compute bundle hash from assets (equivalent to generateBundle)
        const hash = createHash('md5');
        for (const fileName of Object.keys(compilation.assets).sort()) {
          hash.update(fileName);
        }
        bundleHash = hash.digest('hex');

        if (hooks.onBundleGenerated) {
          const bundle = Object.fromEntries(
            Object.entries(compilation.assets).map(([name, asset]: [string, any]) => [name, { source: asset.source }])
          );
          await hooks.onBundleGenerated(bundle);
        }
      });

      compiler.hooks.done.tapPromise(name, async () => {
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

    rollup: {
      options(options: any) {
        if (options.cwd) {
          rootDir = options.cwd;
        }
      },
    },

    esbuild: {
      setup(build: any) {
        // Bug Fix: rootDir must be resolved here (before onEnd), not via closeBundle
        // absWorkingDir may be undefined when user doesn't set it, fall back to cwd
        rootDir = build.initialOptions.absWorkingDir || process.cwd();

        // Bug Fix: force metafile:true so result.metafile.outputs is always available
        // This ensures [hash] placeholder is populated correctly
        build.initialOptions.metafile = true;

        build.onEnd(async (result: any) => {
          if (!pack || Object.keys(pack).length === 0) return;

          // ESBuild does not have generateBundle hook — compute hash from metafile outputs
          let esbuildHash: string | undefined;
          if (result?.metafile?.outputs) {
            const hash = createHash('md5');
            for (const fileName of Object.keys(result.metafile.outputs).sort()) {
              hash.update(fileName);
            }
            esbuildHash = hash.digest('hex');
          }

          // ESBuild: trigger onBundleGenerated if hook is registered
          if (hooks.onBundleGenerated && result?.metafile?.outputs) {
            const bundle: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(result.metafile.outputs)) {
              bundle[k] = v;
            }
            await hooks.onBundleGenerated(bundle);
          }

          try {
            await createArchive(pack, rootDir, hooks, esbuildHash);
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

// Default export for convenience
export default unpluginPackOrchestrator;

// Named exports
export { createArchive };
export type { PackOrchestratorOptions, ArchiveFormat, ArchiveChecksums };
export type { ArchiveOptions, PluginHooks } from './types';
