/**
 * Character Description Service
 * Uses Gemini 2.5 Flash (via Replicate) to analyze character reference images
 * and generate detailed appearance descriptions for image generation
 */

import Replicate from 'replicate';
import { getOpenAIClient } from '../api/openai';

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
 * Uses OpenAI to intelligently extract key details from the description
 *
 * @param aiDescription - The AI-generated character description (comma-separated)
 * @returns Structured appearance object with individual fields populated
 */
export async function parseDescriptionIntoFields(aiDescription: string | string[]): Promise<{
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
}> {
  // Handle array responses - join into a single string
  const descriptionString = Array.isArray(aiDescription)
    ? aiDescription.join(' ')
    : aiDescription;

  console.log('[CharacterDescriber] Parsing description with OpenAI:', descriptionString.substring(0, 200) + '...');

  try {
    const openai = await getOpenAIClient();

    const systemPrompt = `You are a character description parser. Extract structured fields from the provided character description.

Return a JSON object with these fields (use null for missing values):

For ALL characters:
- characterType: "human" | "creature" | "robot" | "animal" | "alien" | "hybrid" | "other"
- species: string (if non-human, e.g., "dragon", "elf")
- age: string (e.g., "30s", "early 20s", "middle-aged")
- gender: "Male" | "Female" | "Other" (extract from ANY language - "masculino", "femenino", "male", "female", "hombre", "mujer", etc.)

For HUMAN characters:
- faceShape: string (brief, e.g., "angular", "oval", "rounded")
- cheekbones: string (brief, e.g., "high and prominent", "soft")
- jawline: string (brief, e.g., "V-shaped, angular", "strong square")
- eyeShape: string (brief, e.g., "almond-shaped upturned", "round")
- eyeColor: string (specific color, e.g., "dark brown almost black", "green")
- eyebrows: string (brief description if mentioned)
- nose: string (brief, e.g., "high narrow bridge, rounded tip")
- mouth: string (brief, e.g., "medium lips with cupid's bow")
- hair: string (complete description: color, texture, length, style)
- skinTone: string (e.g., "beige with warm undertone", "olive")
- height: string (if mentioned, e.g., "tall", "average")
- build: string (e.g., "ectomorph slender", "athletic mesomorph")
- shoulderWidth: string (e.g., "narrow delicate", "broad")
- posture: string (e.g., "relaxed inclined", "upright")
- clothing: string (brief form description)
- defaultExpression: string (e.g., "serene slightly seductive", "neutral")
- distinctiveFeatures: string[] (tattoos, scars, etc.)

For NON-HUMAN characters:
- bodyType: string (e.g., "quadruped", "bipedal")
- texture: string (e.g., "scales", "fur")
- coloration: string (specific colors and patterns)
- size: string (e.g., "massive", "small")
- features: string[] (wings, horns, tail, etc.)

IMPORTANT:
- Extract gender from ANY language (Spanish "masculino/femenino", English "male/female", etc.)
- Keep descriptions brief but specific
- Preserve color accuracy (e.g., "blonde honey with golden highlights" not just "blonde")
- Return ONLY valid JSON, no markdown or extra text`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-2024-11-20',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Parse this character description:\n\n${descriptionString}` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 1000
    });

    const parsed = JSON.parse(response.choices[0].message.content || '{}');

    console.log('[CharacterDescriber] OpenAI parsed fields:', parsed);

    return parsed;
  } catch (error) {
    console.error('[CharacterDescriber] OpenAI parsing failed:', error);

    // Fallback: return minimal structure
    return {
      characterType: 'human',
      gender: 'Unknown',
      age: 'Unknown'
    };
  }
}
