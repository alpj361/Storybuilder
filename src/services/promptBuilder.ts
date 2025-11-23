/**
 * High-Fidelity Form, Low-Fidelity Texture Prompt Builder
 * Generates prompts for rough pencil storyboard sketches with:
 * - HIGH FIDELITY in FORM: Character anatomy, facial features, landmark recognition
 * - LOW FIDELITY in TEXTURE: No rendering, no detail, simplified backgrounds
 *
 * Format (STYLE first):
 * - STYLE: Rough pencil sketch, avoid realism
 * - SHOT: Shot type and angle
 * - CHARACTERS: Anatomical descriptors (face shape, hair, features, build) - NO texture
 * - ACTION: What's happening (one sentence)
 * - LOCATION: For real places: "Simplified [name]" + landmarks as "outline/silhouette"
 * - COMPOSITION: Character position, background indication
 * - ATMOSPHERE: Mood, lighting (very brief)
 * - NOTES: Emphasis on likeness but staying sketchy
 */

import { getOpenAIClient } from '../api/openai';
import { Character, Location } from '../types/storyboard';

const MAX_CONTEXT_LENGTH = 2000; // Maximum characters for context history

/**
 * Build character description with HIGH FIDELITY in form (anatomy, features)
 * but LOW FIDELITY in texture (no rendering details)
 *
 * OPTIMIZED ORDER: Visual importance (face → hair → eyes → body → clothing)
 */
function buildCharacterSection(character: Character): string {
  const app = character.appearance;
  const parts: string[] = [];

  // NON-HUMANS: Species first (critical identifier)
  if (app.characterType && app.characterType !== 'human') {
    if (app.species) {
      parts.push(app.species);
    } else {
      parts.push(app.characterType);
    }
  }

  // 1. ESTRUCTURA FACIAL (CRÍTICO para reconocimiento)
  if (app.faceShape) parts.push(`rostro ${app.faceShape}`);
  if (app.cheekbones) parts.push(app.cheekbones);
  if (app.jawline) parts.push(app.jawline);

  // 2. CABELLO (segundo elemento visual más prominente)
  if (app.hair) parts.push(app.hair);

  // 3. OJOS (forma + color juntos para coherencia)
  if (app.eyeShape && app.eyeColor) {
    parts.push(`ojos ${app.eyeColor} ${app.eyeShape}`);
  } else if (app.eyeColor) {
    parts.push(`ojos ${app.eyeColor}`);
  } else if (app.eyeShape) {
    parts.push(`ojos ${app.eyeShape}`);
  }

  // 4. OTROS RASGOS FACIALES
  if (app.eyebrows) parts.push(app.eyebrows);
  if (app.nose) parts.push(app.nose);
  if (app.mouth) parts.push(app.mouth);

  // 5. RASGOS DISTINTIVOS (muy importantes para identidad)
  if (app.distinctiveFeatures && app.distinctiveFeatures.length > 0) {
    parts.push(...app.distinctiveFeatures);
  }

  // 6. PROPORCIONES CORPORALES
  if (app.build) parts.push(`complexión ${app.build}`);
  if (app.shoulderWidth) parts.push(app.shoulderWidth);
  if (app.posture) parts.push(app.posture);
  if (app.height) parts.push(app.height);

  // 7. PIEL (tono sin textura)
  if (app.skinTone) parts.push(`piel ${app.skinTone}`);

  // NON-HUMANS: Características específicas
  if (app.characterType !== 'human') {
    if (app.coloration) parts.push(app.coloration);
    if (app.bodyType) parts.push(app.bodyType);
    if (app.texture) parts.push(app.texture);
    if (app.features && app.features.length > 0) {
      parts.push(...app.features);
    }
    if (app.size) parts.push(app.size);
  }

  // 8. VESTIMENTA (último, forma sin texturas)
  if (app.clothing) parts.push(`viste ${app.clothing}`);

  // 9. EDAD Y EXPRESIÓN (contexto adicional)
  const ageGender: string[] = [];
  if (app.age) ageGender.push(app.age);
  if (app.gender) ageGender.push(app.gender);
  if (ageGender.length > 0) parts.push(ageGender.join(' '));

  if (app.defaultExpression) parts.push(app.defaultExpression);

  // "Based on" reference (si existe, ayuda al modelo)
  if (app.basedOn) parts.push(`basado en ${app.basedOn}`);

  return parts.join(', ');
}

