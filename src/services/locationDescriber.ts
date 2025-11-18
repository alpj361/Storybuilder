/**
 * Location Description Service
 * Uses Gemini 2.5 Flash (via Replicate) to analyze location reference images
 * and generate detailed descriptions for image generation
 */

import Replicate from 'replicate';

// Initialize Replicate client
const getReplicateKey = () => {
  const key = process.env.EXPO_PUBLIC_REPLICATE_API_KEY;
  console.log('[LocationDescriber] Replicate API Key check:', {
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
 * Create the detailed location description prompt
 */
const getDescriptionPrompt = () => `You are helping a storyboard artist identify and describe locations/scenarios for illustration purposes. Analyze this reference image and provide a DETAILED description suitable for recreating this location consistently across multiple panels.

STEP 1 - IDENTIFY LOCATION TYPE (MANDATORY):
Start your response with the location type using this EXACT format:
LOCATION_TYPE: [natural | urban | indoor | fantasy | sci-fi | historical | other]
IS_REAL_PLACE: [yes | no]

STEP 2 - IF REAL PLACE DETECTED:
If this is a REAL, recognizable location (famous landmarks, named cities visible in signs, well-known buildings), provide:
CITY: [city name]
COUNTRY: [country name]
REGION: [region/state if applicable]
SPECIFIC_LOCATION: [exact name, e.g., "Eiffel Tower", "Central Park"]
LANDMARK: [brief description of what it is]

Real locations include:
- Famous landmarks (Eiffel Tower, Statue of Liberty, Great Wall of China, etc.)
- Named cities/regions visible in signs or distinctive architecture
- Recognizable natural landmarks (Grand Canyon, Niagara Falls, Mount Fuji, etc.)
- Well-known buildings or structures

Examples:
- If it's the Eiffel Tower: "LOCATION_TYPE: urban | IS_REAL_PLACE: yes | CITY: Paris | COUNTRY: France | SPECIFIC_LOCATION: Eiffel Tower | LANDMARK: Iconic iron tower monument"
- If it's Central Park: "LOCATION_TYPE: natural | IS_REAL_PLACE: yes | CITY: New York | COUNTRY: USA | SPECIFIC_LOCATION: Central Park | LANDMARK: Large public park in Manhattan"

STEP 3 - DESCRIBE VISUAL DETAILS:
Provide a comprehensive description including:

FOR ALL LOCATIONS:
1. SETTING: Primary environment (forest, city street, beach, desert, space station, castle, etc.)
2. TIME OF DAY: Dawn, morning, noon, afternoon, dusk, night (if determinable from lighting)
3. WEATHER: Sunny, rainy, foggy, stormy, clear, overcast, snowy
4. LIGHTING: Natural sunlight, artificial, dim, bright, dramatic shadows, soft, golden hour, etc.
5. ATMOSPHERE: Peaceful, tense, mysterious, chaotic, romantic, eerie, serene, bustling
6. SCALE: Intimate (small room), medium (house, street), vast (landscape), epic (mountains, space)

FOR BUILT ENVIRONMENTS (urban, indoor):
7. ARCHITECTURE: Gothic, modern, rustic, futuristic, Victorian, industrial, minimalist, ornate
8. CONDITION: Well-maintained, abandoned, ruins, pristine, decaying, under construction
9. CROWD LEVEL: Empty, sparse, moderate, crowded

FOR NATURAL ENVIRONMENTS:
10. TERRAIN: Flat, hilly, mountainous, underwater, rocky, sandy, icy
11. VEGETATION: Dense forest, sparse trees, desert, jungle, grassland, none

FOR ALL:
12. PROMINENT FEATURES: List key visual elements (fountains, statues, bridges, neon signs, rock formations, waterfalls, etc.)
13. COLOR PALETTE: Warm tones, cool blues, monochrome, vibrant, muted, earth tones, neon colors

Output format: Start with LOCATION_TYPE and IS_REAL_PLACE on the first line, then provide all applicable fields followed by a detailed comma-separated description optimized for AI image generation.

Example for real place: "LOCATION_TYPE: urban | IS_REAL_PLACE: yes | CITY: Paris | COUNTRY: France | SPECIFIC_LOCATION: Champs-Élysées | LANDMARK: Famous avenue | SETTING: Wide tree-lined boulevard, afternoon time, clear weather, natural sunlight with dappled shade from trees, bustling atmosphere, vast scale, Haussmanian architecture, well-maintained condition, crowded, featuring Arc de Triomphe in distance, rows of chestnut trees, elegant street lamps, outdoor café terraces, warm golden tones with green accents"

Example for fictional place: "LOCATION_TYPE: fantasy | IS_REAL_PLACE: no | SETTING: Ancient mystical forest, dusk time, light fog, dim ethereal lighting, mysterious atmosphere, vast scale, gnarled oak trees with massive trunks, dense vegetation, moss-covered stones, featuring glowing mushrooms, twisted roots, stone archway covered in vines, cool blues and greens with bioluminescent accents, untouched pristine condition, empty and silent"`;

/**
 * Analyze a location reference image and generate a detailed description
 * suitable for use in image generation prompts
 *
 * @param imageBase64 - Base64 encoded image (data:image/jpeg;base64,...)
 * @returns Detailed location description
 */
export async function describeLocationFromImage(
  imageBase64: string
): Promise<string> {
  console.log('[LocationDescriber] Analyzing location reference image with Gemini 2.5 Flash via Replicate...');

  try {
    // Gemini 2.5 Flash on Replicate
    const input = {
      images: [imageBase64], // Replicate accepts data URIs
      prompt: getDescriptionPrompt(),
      temperature: 0.2, // Low temperature for consistent descriptions
      max_tokens: 600,
    };

    console.log('[LocationDescriber] Running Gemini 2.5 Flash prediction...');

    // Run the prediction - not streaming for simpler response handling
    const output = await replicate.run(
      "google/gemini-2.5-flash",
      { input }
    ) as string;

    const description = (typeof output === 'string' ? output : JSON.stringify(output)).trim();

    console.log('[LocationDescriber] ✓ Gemini 2.5 Flash - Success:', description);

    return description;
  } catch (error) {
    console.error('[LocationDescriber] ✗ Gemini 2.5 Flash failed:', error);

    // Check if it's a content policy error
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      if (errorMessage.includes('content_policy') ||
          errorMessage.includes('safety') ||
          errorMessage.includes('violated') ||
          errorMessage.includes('cannot help')) {
        throw new Error('Image analysis blocked by content policy. Please manually enter location details in the fields below, or try a different reference image.');
      }

      throw new Error(`Failed to analyze location image: ${error.message}`);
    }

    throw new Error('Failed to analyze location image');
  }
}

/**
 * Cache for location descriptions to avoid re-analyzing the same image
 * Key: first 100 chars of base64 image (as a simple hash)
 */
const descriptionCache = new Map<string, string>();

/**
 * Get location description with caching
 */
export async function getLocationDescription(
  imageBase64: string
): Promise<string> {
  // Create simple cache key from image data
  const cacheKey = imageBase64.substring(0, 100);

  // Check cache first
  if (descriptionCache.has(cacheKey)) {
    console.log('[LocationDescriber] Using cached description');
    return descriptionCache.get(cacheKey)!;
  }

  // Analyze image
  const description = await describeLocationFromImage(imageBase64);

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
 * Parse AI-generated location description into structured detail fields
 * This extracts key details from the AI description and organizes them
 * into the details structure used by the Location interface
 *
 * @param aiDescription - The AI-generated location description
 * @returns Structured details object with individual fields populated
 */
export function parseDescriptionIntoFields(aiDescription: string): {
  locationType?: 'natural' | 'urban' | 'indoor' | 'fantasy' | 'sci-fi' | 'historical' | 'other';
  isRealPlace?: boolean;
  realPlaceInfo?: {
    city?: string;
    country?: string;
    region?: string;
    specificLocation?: string;
    landmark?: string;
  };
  setting?: string;
  timeOfDay?: 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'night';
  weather?: string;
  lighting?: string;
  atmosphere?: string;
  architecture?: string;
  terrain?: string;
  vegetation?: string;
  prominentFeatures?: string[];
  colorPalette?: string;
  scale?: 'intimate' | 'medium' | 'vast' | 'epic';
  condition?: string;
  crowdLevel?: 'empty' | 'sparse' | 'moderate' | 'crowded';
} {
  console.log('[LocationDescriber] Parsing description into fields:', aiDescription);

  const result: any = {
    prominentFeatures: []
  };

  // STEP 1: Extract LOCATION_TYPE
  const locationTypeMatch = aiDescription.match(/LOCATION_TYPE:\s*(natural|urban|indoor|fantasy|sci-fi|historical|other)/i);
  if (locationTypeMatch) {
    result.locationType = locationTypeMatch[1].toLowerCase() as any;
    console.log('[LocationDescriber] Detected location type:', result.locationType);
  }

  // STEP 2: Extract IS_REAL_PLACE
  const isRealPlaceMatch = aiDescription.match(/IS_REAL_PLACE:\s*(yes|no)/i);
  if (isRealPlaceMatch) {
    result.isRealPlace = isRealPlaceMatch[1].toLowerCase() === 'yes';
    console.log('[LocationDescriber] Is real place:', result.isRealPlace);
  }

  // STEP 3: If real place, extract real place info
  if (result.isRealPlace) {
    result.realPlaceInfo = {};

    const cityMatch = aiDescription.match(/CITY:\s*([^|\n]+)/i);
    if (cityMatch) {
      result.realPlaceInfo.city = cityMatch[1].trim();
    }

    const countryMatch = aiDescription.match(/COUNTRY:\s*([^|\n]+)/i);
    if (countryMatch) {
      result.realPlaceInfo.country = countryMatch[1].trim();
    }

    const regionMatch = aiDescription.match(/REGION:\s*([^|\n]+)/i);
    if (regionMatch) {
      result.realPlaceInfo.region = regionMatch[1].trim();
    }

    const specificLocationMatch = aiDescription.match(/SPECIFIC_LOCATION:\s*([^|\n]+)/i);
    if (specificLocationMatch) {
      result.realPlaceInfo.specificLocation = specificLocationMatch[1].trim();
    }

    const landmarkMatch = aiDescription.match(/LANDMARK:\s*([^|\n]+)/i);
    if (landmarkMatch) {
      result.realPlaceInfo.landmark = landmarkMatch[1].trim();
    }

    console.log('[LocationDescriber] Real place info:', result.realPlaceInfo);
  }

  // STEP 4: Extract visual details from the description text
  const desc = aiDescription.toLowerCase();

  // Extract setting
  const settingMatch = aiDescription.match(/SETTING:\s*([^,|\n]+)/i);
  if (settingMatch) {
    result.setting = settingMatch[1].trim();
  }

  // Extract time of day
  const timePatterns = [
    /(dawn|morning|noon|afternoon|dusk|night)\s+time/i,
    /time of day:\s*(dawn|morning|noon|afternoon|dusk|night)/i
  ];
  for (const pattern of timePatterns) {
    const match = aiDescription.match(pattern);
    if (match) {
      result.timeOfDay = match[1].toLowerCase() as any;
      break;
    }
  }

  // Extract weather
  const weatherPatterns = [
    /(sunny|rainy|foggy|stormy|clear|overcast|snowy|cloudy)\s+weather/i,
    /weather:\s*([^,]+)/i
  ];
  for (const pattern of weatherPatterns) {
    const match = aiDescription.match(pattern);
    if (match) {
      result.weather = match[1]?.trim() || match[0].trim();
      break;
    }
  }

  // Extract lighting
  const lightingPatterns = [
    /(natural|artificial|dim|bright|dramatic|soft|golden hour|harsh|diffused)[\s\w]*\s+lighting/i,
    /lighting:\s*([^,]+)/i
  ];
  for (const pattern of lightingPatterns) {
    const match = aiDescription.match(pattern);
    if (match) {
      result.lighting = match[1]?.trim() || match[0].trim();
      break;
    }
  }

  // Extract atmosphere
  const atmospherePatterns = [
    /(peaceful|tense|mysterious|chaotic|romantic|eerie|serene|bustling|calm|dramatic)\s+atmosphere/i,
    /atmosphere:\s*([^,]+)/i
  ];
  for (const pattern of atmospherePatterns) {
    const match = aiDescription.match(pattern);
    if (match) {
      result.atmosphere = match[1]?.trim() || match[0].trim();
      break;
    }
  }

  // Extract scale
  const scalePatterns = [
    /(intimate|medium|vast|epic)\s+scale/i,
    /scale:\s*(intimate|medium|vast|epic)/i
  ];
  for (const pattern of scalePatterns) {
    const match = aiDescription.match(pattern);
    if (match) {
      result.scale = match[1].toLowerCase() as any;
      break;
    }
  }

  // Extract architecture
  const architecturePatterns = [
    /(gothic|modern|rustic|futuristic|victorian|industrial|minimalist|ornate|classical|contemporary|brutalist|art deco|baroque)\s+architecture/i,
    /architecture:\s*([^,]+)/i
  ];
  for (const pattern of architecturePatterns) {
    const match = aiDescription.match(pattern);
    if (match) {
      result.architecture = match[1]?.trim() || match[0].trim();
      break;
    }
  }

  // Extract terrain
  const terrainPatterns = [
    /(flat|hilly|mountainous|underwater|rocky|sandy|icy)\s+terrain/i,
    /terrain:\s*([^,]+)/i
  ];
  for (const pattern of terrainPatterns) {
    const match = aiDescription.match(pattern);
    if (match) {
      result.terrain = match[1]?.trim() || match[0].trim();
      break;
    }
  }

  // Extract vegetation
  const vegetationPatterns = [
    /(dense forest|sparse trees|desert|jungle|grassland|none|lush|barren)\s*(vegetation)?/i,
    /vegetation:\s*([^,]+)/i
  ];
  for (const pattern of vegetationPatterns) {
    const match = aiDescription.match(pattern);
    if (match) {
      result.vegetation = match[1]?.trim() || match[0].trim();
      break;
    }
  }

  // Extract condition
  const conditionPatterns = [
    /(well-maintained|abandoned|ruins|pristine|decaying|under construction)\s+condition/i,
    /condition:\s*([^,]+)/i
  ];
  for (const pattern of conditionPatterns) {
    const match = aiDescription.match(pattern);
    if (match) {
      result.condition = match[1]?.trim() || match[0].trim();
      break;
    }
  }

  // Extract crowd level
  const crowdPatterns = [
    /(empty|sparse|moderate|crowded)/i,
    /crowd level:\s*(empty|sparse|moderate|crowded)/i
  ];
  for (const pattern of crowdPatterns) {
    const match = aiDescription.match(pattern);
    if (match) {
      result.crowdLevel = match[1].toLowerCase() as any;
      break;
    }
  }

  // Extract color palette
  const colorPatterns = [
    /(warm|cool|monochrome|vibrant|muted|earth)\s+tones/i,
    /color palette:\s*([^,]+)/i,
    /colors?:\s*([^,]+)/i
  ];
  for (const pattern of colorPatterns) {
    const match = aiDescription.match(pattern);
    if (match) {
      result.colorPalette = match[1]?.trim() || match[0].trim();
      break;
    }
  }

  // Extract prominent features
  const featureMatch = aiDescription.match(/featuring[:\s]+([^,]+(?:,\s*[^,]+)*)/i);
  if (featureMatch) {
    const features = featureMatch[1].split(',').map(f => f.trim());
    result.prominentFeatures = features;
  }

  // If no prominent features found, remove the empty array
  if (result.prominentFeatures && result.prominentFeatures.length === 0) {
    delete result.prominentFeatures;
  }

  console.log('[LocationDescriber] Parsed fields:', result);

  return result;
}
