/**
 * NanoBanana Image Editing Service
 * Uses Google's NanoBanana model via Replicate for AI-powered image refinement
 *
 * This service allows making light edits to existing images based on text prompts
 * without regenerating from scratch.
 */

import Replicate from 'replicate';
import Constants from 'expo-constants';

const REPLICATE_API_KEY = Constants.expoConfig?.extra?.REPLICATE_API_TOKEN || '';

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

  if (!REPLICATE_API_KEY) {
    throw new Error('Replicate API key not found');
  }

  try {
    const replicate = new Replicate({
      auth: REPLICATE_API_KEY,
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

    console.log('[NanoBanana] API call completed');
    console.log('[NanoBanana] Output type:', typeof output);

    // Get the URL from the output
    let imageUrl: string;

    if (typeof output === 'string') {
      imageUrl = output;
    } else if (output && typeof output.url === 'function') {
      imageUrl = output.url();
    } else if (Array.isArray(output) && output.length > 0) {
      imageUrl = output[0];
    } else if (output && output.url) {
      imageUrl = output.url;
    } else {
      console.error('[NanoBanana] Unexpected output format:', output);
      throw new Error('Unexpected output format from NanoBanana');
    }

    console.log('[NanoBanana] Image URL obtained:', imageUrl.substring(0, 100));

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
 * Check if NanoBanana service is available
 */
export function isNanoBananaAvailable(): boolean {
  const available = !!REPLICATE_API_KEY;
  console.log('[NanoBanana] Service available:', available);
  return available;
}