/**
 * Build location with HIGH FIDELITY in landmarks/structure
 * but LOW FIDELITY in detail (simplified, outline, silhouette)
 */
function buildLocationSection(locations: Location[]): string {
  if (locations.length === 0) return '';

  return locations.map(loc => {
    const { details } = loc;

    // Real place - use "Simplified" + key landmarks as outlines
    if (details.isRealPlace && details.realPlaceInfo) {
      const { specificLocation, city, landmark, knownFor } = details.realPlaceInfo;
      const placeName = specificLocation || loc.name;

      let desc = `Simplified ${placeName}`;
      if (city) desc += `, ${city}`;

      // Add key landmarks as simplified elements
      const landmarks = [];
      if (landmark) landmarks.push(`${landmark} outline`);
      if (details.prominentFeatures && details.prominentFeatures.length > 0) {
        details.prominentFeatures.forEach(f => landmarks.push(`${f} silhouette`));
      }

      if (landmarks.length > 0) {
        desc += `. Rough outlines of ${landmarks.join(', ')}`;
      }

      return desc;
    }

    // Fictional - simplified description
    const parts = [];
    if (details.setting) parts.push(`simplified ${details.setting}`);
    else if (details.locationType) parts.push(details.locationType);

    if (details.timeOfDay) parts.push(details.timeOfDay);

    return `${loc.name}${parts.length > 0 ? ' (' + parts.join(', ') + ')' : ''}`;
  }).join('. ');
}

/**
 * Generate context history summary from previous panels
 */
function buildContextHistory(previousPanels: Array<{panelNumber: number; action: string; characterDesc?: string}>): string {
  if (previousPanels.length === 0) return '';

  const lastPanel = previousPanels[previousPanels.length - 1];

  let context = `[CONTEXT HISTORY]\n`;
  context += `The previous panel showed ${lastPanel.action}. `;

  if (lastPanel.characterDesc) {
    context += `${lastPanel.characterDesc}. `;
  }

  context += `The scene was drawn in a rough pencil storyboard style.\n\n`;

  // Limit to MAX_CONTEXT_LENGTH
  if (context.length > MAX_CONTEXT_LENGTH) {
    context = context.substring(0, MAX_CONTEXT_LENGTH) + '...\n\n';
  }

  return context;
}

/**
 * Generate structured 6-section prompt using GPT
 */
