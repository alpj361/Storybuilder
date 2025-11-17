/**
 * Stable Diffusion API service for storyboard image generation
 * Uses the provided API key for generating draft/rough sketch style images
 * Supports both text-to-image and image-to-image generation
 */

import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { GenerationQuality } from '../types/storyboard';

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

  // Resize image to 1024x1024 before sending to API
  // This ensures the API receives the correct dimensions
  console.log("[StableDiffusion img2img] Resizing image to 1024x1024...");

  try {
    // First, resize and compress as JPEG to reduce file size
    // Stable Diffusion API has a 5MB limit for init_image
    const resizedImage = await manipulateAsync(
      referenceImageBase64,
      [{ resize: { width: 1024, height: 1024 } }],
      { compress: 0.6, format: SaveFormat.JPEG, base64: true } // JPEG with 60% quality
    );

    console.log("[StableDiffusion img2img] Image resized successfully");

    // Use the resized base64 data
    const base64Data = resizedImage.base64!;
    console.log("[StableDiffusion img2img] Resized base64 data length:", base64Data.length);

    // Calculate approximate file size (base64 is ~33% larger than binary)
    const approximateFileSize = (base64Data.length * 3) / 4;
    console.log("[StableDiffusion img2img] Approximate file size:", Math.round(approximateFileSize / 1024), "KB");

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
      uri: `data:image/jpeg;base64,${base64Data}`,
      type: 'image/jpeg',
      name: 'reference.jpg'
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
    console.error("[StableDiffusion img2img] Image generation/resize error:", error);
    throw error;
  }
}

/**
 * Generate a character portrait in storyboard style
 * This creates a standalone character preview that can be used for:
 * 1. User to approve character appearance before panel generation
 * 2. Re-analysis to create a "canonical" description optimized for storyboard style
 * 3. Visual reference for character consistency
 *
 * @param characterDescription AI-generated description from reference photo
 * @param style The storyboard style to use (rough_sketch, pencil_drawing, etc.)
 * @returns Base64 encoded portrait image
 */
export async function generateCharacterPortrait(
  characterDescription: string,
  style: "rough_sketch" | "pencil_drawing" | "clean_lines" | "concept_art" | "comic_style" = "rough_sketch"
): Promise<string> {
  console.log("[generateCharacterPortrait] Generating portrait for:", characterDescription);
  console.log("[generateCharacterPortrait] Style:", style);

  // Style-specific prefix and suffix for portrait generation
  const styleTemplates = {
    rough_sketch: {
      prefix: "Rough pencil sketch character portrait, loose gestural lines, sketchy style, black and white, draft quality, quick sketch, hand-drawn appearance, minimal shading, rough outlines, concept art style",
      suffix: "character design, front view portrait, neutral background, portrait framing, character reference sheet"
    },
    pencil_drawing: {
      prefix: "Detailed pencil drawing character portrait, refined lines, grayscale, sketch style, hand-drawn, artistic shading, pencil texture, detailed illustration",
      suffix: "character design, front view portrait, neutral background, portrait framing, character reference sheet"
    },
    clean_lines: {
      prefix: "Clean line art character portrait, precise lines, black and white, professional illustration, clear outlines, minimal shading, vector-style",
      suffix: "character design, front view portrait, neutral background, portrait framing, character reference sheet"
    },
    concept_art: {
      prefix: "Professional concept art character portrait, detailed illustration, artist sketch, character design sheet, professional quality",
      suffix: "character design, front view portrait, neutral background, portrait framing, character reference sheet"
    },
    comic_style: {
      prefix: "Comic book style character portrait, bold lines, ink drawing, graphic novel art, dynamic illustration, comic book character design",
      suffix: "character design, front view portrait, neutral background, portrait framing, character reference sheet"
    }
  };

  const template = styleTemplates[style];

  // Build portrait-specific prompt
  // Focus on character details without action/scene context
  const prompt = `${template.prefix}, ${characterDescription}, ${template.suffix}`;

  console.log("[generateCharacterPortrait] Full prompt:", prompt);

  // Generate using text-to-image with portrait-optimized settings
  const portraitImage = await generateStoryboardImage(prompt, {
    style_preset: "line-art",
    steps: 35, // Slightly higher quality for character portraits
    cfg_scale: 7.5, // Slightly higher to follow prompt more closely
    width: 1024,
    height: 1024
  });

  console.log("[generateCharacterPortrait] Portrait generated successfully");

  return portraitImage;
}

