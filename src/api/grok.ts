/*
IMPORTANT NOTICE: DO NOT REMOVE
This is a custom client for the Grok API. You may update this service, but you should not need to.
The Grok API can be communicated with the "openai" package, so you can use the same functions as the openai package. It may not support all the same features, so please be careful.


grok-3-latest
grok-3-fast-latest
grok-3-mini-latest

NOTE: Using lazy import to prevent React Native crashes.
*/

let OpenAI: any = null;

export const getGrokClient = async () => {
  const apiKey = process.env.EXPO_PUBLIC_VIBECODE_GROK_API_KEY;
  if (!apiKey) {
    console.warn("Grok API key not found in environment variables");
  }

  // Lazy load OpenAI SDK only when needed
  if (!OpenAI) {
    try {
      const module = await import("openai");
      OpenAI = module.default;
    } catch (error) {
      console.error("Failed to load OpenAI SDK for Grok:", error);
      throw new Error("OpenAI SDK not available in React Native environment");
    }
  }

  return new OpenAI({
    apiKey: apiKey,
    baseURL: "https://api.x.ai/v1",
    dangerouslyAllowBrowser: true,
  });
};
