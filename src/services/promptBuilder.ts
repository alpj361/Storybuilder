/**
 * Simplified Prompt Builder for Storyboard Sketches
 * Generates BRIEF, MINIMAL prompts for rough pencil sketch style
 *
 * Format:
 * - SHOT: Shot type and angle (brief)
 * - CHARACTERS: Character names and key features (minimal)
 * - ACTION: What's happening (one sentence)
 * - LOCATION: Environment essentials only (1-2 phrases)
 * - ATMOSPHERE: Mood, weather, lighting (very brief)
 * - STYLE: Always rough pencil sketch with minimal background
 */

import { getOpenAIClient } from '../api/openai';
import { Character, Location } from '../types/storyboard';

const MAX_CONTEXT_LENGTH = 2000; // Maximum characters for context history

/**
 * Build BRIEF character description - minimal for sketch style
 */
function buildCharacterSection(character: Character): string {
  const appearance = character.appearance;
  const parts: string[] = [];

  // "Based on" reference (most important for AI)
  if (appearance.basedOn) {
    parts.push(`based on ${appearance.basedOn}`);
  }

  // Type/species (essential)
  if (appearance.species) {
    parts.push(appearance.species);
  } else if (appearance.characterType) {
    parts.push(appearance.characterType);
  }

  // Key visual features (minimal)
  if (appearance.size) parts.push(appearance.size);
  if (appearance.build) parts.push(appearance.build);

  // Coloration (important for silhouette)
  if (appearance.coloration) parts.push(appearance.coloration);

  // Clothing (brief)
  if (appearance.clothing) parts.push(appearance.clothing);

  return parts.join(', ');
}

/**
 * Build BRIEF location description - keep it minimal for sketch style
 */
function buildLocationSection(locations: Location[]): string {
  if (locations.length === 0) return '';

  return locations.map(loc => {
    const { details } = loc;
    const parts = [];

    // Real place - just the name
    if (details.isRealPlace && details.realPlaceInfo?.specificLocation) {
      return `REAL LOCATION: ${details.realPlaceInfo.specificLocation}${details.realPlaceInfo.city ? ', ' + details.realPlaceInfo.city : ''}`;
    }

    // Fictional - only essentials
    if (details.locationType) parts.push(details.locationType);
    if (details.setting) parts.push(details.setting);
    if (details.timeOfDay) parts.push(details.timeOfDay);

    return `LOCATION: ${loc.name}${parts.length > 0 ? ' (' + parts.join(', ') + ')' : ''}`;
  }).join(', ');
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

    // Create GPT prompt - SIMPLIFIED for sketch style
    const systemPrompt = `You are a storyboard artist. Create BRIEF, MINIMAL prompts for rough pencil sketches. Keep descriptions SHORT and SIMPLE.

Output format:

SHOT: [shot type and angle - e.g. "medium shot, eye-level" or "wide shot, low angle"]

CHARACTERS: [brief description - name, key features, clothing]

ACTION: [what the character is doing - one sentence]

LOCATION: [environment essentials only - brief, avoid long descriptions]

ATMOSPHERE: [mood, weather, lighting - very brief]

STYLE: Rough pencil storyboard sketch, loose gestural lines, black and white, draft-quality shading, hand-drawn look, minimal background details.

CRITICAL RULES:
- Keep ALL sections brief and minimal
- LOCATION should be 1-2 short phrases maximum
- If REAL LOCATION is specified, just mention the place name
- Focus on ACTION and COMPOSITION, not elaborate detail
- Background should be MINIMAL and LOOSELY sketched
- This is a SKETCH, not a detailed rendering`;

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
 * Fallback prompt generation if GPT fails - SIMPLIFIED
 */
function generateFallbackPrompt(options: {
  panelNumber: number;
  characters: Character[];
  locations?: Location[];
  action: string;
  sceneDescription: string;
  location: string;
}): string {
  const characterNames = options.characters.map(char => char.name).join(' and ');
  const locationName = options.locations && options.locations.length > 0
    ? options.locations[0].name
    : options.location;

  return `SHOT: Medium shot, eye-level

CHARACTERS: ${characterNames}

ACTION: ${options.action || options.sceneDescription}

LOCATION: ${locationName}

ATMOSPHERE: neutral lighting

STYLE: Rough pencil storyboard sketch, loose gestural lines, black and white, draft-quality shading, hand-drawn look, minimal background details.`;
}
