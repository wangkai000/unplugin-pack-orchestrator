import unplugin from './index';
import type { PackOrchestratorOptions } from './types';

/**
 * Webpack plugin for pack orchestrator
 *
 * @example
 * ```js
 * // CJS — both forms work:
 * const packOrchestrator = require('unplugin-pack-orchestrator/webpack');
 * const { default: packOrchestrator } = require('unplugin-pack-orchestrator/webpack');
 *
 * // ESM
 * import packOrchestrator from 'unplugin-pack-orchestrator/webpack';
 * ```
 */
const webpackPlugin = unplugin.webpack as (options?: PackOrchestratorOptions) => import('webpack').WebpackPluginInstance;

export default webpackPlugin;

// CJS compat: make require('.../webpack') return the function directly
// This ensures both require() and require().default work
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = webpackPlugin;
  module.exports.default = webpackPlugin;
}
