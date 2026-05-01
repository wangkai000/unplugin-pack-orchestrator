import unplugin from './index';
import type { PackOrchestratorOptions } from './types';

/**
 * ESBuild plugin for pack orchestrator
 *
 * @example
 * ```js
 * // CJS — both forms work:
 * const packOrchestrator = require('unplugin-pack-orchestrator/esbuild');
 * const { default: packOrchestrator } = require('unplugin-pack-orchestrator/esbuild');
 *
 * // ESM
 * import packOrchestrator from 'unplugin-pack-orchestrator/esbuild';
 * ```
 */
const esbuildPlugin = unplugin.esbuild as (options?: PackOrchestratorOptions) => import('esbuild').Plugin;

export default esbuildPlugin;

// CJS compat: make require('.../esbuild') return the function directly
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = esbuildPlugin;
  module.exports.default = esbuildPlugin;
}
