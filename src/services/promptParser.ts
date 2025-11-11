import { 
  StoryboardProject, 
  StoryboardPanel, 
  StoryboardPrompt, 
  Character, 
  Scene, 
  StoryboardStyle, 
  CompositionType, 
  PanelType,
  PromptGenerationResult,
  ProjectType 
} from "../types/storyboard";
import { v4 as uuidv4 } from "uuid";

// New interfaces for enhanced parsing
interface ThemeAnalysis {
  type: 'historical' | 'educational' | 'fictional' | 'technical' | 'general';
  concepts: string[];
  timePeriod?: string;
  location?: string;
  keyEvents?: string[];
  mainSubject?: string;
}

interface VisualStyle {
  style: 'toons' | 'realistic' | 'anime' | 'sketch' | 'storyboard' | 'generic';
  characteristics: string[];
  complexity: 'simple' | 'detailed' | 'complex';
  colorScheme?: string;
  artisticElements?: string[];
}

interface ContextualPrompt {
  panelNumber: number;
  themeContext: string;
  visualStyle: string;
  narrativeFlow: string;
  technicalSpecs: string;
}

/**
 * Analyze thematic content from user input
 */
export function analyzeTheme(input: string): ThemeAnalysis {
  const lowercaseInput = input.toLowerCase();
  
  // Historical content detection
  if (/(historia|histórico|histórica|guerra|reforma|revolución|presidente|gobierno|siglo|año|década|época)/.test(lowercaseInput)) {
    const timePeriod = extractTimePeriod(input);
    const location = extractLocation(input);
    const concepts = extractHistoricalConcepts(input);
    
    return {
      type: 'historical',
      concepts,
      timePeriod,
      location,
      keyEvents: extractKeyEvents(input),
      mainSubject: extractMainSubject(input)
    };
  }
  
  // Educational content detection
  if (/(educativo|enseñar|aprender|explicar|concepto|lección|tutorial|instrucción)/.test(lowercaseInput)) {
    return {
      type: 'educational',
      concepts: extractEducationalConcepts(input),
      mainSubject: extractMainSubject(input)
    };
  }
  
  // Technical content detection
  if (/(técnico|arquitectura|construcción|diseño|blueprint|cad|ingeniería|estructura)/.test(lowercaseInput)) {
    return {
      type: 'technical',
      concepts: extractTechnicalConcepts(input),
      mainSubject: extractMainSubject(input)
    };
  }
  
  // Fictional content detection
  if (/(historia|cuento|narrativa|personaje|aventura|ficción)/.test(lowercaseInput)) {
    return {
      type: 'fictional',
      concepts: extractFictionalConcepts(input),
      mainSubject: extractMainSubject(input)
    };
  }
  
  return {
    type: 'general',
    concepts: extractGeneralConcepts(input),
    mainSubject: extractMainSubject(input)
  };
}

/**
 * Analyze visual style from user input
 */
export function analyzeVisualStyle(input: string): VisualStyle {
  const lowercaseInput = input.toLowerCase();
  
  // Toons style detection
  if (/(toons|bolitas|palitos|stick|figures|simple|cartoon|dibujo simple)/.test(lowercaseInput)) {
    return {
      style: 'toons',
      characteristics: ['simple shapes', 'basic lines', 'minimal details', 'geometric forms'],
      complexity: 'simple',
      artisticElements: ['bolitas', 'palitos', 'figuras simples']
    };
  }
  
  // Realistic style detection
  if (/(realista|fotográfico|foto|real|detallado|preciso)/.test(lowercaseInput)) {
    return {
      style: 'realistic',
      characteristics: ['detailed', 'photographic', 'realistic proportions', 'textured'],
      complexity: 'detailed'
    };
  }
  
  // Anime style detection
  if (/(anime|manga|japonés|estilo anime)/.test(lowercaseInput)) {
    return {
      style: 'anime',
      characteristics: ['large eyes', 'stylized features', 'dynamic poses', 'expressive'],
      complexity: 'detailed'
    };
  }
  
  // Sketch style detection
  if (/(boceto|sketch|dibujo|lápiz|líneas)/.test(lowercaseInput)) {
    return {
      style: 'sketch',
      characteristics: ['line art', 'sketchy', 'hand-drawn', 'rough'],
      complexity: 'simple'
    };
  }
  
  // Storyboard style detection
  if (/(storyboard|guion gráfico|paneles|secuencia)/.test(lowercaseInput)) {
    return {
      style: 'storyboard',
      characteristics: ['sequential', 'panel-based', 'narrative flow', 'clear composition'],
      complexity: 'simple'
    };
  }
  
  return {
    style: 'generic',
    characteristics: ['neutral', 'standard'],
    complexity: 'simple'
  };
}

/**
 * Main entry point for parsing natural language input into a complete storyboard project
 */
