/**
 * Character Description Service
 * Uses Gemini 2.5 Flash (via Replicate) to analyze character reference images
 * and generate detailed appearance descriptions for image generation
 */

import Replicate from 'replicate';

// Initialize Replicate client
const getReplicateKey = () => {
  const key = process.env.EXPO_PUBLIC_REPLICATE_API_KEY;
  console.log('[CharacterDescriber] Replicate API Key check:', {
    exists: !!key,
    prefix: key?.substring(0, 10)
  });

  if (!key) {
    throw new Error('EXPO_PUBLIC_REPLICATE_API_KEY environment variable is not set');
  }

  return key;
};

const replicate = new Replicate({
  auth: getReplicateKey(),
});

/**
 * Analyze a character reference image and generate a detailed description
 * suitable for use in image generation prompts
 *
 * @param imageBase64 - Base64 encoded image (data:image/jpeg;base64,...)
 * @returns Detailed character appearance description
 */
/**
 * Create the detailed character description prompt
 */
const getDescriptionPrompt = () => `You are helping a storyboard artist create fictional character descriptions for illustration purposes. Analyze this reference image and provide a DETAILED physical description suitable for drawing/sketching this character consistently across multiple panels.

CRITICAL: DO NOT ASSUME THIS IS A HUMAN. First identify what type of character this is, then describe accordingly.

STEP 1 - IDENTIFY CHARACTER TYPE (MANDATORY):
Start your response with the character type using this EXACT format:
CHARACTER_TYPE: [human | creature | robot | animal | alien | hybrid | other]
SPECIES: [specific species if applicable, e.g., "dragon", "wolf", "android", "alien being"]

Examples:
- If it's a dragon: "CHARACTER_TYPE: creature | SPECIES: dragon"
- If it's a wolf: "CHARACTER_TYPE: animal | SPECIES: wolf"
- If it's a robot: "CHARACTER_TYPE: robot | SPECIES: android"
- If it's a human: "CHARACTER_TYPE: human | SPECIES: N/A"
- If it's an alien: "CHARACTER_TYPE: alien | SPECIES: extraterrestrial being"

STEP 2 - DESCRIBE BASED ON CHARACTER TYPE:

FOR HUMANS:
1. FACIAL FEATURES: Face shape, eyes (size, shape, color), eyebrows, nose, mouth, jaw/chin, cheekbones
2. HAIR: Color, length, texture, style
3. BODY & BUILD: Height, build, shoulder width, posture
4. SKIN: Skin tone and texture
5. CLOTHING & STYLE: Primary clothing, colors, accessories
6. DISTINCTIVE FEATURES: Glasses, facial hair, scars, tattoos, etc.
7. AGE & EXPRESSION: Age range, gender, default expression

FOR NON-HUMANS (creatures, robots, animals, aliens):
1. BODY TYPE: Quadruped, bipedal, serpentine, humanoid, etc.
2. SIZE: Massive, large, human-sized, small, tiny
3. TEXTURE/SURFACE: Scales, fur, feathers, metallic plating, smooth skin, etc.
4. COLORATION: Primary colors, patterns, accents (e.g., "crimson scales with golden accents")
5. DISTINCTIVE FEATURES: Wings, horns, tail, claws, multiple limbs, antennae, etc.
6. BUILD: Muscular, slender, bulky, sleek, etc.
7. AGE & IMPRESSION: Young, adult, ancient; menacing, majestic, friendly, etc.

Output format: Start with CHARACTER_TYPE and SPECIES on the first line, then provide a detailed comma-separated description optimized for AI image generation.

Example for dragon: "CHARACTER_TYPE: creature | SPECIES: dragon | Massive quadruped dragon, crimson scales with golden accents along spine, large leathery wings folded at sides, long serpentine neck, fierce yellow eyes with slit pupils, rows of sharp ivory horns along head and back, powerful muscular build, long spiked tail, smoke wisps from nostrils, ancient and majestic presence"

Example for human: "CHARACTER_TYPE: human | SPECIES: N/A | Angular face with strong jawline, almond-shaped dark brown eyes, thick arched eyebrows, straight nose, full lips, high cheekbones, 20s female, long straight black hair parted center, slim athletic build, tan skin, wearing cream knit sweater, confident expression"`;

