import {
  StoryboardPrompt,
  StoryboardStyle,
  CompositionType,
  PanelType,
  Character,
  Scene
} from "../types/storyboard";
import { getCharacterDescription } from "../services/characterDescriber";

/**
 * Base style templates for different storyboard drawing styles
 */
export const STYLE_TEMPLATES = {
  [StoryboardStyle.ROUGH_SKETCH]: {
    prefix: "Rough pencil sketch storyboard drawing, loose gestural lines, sketchy style, black and white, draft quality, quick sketch, hand-drawn appearance, minimal shading, rough outlines, concept art style,",
    suffix: ", storyboard panel, unfinished sketch look, draft drawing, rough concept, line art, gestural drawing, loose composition, storyboard draft"
  },
  [StoryboardStyle.PENCIL_DRAWING]: {
    prefix: "Detailed pencil drawing storyboard, clean lines, shaded, black and white,",
    suffix: ", professional storyboard panel, detailed pencil work, realistic proportions"
  },
  [StoryboardStyle.CLEAN_LINES]: {
    prefix: "Clean line art storyboard, precise lines, minimal shading, black and white,",
    suffix: ", professional storyboard panel, clean vector-like appearance"
  },
  [StoryboardStyle.CONCEPT_ART]: {
    prefix: "Concept art style storyboard, detailed illustration, atmospheric,",
    suffix: ", cinematic storyboard panel, professional concept art quality"
  },
  [StoryboardStyle.COMIC_STYLE]: {
    prefix: "Comic book style storyboard, bold lines, dynamic composition,",
    suffix: ", comic panel style, graphic novel aesthetic"
  }
};

/**
 * Composition templates for different shot types
 */
export const COMPOSITION_TEMPLATES = {
  [CompositionType.EXTREME_WIDE]: {
    description: "extreme wide shot showing the entire environment",
    framing: "very wide framing, characters small in frame, emphasis on location and setting",
    purpose: "establishing shot, showing scale and context"
  },
  [CompositionType.WIDE_SHOT]: {
    description: "wide shot showing full characters and environment",
    framing: "wide framing, full body characters visible, good amount of background",
    purpose: "establishing characters in their environment"
  },
  [CompositionType.MEDIUM_SHOT]: {
    description: "medium shot from waist up",
    framing: "medium framing, characters from waist up, balanced character and background",
    purpose: "dialogue and character interaction"
  },
  [CompositionType.CLOSE_UP]: {
    description: "close-up shot focusing on character faces or important details",
    framing: "tight framing, focus on faces or key objects, minimal background",
    purpose: "emotional moments and important details"
  },
  [CompositionType.EXTREME_CLOSE_UP]: {
    description: "extreme close-up on specific details",
    framing: "very tight framing, focus on eyes, hands, or specific objects",
    purpose: "dramatic emphasis and fine details"
  },
  [CompositionType.OVER_SHOULDER]: {
    description: "over-the-shoulder shot showing conversation",
    framing: "shot from behind one character looking at another",
    purpose: "dialogue scenes and character relationships"
  },
  [CompositionType.BIRD_EYE]: {
    description: "bird's eye view from above",
    framing: "high angle looking down, showing layout and spatial relationships",
    purpose: "showing movement patterns and spatial context"
  },
  [CompositionType.WORM_EYE]: {
    description: "worm's eye view from below",
    framing: "low angle looking up, making subjects appear powerful or imposing",
    purpose: "dramatic effect and showing dominance"
  }
};

/**
 * Panel type templates for different story functions
 */
export const PANEL_TYPE_TEMPLATES = {
  [PanelType.ESTABLISHING]: {
    focus: "setting and environment",
    typical_composition: CompositionType.WIDE_SHOT,
    description: "introduces the location and sets the scene context"
  },
  [PanelType.CHARACTER_INTRO]: {
    focus: "character introduction and personality",
    typical_composition: CompositionType.MEDIUM_SHOT,
    description: "introduces main characters and their characteristics"
  },
  [PanelType.ACTION]: {
    focus: "movement and dynamic activity",
    typical_composition: CompositionType.CLOSE_UP,
    description: "shows the main action or key event"
  },
  [PanelType.DIALOGUE]: {
    focus: "conversation and character interaction",
    typical_composition: CompositionType.MEDIUM_SHOT,
    description: "focuses on character dialogue and communication"
  },
  [PanelType.REACTION]: {
    focus: "character emotions and responses",
    typical_composition: CompositionType.CLOSE_UP,
    description: "shows character reactions to events"
  },
  [PanelType.TRANSITION]: {
    focus: "scene or time changes",
    typical_composition: CompositionType.WIDE_SHOT,
    description: "bridges between different scenes or time periods"
  },
  [PanelType.RESOLUTION]: {
    focus: "conclusion and outcome",
    typical_composition: CompositionType.MEDIUM_SHOT,
    description: "shows the resolution or conclusion of the sequence"
  }
};

/**
 * Generate a complete AI-ready prompt for a storyboard panel
 * @param prompt - The panel prompt configuration
 * @param characters - All characters in the project
 * @param scene - The scene for this panel
 * @param previousPanelsSummary - Optional summary of previous panels for story continuity
 */
