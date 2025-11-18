/**
 * Structured Prompt Builder Service
 * Uses GPT to generate 6-section structured prompts for storyboard panels
 *
 * Format:
 * - CHARACTER: Detailed physical description from Gemini fills
 * - ACTION: Specific action/movement in the panel
 * - CAMERA: Shot type, angle, perspective, motion blur
 * - ENVIRONMENT: Specific environment description
 * - STYLE: Visual style (always storyboard sketch style)
 * - DO NOT INCLUDE: Negative prompts to prevent misinterpretation
 */

import { getOpenAIClient } from '../api/openai';
import { Character, Location } from '../types/storyboard';

const MAX_CONTEXT_LENGTH = 2000; // Maximum characters for context history

/**
 * Build CHARACTER section from Gemini fills
 */
function buildCharacterSection(character: Character): string {
  const appearance = character.appearance;

  // Build character description from fills
  const parts: string[] = [];

  // Start with "Based on" reference if provided
  if (appearance.basedOn) {
    parts.push(`Based on: ${appearance.basedOn}`);
  }

  // Start with character type and species
  if (appearance.characterType) {
    const typeStr = `${appearance.characterType}`;
    const speciesStr = appearance.species ? ` | SPECIES: ${appearance.species}` : '';
    parts.push(`(${typeStr}${speciesStr})`);
  }

  // Add universal fields
  if (appearance.age) parts.push(appearance.age);
  if (appearance.size) parts.push(appearance.size);
  if (appearance.build) parts.push(`${appearance.build} build`);
  if (appearance.bodyType) parts.push(appearance.bodyType);

  // Add texture/surface
  if (appearance.texture) parts.push(appearance.texture);
  if (appearance.coloration) parts.push(appearance.coloration);

  // Add distinctive features
  if (appearance.features && appearance.features.length > 0) {
    parts.push(appearance.features.join(', '));
  }
  if (appearance.distinctiveFeatures && appearance.distinctiveFeatures.length > 0) {
    parts.push(appearance.distinctiveFeatures.join(', '));
  }

  // Human-specific fields
  if (appearance.characterType === 'human') {
    if (appearance.faceShape) parts.push(appearance.faceShape);
    if (appearance.eyeShape && appearance.eyeColor) {
      parts.push(`${appearance.eyeShape} ${appearance.eyeColor} eyes`);
    } else if (appearance.eyeColor) {
      parts.push(`${appearance.eyeColor} eyes`);
    }
    if (appearance.hair) parts.push(appearance.hair);
    if (appearance.skinTone) parts.push(appearance.skinTone);
  }

  // Clothing
  if (appearance.clothing) parts.push(`wearing ${appearance.clothing}`);

  // Gender
  if (appearance.gender) parts.push(appearance.gender);

  // Default expression or impression
  if (appearance.defaultExpression) parts.push(`${appearance.defaultExpression} expression`);

  return parts.join('. ').replace(/\.\./g, '.');
}

/**
 * Build LOCATION section from location fills
 */
