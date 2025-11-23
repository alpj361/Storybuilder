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
 * Create the detailed character description prompt with anatomical precision
 */
const getDescriptionPrompt = () => `You are an anatomical artist helping create detailed character descriptions for AI image generation. Analyze this reference image with PRECISION, focusing on anatomical structure, proportions, and distinctive features.

CRITICAL: DO NOT ASSUME THIS IS A HUMAN. First identify what type of character this is, then describe accordingly.

STEP 1 - IDENTIFY CHARACTER TYPE (MANDATORY):
Start your response with this EXACT format:
CHARACTER_TYPE: [human | creature | robot | animal | alien | hybrid | other]
SPECIES: [specific species if applicable]

STEP 2 - DESCRIBE WITH ANATOMICAL PRECISION:

FOR HUMANS - Focus on MEASURABLE, TECHNICAL details:

1. ESTRUCTURA CRANEAL Y FACIAL (CRÍTICO para fidelidad):
   - Forma de cráneo: proporción largo/ancho, frente alta/baja, occipital prominente/plano
   - Estructura ósea facial: pómulos (altos/bajos/anchos/prominentes), arco superciliar (pronunciado/suave)
   - Mandíbula: angular/redondeada/cuadrada/en V, mentón (puntiagudo/redondeado/hendido)
   - Proporciones faciales: distancia entre ojos (amplia/normal/estrecha), proporción nariz-boca

2. RASGOS ÉTNICOS Y CARACTERÍSTICAS DISTINTIVAS:
   - OJOS: Forma exacta (almendrados/redondos/rasgados), inclinación (hacia arriba/horizontal/hacia abajo),
     pliegue palpebral (monolid/doble pliegue/hooded), epicanto (presente/ausente),
     color ESPECÍFICO (no solo "marrón", sino "marrón ámbar con anillo oscuro" o "verde oliva con motas doradas")
   - NARIZ: Puente nasal (alto/bajo/ancho/estrecho), punta (redondeada/puntiaguda/bulbosa),
     fosas nasales (anchas/estrechas/hacia arriba/hacia abajo), dorso (recto/convexo/cóncavo)
   - BOCA: Grosor labial (fino/medio/grueso, especificar labio superior vs inferior),
     arco de cupido (pronunciado/suave/ausente), comisuras (hacia arriba/neutro/hacia abajo),
     ancho boca relativo a nariz

3. CABELLO - DETALLES TÉCNICOS PRECISOS:
   - Color EXACTO con especificidad: no "rubio", sino "rubio ceniza con raíces más oscuras" o "castaño chocolate con reflejos cobrizos"
   - Textura según escala: Tipo 1 (liso), 2 (ondulado), 3 (rizado), 4 (coily/afro)
   - Grosor individual del cabello: fino/medio/grueso
   - Densidad: baja/media/alta densidad
   - Línea de nacimiento: recta/en pico de viuda/redondeada/retrocedida/irregular
   - Longitud específica: a la oreja/hombros/mitad espalda/cintura
   - Patrón de crecimiento y volumen

4. PROPORCIONES CORPORALES:
   - Altura relativa: bajo/promedio/alto (con contexto si es visible)
   - Complexión: ectomorfo (delgado)/mesomorfo (atlético)/endomorfo (robusto)
   - Ratio hombros-caderas: hombros anchos/promedio/estrechos relativos a caderas
   - Longitud de cuello: corto/promedio/largo y delgado/grueso
   - Estructura de hombros: caídos/rectos/elevados
   - Postura habitual: erguida/encorvada/inclinada/relajada

5. TONO Y CARACTERÍSTICAS DE PIEL:
   - Tono ESPECÍFICO usando descriptores técnicos: porcelana/marfil/beige/oliva/caramelo/bronze/ébano/etc.
   - Subtono: cálido/frío/neutro
   - NO describir textura, solo color y características visibles (pecas/lunares/marcas)

6. VESTIMENTA (forma, NO textura):
   - Silueta de la ropa: ajustada/holgada/estructurada
   - Colores específicos
   - Elementos distintivos visibles

7. EDAD, GÉNERO Y EXPRESIÓN:
   - Rango de edad específico (ej: "principios de 20s", "mediados de 40s")
   - Género aparente
   - Expresión facial dominante

FOR NON-HUMANS (creatures, robots, animals, aliens) - TECHNICAL PRECISION:

1. MORFOLOGÍA CORPORAL:
   - Tipo de locomoción: cuadrúpedo/bípedo/serpentino/volador/acuático
   - Proporciones: cabeza-cuerpo, extremidades-torso
   - Simetría: bilateral/radial/asimétrico

2. ESCALA Y DIMENSIONES:
   - Tamaño: masivo/grande/tamaño humano/pequeño/diminuto
   - Proporciones relativas si hay contexto

3. SUPERFICIE Y RECUBRIMIENTO:
   - Tipo: escamas/pelaje/plumas/placa metálica/piel lisa/exoesqueleto/cristalino
   - Patrón: uniforme/irregular/en placas/segmentado

4. COLORACIÓN PRECISA:
   - Color primario ESPECÍFICO: no "rojo", sino "rojo carmesí" o "escarlata"
   - Patrones: sólido/degradado/manchas/rayas/moteado
   - Acentos: ubicación y color específico

5. CARACTERÍSTICAS ANATÓMICAS DISTINTIVAS:
   - Apéndices: alas (membranosas/emplumadas), cuernos (curvos/rectos/espirales),
     cola (larga/corta/prensil/espinosa), garras, colmillos, antenas
   - Ubicación exacta y forma

6. COMPLEXIÓN Y MUSCULATURA:
   - Musculoso/esbelto/robusto/delgado/voluminoso

7. IMPRESIÓN Y EDAD:
   - Joven/adulto/anciano
   - Presencia: amenazante/majestuoso/amigable/misterioso

OUTPUT FORMAT:
CHARACTER_TYPE: [type] | SPECIES: [species] | [Comma-separated technical description focusing on anatomical precision]

EXAMPLE (Human):
"CHARACTER_TYPE: human | SPECIES: N/A | Cráneo dolicocéfalo con frente amplia, pómulos altos y prominentes, mandíbula angular con mentón definido, arco superciliar marcado, distancia entre ojos amplia. Ojos almendrados con inclinación hacia arriba, doble pliegue palpebral, color marrón oscuro casi negro con anillo limbal pronunciado. Nariz con puente alto y estrecho, punta redondeada, fosas nasales estrechas. Labios medianos con arco de cupido pronunciado. Cabello negro azabache tipo 1A (liso), textura fina, alta densidad, línea de nacimiento en pico de viuda, longitud hasta hombros. Complexión mesomorfa atlética, hombros anchos relativos a caderas, cuello largo, postura erguida. Tono de piel oliva con subtono cálido. Viste camisa blanca ajustada. Principios de 30s, masculino, expresión neutra concentrada"

EXAMPLE (Creature):
"CHARACTER_TYPE: creature | SPECIES: dragon | Morfología cuadrúpeda con alas, cabeza grande relativa al cuerpo serpentino. Escamas hexagonales uniformes, color carmesí intenso en dorso con degradado a escarlata en vientre, acentos dorados metálicos a lo largo de la espina dorsal formando cresta continua. Alas membranosas con estructura ósea visible, envergadura el doble del largo corporal. Cuernos curvos hacia atrás en pares (4 total) emergiendo del occipital. Ojos reptilianos con pupila vertical, iris amarillo dorado. Hocico alargado con fosas nasales prominentes expulsando humo. Cola larga y muscular con espinas óseas en tercio final. Complexión muscular poderosa. Adulto, presencia majestuosa e imponente"`;

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