export async function generateStructuredPrompt(options: {
  panelNumber: number;
  characters: Character[];
  locations?: Location[]; // New: structured locations
  action: string;
  sceneDescription: string;
  location: string; // Kept for backward compatibility
  cameraAngle?: string;
  composition?: string;
  lighting?: string;
  mood?: string;
  previousPanels?: Array<{panelNumber: number; action: string; characterDesc?: string}>;
}): Promise<string> {
  console.log('[PromptBuilder] Generating structured prompt for panel', options.panelNumber);

  try {
    const openai = await getOpenAIClient();

    // Build character section
    const characterSections = options.characters.map(char => {
      const charDesc = buildCharacterSection(char);
      return `CHARACTER: ${char.name} - ${charDesc}`;
    }).join('\n');

    // Build location section
    const locationSection = options.locations && options.locations.length > 0
      ? buildLocationSection(options.locations)
      : '';

    // Build context history if not first panel
    const contextHistory = options.previousPanels && options.previousPanels.length > 0
      ? buildContextHistory(options.previousPanels)
      : '';

    // Create GPT prompt - STRUCTURE: Subject + Environment + Style + Quality
    const systemPrompt = `Eres un artista técnico de storyboards. Genera prompts CONCISOS siguiendo esta estructura obligatoria:

[SUJETO] + [ENTORNO] + [ESTILO] + [CALIDAD]

FORMATO Y REGLAS:

1. SUJETO (Personajes):
   - Nombre del personaje
   - Rasgos anatómicos clave: forma de rostro, estructura ósea, proporciones
   - Cabello: color específico, textura, longitud
   - Ojos: color exacto y forma
   - Vestimenta: formas y siluetas (NO texturas)
   - Acción: UN verbo en gerundio, máximo una frase corta

2. ENTORNO (Ubicación):
   - Nombre del lugar
   - Si es lugar real: agregar "simplificado" + elementos clave como "silueta" o "contorno"
   - Si es ficticio: descripción breve con "simplificado"
   - Iluminación básica: día/noche/crepúsculo

3. ESTILO (Técnica de dibujo):
   - SIEMPRE: "Boceto a lápiz negro" o "Boceto a grafito"
   - SIEMPRE: "líneas gestuales sueltas"
   - SIEMPRE: "sin sombreado, sin color"

4. CALIDAD (Fidelidad):
   - "Alta fidelidad en proporciones faciales y anatomía"
   - "Entorno simplificado y minimalista"

LÍMITE CRÍTICO: Máximo 60-80 palabras. Evita listas largas y descripciones excesivas.

VOCABULARIO PERMITIDO:
✓ Usar: "simplificado", "contorno", "silueta", "gestual", "suelto", "minimalista"
✗ NUNCA: "realista", "detallado", "texturizado", "renderizado", "fotográfico"

EJEMPLO CORRECTO (76 palabras):
"Elena, rostro ovalado con pómulos altos, cabello castaño oscuro ondulado hasta hombros, ojos verdes almendrados, vestido azul marino forma A, mirando por la ventana. Sala parisina simplificada con contorno de ventana arqueada y sillón indicado. Boceto a lápiz negro, líneas gestuales sueltas, sin sombreado ni color. Alta fidelidad en proporciones faciales, entorno minimalista."

SALIDA: Genera SOLO el prompt optimizado, sin secciones ni etiquetas.`;

    const userPrompt = `${contextHistory}Panel #${options.panelNumber}:

${characterSections}
${locationSection ? locationSection : `Location: ${options.location}`}
Action: ${options.action || options.sceneDescription}
${options.cameraAngle ? `Shot: ${options.cameraAngle}` : ''}
${options.composition ? `Composition: ${options.composition}` : ''}

Create a BRIEF prompt. Keep it MINIMAL and SKETCHY.`;

    console.log('[PromptBuilder] Calling GPT with:', {
      panelNumber: options.panelNumber,
      hasContext: !!contextHistory,
      charactersCount: options.characters.length
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-2024-11-20',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.5,
      max_tokens: 400
    });

    const structuredPrompt = response.choices[0].message.content || '';

    console.log('[PromptBuilder] Generated structured prompt:', structuredPrompt.substring(0, 200) + '...');

    return structuredPrompt;
  } catch (error) {
    console.error('[PromptBuilder] Error generating structured prompt:', error);

    // Fallback: generate basic prompt without GPT
    console.warn('[PromptBuilder] Falling back to basic prompt generation');
    return generateFallbackPrompt(options);
  }
}

/**
 * Fallback prompt generation if GPT fails - OPTIMIZED STRUCTURE
 */
function generateFallbackPrompt(options: {
  panelNumber: number;
  characters: Character[];
  locations?: Location[];
  action: string;
  sceneDescription: string;
  location: string;
}): string {
  // Build character descriptions with anatomy focus
  const characterDescs = options.characters.map(char => {
    return `${char.name}, ${buildCharacterSection(char)}`;
  }).join('. ');

  // Build location with simplified approach
  const locationDesc = options.locations && options.locations.length > 0
    ? buildLocationSection(options.locations)
    : `${options.location} simplificado`;

  const action = options.action || options.sceneDescription;

  // STRUCTURE: Subject + Environment + Style + Quality
  return `${characterDescs}, ${action}. ${locationDesc}. Boceto a lápiz negro, líneas gestuales sueltas, sin sombreado ni color. Alta fidelidad en proporciones faciales y anatomía, entorno minimalista.`;
}

/**
 * Generate MiniWorld-style structured prompt using GPT
 * Isometric diorama style with warm pastel colors
 */
