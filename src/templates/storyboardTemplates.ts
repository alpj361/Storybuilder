import { 
  StoryboardPrompt, 
  StoryboardStyle, 
  CompositionType, 
  PanelType,
  Character,
  Scene 
} from "../types/storyboard";

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
 */
export function generateStoryboardPrompt(
  prompt: StoryboardPrompt,
  characters: Character[],
  scene: Scene
): string {
  const styleTemplate = STYLE_TEMPLATES[prompt.style];
  const compositionTemplate = COMPOSITION_TEMPLATES[prompt.composition];

  // Get character descriptions for this panel
  const panelCharacters = characters.filter(char =>
    prompt.characters.includes(char.id)
  );

  // Build character description string - use only appearance details, not full description
  const characterDescriptions = panelCharacters.map(char => {
    const appearance = char.appearance;
    const features = [
      appearance.age && `${appearance.age}`,
      appearance.gender && `${appearance.gender}`,
      appearance.build && `${appearance.build} build`,
      appearance.hair && `${appearance.hair} hair`,
      appearance.clothing && `wearing ${appearance.clothing}`,
      appearance.distinctiveFeatures?.join(", ")
    ].filter(Boolean).join(", ");

    // Only use appearance features if available, otherwise use character name
    return features || char.name;
  }).join(" and ");

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

  // Use prompt.action directly as it now contains the user's actual idea
  const mainAction = prompt.action || prompt.sceneDescription;

  // Construct the complete prompt with user's actual idea as the focus
  const promptParts = [
    styleTemplate.prefix,
    compositionTemplate.description,
    mainAction, // User's actual story idea
    characterDescriptions && `with ${characterDescriptions}`,
    sceneDescription && `in ${sceneDescription}`,
    prompt.cameraAngle && `${prompt.cameraAngle}`,
    prompt.lighting && `${prompt.lighting}`,
    prompt.mood && `${prompt.mood} mood`,
    compositionTemplate.framing,
    styleTemplate.suffix
  ].filter(Boolean).join(", ");

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
 * Generate prompts for an entire storyboard project
 */
export function generateAllPanelPrompts(
  prompts: StoryboardPrompt[],
  characters: Character[],
  scenes: Scene[]
): StoryboardPrompt[] {
  return prompts.map(prompt => {
    const scene = scenes.find(s => s.id === prompt.sceneId) || scenes[0];
    const generatedPrompt = generateStoryboardPrompt(prompt, characters, scene);
    const enhancedPrompt = enhancePromptForStoryboard(generatedPrompt);
    
    return {
      ...prompt,
      generatedPrompt: enhancedPrompt
    };
  });
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