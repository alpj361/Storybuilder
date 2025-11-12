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
            text: `Analyze this character image and provide a detailed physical description suitable for image generation prompts.

IMPORTANT: Focus ONLY on visible physical attributes. Be specific and concise.

Include:
- Age range (e.g., "20s", "middle-aged", "elderly")
- Gender presentation
- Build/physique (e.g., "athletic", "slim", "stocky")
- Hair: color, length, style
- Clothing: style, colors, distinctive items
- Distinctive features: scars, tattoos, glasses, facial hair, etc.

Format as a comma-separated description. Keep it under 50 words.

Example output: "30s male, athletic build, short dark brown hair, stubble beard, wearing navy blue casual jacket over white t-shirt, jeans, warm smile, friendly appearance"`
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

    // Return a fallback description
    if (error instanceof Error) {
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