export async function generateMiniWorldPrompt(options: {
  location: string;
  characters?: Character[];
  locations?: Location[];
  sceneDescription: string;
}): Promise<string> {
  console.log('[PromptBuilder] Generating MiniWorld prompt');

  try {
    const openai = await getOpenAIClient();

    // Build character section if characters are present
    const characterSections = options.characters && options.characters.length > 0
      ? options.characters.map(char => {
          const charDesc = buildCharacterSection(char);
          return `CHARACTER: ${char.name} - ${charDesc}`;
        }).join('\n')
      : '';

    // Build location section
    const locationSection = options.locations && options.locations.length > 0
      ? buildLocationSection(options.locations)
      : options.location;

    // Create GPT prompt for MiniWorld style - CONCISE STRUCTURE
    const systemPrompt = `Eres un diseñador de dioramas isométricos. Genera prompts CONCISOS siguiendo esta estructura:

[ENTORNO] + [ELEMENTOS] + [PALETA] + [ESTILO ISOMÉTRICO]

FORMATO Y REGLAS:

1. ENTORNO (Espacio principal):
   - Tipo de espacio: interior/exterior
   - Dimensión: pequeño/mediano
   - Ángulo OBLIGATORIO: "vista isométrica 45°" o "perspectiva elevada 30°"

2. ELEMENTOS (Objetos y personajes):
   - Mobiliario principal: 3-5 piezas clave con material y forma
   - Accesorios decorativos: plantas, libros, objetos (máximo 5)
   - Personajes (si aplica): posición y acción simple en UNA frase

3. PALETA DE COLOR (CRÍTICO - especificar tonos exactos):
   - 3-4 colores principales
   - Usar nombres específicos: "beige arena", "verde salvia", "terracota", "azul pastel"
   - SIEMPRE tonos cálidos, pasteles o tierra

4. ILUMINACIÓN:
   - "Luz difusa cenital" o "luz cálida lateral"
   - SIEMPRE: "sin sombras duras"

5. ESTILO TÉCNICO:
   - "Diorama isométrico miniatura"
   - "Detalle moderado, no hiperrealista"
   - "Bordes limpios, corte limpio sin techo"

LÍMITE CRÍTICO: Máximo 70-90 palabras. Evita descripciones largas.

VOCABULARIO PERMITIDO:
✓ Usar: "isométrico", "miniatura", "pastel", "cálido", "difuso", "contenido", "ordenado"
✗ NUNCA: "realista fotográfico", "sombras dramáticas", "iluminación intensa", "saturado"

EJEMPLO CORRECTO (82 palabras):
"Cafetería pequeña, vista isométrica 45°. Barra de madera nogal con cafetera vintage plateada, dos mesas redondas con sillas, estante con plantas en macetas, piso damero. Paleta: nogal cálido, azul pastel, terracota, blanco cremoso. Luz difusa cenital sin sombras duras. Diorama isométrico miniatura, detalle moderado, bordes limpios con corte limpio mostrando interior sin techo."

SALIDA: Genera SOLO el prompt optimizado, sin secciones ni etiquetas.`;

    const userPrompt = `Create a MiniWorld scene:

${locationSection ? `Location: ${locationSection}` : ''}
${characterSections ? `\n${characterSections}` : ''}
${options.sceneDescription ? `\nScene: ${options.sceneDescription}` : ''}

Create a CONCISE prompt for this isometric miniature diorama.`;

    console.log('[PromptBuilder] Calling GPT for MiniWorld style');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-2024-11-20',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.6,
      max_tokens: 500
    });

    const miniWorldPrompt = response.choices[0].message.content || '';

    console.log('[PromptBuilder] Generated MiniWorld prompt:', miniWorldPrompt.substring(0, 200) + '...');

    return miniWorldPrompt;
  } catch (error) {
    console.error('[PromptBuilder] Error generating MiniWorld prompt:', error);

    // Fallback: generate basic MiniWorld prompt without GPT
    console.warn('[PromptBuilder] Falling back to basic MiniWorld prompt generation');
    return generateFallbackMiniWorldPrompt(options);
  }
}

/**
 * Fallback MiniWorld prompt generation if GPT fails - OPTIMIZED STRUCTURE
 */
function generateFallbackMiniWorldPrompt(options: {
  location: string;
  characters?: Character[];
  locations?: Location[];
  sceneDescription: string;
}): string {
  const locationDesc = options.locations && options.locations.length > 0
    ? buildLocationSection(options.locations)
    : options.location;

  const characterDescs = options.characters && options.characters.length > 0
    ? options.characters.map(char => `${char.name}, ${buildCharacterSection(char)}`).join('. ')
    : '';

  // STRUCTURE: Environment + Elements + Palette + Isometric Style
  const basePrompt = `${locationDesc}, vista isométrica 45°. ${options.sceneDescription}.`;
  const charactersPrompt = characterDescs ? ` ${characterDescs}.` : '';
  const stylePrompt = ` Paleta cálida pastel con tonos tierra. Luz difusa cenital sin sombras duras. Diorama isométrico miniatura, detalle moderado, bordes limpios con corte limpio sin techo.`;

  return basePrompt + charactersPrompt + stylePrompt;
}
