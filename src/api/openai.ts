/*
IMPORTANT NOTICE: DO NOT REMOVE
This is a custom client for the OpenAI API. You may update this service, but you should not need to.

valid model names:
gpt-4.1-2025-04-14
o4-mini-2025-04-16
gpt-4o-2024-11-20

NOTE: The OpenAI SDK has compatibility issues with React Native.
Using lazy import to prevent crashes on app initialization.
*/

let OpenAI: any = null;

export const getOpenAIClient = async () => {
  const apiKey = process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("OpenAI API key not found in environment variables");
  }

  // Lazy load OpenAI SDK only when needed
  if (!OpenAI) {
    try {
      const module = await import("openai");
      OpenAI = module.default;
    } catch (error) {
      console.error("Failed to load OpenAI SDK:", error);
      throw new Error("OpenAI SDK not available in React Native environment");
    }
  }

  return new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true, // Required for React Native
  });
};
