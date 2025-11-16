/**
 * Consistent Character Service
 * Uses sdxl-based/consistent-character via Replicate to generate character portraits
 * while preserving visual identity and consistency across different poses
 */

import Replicate from 'replicate';

// Consistent Character model version
export const CONSISTENT_CHARACTER_VERSION = "9c77a3c2f884193fcee4d89645f02a0b9def9434f9e03cb98460456b831c8772";

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

export interface ConsistentCharacterOptions {
  prompt: string;
  refImage: string; // Base64 or URL - reference image of the character
  seed?: number; // Optional seed for reproducibility
  numOutputs?: number; // Number of variations to generate (default 1)
}

/**
 * Generate a character portrait using Consistent Character model
 * Preserves visual identity from reference image while allowing different poses
 *
 * @param options - Generation options including reference image and prompt
 * @returns Object with image URLs and seed used
 */
export async function generatePortraitWithConsistentCharacter(
  options: ConsistentCharacterOptions
): Promise<{ imageUrl: string; seedUsed: number }> {
  console.log('[ConsistentCharacter] Generating portrait with visual consistency...');
  console.log('[ConsistentCharacter] Seed:', options.seed || 'random');

  try {
    // Validate refImage is provided
    if (!options.refImage || options.refImage.trim() === '') {
      throw new Error('Reference image is required but was not provided');
    }

    // Ensure image is in correct format for Replicate
    // Replicate accepts: URLs (http/https) or data URIs (data:image/...;base64,...)
    let imageInput = options.refImage;

    // Check if it's already a data URI or URL
    const isDataURI = imageInput.startsWith('data:');
    const isUrl = imageInput.startsWith('http://') || imageInput.startsWith('https://');

    console.log('[ConsistentCharacter] Original image format:', {
      isDataURI,
      isUrl,
      length: imageInput.length,
      preview: imageInput.substring(0, 100)
    });

    // If it's raw base64 without data URI prefix, add it
    // Common formats from React Native image pickers
    if (!isDataURI && !isUrl) {
      console.log('[ConsistentCharacter] Converting raw base64 to data URI format');
      // Assume PNG if no format specified (most common for portraits)
      imageInput = `data:image/png;base64,${imageInput}`;
    }

    // Validate data URI format if it's base64
    if (imageInput.startsWith('data:')) {
      if (!imageInput.includes('base64,')) {
        throw new Error('Invalid data URI format: missing base64 encoding marker');
      }
      const base64Part = imageInput.split('base64,')[1];
      if (!base64Part || base64Part.length === 0) {
        throw new Error('Invalid data URI format: empty base64 data');
      }
      console.log('[ConsistentCharacter] Data URI validated, base64 length:', base64Part.length);
    }

    // Build storyboard-specific prompt
    const storyboardPrompt = buildStoryboardPrompt(options.prompt);

    // Generate or use provided seed
    const seed = options.seed ?? Math.floor(Math.random() * 1e9);

    // Prepare input for Consistent Character model
    const input = {
      image: imageInput,
      prompt: storyboardPrompt,
      seed: seed,
      num_outputs: options.numOutputs || 1,
    };

    console.log('[ConsistentCharacter] Calling Replicate with version:', CONSISTENT_CHARACTER_VERSION);
    console.log('[ConsistentCharacter] Prompt:', storyboardPrompt);
    console.log('[ConsistentCharacter] Image format being sent:', imageInput.startsWith('data:') ? 'data URI' : 'URL');

    // Run Consistent Character prediction using /v1/predictions endpoint
    const prediction = await replicate.predictions.create({
      version: CONSISTENT_CHARACTER_VERSION,
      input: input
    });

    // Wait for the prediction to complete
    console.log('[ConsistentCharacter] Waiting for prediction:', prediction.id);
    const completedPrediction = await replicate.wait(prediction);

    console.log('[ConsistentCharacter] Prediction completed with status:', completedPrediction.status);

    // Check for errors in the prediction
    if (completedPrediction.status === 'failed') {
      const errorMessage = completedPrediction.error || 'Unknown error from Replicate';
      console.error('[ConsistentCharacter] Prediction failed:', errorMessage);
      console.error('[ConsistentCharacter] Full prediction object:', JSON.stringify(completedPrediction, null, 2));
      throw new Error(`Prediction failed: ${errorMessage}`);
    }

    if (!completedPrediction.output || completedPrediction.output.length === 0) {
      console.error('[ConsistentCharacter] No output received. Status:', completedPrediction.status);
      console.error('[ConsistentCharacter] Full prediction:', JSON.stringify(completedPrediction, null, 2));
      throw new Error('Consistent Character model returned no output');
    }

    // Get the first output image (URL)
    const imageUrl = completedPrediction.output[0] as string;
    console.log('[ConsistentCharacter] Portrait generated, URL:', imageUrl);

    // Convert URL to base64 for consistent handling
    const base64Image = await urlToBase64(imageUrl);
    console.log('[ConsistentCharacter] Portrait converted to base64');

    return {
      imageUrl: base64Image,
      seedUsed: seed
    };
  } catch (error) {
    console.error('[ConsistentCharacter] Error generating portrait:', error);
    throw new Error(
      `Failed to generate portrait with Consistent Character: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Build a storyboard-optimized prompt for Consistent Character
 */
function buildStoryboardPrompt(characterDescription: string): string {
  const storyboardStyle = 'rough pencil sketch, loose gestural lines, black and white, draft quality, hand-drawn appearance, storyboard style';

  return `${storyboardStyle}, ${characterDescription}, character portrait, front view, neutral background, character reference sheet`;
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
    console.error('[ConsistentCharacter] Error converting URL to base64:', error);
    throw error;
  }
}

/**
 * Check if Consistent Character is available (API key configured)
 */
export function isConsistentCharacterAvailable(): boolean {
  try {
    getReplicateKey();
    return true;
  } catch {
    return false;
  }
}

// Legacy export names for backward compatibility
export const generatePortraitWithInstantID = generatePortraitWithConsistentCharacter;
export const isInstantIDAvailable = isConsistentCharacterAvailable;
export type InstantIDOptions = ConsistentCharacterOptions;