export async function parseUserInput(input: string): Promise<PromptGenerationResult> {
  const startTime = Date.now();
  
  try {
    // Extract key elements from user input
    const characters = extractCharacters(input);
    const scenes = extractScenes(input);
    const genre = detectGenre(input);
    const targetAudience = detectTargetAudience(input);
    const panelCount = detectPanelCount(input);
    
    // Generate sequence with detected panel count
    const panels = generatePanelSequence(input, characters, scenes, panelCount);
    
    // Create project structure
    const project: StoryboardProject = {
      id: uuidv4(),
      title: generateTitle(input),
      description: input,
      userInput: input,
      characters,
      scenes,
      panels,
      style: StoryboardStyle.ROUGH_SKETCH,
      createdAt: new Date(),
      updatedAt: new Date(),
      isComplete: true,
      metadata: {
        targetAudience,
        genre,
        aspectRatio: "1:1"
      },
      projectType: ProjectType.STORYBOARD
    };

    const processingTime = Date.now() - startTime;
    
    return {
      success: true,
      project,
      processingTime
    };
    
  } catch (error) {
    return {
      success: false,
      project: {} as StoryboardProject,
      errors: [error instanceof Error ? error.message : "Unknown parsing error"],
      processingTime: Date.now() - startTime
    };
  }
}

/**
 * Extract and define characters from natural language input
 */
export function extractCharacters(input: string): Character[] {
  const characters: Character[] = [];
  const lowercaseInput = input.toLowerCase();
  
  // Common character patterns
  const characterPatterns = [
    { pattern: /(?:a |the )?(?:young |old )?(?:man|guy|dude|person|character)/g, type: "man" },
    { pattern: /(?:a |the )?(?:young |old )?(?:woman|girl|lady|person|character)/g, type: "woman" },
    { pattern: /(?:a |the )?(?:small |big |large )?(?:dog|puppy|canine)/g, type: "dog" },
    { pattern: /(?:a |the )?(?:small |big |large )?(?:cat|kitten|feline)/g, type: "cat" },
    { pattern: /(?:a |the )?(?:child|kid|boy|girl)/g, type: "child" },
    { pattern: /(?:a |the )?(?:robot|android|machine)/g, type: "robot" }
  ];

  characterPatterns.forEach((pattern, index) => {
    const matches = lowercaseInput.match(pattern.pattern);
    if (matches && matches.length > 0) {
      const character: Character = {
        id: uuidv4(),
        name: `Character ${index + 1}`,
        description: generateCharacterDescription(pattern.type, input),
        appearance: generateCharacterAppearance(pattern.type),
        role: index === 0 ? "protagonist" : "supporting"
      };
      characters.push(character);
    }
  });

  // If no characters found, create character based on user input
  if (characters.length === 0) {
    characters.push({
      id: uuidv4(),
      name: "Main Subject",
      description: input.trim(), // Use actual user input instead of generic text
      appearance: {
        age: "adult",
        build: "average",
        clothing: "casual"
      },
      role: "protagonist"
    });
  }

  return characters;
}

/**
 * Extract and define scenes/settings from natural language input
 */
export function extractScenes(input: string): Scene[] {
  const scenes: Scene[] = [];
  const lowercaseInput = input.toLowerCase();
  
  // Scene/location patterns
  const locationPatterns = [
    { pattern: /(?:in |at |outside |inside )?(?:a |the )?(?:park|garden|outdoor)/g, location: "park", environment: "outdoor natural setting with trees and grass" },
    { pattern: /(?:in |at |inside )?(?:a |the )?(?:house|home|room|living room)/g, location: "indoor home", environment: "comfortable indoor residential space" },
    { pattern: /(?:in |at |on )?(?:a |the )?(?:street|road|sidewalk)/g, location: "street", environment: "urban street setting with buildings and pavement" },
    { pattern: /(?:in |at )?(?:a |the )?(?:office|workplace|building)/g, location: "office", environment: "professional indoor workspace" },
    { pattern: /(?:in |at )?(?:a |the )?(?:beach|ocean|water)/g, location: "beach", environment: "coastal setting with sand and water" },
    { pattern: /(?:in |at )?(?:a |the )?(?:construction site|worksite)/g, location: "construction site", environment: "active construction area with structural elements and equipment" },
    { pattern: /(?:on |over )?(?:a |the )?(?:blueprint|plan|drawing)/g, location: "blueprint table", environment: "architectural blueprints and technical drawings on a desk" },
    { pattern: /(?:in |at )?(?:a |the )?(?:studio|atelier)/g, location: "design studio", environment: "architectural studio with drafting tools and models" }
  ];

  let sceneFound = false;
  locationPatterns.forEach(pattern => {
    if (lowercaseInput.match(pattern.pattern) && !sceneFound) {
      scenes.push({
        id: uuidv4(),
        name: `Main Scene`,
        location: pattern.location,
        timeOfDay: detectTimeOfDay(input),
        lighting: "natural daylight",
        mood: detectMood(input),
        environment: pattern.environment
      });
      sceneFound = true;
    }
  });

  // Default scene if none detected - use actual user input
  if (!sceneFound) {
    scenes.push({
      id: uuidv4(),
      name: "Main Scene",
      location: input.trim(), // Use user's actual idea instead of "generic setting"
      timeOfDay: detectTimeOfDay(input),
      lighting: "natural lighting",
      mood: detectMood(input),
      environment: input.trim() // Use user's actual description
    });
  }

  return scenes;
}

