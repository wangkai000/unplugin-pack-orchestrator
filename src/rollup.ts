import unplugin from './index';
import type { PackOrchestratorOptions } from './types';

/**
 * Rollup plugin for pack orchestrator
 *
 * @example
 * ```js
 * // CJS — both forms work:
 * const packOrchestrator = require('unplugin-pack-orchestrator/rollup');
 * const { default: packOrchestrator } = require('unplugin-pack-orchestrator/rollup');
 *
 * // ESM
 * import packOrchestrator from 'unplugin-pack-orchestrator/rollup';
 * ```
 */
const rollupPlugin = unplugin.rollup as (options?: PackOrchestratorOptions) => import('rollup').Plugin;

export default rollupPlugin;

// CJS compat: make require('.../rollup') return the function directly
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = rollupPlugin;
  module.exports.default = rollupPlugin;
}
