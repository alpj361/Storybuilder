// Load environment variables from env.json
// This is a robust fallback for when .env is not loaded correctly (e.g. in EAS Build)
const env = require('./env.json');

console.log('✅ Loaded env.json successfully');

module.exports = ({ config }) => {
  return {
    ...config,
    name: "vibecode",
    slug: "vibecode",
    scheme: "vibecode",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.alpj361.vibecode"
    },
    android: {
      edgeToEdgeEnabled: true,
      package: "com.alpj361.vibecode"
    },
    plugins: [
      "expo-asset",
      "expo-build-properties",
      "expo-font",
      "expo-secure-store",
      "expo-video",
      "expo-mail-composer",
      "expo-sqlite",
      "expo-web-browser"
    ],
    // Pass environment variables to the app at runtime
    extra: {
      EXPO_PUBLIC_OPENAI_API_KEY: env.EXPO_PUBLIC_OPENAI_API_KEY,
      EXPO_PUBLIC_REPLICATE_API_KEY: env.EXPO_PUBLIC_REPLICATE_API_KEY,
      EXPO_PUBLIC_SUPABASE_URL: env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    }
  };
};
