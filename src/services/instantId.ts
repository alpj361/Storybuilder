/**
 * Visual Identity Preservation Services
 *
 * - Consistent Character: For HUMAN characters (uses InstantID, requires faces)
 * - IP-Adapter: For NON-HUMAN characters (creatures, robots, animals, etc.)
 *
 * Both services use Replicate to generate character portraits while preserving
 * visual identity and consistency across different poses
 */

import Replicate from 'replicate';
import * as FileSystem from 'expo-file-system';

// Model versions
export const CONSISTENT_CHARACTER_VERSION = "9c77a3c2f884193fcee4d89645f02a0b9def9434f9e03cb98460456b831c8772";
export const IP_ADAPTER_VERSION = "chigozienri/ip_adapter-sdxl:904dc004af1dba5c9b13fc9e41635aeb2f9a177896a396ab3393f3f6493dbdd4";

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

export interface IPAdapterOptions {
  prompt: string;
  refImage: string; // Base64 or URL - reference image of the character
  seed?: number; // Optional seed for reproducibility
  numOutputs?: number; // Number of variations to generate (1-4, default 1)
  scale?: number; // Influence of reference image (0-1, default 0.6)
  negativePrompt?: string; // Elements to avoid in generation
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

    // Upload image to Replicate Files API (or use URL as-is)
    const imageInput = await uploadImageToReplicateFiles(options.refImage, 'ConsistentCharacter');

    // Build storyboard-specific prompt
    const storyboardPrompt = buildStoryboardPrompt(options.prompt);

    // Generate or use provided seed
    const seed = options.seed ?? Math.floor(Math.random() * 1e9);

    // Prepare input for Consistent Character model
    // Schema: https://replicate.com/sdxl-based/consistent-character
    const input = {
      subject: imageInput,                      // Image of the person (URI)
      prompt: storyboardPrompt,                 // Description of what to generate
      seed: seed,                               // For reproducibility
      number_of_outputs: options.numOutputs || 1, // How many images to generate
      output_format: 'png',                     // Format: webp/jpg/png
      output_quality: 90,                       // Quality: 0-100
      randomise_poses: false,                   // Keep consistent pose
      number_of_images_per_pose: 1,            // Images per pose
      disable_safety_checker: false             // Keep safety checker enabled
    };

