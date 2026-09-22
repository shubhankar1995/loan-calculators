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

// The one thing that flat resolution breaks: Reanimated and Worklets want
// semver 7's per-function entry points, but the hoisted copy at the workspace
// root is semver 6, and with hierarchical lookup off Metro never sees their
// own nested copy. Point just those two packages back at it.
const SEMVER_7_OWNERS = ['react-native-reanimated', 'react-native-worklets'];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'semver' || moduleName.startsWith('semver/')) {
    const owner = SEMVER_7_OWNERS.find((name) =>
      context.originModulePath.includes(`node_modules/${name}/`),
    );
    if (owner) {
      const nested = path.resolve(workspaceRoot, 'node_modules', owner, 'node_modules');
      return context.resolveRequest(
        { ...context, nodeModulesPaths: [nested, ...context.nodeModulesPaths] },
        moduleName,
        platform,
      );
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
