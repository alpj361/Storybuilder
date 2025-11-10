/*
IMPORTANT NOTICE: DO NOT REMOVE
This is a custom client for the Anthropic API. You may update this service, but you should not need to.

Valid model names:
claude-sonnet-4-20250514
claude-3-7-sonnet-latest
claude-3-5-haiku-latest

NOTE: The Anthropic SDK has compatibility issues with React Native.
Using lazy import to prevent crashes on app initialization.
*/

let Anthropic: any = null;

export const getAnthropicClient = async () => {
  const apiKey = process.env.EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("Anthropic API key not found in environment variables");
  }

  // Lazy load Anthropic SDK only when needed
  if (!Anthropic) {
    try {
      const module = await import("@anthropic-ai/sdk");
      Anthropic = module.default;
    } catch (error) {
      console.error("Failed to load Anthropic SDK:", error);
      throw new Error("Anthropic SDK not available in React Native environment");
    }
  }

  return new Anthropic({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true, // Required for React Native
  });
};