    console.log('[ConsistentCharacter] Calling Replicate with version:', CONSISTENT_CHARACTER_VERSION);
    console.log('[ConsistentCharacter] Prompt:', storyboardPrompt);
    console.log('[ConsistentCharacter] Subject URL:', imageInput);
    console.log('[ConsistentCharacter] Input params:', JSON.stringify(input, null, 2));

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
 * Generate a character portrait using IP-Adapter SDXL
 * For non-human characters (creatures, robots, animals, etc.)
 * Preserves visual style and appearance from reference image
 *
 * @param options - Generation options including reference image and prompt
 * @returns Object with image URLs and seed used
 */
export async function generatePortraitWithIPAdapter(
  options: IPAdapterOptions
): Promise<{ imageUrl: string; seedUsed: number }> {
  console.log('[IPAdapter] Generating portrait with visual identity preservation...');
  console.log('[IPAdapter] Seed:', options.seed || 'random');

  try {
    // Validate refImage is provided
    if (!options.refImage || options.refImage.trim() === '') {
      throw new Error('Reference image is required but was not provided');
    }

    // Upload image to Replicate Files API (or use URL as-is)
    const imageInput = await uploadImageToReplicateFiles(options.refImage, 'IPAdapter');

    // Build storyboard-specific prompt
    const storyboardPrompt = buildStoryboardPrompt(options.prompt);

    // Generate or use provided seed
    const seed = options.seed ?? Math.floor(Math.random() * 1e9);

    // Prepare input for IP-Adapter model
    // Schema: https://replicate.com/chigozienri/ip_adapter-sdxl
    const input = {
      image: imageInput,                          // Reference image (URI)
      prompt: storyboardPrompt,                   // Description of what to generate
      negative_prompt: options.negativePrompt || 'blurry, low quality, distorted, deformed', // Elements to avoid
      scale: options.scale ?? 0.6,                // Influence of reference image (0-1)
      num_outputs: options.numOutputs || 1,       // Number of images (1-4)
      num_inference_steps: 30,                    // Denoising steps
      seed: seed                                   // For reproducibility
    };

    console.log('[IPAdapter] Calling Replicate with model:', IP_ADAPTER_VERSION);
    console.log('[IPAdapter] Prompt:', storyboardPrompt);
    console.log('[IPAdapter] Image URL:', imageInput);
    console.log('[IPAdapter] Input params:', JSON.stringify(input, null, 2));

    // Run IP-Adapter prediction using model identifier
    const output = await replicate.run(IP_ADAPTER_VERSION as any, {
      input: input
    });

    console.log('[IPAdapter] Prediction completed');
    console.log('[IPAdapter] Output:', output);

    // Check if output exists
    if (!output || (Array.isArray(output) && output.length === 0)) {
      console.error('[IPAdapter] No output received');
      throw new Error('IP-Adapter model returned no output');
    }

    // Get the first output image (URL)
    const imageUrl = Array.isArray(output) ? output[0] : output;
    console.log('[IPAdapter] Portrait generated, URL:', imageUrl);

    // Convert URL to base64 for consistent handling
    const base64Image = await urlToBase64(imageUrl as string);
    console.log('[IPAdapter] Portrait converted to base64');

    return {
      imageUrl: base64Image,
      seedUsed: seed
    };
  } catch (error) {
    console.error('[IPAdapter] Error generating portrait:', error);
    throw new Error(
      `Failed to generate portrait with IP-Adapter: ${error instanceof Error ? error.message : 'Unknown error'}`
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
    console.error('[VisualIdentity] Error converting URL to base64:', error);
    throw error;
  }
}

/**
 * Upload image to Replicate Files API
 * Shared helper for both Consistent Character and IP-Adapter
 */
async function uploadImageToReplicateFiles(imageInput: string, logPrefix: string): Promise<string> {
  // Check if it's already a public URL
  const isUrl = imageInput.startsWith('http://') || imageInput.startsWith('https://');

  console.log(`[${logPrefix}] Original image format:`, {
    isUrl,
    length: imageInput.length,
    preview: imageInput.substring(0, 100)
  });

  // If already a URL, return as-is
  if (isUrl) {
    return imageInput;
  }

  console.log(`[${logPrefix}] Uploading image to Replicate Files API...`);

  if (!imageInput.startsWith('data:')) {
    throw new Error('Unsupported image format. Please use data URI or public URL.');
  }

  // Extract base64 data from data URI
  const base64Data = imageInput.split('base64,')[1];
  if (!base64Data) {
    throw new Error('Invalid data URI: no base64 data found');
  }

  // Get MIME type from data URI
  const mimeMatch = imageInput.match(/data:([^;]+);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const extension = mimeType.split('/')[1] || 'jpg';

  console.log(`[${logPrefix}] Data URI info:`, {
    mimeType,
    extension,
    base64Length: base64Data.length
  });

  // Write base64 to temporary file using FileSystem
  const tempFileName = `replicate_upload_${Date.now()}.${extension}`;
  const tempFileUri = `${FileSystem.cacheDirectory}${tempFileName}`;

  console.log(`[${logPrefix}] Writing to temporary file:`, tempFileUri);

  await FileSystem.writeAsStringAsync(tempFileUri, base64Data, {
    encoding: FileSystem.EncodingType.Base64
  });

  console.log(`[${logPrefix}] File written, preparing upload...`);

  try {
    // Create FormData for file upload (React Native compatible)
    const formData = new FormData();
    formData.append('content', {
      uri: tempFileUri,
      type: mimeType,
      name: tempFileName
    } as any);

    // Upload to Replicate Files API using fetch
    const uploadResponse = await fetch('https://api.replicate.com/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${getReplicateKey()}`
      },
      body: formData
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Files API upload failed: ${uploadResponse.status} ${errorText}`);
    }

    const fileData = await uploadResponse.json();
    const uploadedUrl = fileData.urls.get;

    console.log(`[${logPrefix}] Image uploaded successfully`);
    console.log(`[${logPrefix}] Temporary URL:`, uploadedUrl);

    return uploadedUrl;
  } finally {
    // Clean up temporary file
    try {
      await FileSystem.deleteAsync(tempFileUri, { idempotent: true });
      console.log(`[${logPrefix}] Temporary file cleaned up`);
    } catch (cleanupError) {
      console.warn(`[${logPrefix}] Failed to cleanup temp file:`, cleanupError);
    }
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
