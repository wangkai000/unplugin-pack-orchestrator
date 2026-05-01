import unplugin from './index';
import type { PackOrchestratorOptions } from './types';

/**
 * Vite plugin for pack orchestrator
 *
 * @example
 * ```js
 * // CJS — both forms work:
 * const packOrchestrator = require('unplugin-pack-orchestrator/vite');
 * const { default: packOrchestrator } = require('unplugin-pack-orchestrator/vite');
 *
 * // ESM
 * import packOrchestrator from 'unplugin-pack-orchestrator/vite';
 * ```
 */
const vitePlugin = unplugin.vite as (options?: PackOrchestratorOptions) => import('vite').Plugin;

export default vitePlugin;

// CJS compat: make require('.../vite') return the function directly
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = vitePlugin;
  module.exports.default = vitePlugin;
}