/**
 * Generate contextual panel sequence with theme and style awareness
 */
export function generateContextualPanelSequence(
  input: string, 
  characters: Character[], 
  scenes: Scene[],
  count: number,
  themeAnalysis: ThemeAnalysis,
  visualStyle: VisualStyle
): StoryboardPanel[] {
  try {
    const panels: StoryboardPanel[] = [];
    const mainCharacter = characters?.[0];
    const mainScene = scenes?.[0];

    // Generate contextual prompts for each panel
    for (let i = 1; i <= count; i++) {
      const contextualPrompt = generateContextualPrompt(i, input, themeAnalysis, visualStyle, characters, scenes);
      panels.push(createContextualPanel(i, contextualPrompt, mainCharacter, mainScene));
    }

    return panels;
  } catch (error) {
    console.error('Error generating contextual panel sequence:', error);
    // Fallback to basic panels
    const panels: StoryboardPanel[] = [];
    for (let i = 1; i <= count; i++) {
      const prompt: StoryboardPrompt = {
        id: uuidv4(),
        panelNumber: i,
        panelType: getPanelType(i),
        composition: getCompositionType(i),
        sceneDescription: "Story context",
        characters: [],
        sceneId: "",
        action: "Narrative flow",
        cameraAngle: "Standard angle",
        lighting: "Natural lighting",
        mood: "Neutral",
        visualNotes: "Visual style",
        generatedPrompt: "Contextual storyboard illustration",
        style: StoryboardStyle.ROUGH_SKETCH
      };

      panels.push({
        id: uuidv4(),
        panelNumber: i,
        prompt,
        isGenerating: false,
        isEdited: false
      });
    }
    return panels;
  }
}

/**
 * Generate contextual prompt for a specific panel
 */
function generateContextualPrompt(
  panelNumber: number,
  input: string,
  themeAnalysis: ThemeAnalysis,
  visualStyle: VisualStyle,
  characters: Character[],
  scenes: Scene[]
): ContextualPrompt {
  try {
    const themeContext = buildThemeContext(panelNumber, themeAnalysis);
    const visualStyleContext = buildVisualStyleContext(visualStyle);
    const narrativeFlow = buildNarrativeFlow(panelNumber, themeAnalysis, characters);
    const technicalSpecs = buildTechnicalSpecs(panelNumber, visualStyle);

    return {
      panelNumber,
      themeContext,
      visualStyle: visualStyleContext,
      narrativeFlow,
      technicalSpecs
    };
  } catch (error) {
    console.error('Error generating contextual prompt:', error);
    return {
      panelNumber,
      themeContext: "story context",
      visualStyle: "visual style",
      narrativeFlow: "narrative flow",
      technicalSpecs: "technical specifications"
    };
  }
}

/**
 * Build theme context for a panel
 */
function buildThemeContext(panelNumber: number, themeAnalysis: ThemeAnalysis): string {
  try {
    if (!themeAnalysis || typeof themeAnalysis !== 'object') {
      return "story context";
    }
    
    switch (themeAnalysis.type) {
      case 'historical':
        return buildHistoricalContext(panelNumber, themeAnalysis);
      case 'educational':
        return buildEducationalContext(panelNumber, themeAnalysis);
      case 'technical':
        return buildTechnicalContext(panelNumber, themeAnalysis);
      case 'fictional':
        return buildFictionalContext(panelNumber, themeAnalysis);
      default:
        return buildGeneralContext(panelNumber, themeAnalysis);
    }
  } catch (error) {
    console.error('Error building theme context:', error);
    return "story context";
  }
}

/**
 * Build visual style context
 */
function buildVisualStyleContext(visualStyle: VisualStyle): string {
  try {
    if (!visualStyle || typeof visualStyle !== 'object') {
      return "visual style";
    }
    
    const styleDescriptors = visualStyle.characteristics?.join(', ') || "characteristics";
    const complexity = visualStyle.complexity || "simple";
    const elements = visualStyle.artisticElements ? visualStyle.artisticElements.join(', ') : '';
    
    return `${visualStyle.style || "style"} style with ${styleDescriptors}, ${complexity} detail level${elements ? `, featuring ${elements}` : ''}`;
  } catch (error) {
    console.error('Error building visual style context:', error);
    return "visual style";
  }
}

/**
 * Build narrative flow for panel
 */