/**
 * Generate a storyboard panel with optional visual identity preservation
 * @param scenePrompt - The scene description prompt for the panel (can be structured 6-section GPT prompt)
 * @param characters - Array of characters with potential visual identity data
 * @param generationQuality - Quality tier: GenerationQuality.STANDARD (Stable Diffusion) or GenerationQuality.HIGH (Seeddream 4)
 * @returns Base64 encoded image data
 */
export async function generateStoryboardPanelWithVisualIdentity(
  scenePrompt: string,
  characters?: Array<{
    id: string;
    name: string;
    appearance: {
      characterType?: 'human' | 'creature' | 'robot' | 'animal' | 'alien' | 'hybrid' | 'other';
    };
    referenceImage?: string;
    useVisualIdentity?: boolean;
    portraitSeed?: number;
    portraitEngine?: string;
  }>,
  generationQuality?: GenerationQuality
): Promise<string> {
  console.log("[generateStoryboardPanelWithVisualIdentity] Generating panel");
  console.log("[generateStoryboardPanelWithVisualIdentity] Quality tier:", generationQuality || GenerationQuality.STANDARD);
  console.log("[generateStoryboardPanelWithVisualIdentity] Prompt length:", scenePrompt.length);

  /* DISABLED: Visual Identity Preservation (Phase 4 - to be re-enabled later)
  // Check if any character has visual identity enabled
  const characterWithVisualIdentity = characters?.find(c =>
    c.useVisualIdentity && c.referenceImage && c.portraitSeed
  );

  if (characterWithVisualIdentity) {
    console.log("[generateStoryboardPanelWithVisualIdentity] Using visual identity for character:", characterWithVisualIdentity.name);
    console.log("[generateStoryboardPanelWithVisualIdentity] Character type:", characterWithVisualIdentity.appearance.characterType);
    console.log("[generateStoryboardPanelWithVisualIdentity] Engine:", characterWithVisualIdentity.portraitEngine);

    // Import the visual identity service functions
    const {
      generatePortraitWithIPAdapter,
      generatePortraitWithConsistentCharacter
    } = await import('../services/instantId');

    try {
      // Choose the appropriate model based on character type
      const isHuman = characterWithVisualIdentity.appearance.characterType === 'human';

      const result = isHuman
        ? await generatePortraitWithConsistentCharacter({
            prompt: scenePrompt,
            refImage: characterWithVisualIdentity.referenceImage!,
            seed: characterWithVisualIdentity.portraitSeed,
            numOutputs: 1,
            context: 'scene' // Important: this is a scene, not a portrait!
          })
        : await generatePortraitWithIPAdapter({
            prompt: scenePrompt,
            refImage: characterWithVisualIdentity.referenceImage!,
            seed: characterWithVisualIdentity.portraitSeed,
            numOutputs: 1,
            context: 'scene' // Important: this is a scene, not a portrait!
          });

      console.log("[generateStoryboardPanelWithVisualIdentity] Panel generated with visual identity");
      return result.imageUrl;
    } catch (error) {
      console.error("[generateStoryboardPanelWithVisualIdentity] Visual identity generation failed, falling back to standard:", error);
      // Fall back to standard generation if visual identity fails
    }
  }
  */

  // CURRENT: Use quality-based generation (Stable Diffusion or Seeddream 4)
  // scenePrompt should be a GPT-generated 6-section structured prompt

  if (generationQuality === GenerationQuality.HIGH) {
    // Use Seeddream 4 for high quality generation
    console.log("[generateStoryboardPanelWithVisualIdentity] Using Seeddream 4 (Gama Alta)");
    const { generateWithSeedream } = await import('./seedream');
    return await generateWithSeedream(scenePrompt, { aspectRatio: '4:3' });
  } else {
    // Use Stable Diffusion SDXL for standard quality (default)
    console.log("[generateStoryboardPanelWithVisualIdentity] Using Stable Diffusion SDXL (Gama Baja)");
    return await generateDraftStoryboardImage(scenePrompt);
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
