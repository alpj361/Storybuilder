/**
 * Character Description Service
 * Uses Gemini 2.0 Flash (via Clarifai) to analyze character reference images
 * and generate detailed appearance descriptions for image generation
 */

import OpenAI from 'openai';

// Initialize Clarifai client using OpenAI-compatible API
// This uses Gemini 2.0 Flash through Clarifai's infrastructure
const getClarifaiKey = () => {
  const key = process.env.EXPO_PUBLIC_CLARIFAI_API_KEY;
  console.log('[CharacterDescriber] Clarifai API Key check:', {
    exists: !!key,
    prefix: key?.substring(0, 10)
  });

  if (!key) {
    throw new Error('EXPO_PUBLIC_CLARIFAI_API_KEY environment variable is not set');
  }

  return key;
};

const openai = new OpenAI({
  baseURL: 'https://api.clarifai.com/v2/ext/openai/v1',
  apiKey: getClarifaiKey(),
  dangerouslyAllowBrowser: true // Note: In production, use backend proxy
});

/**
 * Analyze a character reference image and generate a detailed description
 * suitable for use in image generation prompts
 *
 * @param imageBase64 - Base64 encoded image (data:image/jpeg;base64,...)
 * @returns Detailed character appearance description
 */
export async function describeCharacterFromImage(
  imageBase64: string
): Promise<string> {
  console.log('[CharacterDescriber] Analyzing character reference image...');

  try {
    const response = await openai.chat.completions.create({
      model: 'https://clarifai.com/gcp/generate/models/gemini-2_0-flash',
      max_tokens: 500, // Increased for more detailed descriptions
      temperature: 0.2, // Very low temperature for highly consistent descriptions
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: `You are helping a storyboard artist create fictional character descriptions for illustration purposes. Analyze this reference image and provide a DETAILED physical description suitable for drawing/sketching this character consistently across multiple panels.

IMPORTANT: This is for creating fictional illustrated characters in storyboard art. Focus ONLY on observable physical attributes for artistic reference.

Describe these characteristics in detail:

1. FACIAL FEATURES (most important for consistency):
   - Face shape (oval, round, square, heart-shaped, angular, etc.)
   - Eyes: size, shape, spacing (wide-set, close-set, almond-shaped, round, etc.)
   - Eyebrows: thickness, shape, arch
   - Nose: size and shape (small, button, prominent, straight, upturned, etc.)
   - Mouth: size, lip fullness (thin lips, full lips, etc.)
   - Jaw/chin: definition (strong jaw, soft chin, pointed chin, etc.)
   - Cheekbones: prominence (high cheekbones, soft cheeks, etc.)

2. HAIR (detailed):
   - Color (be specific: "dark brown", "platinum blonde", "black with blue tint")
   - Length (very short, chin-length, shoulder-length, waist-length, etc.)
   - Texture (straight, wavy, curly, kinky, coarse, fine)
   - Style (loose, tied back, braided, messy, sleek, parted left/right/center, bangs, etc.)

3. BODY & BUILD:
   - Height impression (tall, average, short, petite)
   - Build (slim, athletic, curvy, stocky, muscular, heavyset, etc.)
   - Shoulder width (broad, narrow, average)
   - Proportions relevant to drawing

4. DISTINCTIVE FEATURES:
   - Glasses, facial hair, scars, tattoos, piercings, moles, freckles
   - Unique characteristics that make this person recognizable

5. CLOTHING & STYLE:
   - Primary clothing items and colors
   - Style (casual, formal, sporty, vintage, etc.)
   - Accessories (jewelry, watches, bags, hats, etc.)

6. AGE & OVERALL IMPRESSION:
   - Age range (teens, 20s, 30s, middle-aged, elderly)
   - Gender presentation
   - Overall vibe/expression (friendly, serious, confident, etc.)

Output format: Detailed comma-separated description optimized for AI image generation. Focus on DISTINCTIVE features that will help maintain visual consistency. Use specific, visual language that works well for sketch/storyboard generation.

Example: "Angular face with strong jawline, almond-shaped dark eyes with thick arched eyebrows, straight nose, full lips, high cheekbones, 20s female, long straight black hair parted in center reaching mid-back, slim athletic build with narrow shoulders, wearing oversized cream knit sweater and silver hoop earrings, confident expression with slight smile, distinctive small mole above left lip"`
          },
          {
            type: 'image_url',
            image_url: {
              url: imageBase64,
              detail: 'high' // Use 'high' for better facial feature recognition
            }
          }
        ]
      }]
    });

    const description = response.choices[0].message.content?.trim() || '';

    console.log('[CharacterDescriber] Gemini 2.0 Flash - Generated description:', description);
    console.log('[CharacterDescriber] Tokens used:', response.usage);

    return description;
  } catch (error) {
    console.error('[CharacterDescriber] Gemini 2.0 Flash - Error analyzing image:', error);

    // Check if it's a content policy error
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      if (errorMessage.includes('content_policy') ||
          errorMessage.includes('safety') ||
          errorMessage.includes('violated') ||
          errorMessage.includes('cannot help')) {
        throw new Error('Image analysis blocked by content policy. Please manually enter appearance details in the fields below, or try a different reference image (e.g., illustration/artwork instead of photos).');
      }

      throw new Error(`Failed to analyze character image: ${error.message}`);
    }

    throw new Error('Failed to analyze character image');
  }
}

/**
 * Cache for character descriptions to avoid re-analyzing the same image
 * Key: first 100 chars of base64 image (as a simple hash)
 */
const descriptionCache = new Map<string, string>();

/**
 * Get character description with caching
 */
export async function getCharacterDescription(
  imageBase64: string
): Promise<string> {
  // Create simple cache key from image data
  const cacheKey = imageBase64.substring(0, 100);

  // Check cache first
  if (descriptionCache.has(cacheKey)) {
    console.log('[CharacterDescriber] Using cached description');
    return descriptionCache.get(cacheKey)!;
  }

  // Analyze image
  const description = await describeCharacterFromImage(imageBase64);

  // Cache result
  descriptionCache.set(cacheKey, description);

  // Limit cache size to prevent memory issues
  if (descriptionCache.size > 50) {
    const firstKey = descriptionCache.keys().next().value;
    if (firstKey !== undefined) {
      descriptionCache.delete(firstKey);
    }
  }

  return description;
}
