/**
 * InstantID Service
 * Uses InstantID via Replicate to generate character portraits
 * while preserving visual identity from reference image
 */

import Replicate from 'replicate';

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

export interface InstantIDOptions {
  prompt: string;
  faceImage: string; // Base64 or URL
  identityStrength?: number; // 0.0-1.0 (default 0.8)
  style?: 'sketch' | 'artistic' | 'photorealistic';
  width?: number;
  height?: number;
  numInferenceSteps?: number;
  guidanceScale?: number;
}

/**
 * Generate a character portrait using InstantID
 * Preserves visual identity from reference image while applying storyboard style
 *
 * @param options - Generation options including face image and prompt
 * @returns Base64 encoded portrait image
 */
export async function generatePortraitWithInstantID(
  options: InstantIDOptions
): Promise<string> {
  console.log('[InstantID] Generating portrait with visual identity preservation...');
  console.log('[InstantID] Identity strength:', options.identityStrength || 0.8);
  console.log('[InstantID] Style:', options.style || 'sketch');

  try {
    // Select model based on desired style
    const modelVersions = {
      sketch: 'zsxkib/instant-id',           // Good for line art/sketches
      artistic: 'grandlineai/instant-id-artistic',  // Dreamshaper-XL base
      photorealistic: 'grandlineai/instant-id-photorealistic' // Juggernaut-XL base
    };

    const selectedModel = modelVersions[options.style || 'sketch'];

    // Build storyboard-specific prompt
    const storyboardPrompt = buildStoryboardPrompt(options.prompt, options.style);

    // Prepare input for InstantID
    const input = {
      image: options.faceImage,
      prompt: storyboardPrompt,
      width: options.width || 1024,
      height: options.height || 1024,
      num_inference_steps: options.numInferenceSteps || 30,
      guidance_scale: options.guidanceScale || 7.5,
      // Identity preservation parameters
      identitynet_strength_ratio: options.identityStrength || 0.8,
      adapter_strength_ratio: options.identityStrength || 0.8,
      // Style parameters
      negative_prompt: 'blurry, low quality, distorted, ugly, bad anatomy, extra limbs, poorly drawn, bad proportions',
    };

    console.log('[InstantID] Calling Replicate with model:', selectedModel);
    console.log('[InstantID] Prompt:', storyboardPrompt);

    // Run InstantID prediction using /v1/predictions endpoint (for community models)
    const prediction = await replicate.predictions.create({
      version: selectedModel,
      input: input
    });

    // Wait for the prediction to complete
    const completedPrediction = await replicate.wait(prediction);

    if (!completedPrediction.output || completedPrediction.output.length === 0) {
      throw new Error('InstantID returned no output');
    }

    // Get the first output image (URL)
    const imageUrl = completedPrediction.output[0];
    console.log('[InstantID] Portrait generated, URL:', imageUrl);

    // Convert URL to base64 for consistent handling
    const base64Image = await urlToBase64(imageUrl);
    console.log('[InstantID] Portrait converted to base64');

    return base64Image;
  } catch (error) {
    console.error('[InstantID] Error generating portrait:', error);
    throw new Error(
      `Failed to generate portrait with InstantID: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Build a storyboard-optimized prompt for InstantID
 */
function buildStoryboardPrompt(characterDescription: string, style?: string): string {
  const stylePrompts = {
    sketch: 'rough pencil sketch, loose gestural lines, black and white, draft quality, hand-drawn appearance, storyboard style',
    artistic: 'artistic illustration, detailed drawing, expressive lines, concept art style',
    photorealistic: 'professional portrait, detailed rendering, high quality'
  };

  const selectedStyle = stylePrompts[style || 'sketch'];

  return `${selectedStyle}, ${characterDescription}, character portrait, front view, neutral background, character reference sheet`;
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
    console.error('[InstantID] Error converting URL to base64:', error);
    throw error;
  }
}

/**
 * Check if InstantID is available (API key configured)
 */
export function isInstantIDAvailable(): boolean {
  try {
    getReplicateKey();
    return true;
  } catch {
    return false;
  }
}