export async function generateStoryboardPrompt(
  prompt: StoryboardPrompt,
  characters: Character[],
  scene: Scene,
  previousPanelsSummary?: string
): Promise<string> {
  console.log("[generateStoryboardPrompt] Input:", {
    panelNumber: prompt.panelNumber,
    style: prompt.style,
    composition: prompt.composition,
    action: prompt.action,
    sceneDescription: prompt.sceneDescription,
    characters: characters.map(c => ({ id: c.id, name: c.name, description: c.description })),
    scene: { location: scene.location, timeOfDay: scene.timeOfDay },
    hasPreviousContext: !!previousPanelsSummary
  });

  const styleTemplate = STYLE_TEMPLATES[prompt.style];
  const compositionTemplate = COMPOSITION_TEMPLATES[prompt.composition];
  const isFirstPanel = prompt.panelNumber === 1;

  // Get character descriptions for this panel
  const panelCharacters = characters.filter(char =>
    prompt.characters.includes(char.id)
  );

  // Build character description string
  let characterDescriptions = '';

  if (isFirstPanel) {
    // Panel 1: Use the best available character description
    // Priority order:
    // 1. portraitDescription (canonical, optimized for storyboard style)
    // 2. aiGeneratedDescription (from reference photo)
    // 3. manual appearance fields
    // 4. character name only
    const characterDescPromises = panelCharacters.map(async char => {
      const appearance = char.appearance;

      // HIGHEST PRIORITY: Portrait description (canonical, optimized for consistency)
      if (char.portraitDescription) {
        console.log(`[generateStoryboardPrompt] Using portrait description for ${char.name}:`, char.portraitDescription);
        return char.portraitDescription;
      }

      // SECOND PRIORITY: AI-generated description from reference photo
      if (char.aiGeneratedDescription) {
        console.log(`[generateStoryboardPrompt] Using saved AI description for ${char.name}:`, char.aiGeneratedDescription);
        return char.aiGeneratedDescription;
      }

      // THIRD PRIORITY: Reference image analysis (backwards compatibility)
      if (char.referenceImage && char.useReferenceInPrompt && !char.aiGeneratedDescription) {
        try {
          const aiDescription = await getCharacterDescription(char.referenceImage);
          console.log(`[generateStoryboardPrompt] Generated AI description for ${char.name}:`, aiDescription);
          return aiDescription;
        } catch (error) {
          console.warn(`[generateStoryboardPrompt] Failed to get AI description for ${char.name}:`, error);
          // Fall back to manual features if AI fails
        }
      }

      // FOURTH PRIORITY: Manual appearance features
      const features = [
        appearance.age && `${appearance.age}`,
        appearance.gender && `${appearance.gender}`,
        appearance.build && `${appearance.build} build`,
        appearance.hair && `${appearance.hair} hair`,
        appearance.clothing && `wearing ${appearance.clothing}`,
        appearance.distinctiveFeatures?.join(", ")
      ].filter(Boolean).join(", ");

      // FALLBACK: Character name only
      return features || char.name;
    });

    const characterDescArray = await Promise.all(characterDescPromises);
    characterDescriptions = characterDescArray.join(" and ");
  } else {
    // Panels 2+: Reference the same characters from panel 1 for consistency
    characterDescriptions = panelCharacters.map(char => {
      const appearance = char.appearance;
      const basicDesc = [
        appearance.age && `${appearance.age}`,
        appearance.gender && `${appearance.gender}`
      ].filter(Boolean).join(" ");

      // Reference previous panel for visual consistency
      return basicDesc
        ? `same ${basicDesc} ${char.name.toLowerCase()} from previous panels`
        : `same ${char.name.toLowerCase()} from previous panels`;
    }).join(" and ");
  }

  console.log("[generateStoryboardPrompt] Character descriptions:", characterDescriptions);

  // Build scene description - avoid duplicate text
  // Extract just the location name if scene.location contains the full user input
  const locationName = scene.location.length > 50
    ? scene.location.split(/[,.-]/)[0].trim() // Take first part if too long
    : scene.location;

  const sceneDescription = [
    locationName,
    scene.timeOfDay !== "unknown" && `during ${scene.timeOfDay}`,
    scene.weather && `${scene.weather} weather`
  ].filter(Boolean).join(", ");

  console.log("[generateStoryboardPrompt] Scene description:", sceneDescription);

  // Use prompt.action directly as it now contains the user's actual idea
  const mainAction = prompt.action || prompt.sceneDescription;

  console.log("[generateStoryboardPrompt] Main action:", mainAction);

  // Add story progression context for panels 2+
  const storyContext = !isFirstPanel && previousPanelsSummary
    ? `Continuing from: ${previousPanelsSummary}. Now: `
    : '';

  // Construct the complete prompt with user's actual idea as the focus
  const promptParts = [
    styleTemplate.prefix,
    compositionTemplate.description,
    storyContext, // Story progression context
    mainAction, // User's actual story idea
    characterDescriptions && `with ${characterDescriptions}`,
    sceneDescription && `in ${sceneDescription}`,
    prompt.cameraAngle && `${prompt.cameraAngle}`,
    prompt.lighting && `${prompt.lighting}`,
    prompt.mood && `${prompt.mood} mood`,
    !isFirstPanel && "maintain visual consistency with previous panels", // Character consistency reminder
    compositionTemplate.framing,
    styleTemplate.suffix
  ].filter(Boolean).join(", ").replace(/,\s*,/g, ','); // Remove double commas

  console.log("[generateStoryboardPrompt] Final prompt:", promptParts);

  return promptParts;
}

