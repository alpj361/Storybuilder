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
 */
function buildCharacterSection(character: Character): string {
  const appearance = character.appearance;
  const parts: string[] = [];

  // "Based on" reference (most important for AI)
  if (appearance.basedOn) {
    parts.push(`based on ${appearance.basedOn}`);
  }

  // Anatomical descriptors for FORM FIDELITY
  // Face structure (critical for likeness)
  if (appearance.faceShape) parts.push(`${appearance.faceShape} face`);

  // Hair shape (not texture)
  if (appearance.hair) {
    parts.push(`${appearance.hair} hair`);
  }

  // Facial features (shape, not detail)
  if (appearance.eyeShape && appearance.eyeColor) {
    parts.push(`${appearance.eyeShape} ${appearance.eyeColor} eyes`);
  } else if (appearance.eyeColor) {
    parts.push(`${appearance.eyeColor} eyes`);
  }

  // Distinctive features (glasses, facial hair, etc.)
  if (appearance.distinctiveFeatures && appearance.distinctiveFeatures.length > 0) {
    parts.push(appearance.distinctiveFeatures.join(', '));
  }

  // Build and proportions
  if (appearance.build) parts.push(`${appearance.build} build`);
  if (appearance.size) parts.push(appearance.size);

  // Type/species (for non-humans)
  if (appearance.species) {
    parts.push(appearance.species);
  } else if (appearance.characterType && appearance.characterType !== 'human') {
    parts.push(appearance.characterType);
  }

  // Skin tone (form, not texture)
  if (appearance.skinTone) parts.push(appearance.skinTone);

  // Coloration (for non-humans - important for silhouette)
  if (appearance.coloration) parts.push(appearance.coloration);

  // Clothing (shape, not fabric detail)
  if (appearance.clothing) parts.push(`wearing ${appearance.clothing}`);

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

    // Create GPT prompt - HIGH FIDELITY in FORM, LOW FIDELITY in TEXTURE
    const systemPrompt = `You are a storyboard artist. Create prompts for rough pencil sketches with HIGH FIDELITY in FORM (character likeness, landmark recognition) but LOW FIDELITY in TEXTURE (no rendering, no detail).

Output format (STYLE goes FIRST):

STYLE: Rough black-and-white pencil storyboard sketch. Loose gestural line art, no color, no shading, minimal detail, hand-drawn animation pre-visualization look. Clear silhouettes, simplified backgrounds. Avoid realism.

SHOT: [shot type and angle - e.g. "medium shot, eye-level"]

CHARACTERS: [anatomical fidelity - face structure, hair shape, distinctive features, build, clothing. NO texture words like "smooth skin" or "detailed fabric"]

ACTION: [what the character is doing - one sentence]

LOCATION: [For real places: "Simplified [place name]" with key landmarks as "outline" or "silhouette". For fictional: brief description with "simplified" prefix]

COMPOSITION: [character position, background indication - e.g. "characters centered, background lightly indicated"]

ATMOSPHERE: [mood, lighting - very brief]

NOTES: Keep sketch rough; emphasize character likeness and facial proportions. Background should resemble real location but stay minimalistic and sketched.

CRITICAL RULES:
- HIGH fidelity in CHARACTER ANATOMY (face shape, features) but NO rendering
- HIGH fidelity in LOCATION LANDMARKS (recognizable) but as SIMPLIFIED OUTLINES
- Use words: "simplified", "outline", "silhouette", "rough", "suggested", "indicated"
- NEVER use: "realistic", "detailed", "textured", "rendered", "photographic"
- Characters must be anatomically recognizable but sketch-style
- Locations must be landmark-recognizable but minimalistic`;

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
 * Fallback prompt generation if GPT fails - HIGH FIDELITY FORM, LOW FIDELITY TEXTURE
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
    return `${char.name}: ${buildCharacterSection(char)}`;
  }).join('. ');

  // Build location with simplified approach
  const locationDesc = options.locations && options.locations.length > 0
    ? buildLocationSection(options.locations)
    : `Simplified ${options.location}`;

  return `STYLE: Rough black-and-white pencil storyboard sketch. Loose gestural line art, no color, no shading, minimal detail, hand-drawn animation pre-visualization look. Clear silhouettes, simplified backgrounds. Avoid realism.

SHOT: Medium shot, eye-level

CHARACTERS: ${characterDescs}

ACTION: ${options.action || options.sceneDescription}

LOCATION: ${locationDesc}

COMPOSITION: Characters centered, background lightly indicated as loose pencil outlines

ATMOSPHERE: Neutral lighting

NOTES: Keep sketch rough; emphasize character likeness and facial proportions. Background should stay minimalistic and sketched.`;
}