function buildNarrativeFlow(panelNumber: number, themeAnalysis: ThemeAnalysis, characters: Character[]): string {
  try {
    if (!panelNumber || typeof panelNumber !== 'number') {
      return "narrative flow";
    }
    
    const totalPanels = 4; // Default
    const progress = panelNumber / totalPanels;
    
    if (progress <= 0.25) {
      return "Establishing the scene and context";
    } else if (progress <= 0.5) {
      return "Introducing key elements and characters";
    } else if (progress <= 0.75) {
      return "Developing the main action or concept";
    } else {
      return "Concluding with resolution or key message";
    }
  } catch (error) {
    console.error('Error building narrative flow:', error);
    return "narrative flow";
  }
}

/**
 * Build technical specifications
 */
function buildTechnicalSpecs(panelNumber: number, visualStyle: VisualStyle): string {
  try {
    if (!panelNumber || typeof panelNumber !== 'number') {
      return "technical specifications";
    }
    
    const compositions = ['wide shot', 'medium shot', 'close-up', 'extreme close-up'];
    const composition = compositions[Math.min(panelNumber - 1, compositions.length - 1)];
    const complexity = visualStyle?.complexity || "simple";
    
    return `${composition}, ${complexity} detail, clear composition`;
  } catch (error) {
    console.error('Error building technical specs:', error);
    return "technical specifications";
  }
}

/**
 * Create contextual panel with enhanced prompt generation
 */
function createContextualPanel(
  panelNumber: number,
  contextualPrompt: ContextualPrompt,
  mainCharacter: Character,
  mainScene: Scene
): StoryboardPanel {
  try {
    const prompt: StoryboardPrompt = {
      id: uuidv4(),
      panelNumber,
      panelType: getPanelType(panelNumber),
      composition: getCompositionType(panelNumber),
      sceneDescription: `${contextualPrompt?.themeContext || "story context"} - ${contextualPrompt?.narrativeFlow || "narrative flow"}`,
      characters: [mainCharacter?.id || ""],
      sceneId: mainScene?.id || "",
      action: contextualPrompt?.narrativeFlow || "narrative flow",
      cameraAngle: contextualPrompt?.technicalSpecs || "technical specifications",
      lighting: "appropriate lighting for the scene",
      mood: "contextual mood",
      visualNotes: contextualPrompt?.visualStyle || "visual style",
      generatedPrompt: generateEnhancedPrompt(contextualPrompt, mainCharacter, mainScene),
      style: StoryboardStyle.ROUGH_SKETCH
    };

    return {
      id: uuidv4(),
      panelNumber,
      prompt,
      isGenerating: false,
      isEdited: false
    };
  } catch (error) {
    console.error('Error creating contextual panel:', error);
    // Fallback to basic panel
    const prompt: StoryboardPrompt = {
      id: uuidv4(),
      panelNumber,
      panelType: getPanelType(panelNumber),
      composition: getCompositionType(panelNumber),
      sceneDescription: "Story context",
      characters: [],
      sceneId: "",
      action: "Narrative flow",
      cameraAngle: "Standard angle",
      lighting: "Natural lighting",
      mood: "Neutral",
      visualNotes: "Visual style",
      generatedPrompt: "Contextual storyboard illustration",
      style: StoryboardStyle.ROUGH_SKETCH
    };

    return {
      id: uuidv4(),
      panelNumber,
      prompt,
      isGenerating: false,
      isEdited: false
    };
  }
}

/**
 * Generate enhanced prompt combining all contextual elements
 */
function generateEnhancedPrompt(
  contextualPrompt: ContextualPrompt,
  character: Character,
  scene: Scene
): string {
  const { themeContext, visualStyle, narrativeFlow, technicalSpecs } = contextualPrompt;
  
  return `${visualStyle} illustration showing ${themeContext}. ${narrativeFlow}. ${technicalSpecs}. Character: ${character.description}. Scene: ${scene.environment}`;
}

// Helper functions for theme context building
function buildHistoricalContext(panelNumber: number, theme: ThemeAnalysis): string {
  try {
    if (!theme || typeof theme !== 'object') {
      return "historical context";
    }
    
    const events = theme.keyEvents || [];
    const concepts = theme.concepts || [];
    
    if (panelNumber === 1) {
      return `Historical context: ${theme.timePeriod || 'historical period'} in ${theme.location || 'the region'}`;
    } else if (panelNumber === 2) {
      return `Key historical figure: ${theme.mainSubject || 'historical figure'}`;
    } else if (panelNumber === 3) {
      return `Historical event: ${events[0] || concepts[0] || 'significant historical moment'}`;
    } else {
      return `Historical impact: ${events[1] || concepts[1] || 'consequences and legacy'}`;
    }
  } catch (error) {
    console.error('Error building historical context:', error);
    return "historical context";
  }
}

function buildEducationalContext(panelNumber: number, theme: ThemeAnalysis): string {
  try {
    if (!theme || typeof theme !== 'object') {
      return "educational context";
    }
    
    const concepts = theme.concepts || [];
    
    if (panelNumber === 1) {
      return `Educational topic: ${theme.mainSubject || 'learning concept'}`;
    } else if (panelNumber === 2) {
      return `Key concept: ${concepts[0] || 'main learning point'}`;
    } else if (panelNumber === 3) {
      return `Application: ${concepts[1] || 'practical example'}`;
    } else {
      return `Conclusion: ${concepts[2] || 'key takeaway'}`;
    }
  } catch (error) {
    console.error('Error building educational context:', error);
    return "educational context";
  }
}