/**
 * Generate character consistency prompt additions
 */
export function generateCharacterConsistencyPrompt(character: Character): string {
  const appearance = character.appearance;
  const consistencyElements = [
    "maintain consistent character appearance",
    appearance.age && `always ${appearance.age}`,
    appearance.gender && `${appearance.gender}`,
    appearance.build && `${appearance.build} build`,
    appearance.hair && `${appearance.hair} hair`,
    appearance.clothing && `wearing ${appearance.clothing}`,
    appearance.distinctiveFeatures?.length && `distinctive features: ${appearance.distinctiveFeatures.join(", ")}`,
    "same character design across all panels"
  ].filter(Boolean).join(", ");
  
  return consistencyElements;
}

/**
 * Apply storyboard-specific enhancements to prompts
 */
export function enhancePromptForStoryboard(basePrompt: string): string {
  const storyboardEnhancements = [
    "storyboard panel",
    "sequential art",
    "narrative flow",
    "cinematic composition",
    "professional storyboard quality",
    "clear visual storytelling",
    "appropriate for pre-visualization"
  ];
  
  return `${basePrompt}, ${storyboardEnhancements.join(", ")}`;
}

/**
 * Generate prompts for an entire storyboard project with cumulative story context
 */
export async function generateAllPanelPrompts(
  prompts: StoryboardPrompt[],
  characters: Character[],
  scenes: Scene[]
): Promise<StoryboardPrompt[]> {
  // Build story context progressively as we process each panel
  const processedPrompts: StoryboardPrompt[] = [];
  let cumulativeStoryContext = '';

  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];
    const scene = scenes.find(s => s.id === prompt.sceneId) || scenes[0];

    // For panels 2+, pass summary of previous panels
    const previousPanelsSummary = i > 0 ? cumulativeStoryContext : undefined;

    const generatedPrompt = await generateStoryboardPrompt(
      prompt,
      characters,
      scene,
      previousPanelsSummary
    );
    const enhancedPrompt = enhancePromptForStoryboard(generatedPrompt);

    // Add this panel's action to cumulative context for next panels
    if (i < prompts.length - 1) {
      // Build a concise summary: "Panel 1: [action], Panel 2: [action]"
      const panelSummary = `Panel ${prompt.panelNumber}: ${prompt.action || prompt.sceneDescription}`;
      cumulativeStoryContext = cumulativeStoryContext
        ? `${cumulativeStoryContext}, ${panelSummary}`
        : panelSummary;

      // Keep context concise - limit to last 3 panels for readability
      const summaries = cumulativeStoryContext.split(', ');
      if (summaries.length > 3) {
        cumulativeStoryContext = summaries.slice(-3).join(', ');
      }
    }

    processedPrompts.push({
      ...prompt,
      generatedPrompt: enhancedPrompt
    });
  }

  return processedPrompts;
}

/**
 * Template for different target audiences
 */
export const AUDIENCE_TEMPLATES = {
  animators: {
    style_preference: StoryboardStyle.ROUGH_SKETCH,
    additional_notes: "animation-ready, clear character poses, motion lines where appropriate",
    focus: "character animation and movement"
  },
  filmmakers: {
    style_preference: StoryboardStyle.CONCEPT_ART,
    additional_notes: "cinematic composition, camera angles, lighting setup",
    focus: "cinematography and visual direction"
  },
  marketers: {
    style_preference: StoryboardStyle.CLEAN_LINES,
    additional_notes: "clear product visibility, brand-appropriate styling, commercial appeal",
    focus: "product presentation and brand messaging"
  },
  architects: {
    style_preference: StoryboardStyle.PENCIL_DRAWING,
    additional_notes: "architectural accuracy, spatial relationships, technical precision",
    focus: "spatial design and structural elements"
  },
  general: {
    style_preference: StoryboardStyle.ROUGH_SKETCH,
    additional_notes: "clear visual communication, balanced composition",
    focus: "general visual storytelling"
  }
};

/**
 * Apply audience-specific template modifications
 */
export function applyAudienceTemplate(
  prompt: StoryboardPrompt,
  audience: keyof typeof AUDIENCE_TEMPLATES
): StoryboardPrompt {
  const template = AUDIENCE_TEMPLATES[audience];
  
  return {
    ...prompt,
    style: template.style_preference,
    visualNotes: prompt.visualNotes 
      ? `${prompt.visualNotes}, ${template.additional_notes}`
      : template.additional_notes
  };
}