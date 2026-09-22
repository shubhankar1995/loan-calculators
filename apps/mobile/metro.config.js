// Metro needs to be told about the monorepo so it can follow the `@repayly/core`
// symlink out of apps/mobile and watch the shared maths for changes.
const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
// Resolve only from the paths above, so a stray nested node_modules can't
// give us a second copy of React.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
