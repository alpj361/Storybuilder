/**
 * Seeddream 4 API Service
 * High-quality image generation using ByteDance's Seeddream 4 model via Replicate
 * Used as "Gama Alta" option for storyboard panel generation
 */

import Replicate from 'replicate';

// Seeddream 4 model identifier
export const SEEDREAM_4_MODEL = "bytedance/seedream-4";

// Initialize Replicate client
const getReplicateKey = () => {
  const key = process.env.EXPO_PUBLIC_REPLICATE_API_KEY;
  if (!key) {
    throw new Error('EXPO_PUBLIC_REPLICATE_API_KEY environment variable is not set');
  }
  return key;
};

const replicate = new Replicate({
  auth: getReplicateKey(),
});

export interface SeedreamOptions {
  prompt: string;
  aspectRatio?: '1:1' | '4:3' | '3:4' | '16:9' | '9:16';
  seed?: number;
}

/**
 * Generate a storyboard panel image using Seeddream 4 (High Quality)
 * @param prompt - The structured 6-section prompt for the panel
 * @param options - Additional generation options
 * @returns Base64 encoded image data
 */
export async function generateWithSeedream(
  prompt: string,
  options: SeedreamOptions = {}
): Promise<string> {
  console.log('[Seedream4] Generating high-quality image...');
  console.log('[Seedream4] Prompt length:', prompt.length);
  console.log('[Seedream4] Aspect ratio:', options.aspectRatio || '4:3');

  try {
    const input = {
      prompt: prompt,
      aspect_ratio: options.aspectRatio || '4:3',
      ...(options.seed && { seed: options.seed })
    };

    console.log('[Seedream4] Calling Replicate with input:', JSON.stringify(input, null, 2));

    const output = await replicate.run(SEEDREAM_4_MODEL, {
      input: input
    }) as any;

    console.log('[Seedream4] Generation completed');
    console.log('[Seedream4] Output type:', Array.isArray(output) ? 'array' : typeof output);

    // Get the first output image URL
    const imageUrl = Array.isArray(output) ? output[0].url() : output.url();
    console.log('[Seedream4] Image URL:', imageUrl);

    // Convert URL to base64
    const base64Image = await urlToBase64(imageUrl);
    console.log('[Seedream4] Image converted to base64, length:', base64Image.length);

    return base64Image;
  } catch (error) {
    console.error('[Seedream4] Error generating image:', error);
    throw new Error(
      `Failed to generate image with Seedream 4: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Convert image URL to base64 data URI
 */
async function urlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        resolve(base64data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('[Seedream4] Error converting URL to base64:', error);
    throw error;
  }
}

/**
 * Check if Seeddream 4 is available (API key configured)
 */
export function isSeedreamAvailable(): boolean {
  try {
    getReplicateKey();
    return true;
  } catch {
    return false;
  }
}
