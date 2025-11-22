// Load environment variables from .env file
// This is required for Expo to access EXPO_PUBLIC_* variables at runtime
require('dotenv').config();

module.exports = {
  expo: {
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
      EXPO_PUBLIC_OPENAI_API_KEY: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
      EXPO_PUBLIC_REPLICATE_API_KEY: process.env.EXPO_PUBLIC_REPLICATE_API_KEY,
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    }
  }
};
