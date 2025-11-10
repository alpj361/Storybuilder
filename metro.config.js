// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.useWatchman = false;

// Add source extensions for better compatibility
config.resolver.sourceExts = [...(config.resolver.sourceExts || []), 'cjs', 'mjs'];

// Resolver configuration for better module resolution
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle OpenAI SDK's runtime polyfills
  if (moduleName === 'node:stream' || moduleName === 'stream') {
    return {
      filePath: require.resolve('readable-stream'),
      type: 'sourceFile',
    };
  }

  // Use default resolver
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, {
  input: './global.css',
  configPath: path.resolve(__dirname, 'tailwind.config.js')
});