function buildTechnicalContext(panelNumber: number, theme: ThemeAnalysis): string {
  try {
    if (!theme || typeof theme !== 'object') {
      return "technical context";
    }
    
    const concepts = theme.concepts || [];
    
    if (panelNumber === 1) {
      return `Technical overview: ${theme.mainSubject || 'technical system'}`;
    } else if (panelNumber === 2) {
      return `Technical detail: ${concepts[0] || 'specific component'}`;
    } else if (panelNumber === 3) {
      return `Technical process: ${concepts[1] || 'construction or assembly'}`;
    } else {
      return `Technical result: ${concepts[2] || 'final structure or system'}`;
    }
  } catch (error) {
    console.error('Error building technical context:', error);
    return "technical context";
  }
}

function buildFictionalContext(panelNumber: number, theme: ThemeAnalysis): string {
  try {
    if (!theme || typeof theme !== 'object') {
      return "fictional context";
    }
    
    const concepts = theme.concepts || [];
    
    if (panelNumber === 1) {
      return `Story setup: ${theme.mainSubject || 'story beginning'}`;
    } else if (panelNumber === 2) {
      return `Character introduction: ${concepts[0] || 'main character'}`;
    } else if (panelNumber === 3) {
      return `Story development: ${concepts[1] || 'plot development'}`;
    } else {
      return `Story resolution: ${concepts[2] || 'story conclusion'}`;
    }
  } catch (error) {
    console.error('Error building fictional context:', error);
    return "fictional context";
  }
}

function buildGeneralContext(panelNumber: number, theme: ThemeAnalysis): string {
  try {
    if (!theme || typeof theme !== 'object') {
      return "general context";
    }
    
    const concepts = theme.concepts || [];
    
    if (panelNumber === 1) {
      return `Scene introduction: ${theme.mainSubject || 'general scene'}`;
    } else if (panelNumber === 2) {
      return `Element focus: ${concepts[0] || 'key element'}`;
    } else if (panelNumber === 3) {
      return `Action development: ${concepts[1] || 'main action'}`;
    } else {
      return `Scene conclusion: ${concepts[2] || 'scene resolution'}`;
    }
  } catch (error) {
    console.error('Error building general context:', error);
    return "general context";
  }
}

// Helper functions for panel type and composition
function getPanelType(panelNumber: number): PanelType {
  try {
    if (!panelNumber || typeof panelNumber !== 'number') {
      return PanelType.ACTION;
    }
    
    if (panelNumber === 1) return PanelType.ESTABLISHING;
    if (panelNumber === 2) return PanelType.CHARACTER_INTRO;
    if (panelNumber === 3) return PanelType.ACTION;
    return PanelType.RESOLUTION;
  } catch (error) {
    console.error('Error getting panel type:', error);
    return PanelType.ACTION;
  }
}

function getCompositionType(panelNumber: number): CompositionType {
  try {
    if (!panelNumber || typeof panelNumber !== 'number') {
      return CompositionType.MEDIUM_SHOT;
    }
    
    if (panelNumber === 1) return CompositionType.WIDE_SHOT;
    if (panelNumber === 2) return CompositionType.MEDIUM_SHOT;
    if (panelNumber === 3) return CompositionType.CLOSE_UP;
    return CompositionType.MEDIUM_SHOT;
  } catch (error) {
    console.error('Error getting composition type:', error);
    return CompositionType.MEDIUM_SHOT;
  }
}

/**
 * Generate a logical 4-panel storyboard sequence (legacy function for backward compatibility)
 */
