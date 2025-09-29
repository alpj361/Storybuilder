import { 
  StoryboardProject, 
  StoryboardPanel, 
  StoryboardPrompt, 
  Character, 
  Scene, 
  StoryboardStyle, 
  CompositionType, 
  PanelType,
  PromptGenerationResult 
} from "../types/storyboard";
import { v4 as uuidv4 } from "uuid";

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
      }
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

  // If no characters found, create a generic protagonist
  if (characters.length === 0) {
    characters.push({
      id: uuidv4(),
      name: "Main Character",
      description: "A person in the scene",
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

  // Default scene if none detected
  if (!sceneFound) {
    scenes.push({
      id: uuidv4(),
      name: "Main Scene",
      location: "generic setting",
      timeOfDay: "unknown",
      lighting: "neutral lighting",
      mood: "neutral",
      environment: "simple background setting"
    });
  }

  return scenes;
}

/**
 * Generate a logical 4-panel storyboard sequence
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

  // Panel 1: Establishing shot
  panels.push(createPanel(1, {
    panelType: PanelType.ESTABLISHING,
    composition: CompositionType.WIDE_SHOT,
    sceneDescription: `Wide establishing shot of ${mainScene.location}`,
    action: `Setting the scene in ${mainScene.environment}`,
    characters: [],
    sceneId: mainScene.id,
    cameraAngle: "eye level wide shot",
    mood: mainScene.mood
  }));

  // Panel 2: Character introduction (if count >= 2)
  if (count >= 2) {
    panels.push(createPanel(2, {
      panelType: PanelType.CHARACTER_INTRO,
      composition: CompositionType.MEDIUM_SHOT,
      sceneDescription: `${mainCharacter.description} appears in the scene`,
      action: `Introducing ${mainCharacter.name} in ${mainScene.location}`,
      characters: [mainCharacter.id],
      sceneId: mainScene.id,
      cameraAngle: "medium shot focusing on character",
      mood: "introduction"
    }));
  }

  // Middle beats sized to count (Action-focused)
  const middleSlots = Math.max(0, count - 2 - 1);
  const actionDescription = generateActionFromInput(input, characters);
  for (let i = 0; i < middleSlots; i++) {
    const number = 3 + i;
    const isDetail = actionDescription.toLowerCase().includes("detail");
    panels.push(createPanel(number, {
      panelType: PanelType.ACTION,
      composition: isDetail ? CompositionType.EXTREME_CLOSE_UP : CompositionType.CLOSE_UP,
      sceneDescription: actionDescription,
      action: `Main action: ${actionDescription}`,
      characters: characters.map(c => c.id),
      sceneId: mainScene.id,
      cameraAngle: isDetail ? "macro technical close-up" : "close-up on the action",
      mood: "engaging"
    }));
  }

  // Final resolution (if count >= 3)
  if (count >= 3) {
    panels.push(createPanel(count, {
      panelType: PanelType.RESOLUTION,
      composition: CompositionType.MEDIUM_SHOT,
      sceneDescription: `Resolution of the scene with ${mainCharacter.name}`,
      action: "Concluding moment showing the result or reaction",
      characters: characters.map(c => c.id),
      sceneId: mainScene.id,
      cameraAngle: "medium shot showing resolution",
      mood: "conclusive"
    }));
  }

  return panels;
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
