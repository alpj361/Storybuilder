/**
 * NanoBanana Image Editing Service
 * Uses Google's NanoBanana model via Replicate for AI-powered image refinement
 *
 * This service allows making light edits to existing images based on text prompts
 * without regenerating from scratch.
 */

import Replicate from 'replicate';

// Get Replicate API key
const getReplicateKey = () => {
  const key = process.env.EXPO_PUBLIC_REPLICATE_API_KEY;
  console.log('[NanoBanana] Replicate API Key check:', {
    exists: !!key,
    prefix: key?.substring(0, 10)
  });

  if (!key) {
    throw new Error('EXPO_PUBLIC_REPLICATE_API_KEY environment variable is not set');
  }

  return key;
};

/**
 * Edit an existing image using NanoBanana
 * @param imageBase64 - The current panel image in base64 format
 * @param editPrompt - Text description of the desired changes
 * @returns Promise with the edited image URL
 */
export async function editImageWithNanoBanana(
  imageBase64: string,
  editPrompt: string
): Promise<string> {
  console.log('[NanoBanana] Starting image edit...');
  console.log('[NanoBanana] Prompt:', editPrompt);
  console.log('[NanoBanana] Image size:', imageBase64.length, 'characters');

  try {
    const replicate = new Replicate({
      auth: getReplicateKey(),
    });

    console.log('[NanoBanana] Calling Replicate API...');

    const input = {
      prompt: editPrompt,
      image_input: [imageBase64] // NanoBanana expects an array
    };

    console.log('[NanoBanana] Input prepared:', {
      promptLength: editPrompt.length,
      imageCount: 1
    });

    const output = await replicate.run(
      'google/nano-banana',
      { input }
    ) as any;

    console.log('[NanoBanana] Generation completed');
    console.log('[NanoBanana] Output type:', Array.isArray(output) ? 'array' : typeof output);

    // Debug: log output structure
    if (output && typeof output === 'object') {
      console.log('[NanoBanana] Output keys:', Object.keys(output));
      console.log('[NanoBanana] Has url property:', 'url' in output);
      console.log('[NanoBanana] url type:', typeof output.url);
    }

    // Get the image URL from output (following Seedream4 pattern)
    let imageUrl: string;

    if (Array.isArray(output)) {
      // If it's an array, get the first element
      console.log('[NanoBanana] Output is array, length:', output.length);
      imageUrl = typeof output[0].url === 'function' ? output[0].url() : output[0];
    } else if (output && typeof output.url === 'function') {
      // If it's an object with url() method
      console.log('[NanoBanana] Calling output.url()');
      imageUrl = output.url();
    } else if (typeof output === 'string') {
      // If it's already a string URL
      console.log('[NanoBanana] Output is string');
      imageUrl = output;
    } else if (output && typeof output === 'object' && output.url) {
      // If url is a property (not a function)
      console.log('[NanoBanana] Using output.url property');
      imageUrl = output.url;
    } else {
      console.error('[NanoBanana] Unexpected output format:', JSON.stringify(output, null, 2));
      throw new Error('Unexpected output format from NanoBanana');
    }

    console.log('[NanoBanana] Image URL:', typeof imageUrl === 'string' ? imageUrl.substring(0, 100) : imageUrl);

    // Convert URL to base64
    console.log('[NanoBanana] Converting edited image to base64...');
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    console.log('[NanoBanana] Image converted to base64, length:', base64.length);

    return base64;
  } catch (error) {
    console.error('[NanoBanana] Error editing image:', error);
    throw error;
  }
}

/**
 * Generate a new image using NanoBanana
 * @param prompt - Text description for the image
 * @returns Promise with the generated image URL
 */
export async function generateImageWithNanoBanana(
  prompt: string
): Promise<string> {
  console.log('[NanoBanana] Starting image generation...');
  console.log('[NanoBanana] Prompt:', prompt);

  try {
    const replicate = new Replicate({
      auth: getReplicateKey(),
    });

    console.log('[NanoBanana] Calling Replicate API for generation...');

    const input = {
      prompt: prompt,
      num_inference_steps: 30, // Standard default
      guidance_scale: 7.5
    };

    const output = await replicate.run(
      'google/nano-banana',
      { input }
    ) as any;

    console.log('[NanoBanana] Generation completed');

    // Handle output (same logic as edit)
    let imageUrl: string;

    if (Array.isArray(output)) {
      imageUrl = typeof output[0].url === 'function' ? output[0].url() : output[0];
    } else if (output && typeof output.url === 'function') {
      imageUrl = output.url();
    } else if (typeof output === 'string') {
      imageUrl = output;
    } else if (output && typeof output === 'object' && output.url) {
      imageUrl = output.url;
    } else {
      throw new Error('Unexpected output format from NanoBanana');
    }

    console.log('[NanoBanana] Image URL:', typeof imageUrl === 'string' ? imageUrl.substring(0, 100) : imageUrl);

    // Convert URL to base64
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    return base64;
  } catch (error) {
    console.error('[NanoBanana] Error generating image:', error);
    throw error;
  }
}

/**
 * Generate a new image using NanoBanana Pro
 * @param prompt - Text description for the image
 * @returns Promise with the generated image URL
 */
export async function generateImageWithNanoBananaPro(
  prompt: string
): Promise<string> {
  console.log('[NanoBanana] Starting Pro image generation...');
  console.log('[NanoBanana] Prompt:', prompt);

  try {
    const replicate = new Replicate({
      auth: getReplicateKey(),
    });

    console.log('[NanoBanana] Calling Replicate API for Pro generation...');

    const input = {
      prompt: prompt,
      aspect_ratio: "4:3",
      output_format: "png"
    };

    const output = await replicate.run(
      'google/nano-banana-pro',
      { input }
    ) as any;

    console.log('[NanoBanana] Pro Generation completed');

    // Handle output
    let imageUrl: string;

    if (Array.isArray(output)) {
      imageUrl = typeof output[0].url === 'function' ? output[0].url() : output[0];
    } else if (output && typeof output.url === 'function') {
      imageUrl = output.url();
    } else if (typeof output === 'string') {
      imageUrl = output;
    } else if (output && typeof output === 'object' && output.url) {
      imageUrl = output.url;
    } else {
      throw new Error('Unexpected output format from NanoBanana Pro');
    }

    console.log('[NanoBanana] Pro Image URL:', typeof imageUrl === 'string' ? imageUrl.substring(0, 100) : imageUrl);

    // Convert URL to base64
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    return base64;
  } catch (error) {
    console.error('[NanoBanana] Error generating Pro image:', error);
    throw error;
  }
}

/**
 * Check if NanoBanana service is available
 */
export function isNanoBananaAvailable(): boolean {
  const key = process.env.EXPO_PUBLIC_REPLICATE_API_KEY;
  const available = !!key;
  console.log('[NanoBanana] Service available:', available);
  return available;
}