export async function describeCharacterFromImage(
  imageBase64: string
): Promise<string> {
  console.log('[CharacterDescriber] Analyzing character reference image with Gemini 2.5 Flash via Replicate...');

  try {
    // Gemini 2.5 Flash on Replicate
    const input = {
      images: [imageBase64], // Replicate accepts data URIs
      prompt: getDescriptionPrompt(),
      temperature: 0.2, // Low temperature for consistent descriptions
      max_tokens: 500,
    };

    console.log('[CharacterDescriber] Running Gemini 2.5 Flash prediction...');

    // Run the prediction - not streaming for simpler response handling
    const output = await replicate.run(
      "google/gemini-2.5-flash",
      { input }
    ) as string;

    const description = (typeof output === 'string' ? output : JSON.stringify(output)).trim();

    console.log('[CharacterDescriber] ✓ Gemini 2.5 Flash - Success:', description);

    return description;
  } catch (error) {
    console.error('[CharacterDescriber] ✗ Gemini 2.5 Flash failed:', error);

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

/**
 * Parse AI-generated character description into structured appearance fields
 * This extracts key details from the comma-separated description and organizes them
 * into the appearance structure used by the Character interface
 *
 * @param aiDescription - The AI-generated character description (comma-separated)
 * @returns Structured appearance object with individual fields populated
 */
export function parseDescriptionIntoFields(aiDescription: string): {
  characterType?: 'human' | 'creature' | 'robot' | 'animal' | 'alien' | 'hybrid' | 'other';
  age?: string;
  gender?: string;
  height?: string;
  build?: string;
  hair?: string;
  clothing?: string;
  distinctiveFeatures?: string[];
  // Human-specific fields
  faceShape?: string;
  eyeShape?: string;
  eyeColor?: string;
  eyebrows?: string;
  nose?: string;
  mouth?: string;
  jawline?: string;
  cheekbones?: string;
  shoulderWidth?: string;
  posture?: string;
  skinTone?: string;
  defaultExpression?: string;
  // Non-human specific fields
  species?: string;
  bodyType?: string;
  texture?: string;
  features?: string[];
  coloration?: string;
  size?: string;
} {
  console.log('[CharacterDescriber] Parsing description into fields:', aiDescription);

  const result: {
    characterType?: 'human' | 'creature' | 'robot' | 'animal' | 'alien' | 'hybrid' | 'other';
    age?: string;
    gender?: string;
    height?: string;
    build?: string;
    hair?: string;
    clothing?: string;
    distinctiveFeatures?: string[];
    faceShape?: string;
    eyeShape?: string;
    eyeColor?: string;
    eyebrows?: string;
    nose?: string;
    mouth?: string;
    jawline?: string;
    cheekbones?: string;
    shoulderWidth?: string;
    posture?: string;
    skinTone?: string;
    defaultExpression?: string;
    species?: string;
    bodyType?: string;
    texture?: string;
    features?: string[];
    coloration?: string;
    size?: string;
  } = {
    distinctiveFeatures: [],
    features: []
  };

  // STEP 1: Extract CHARACTER_TYPE and SPECIES
  const characterTypeMatch = aiDescription.match(/CHARACTER_TYPE:\s*(human|creature|robot|animal|alien|hybrid|other)/i);
  if (characterTypeMatch) {
    result.characterType = characterTypeMatch[1].toLowerCase() as any;
    console.log('[CharacterDescriber] Detected character type:', result.characterType);
  }

  const speciesMatch = aiDescription.match(/SPECIES:\s*([^|]+)/i);
  if (speciesMatch) {
    const species = speciesMatch[1].trim();
    if (species.toLowerCase() !== 'n/a') {
      result.species = species;
      console.log('[CharacterDescriber] Detected species:', result.species);
    }
  }

  // Convert to lowercase for easier pattern matching
  const desc = aiDescription.toLowerCase();

  // Extract age range
  const agePatterns = [
    /(\d{1,2}s)\s*(male|female|person)?/i,
    /(teens|teenager|young adult|middle[-\s]?aged|elderly|senior)/i,
    /(early|late|mid)[-\s]?(\d{1,2}s)/i
  ];

  for (const pattern of agePatterns) {
    const match = aiDescription.match(pattern);
    if (match) {
      result.age = match[0].trim();
      break;
    }
  }

  // Extract gender
  if (desc.includes('female') || desc.includes('woman')) {
    result.gender = 'Female';
  } else if (desc.includes('male') || desc.includes('man')) {
    result.gender = 'Male';
  }

  // Extract build/body type
  const buildPatterns = [
    /(slim|slender|lean|thin|petite)/i,
    /(athletic|fit|toned|muscular)/i,
    /(curvy|heavyset|stocky|robust|sturdy)/i,
    /(average|medium) build/i
  ];

  for (const pattern of buildPatterns) {
    const match = aiDescription.match(pattern);
    if (match) {
      result.build = match[0].trim();
      break;
    }
  }

  // Extract height
  const heightPatterns = [
    /(tall|short|petite|average height)/i,
  ];

  for (const pattern of heightPatterns) {
    const match = aiDescription.match(pattern);
    if (match) {
      result.height = match[0].trim();
      break;
    }
  }

  // Extract hair description (most detailed extraction)
  // Look for patterns like "long dark brown wavy hair" or "short black hair"
  const hairMatch = aiDescription.match(
    /(very )?(\w+)[-\s]?(length|long|short)?\s*(dark |light |platinum |jet |honey |auburn |chestnut |sandy |ash )?(\w+)\s*(hair|tresses|locks)/i
  );

  if (hairMatch) {
    result.hair = hairMatch[0].trim();
  } else {
    // Fallback: look for color + hair
    const simpleHairMatch = aiDescription.match(/(\w+\s+\w+)\s+hair/i);
    if (simpleHairMatch) {
      result.hair = simpleHairMatch[0].trim();
    }
  }

  // Extract clothing
  const clothingMatch = aiDescription.match(/wearing\s+([^,]+)/i);
  if (clothingMatch) {
    result.clothing = clothingMatch[1].trim();
  }

  // Extract distinctive features
  const distinctivePatterns = [
    /(full|thick|sparse|trimmed|neat|scruffy)\s+(beard|mustache|goatee|facial hair)/i,
    /(glasses|spectacles)/i,
    /(scar|scars)\s+([^,]+)/i,
    /(tattoo|tattoos)\s+([^,]+)/i,
    /(piercing|piercings)\s+([^,]+)/i,
    /(mole|beauty mark)\s+([^,]+)/i,
    /(freckles)/i,
    /distinctive\s+([^,]+)/i
  ];

  for (const pattern of distinctivePatterns) {
    const match = aiDescription.match(pattern);
    if (match && result.distinctiveFeatures) {
      result.distinctiveFeatures.push(match[0].trim());
    }
  }

  // If no distinctive features found, remove the empty array
  if (result.distinctiveFeatures && result.distinctiveFeatures.length === 0) {
    delete result.distinctiveFeatures;
  }

  // Extract face shape
  const faceShapePatterns = [
    /(oval|round|square|heart[-\s]?shaped|angular|rectangular|diamond|triangular|oblong)[-\s]?face/i,
    /face[-\s]?shape[:\s]+(oval|round|square|heart[-\s]?shaped|angular|rectangular|diamond|triangular|oblong)/i
  ];
  for (const pattern of faceShapePatterns) {
    const match = aiDescription.match(pattern);
    if (match) {
      result.faceShape = match[1]?.trim() || match[0].trim();
      break;
    }
  }

  // Extract eye shape and color
  const eyeShapePatterns = [
    /(almond[-\s]?shaped|round|wide[-\s]?set|close[-\s]?set|hooded|upturned|downturned|monolid|deep[-\s]?set)[-\s]?eyes/i,
    /eyes[:\s]+([^,]+?)(,|with|and)/i
  ];
  for (const pattern of eyeShapePatterns) {
    const match = aiDescription.match(pattern);
    if (match) {
      result.eyeShape = match[1]?.trim() || match[0].trim();
      break;
    }
  }

  const eyeColorPatterns = [
    /(blue|brown|green|hazel|amber|gray|grey|dark|light)[-\s]?eyes/i,
    /eyes[^,]*?(blue|brown|green|hazel|amber|gray|grey|dark|light)/i
  ];
  for (const pattern of eyeColorPatterns) {
    const match = aiDescription.match(pattern);
    if (match) {
      result.eyeColor = match[1]?.trim();
      break;
    }
  }

  // Extract eyebrows
  const eyebrowPatterns = [
    /(thick|thin|sparse|arched|straight|bushy|groomed|neat)[-\s]?(arched|straight)?[-\s]?eyebrows/i,
    /eyebrows[:\s]+([^,]+)/i
  ];
  for (const pattern of eyebrowPatterns) {
    const match = aiDescription.match(pattern);
    if (match) {
      result.eyebrows = match[0].trim();
      break;
    }
  }

  // Extract nose
  const nosePatterns = [
    /(small|large|button|prominent|straight|upturned|aquiline|roman|wide|narrow|pointed)[-\s]?nose/i,
    /nose[:\s]+([^,]+)/i
  ];
  for (const pattern of nosePatterns) {
    const match = aiDescription.match(pattern);
    if (match) {
      result.nose = match[0].trim();
      break;
    }
  }

  // Extract mouth/lips
  const mouthPatterns = [
    /(full|thin|wide|small|cupid's bow|pouty)[-\s]?lips/i,
    /(thin|full|wide|narrow)[-\s]?mouth/i,
    /lips[:\s]+([^,]+)/i
  ];
  for (const pattern of mouthPatterns) {
    const match = aiDescription.match(pattern);
    if (match) {
      result.mouth = match[0].trim();
      break;
    }
  }

  // Extract jawline
  const jawlinePatterns = [
    /(strong|soft|defined|angular|square|round|weak|pronounced|chiseled)[-\s]?(jaw|jawline|chin)/i,
    /(pointed|rounded|square|soft|strong)[-\s]?chin/i
  ];
  for (const pattern of jawlinePatterns) {
    const match = aiDescription.match(pattern);
    if (match) {
      result.jawline = match[0].trim();
      break;
    }
  }

  // Extract cheekbones
  const cheekbonePatterns = [
    /(high|prominent|soft|defined|angular)[-\s]?cheekbones/i,
    /cheekbones[:\s]+([^,]+)/i
  ];
  for (const pattern of cheekbonePatterns) {
    const match = aiDescription.match(pattern);
    if (match) {
      result.cheekbones = match[0].trim();
      break;
    }
  }

  // Extract shoulder width
  const shoulderPatterns = [
    /(broad|narrow|wide|average)[-\s]?shoulders/i,
    /shoulders[:\s]+([^,]+)/i
  ];
  for (const pattern of shoulderPatterns) {
    const match = aiDescription.match(pattern);
    if (match) {
      result.shoulderWidth = match[0].trim();
      break;
    }
  }

  // Extract posture
  const posturePatterns = [
    /(upright|slouched|relaxed|tense|confident|hunched)[-\s]?posture/i,
    /posture[:\s]+([^,]+)/i,
    /(standing|sitting)[-\s]?(upright|straight|relaxed|slouched)/i
  ];
  for (const pattern of posturePatterns) {
    const match = aiDescription.match(pattern);
    if (match) {
      result.posture = match[0].trim();
      break;
    }
  }

  // Extract skin tone
  const skinTonePatterns = [
    /(fair|light|pale|olive|tan|brown|dark|ebony|porcelain|ivory|beige|bronze)[-\s]?(skin|complexion|skin tone)/i,
    /skin[-\s]?tone[:\s]+([^,]+)/i,
    /complexion[:\s]+([^,]+)/i
  ];
  for (const pattern of skinTonePatterns) {
    const match = aiDescription.match(pattern);
    if (match) {
      result.skinTone = match[0].trim();
      break;
    }
  }

  // Extract default expression
  const expressionPatterns = [
    /(friendly|serious|confident|shy|stern|warm|cold|neutral|happy|sad|angry|calm|intense)[-\s]?expression/i,
    /expression[:\s]+([^,]+)/i,
    /(smiling|frowning|grinning|smirking|neutral face)/i
  ];
  for (const pattern of expressionPatterns) {
    const match = aiDescription.match(pattern);
    if (match) {
      result.defaultExpression = match[0].trim();
      break;
    }
  }

  // STEP 2: Extract NON-HUMAN specific fields (if not human)
  if (result.characterType && result.characterType !== 'human') {
    console.log('[CharacterDescriber] Parsing non-human fields...');

    // Extract body type
    const bodyTypePatterns = [
      /(quadruped|bipedal|serpentine|humanoid|multi-limbed|amorphous)/i,
      /body type[:\s]+([^,]+)/i
    ];
    for (const pattern of bodyTypePatterns) {
      const match = aiDescription.match(pattern);
      if (match) {
        result.bodyType = match[1] || match[0].trim();
        break;
      }
    }

    // Extract texture/surface
    const texturePatterns = [
      /(scales|fur|feathers|metallic plating|smooth skin|rough skin|crystalline|chitinous)/i,
      /texture[:\s]+([^,]+)/i,
      /covered in ([^,]+)/i
    ];
    for (const pattern of texturePatterns) {
      const match = aiDescription.match(pattern);
      if (match) {
        result.texture = match[1] || match[0].trim();
        break;
      }
    }

    // Extract coloration
    const colorationPatterns = [
      /([a-z]+)[-\s](scales|fur|feathers|plating|skin)\s+with\s+([^,]+)/i,
      /coloration[:\s]+([^,]+)/i,
      /(crimson|golden|silver|black|white|blue|green|red|purple|multicolored)[^,]+(scales|fur|feathers|body)/i
    ];
    for (const pattern of colorationPatterns) {
      const match = aiDescription.match(pattern);
      if (match) {
        result.coloration = match[0].trim();
        break;
      }
    }

    // Extract size
    const sizePatterns = [
      /(massive|huge|large|giant|enormous|colossal|medium|small|tiny|diminutive)/i,
      /size[:\s]+([^,]+)/i
    ];
    for (const pattern of sizePatterns) {
      const match = aiDescription.match(pattern);
      if (match) {
        result.size = match[1] || match[0].trim();
        break;
      }
    }

    // Extract features (wings, horns, tail, etc.)
    const featureKeywords = [
      'wings', 'horns', 'tail', 'claws', 'fangs', 'antennae', 'tentacles',
      'spikes', 'fins', 'beak', 'talons', 'mane', 'crest', 'tusks'
    ];

    const detectedFeatures: string[] = [];
    for (const keyword of featureKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(aiDescription)) {
        detectedFeatures.push(keyword);
      }
    }

    if (detectedFeatures.length > 0) {
      result.features = detectedFeatures;
    }

    console.log('[CharacterDescriber] Non-human fields extracted:', {
      bodyType: result.bodyType,
      texture: result.texture,
      coloration: result.coloration,
      size: result.size,
      features: result.features
    });
  }

  console.log('[CharacterDescriber] Parsed fields:', result);

  return result;
}
