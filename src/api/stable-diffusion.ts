/**
 * Stable Diffusion API service for storyboard image generation
 * Uses the provided API key for generating draft/rough sketch style images
 */

const STABLE_DIFFUSION_API_URL = "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image";

export interface StableDiffusionOptions {
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;
  cfg_scale?: number;
  samples?: number;
  style_preset?: "enhance" | "anime" | "photographic" | "digital-art" | "comic-book" | "fantasy-art" | "line-art" | "analog-film" | "neon-punk" | "isometric" | "low-poly" | "origami" | "modeling-compound" | "cinematic" | "3d-model" | "pixel-art" | "tile-texture";
  engine?: string;
}

export interface StableDiffusionResponse {
  artifacts: Array<{
    base64: string;
    seed: number;
    finishReason: string;
  }>;
}

/**
 * Generate a storyboard image using Stable Diffusion
 * @param prompt The text prompt for image generation
 * @param options Generation options
 * @returns Base64 encoded image data
 */
export async function generateStoryboardImage(
  prompt: string,
  options: StableDiffusionOptions = {}
): Promise<string> {
  const apiKey = "sk-vPIMZInP8snQecyXCCwYwyOuB4h5zE8lUfA31zNGbAojuD6P";

  // Default options optimized for storyboard/draft style
  const defaultOptions: StableDiffusionOptions = {
    width: 1024,
    height: 1024,
    steps: 30,
    cfg_scale: 7,
    samples: 1,
    style_preset: "line-art", // Perfect for draft/rough sketch style
    ...options
  };

  console.log("[StableDiffusion] Generating image with:", {
    prompt: prompt,
    options: defaultOptions
  });

  const requestBody = {
    text_prompts: [
      {
        text: prompt,
        weight: 1
      }
    ],
    ...defaultOptions
  };

  console.log("[StableDiffusion] Request body:", JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch(STABLE_DIFFUSION_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    console.log("[StableDiffusion] Response status:", response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error("[StableDiffusion] Error response:", errorData);
      throw new Error(`Stable Diffusion API error: ${response.status} ${errorData}`);
    }

    const result: StableDiffusionResponse = await response.json();

    console.log("[StableDiffusion] Response artifacts:", result.artifacts?.length || 0);

    if (result.artifacts && result.artifacts.length > 0) {
      const imageData = result.artifacts[0].base64;
      console.log("[StableDiffusion] Image generated successfully, base64 length:", imageData.length);
      return `data:image/png;base64,${imageData}`;
    } else {
      throw new Error("No image artifacts returned from Stable Diffusion API");
    }
  } catch (error) {
    console.error("[StableDiffusion] Image generation error:", error);
    throw error;
  }
}

/**
 * Generate a storyboard image with draft/rough sketch style
 * @param prompt The storyboard prompt (already includes style from template)
 * @returns Base64 encoded image data
 */
export async function generateDraftStoryboardImage(prompt: string): Promise<string> {
  console.log("[generateDraftStoryboardImage] Called with prompt:", prompt);
  console.log("[generateDraftStoryboardImage] Prompt length:", prompt.length);

  // Use the prompt directly - it already includes style information from STYLE_TEMPLATES
  // The style_preset parameter will handle the visual style
  const result = await generateStoryboardImage(prompt, {
    style_preset: "line-art",
    steps: 30, // Increased for better quality
    cfg_scale: 7, // Good balance for creative but coherent results
    width: 1024,
    height: 1024
  });

  console.log("[generateDraftStoryboardImage] Returning result, length:", result.length);

  return result;
}

/**
 * Convert base64 image to data URI for display in React Native
 * @param base64Data Base64 encoded image data
 * @returns Data URI for the image (compatible with React Native Image component)
 */
export function base64ToBlobUrl(base64Data: string): string {
  // In React Native, we can't use Blob URLs or atob()
  // Instead, just ensure it's a proper data URI format
  if (base64Data.startsWith('data:image')) {
    return base64Data;
  }
  return `data:image/png;base64,${base64Data}`;
}
