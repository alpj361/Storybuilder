/**
 * Stable Diffusion API service for storyboard image generation
 * Uses the provided API key for generating draft/rough sketch style images
 * Supports both text-to-image and image-to-image generation
 */

const STABLE_DIFFUSION_TEXT_TO_IMAGE_URL = "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image";
const STABLE_DIFFUSION_IMAGE_TO_IMAGE_URL = "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image";

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
    const response = await fetch(STABLE_DIFFUSION_TEXT_TO_IMAGE_URL, {
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
 * @param referenceImage Optional reference image for img2img mode
 * @param imageStrength Optional strength for img2img (0.2-0.6, default 0.35)
 * @returns Base64 encoded image data
 */
export async function generateDraftStoryboardImage(
  prompt: string,
  referenceImage?: string,
  imageStrength?: number
): Promise<string> {
  console.log("[generateDraftStoryboardImage] Called with prompt:", prompt);
  console.log("[generateDraftStoryboardImage] Prompt length:", prompt.length);
  console.log("[generateDraftStoryboardImage] Has reference image:", !!referenceImage);

  // If reference image provided, use img2img mode
  if (referenceImage) {
    console.log("[generateDraftStoryboardImage] Using img2img mode");
    const result = await generateImageWithReference(prompt, referenceImage, imageStrength || 0.35, {
      style_preset: "line-art",
      steps: 30,
      cfg_scale: 7
    });
    console.log("[generateDraftStoryboardImage] img2img result length:", result.length);
    return result;
  }

  // Otherwise use standard text-to-image
  console.log("[generateDraftStoryboardImage] Using text-to-image mode");
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
 * Generate an image using img2img (image-to-image) mode with a reference image
 * @param prompt The text prompt for image generation
 * @param referenceImageBase64 Base64 encoded reference image (with data:image prefix)
 * @param imageStrength How much to transform the image (0-1, default 0.35)
 * @param options Additional generation options
 * @returns Base64 encoded image data
 */
export async function generateImageWithReference(
  prompt: string,
  referenceImageBase64: string,
  imageStrength: number = 0.35,
  options: StableDiffusionOptions = {}
): Promise<string> {
  const apiKey = "sk-vPIMZInP8snQecyXCCwYwyOuB4h5zE8lUfA31zNGbAojuD6P";

  console.log("[StableDiffusion img2img] Generating with reference image, strength:", imageStrength);
  console.log("[StableDiffusion img2img] Prompt:", prompt);

  // Remove data:image prefix if present
  const base64Data = referenceImageBase64.includes(',')
    ? referenceImageBase64.split(',')[1]
    : referenceImageBase64;

  console.log("[StableDiffusion img2img] Base64 data length:", base64Data.length);

  // Default options optimized for img2img with character reference
  const defaultOptions: StableDiffusionOptions = {
    steps: 30,
    cfg_scale: 7,
    samples: 1,
    style_preset: "line-art", // Match storyboard style
    ...options
  };

  // Build FormData for multipart/form-data request
  const formData = new FormData();

  // Create a file-like object for React Native
  // React Native's FormData expects: { uri, type, name }
  const imageFile: any = {
    uri: `data:image/png;base64,${base64Data}`,
    type: 'image/png',
    name: 'reference.png'
  };

  formData.append('init_image', imageFile);
  formData.append('text_prompts[0][text]', prompt);
  formData.append('text_prompts[0][weight]', '1');
  formData.append('image_strength', imageStrength.toString());
  formData.append('init_image_mode', 'IMAGE_STRENGTH');

  // Add all options as form fields
  Object.entries(defaultOptions).forEach(([key, value]) => {
    if (value !== undefined) {
      formData.append(key, value.toString());
    }
  });

  console.log("[StableDiffusion img2img] Request parameters:", {
    prompt: prompt.substring(0, 100) + '...',
    image_strength: imageStrength,
    init_image_mode: 'IMAGE_STRENGTH',
    ...defaultOptions
  });

  try {
    const response = await fetch(STABLE_DIFFUSION_IMAGE_TO_IMAGE_URL, {
      method: "POST",
      headers: {
        // DO NOT set Content-Type - browser auto-sets it with boundary for FormData
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json"
      },
      body: formData // Send FormData, not JSON
    });

    console.log("[StableDiffusion img2img] Response status:", response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error("[StableDiffusion img2img] Error response:", errorData);
      throw new Error(`Stable Diffusion img2img API error: ${response.status} ${errorData}`);
    }

    const result: StableDiffusionResponse = await response.json();

    console.log("[StableDiffusion img2img] Response artifacts:", result.artifacts?.length || 0);

    if (result.artifacts && result.artifacts.length > 0) {
      const imageData = result.artifacts[0].base64;
      console.log("[StableDiffusion img2img] Image generated successfully, base64 length:", imageData.length);
      return `data:image/png;base64,${imageData}`;
    } else {
      throw new Error("No image artifacts returned from Stable Diffusion img2img API");
    }
  } catch (error) {
    console.error("[StableDiffusion img2img] Image generation error:", error);
    throw error;
  }
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
