/**
 * Character Description Service
 * Uses GPT-4 Vision to analyze character reference images
 * and generate detailed appearance descriptions for image generation
 */

import OpenAI from 'openai';

// Initialize OpenAI client (reuse same configuration as aiParser)
const getOpenAIKey = () => {
  const key = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  console.log('[CharacterDescriber] OpenAI API Key check:', {
    exists: !!key,
    prefix: key?.substring(0, 10)
  });
  return key || 'your-api-key-here';
};

const openai = new OpenAI({
  apiKey: getOpenAIKey(),
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
      model: 'gpt-4o',
      max_tokens: 300,
      temperature: 0.3, // Low temperature for consistent descriptions
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this reference ONLY to extract generic visual traits (age range, hair, clothing, expression). Do not infer identity. This is for fictional art, not for identifying a real person.

Describe these observable visual attributes:
- Approximate age range (e.g., "20s", "middle-aged", "elderly")
- Gender presentation
- Build/physique (e.g., "athletic", "slim", "average build")
- Hair: color, length, style/texture
- Clothing: style, colors, key items visible
- Notable features: accessories, glasses, facial hair, expression

Output format: Single comma-separated sentence, under 50 words, suitable for art direction.

Example: "20s female, slim build, long dark brown hair, wearing black top with beaded bracelet, casual office setting, friendly expression"`
          },
          {
            type: 'image_url',
            image_url: {
              url: imageBase64,
              detail: 'low' // Use 'low' for faster processing and lower cost
            }
          }
        ]
      }]
    });

    const description = response.choices[0].message.content?.trim() || '';

    console.log('[CharacterDescriber] Generated description:', description);
    console.log('[CharacterDescriber] Tokens used:', response.usage);

    return description;
  } catch (error) {
    console.error('[CharacterDescriber] Error analyzing image:', error);

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