function buildLocationSection(locations: Location[]): string {
  if (locations.length === 0) return '';

  return locations.map(loc => {
    const { details, aiGeneratedDescription } = loc;

    // ===== CASE 1: REAL PLACE =====
    if (details.isRealPlace && details.realPlaceInfo) {
      const { specificLocation, city, country, knownFor } = details.realPlaceInfo;

      let prompt = `REAL LOCATION: ${specificLocation || loc.name}`;
      if (city) prompt += ` in ${city}`;
      if (country) prompt += `, ${country}`;
      prompt += `. Use your extensive knowledge of this real-world location.`;

      if (knownFor) {
        prompt += ` Context: ${knownFor}.`;
      }

      // Add additional visual details from fills
      const visualDetails = [];
      if (details.timeOfDay) visualDetails.push(`${details.timeOfDay} time`);
      if (details.weather) visualDetails.push(details.weather);
      if (details.lighting) visualDetails.push(`${details.lighting} lighting`);
      if (details.atmosphere) visualDetails.push(`${details.atmosphere} atmosphere`);

      if (visualDetails.length > 0) {
        prompt += ` Visual context: ${visualDetails.join(', ')}.`;
      }

      if (aiGeneratedDescription) {
        prompt += ` Additional details from reference: ${aiGeneratedDescription}`;
      }

      return prompt;
    }

    // ===== CASE 2: FICTIONAL PLACE WITH FILLS =====
    const parts = [];

    // Type and setting
    if (details.locationType) parts.push(details.locationType);
    if (details.setting) parts.push(details.setting);

    // Time and atmosphere
    if (details.timeOfDay) parts.push(`${details.timeOfDay} time`);
    if (details.weather) parts.push(`${details.weather} weather`);
    if (details.lighting) parts.push(`${details.lighting} lighting`);
    if (details.atmosphere) parts.push(`${details.atmosphere} atmosphere`);

    // Physical characteristics
    if (details.architecture) parts.push(`${details.architecture} architecture`);
    if (details.terrain) parts.push(`${details.terrain} terrain`);
    if (details.vegetation) parts.push(details.vegetation);

    // Prominent features
    if (details.prominentFeatures && details.prominentFeatures.length > 0) {
      parts.push(`featuring: ${details.prominentFeatures.join(', ')}`);
    }

    // Color and scale
    if (details.colorPalette) parts.push(`${details.colorPalette} tones`);
    if (details.scale) parts.push(`${details.scale} scale`);
    if (details.condition) parts.push(details.condition);
    if (details.crowdLevel) parts.push(`${details.crowdLevel} crowd level`);

    // Soundscape (additional context)
    if (details.soundscape) parts.push(`soundscape: ${details.soundscape}`);

    let prompt = `LOCATION: ${loc.name}. ${parts.join(', ')}.`;

    // If there's AI description from image, add it
    if (aiGeneratedDescription) {
      prompt += ` Additional visual details: ${aiGeneratedDescription}`;
    }

    return prompt;
  }).join('\n\n');
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

    // Create GPT prompt
    const systemPrompt = `You are an expert storyboard artist assistant. Your task is to transform scene descriptions into structured 6-section prompts for AI image generation.

The output format MUST follow this structure:

LOCATION: [Detailed location/environment description. If REAL LOCATION is specified, use your knowledge of that real place. Otherwise, describe the fictional setting with all provided details]

CHARACTER: [Detailed physical description of the character(s) including species, body type, features, coloration, etc.]

ACTION: [Specific action/movement happening in this panel - be dynamic and descriptive]

CAMERA: [Shot type (wide, medium, close-up), angle (low, high, eye-level), perspective, motion blur effects]

ENVIRONMENT: [Additional environmental details, atmospheric effects, background elements]

STYLE: Rough pencil storyboard sketch, loose gestural lines, black and white, draft-quality shading. No 3D rendering. Hand-drawn look with light crosshatching. Focus on silhouette clarity and expressive motion.

DO NOT INCLUDE: [Things to avoid - always include: No planes, no spaceships, no vehicles (unless specified in action), no humans (if characters are non-human)]

IMPORTANT:
- If REAL LOCATION is provided, incorporate your knowledge of that place accurately
- LOCATION section should be first and detailed
- Keep each section clear and specific
- ACTION should describe dynamic movement
- CAMERA should specify angle and shot type
- ENVIRONMENT should complement LOCATION with atmospheric details
- STYLE section is ALWAYS the same (rough pencil storyboard sketch)
- DO NOT INCLUDE should prevent common misinterpretations`;

    const userPrompt = `${contextHistory}Generate a structured prompt for storyboard panel #${options.panelNumber}:

${locationSection ? locationSection + '\n' : ''}
${characterSections}

SCENE ACTION: ${options.action || options.sceneDescription}
${!locationSection ? `LOCATION: ${options.location}` : ''}
${options.cameraAngle ? `CAMERA ANGLE: ${options.cameraAngle}` : ''}
${options.composition ? `COMPOSITION: ${options.composition}` : ''}
${options.lighting ? `LIGHTING: ${options.lighting}` : ''}
${options.mood ? `MOOD: ${options.mood}` : ''}

Generate the complete 6-section prompt following the exact format.`;

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
      temperature: 0.7,
      max_tokens: 1000
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
 * Fallback prompt generation if GPT fails
 */
function generateFallbackPrompt(options: {
  panelNumber: number;
  characters: Character[];
  locations?: Location[];
  action: string;
  sceneDescription: string;
  location: string;
}): string {
  const characterDescs = options.characters.map(char => buildCharacterSection(char)).join(' and ');
  const locationDesc = options.locations && options.locations.length > 0
    ? buildLocationSection(options.locations)
    : `LOCATION: ${options.location}`;

  return `${locationDesc}

CHARACTER: ${characterDescs}

ACTION: ${options.action || options.sceneDescription}

CAMERA: Medium shot, eye-level angle

ENVIRONMENT: ${options.location}

STYLE: Rough pencil storyboard sketch, loose gestural lines, black and white, draft-quality shading. No 3D rendering. Hand-drawn look with light crosshatching. Focus on silhouette clarity and expressive motion.

DO NOT INCLUDE: No planes, no spaceships, no vehicles, no unrelated objects.`;
}
