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

/**
 * Simplified parser that avoids complex functions that might cause C++ errors
 */
export async function parseUserInput(input: string): Promise<PromptGenerationResult> {
  const startTime = Date.now();
  
  try {
    // Simple character extraction
    const characters: Character[] = [{
      id: uuidv4(),
      name: "Main Character",
      description: "A character in the scene",
      appearance: {
        age: "adult",
        build: "average",
        clothing: "casual"
      },
      role: "protagonist"
    }];

    // Simple scene extraction
    const scenes: Scene[] = [{
      id: uuidv4(),
      name: "Main Scene",
      location: "generic setting",
      timeOfDay: "unknown",
      lighting: "neutral lighting",
      mood: "neutral",
      environment: "simple background setting"
    }];

    // Simple panel generation
    const panels: StoryboardPanel[] = [];
    const panelCount = 4;

    for (let i = 1; i <= panelCount; i++) {
      const prompt: StoryboardPrompt = {
        id: uuidv4(),
        panelNumber: i,
        panelType: i === 1 ? PanelType.ESTABLISHING : i === 2 ? PanelType.CHARACTER_INTRO : i === 3 ? PanelType.ACTION : PanelType.RESOLUTION,
        composition: i === 1 ? CompositionType.WIDE_SHOT : i === 2 ? CompositionType.MEDIUM_SHOT : i === 3 ? CompositionType.CLOSE_UP : CompositionType.MEDIUM_SHOT,
        sceneDescription: `Panel ${i} description`,
        characters: [characters[0].id],
        sceneId: scenes[0].id,
        action: `Action for panel ${i}`,
        cameraAngle: "Standard angle",
        lighting: "Natural lighting",
        mood: "Neutral",
        visualNotes: "Visual notes",
        generatedPrompt: `Simple storyboard illustration for panel ${i}`,
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

    // Create project structure
    const project: StoryboardProject = {
      id: uuidv4(),
      title: "Simple Project",
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
        targetAudience: "general",
        genre: "general",
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