export function generatePanelSequence(
  input: string,
  characters: Character[],
  scenes: Scene[],
  count: number = 4
): StoryboardPanel[] {
  const panels: StoryboardPanel[] = [];
  const mainCharacter = characters[0];
  const mainScene = scenes[0];

  // Use the actual user input for descriptions instead of hardcoded values
  const userIdea = input.trim();

  // Create a meaningful breakdown of the user's idea across panels
  const storyBeats = breakdownStoryIntoBeats(userIdea, count);

  // Panel 1: Establishing shot using user's actual idea
  panels.push(createPanel(1, {
    panelType: PanelType.ESTABLISHING,
    composition: CompositionType.WIDE_SHOT,
    sceneDescription: `${storyBeats[0] || userIdea} - establishing shot showing ${mainScene.location}`,
    action: `${userIdea} - setting up the scene`,
    characters: [],
    sceneId: mainScene.id,
    cameraAngle: "wide establishing angle",
    mood: mainScene.mood,
    visualNotes: `Scene context: ${userIdea}`
  }));

  // Panel 2: Character/subject introduction using user's idea
  if (count >= 2) {
    panels.push(createPanel(2, {
      panelType: PanelType.CHARACTER_INTRO,
      composition: CompositionType.MEDIUM_SHOT,
      sceneDescription: `${storyBeats[1] || userIdea} - introducing the main subject`,
      action: `${userIdea} - ${mainCharacter.description} in the scene`,
      characters: [mainCharacter.id],
      sceneId: mainScene.id,
      cameraAngle: "medium shot on subject",
      mood: "introduction",
      visualNotes: storyBeats[1] || userIdea
    }));
  }

  // Middle panels: Main action using user's actual story beats
  const middleSlots = Math.max(0, count - 2 - 1);
  for (let i = 0; i < middleSlots; i++) {
    const number = 3 + i;
    const beatIndex = Math.min(2 + i, storyBeats.length - 1);
    const currentBeat = storyBeats[beatIndex] || userIdea;

    panels.push(createPanel(number, {
      panelType: PanelType.ACTION,
      composition: CompositionType.CLOSE_UP,
      sceneDescription: `${currentBeat} - ${userIdea}`,
      action: currentBeat,
      characters: characters.map(c => c.id),
      sceneId: mainScene.id,
      cameraAngle: "dynamic angle on action",
      mood: "engaging",
      visualNotes: `${userIdea} - panel ${number} of ${count}`
    }));
  }

  // Final panel: Resolution using user's idea
  if (count >= 3) {
    const lastBeat = storyBeats[storyBeats.length - 1] || userIdea;
    panels.push(createPanel(count, {
      panelType: PanelType.RESOLUTION,
      composition: CompositionType.MEDIUM_SHOT,
      sceneDescription: `${lastBeat} - conclusion`,
      action: `${userIdea} - final moment`,
      characters: characters.map(c => c.id),
      sceneId: mainScene.id,
      cameraAngle: "medium resolution shot",
      mood: "conclusive",
      visualNotes: `${userIdea} - final panel showing resolution`
    }));
  }

  return panels;
}

/**
 * Break down user's story idea into logical beats for each panel
 */
function breakdownStoryIntoBeats(input: string, panelCount: number): string[] {
  const beats: string[] = [];

  // Split the input into sentences or meaningful chunks
  const sentences = input.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);

  if (sentences.length === 0) {
    // If no sentences, use the full input for all beats
    for (let i = 0; i < panelCount; i++) {
      beats.push(input);
    }
    return beats;
  }

  // If we have multiple sentences, distribute them across panels
  if (sentences.length >= panelCount) {
    // More sentences than panels - use first N sentences
    return sentences.slice(0, panelCount);
  } else {
    // Fewer sentences than panels - repeat strategically
    for (let i = 0; i < panelCount; i++) {
      const sentenceIndex = Math.floor((i * sentences.length) / panelCount);
      beats.push(sentences[sentenceIndex] || sentences[sentences.length - 1]);
    }
  }

  return beats;
}

/**
 * Create a storyboard panel with enhanced prompt generation
 */
function createPanel(panelNumber: number, promptData: Partial<StoryboardPrompt>): StoryboardPanel {
  const prompt: StoryboardPrompt = {
    id: uuidv4(),
    panelNumber,
    panelType: promptData.panelType || PanelType.ACTION,
    composition: promptData.composition || CompositionType.MEDIUM_SHOT,
    sceneDescription: promptData.sceneDescription || "",
    characters: promptData.characters || [],
    sceneId: promptData.sceneId || "",
    action: promptData.action || "",
    dialogue: promptData.dialogue,
    cameraAngle: promptData.cameraAngle,
    lighting: promptData.lighting || "natural lighting",
    mood: promptData.mood || "neutral",
    visualNotes: promptData.visualNotes,
    generatedPrompt: "", // Will be filled by template system
    style: StoryboardStyle.ROUGH_SKETCH
  };

  return {
    id: uuidv4(),
    panelNumber,
    prompt,
    isGenerating: false,
    isEdited: false
  };
}

// Helper functions
function generateTitle(input: string): string {
  const words = input.split(" ").slice(0, 4);
  return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function detectGenre(input: string): string {
  const lowercaseInput = input.toLowerCase();
  if (lowercaseInput.includes("action") || lowercaseInput.includes("fight")) return "action";
  if (lowercaseInput.includes("comedy") || lowercaseInput.includes("funny")) return "comedy";
  if (lowercaseInput.includes("drama") || lowercaseInput.includes("emotional")) return "drama";
  if (lowercaseInput.includes("horror") || lowercaseInput.includes("scary")) return "horror";
  return "general";
}

function detectTargetAudience(input: string): "animators" | "filmmakers" | "marketers" | "architects" | "general" {
  const lowercaseInput = input.toLowerCase();
  if (lowercaseInput.includes("animation") || lowercaseInput.includes("cartoon")) return "animators";
  if (lowercaseInput.includes("film") || lowercaseInput.includes("movie")) return "filmmakers";
  if (lowercaseInput.includes("product") || lowercaseInput.includes("brand")) return "marketers";
  if (
    lowercaseInput.includes("building") ||
    lowercaseInput.includes("architecture") ||
    lowercaseInput.includes("architectural") ||
    lowercaseInput.includes("beam") ||
    lowercaseInput.includes("column") ||
    lowercaseInput.includes("truss") ||
    lowercaseInput.includes("blueprint") ||
    lowercaseInput.includes("cad") ||
    lowercaseInput.includes("technical drawing") ||
    lowercaseInput.includes("construction detail") ||
    lowercaseInput.includes("structural")
  ) return "architects";
  return "general";
}

function detectTimeOfDay(input: string): "dawn" | "morning" | "noon" | "afternoon" | "evening" | "night" | "unknown" {
  const lowercaseInput = input.toLowerCase();
  if (lowercaseInput.includes("morning")) return "morning";
  if (lowercaseInput.includes("noon") || lowercaseInput.includes("midday")) return "noon";
  if (lowercaseInput.includes("afternoon")) return "afternoon";
  if (lowercaseInput.includes("evening")) return "evening";
  if (lowercaseInput.includes("night")) return "night";
  if (lowercaseInput.includes("dawn")) return "dawn";
  return "unknown";
}

function detectMood(input: string): string {
  const lowercaseInput = input.toLowerCase();
  if (lowercaseInput.includes("happy") || lowercaseInput.includes("joy")) return "happy";
  if (lowercaseInput.includes("sad") || lowercaseInput.includes("melancholy")) return "sad";
  if (lowercaseInput.includes("exciting") || lowercaseInput.includes("energetic")) return "exciting";
  if (lowercaseInput.includes("calm") || lowercaseInput.includes("peaceful")) return "calm";
  if (lowercaseInput.includes("tense") || lowercaseInput.includes("dramatic")) return "tense";
  return "neutral";
}

function generateCharacterDescription(type: string, input: string): string {
  const descriptions = {
    man: "A man with average build and casual appearance",
    woman: "A woman with average build and casual appearance", 
    dog: "A friendly dog with medium size and expressive features",
    cat: "A cat with sleek fur and alert posture",
    child: "A child with youthful energy and curious expression",
    robot: "A robot with mechanical features and technological design"
  };
  return descriptions[type as keyof typeof descriptions] || "A character in the scene";
}

function generateCharacterAppearance(type: string) {
  const appearances = {
    man: { age: "adult", gender: "male", build: "average", clothing: "casual" },
    woman: { age: "adult", gender: "female", build: "average", clothing: "casual" },
    dog: { age: "adult", build: "medium", distinctiveFeatures: ["four legs", "tail", "fur"] },
    cat: { age: "adult", build: "small", distinctiveFeatures: ["four legs", "tail", "whiskers"] },
    child: { age: "child", build: "small", clothing: "casual" },
    robot: { build: "mechanical", distinctiveFeatures: ["metallic", "technological"] }
  };
  return appearances[type as keyof typeof appearances] || { build: "average" };
}

function generateActionFromInput(input: string, characters: Character[]): string {
  const lowercaseInput = input.toLowerCase();
  
  // Architectural/technical details
  if (/(beam|column|girder|truss|joist|connection|weld|bolted|blueprint|cad|technical drawing|section|detail|elevation|plan|foundation|reinforcement)/.test(lowercaseInput)) {
    const keyword = (lowercaseInput.match(/beam|column|girder|truss|joist|connection|weld|bolted|blueprint|cad|technical drawing|section|detail|elevation|plan|foundation|reinforcement/) || ["technical detail"])[0];
    return `Detailed technical ${keyword} view with annotations`;
  }

  // Look for action verbs
  if (lowercaseInput.includes("walking") || lowercaseInput.includes("walk")) {
    return `${characters[0]?.name || "Character"} walking with ${characters[1]?.name || "companion"}`;
  }
  if (lowercaseInput.includes("playing") || lowercaseInput.includes("play")) {
    return `${characters[0]?.name || "Character"} playing with ${characters[1]?.name || "companion"}`;
  }
  if (lowercaseInput.includes("talking") || lowercaseInput.includes("speaking")) {
    return `${characters[0]?.name || "Character"} having a conversation`;
  }
  
  // Default interaction based on characters
  if (characters.length > 1) {
    return `${characters[0]?.name || "Character"} interacting with ${characters[1]?.name || "companion"}`;
  }
  
  return `${characters[0]?.name || "Character"} in the main scene`;
}

// Detect desired panel count from input (e.g., "6 panels", "8 frames")
function detectPanelCount(input: string): number {
  const lowercaseInput = input.toLowerCase();
  const m = lowercaseInput.match(/(\d{1,2})\s*(?:panels?|frames?)/);
  if (m) {
    const n = parseInt(m[1], 10);
    if (Number.isFinite(n) && n >= 1) return Math.min(n, 12);
  }
  return 4;
}

// Enhanced concept extraction functions
function extractTimePeriod(input: string): string {
  try {
    if (!input || typeof input !== 'string') {
      return "historical period";
    }
    
    const timePatterns = [
      /(\d{4})/g, // Years
      /(siglo\s+\w+)/gi, // Centuries
      /(década\s+del\s+\d+)/gi, // Decades
      /(años\s+\d+)/gi // Years range
    ];
    
    for (const pattern of timePatterns) {
      const match = input.match(pattern);
      if (match) return match[0];
    }
    
    return "historical period";
  } catch (error) {
    console.error('Error extracting time period:', error);
    return "historical period";
  }
}

function extractLocation(input: string): string {
  try {
    if (!input || typeof input !== 'string') {
      return "the region";
    }
    
    const locationPatterns = [
      /(en\s+\w+)/gi, // "en Guatemala"
      /(de\s+\w+)/gi, // "de Guatemala"
      /(Guatemala|México|España|Colombia|Argentina)/gi // Country names
    ];
    
    for (const pattern of locationPatterns) {
      const match = input.match(pattern);
      if (match) return match[0];
    }
    
    return "the region";
  } catch (error) {
    console.error('Error extracting location:', error);
    return "the region";
  }
}

function extractHistoricalConcepts(input: string): string[] {
  try {
    if (!input || typeof input !== 'string') {
      return [];
    }
    
    const concepts: string[] = [];
    const lowercaseInput = input.toLowerCase();
    
    if (lowercaseInput.includes("reforma agraria")) concepts.push("agrarian reform");
    if (lowercaseInput.includes("presidente")) concepts.push("president");
    if (lowercaseInput.includes("gobierno")) concepts.push("government");
    if (lowercaseInput.includes("tierra")) concepts.push("land distribution");
    if (lowercaseInput.includes("población")) concepts.push("population");
    if (lowercaseInput.includes("pobreza")) concepts.push("poverty");
    if (lowercaseInput.includes("decreto")) concepts.push("decree");
    if (lowercaseInput.includes("congreso")) concepts.push("congress");
    
    return concepts;
  } catch (error) {
    console.error('Error extracting historical concepts:', error);
    return [];
  }
}

function extractKeyEvents(input: string): string[] {
  try {
    if (!input || typeof input !== 'string') {
      return [];
    }
    
    const events: string[] = [];
    const lowercaseInput = input.toLowerCase();
    
    if (lowercaseInput.includes("decreto 900")) events.push("Decree 900 approval");
    if (lowercaseInput.includes("redistribución")) events.push("land redistribution");
    if (lowercaseInput.includes("reforma")) events.push("agrarian reform implementation");
    if (lowercaseInput.includes("controversia")) events.push("political controversy");
    
    return events;
  } catch (error) {
    console.error('Error extracting key events:', error);
    return [];
  }
}

function extractMainSubject(input: string): string {
  const lowercaseInput = input.toLowerCase();
  
  if (lowercaseInput.includes("jacobo arbenz")) return "Jacobo Arbenz Guzmán";
  if (lowercaseInput.includes("reforma agraria")) return "agrarian reform";
  if (lowercaseInput.includes("guatemala")) return "Guatemala";
  
  return "main subject";
}

function extractEducationalConcepts(input: string): string[] {
  const concepts: string[] = [];
  const lowercaseInput = input.toLowerCase();
  
  if (lowercaseInput.includes("concepto")) concepts.push("key concept");
  if (lowercaseInput.includes("lección")) concepts.push("lesson");
  if (lowercaseInput.includes("aprender")) concepts.push("learning objective");
  if (lowercaseInput.includes("ejemplo")) concepts.push("example");
  
  return concepts;
}

function extractTechnicalConcepts(input: string): string[] {
  const concepts: string[] = [];
  const lowercaseInput = input.toLowerCase();
  
  if (lowercaseInput.includes("estructura")) concepts.push("structure");
  if (lowercaseInput.includes("construcción")) concepts.push("construction");
  if (lowercaseInput.includes("diseño")) concepts.push("design");
  if (lowercaseInput.includes("blueprint")) concepts.push("blueprint");
  if (lowercaseInput.includes("cad")) concepts.push("CAD design");
  
  return concepts;
}

function extractFictionalConcepts(input: string): string[] {
  const concepts: string[] = [];
  const lowercaseInput = input.toLowerCase();
  
  if (lowercaseInput.includes("personaje")) concepts.push("character");
  if (lowercaseInput.includes("historia")) concepts.push("story");
  if (lowercaseInput.includes("aventura")) concepts.push("adventure");
  if (lowercaseInput.includes("narrativa")) concepts.push("narrative");
  
  return concepts;
}

function extractGeneralConcepts(input: string): string[] {
  const concepts: string[] = [];
  const lowercaseInput = input.toLowerCase();
  
  if (lowercaseInput.includes("escena")) concepts.push("scene");
  if (lowercaseInput.includes("acción")) concepts.push("action");
  if (lowercaseInput.includes("momento")) concepts.push("moment");
  if (lowercaseInput.includes("situación")) concepts.push("situation");
  
  return concepts;
}
