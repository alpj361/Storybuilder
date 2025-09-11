import { 
  StoryboardProject, 
  StoryboardPanel, 
  StoryboardPrompt,
  Character,
  Scene,
  StoryboardStyle,
  CompositionType,
  PanelType
} from "../types/storyboard";
import { v4 as uuidv4 } from "uuid";

/**
 * Mock storyboard projects for testing and demonstration
 */
export const mockStoryboardProjects: StoryboardProject[] = [
  {
    id: "mock-1",
    title: "Guy With A Dog",
    description: "A guy with a dog walking in the park",
    userInput: "A guy with a dog walking in the park",
    characters: [
      {
        id: "char-1",
        name: "Main Character",
        description: "A friendly man in his 30s",
        appearance: {
          age: "adult",
          gender: "male",
          build: "average",
          hair: "brown hair",
          clothing: "casual jeans and t-shirt"
        },
        role: "protagonist"
      },
      {
        id: "char-2", 
        name: "Buddy",
        description: "A golden retriever dog",
        appearance: {
          build: "medium",
          distinctiveFeatures: ["golden fur", "friendly expression", "wagging tail"]
        },
        role: "supporting"
      }
    ],
    scenes: [
      {
        id: "scene-1",
        name: "Park Scene",
        location: "city park",
        timeOfDay: "afternoon",
        lighting: "natural daylight",
        mood: "peaceful",
        environment: "green park with trees, grass, and walking paths",
        props: ["park bench", "trees", "walking path"]
      }
    ],
    panels: [
      {
        id: "panel-1",
        panelNumber: 1,
        prompt: {
          id: "prompt-1",
          panelNumber: 1,
          panelType: PanelType.ESTABLISHING,
          composition: CompositionType.WIDE_SHOT,
          sceneDescription: "Wide establishing shot of a peaceful city park",
          characters: [],
          sceneId: "scene-1",
          action: "Setting the scene in a green park with trees and walking paths",
          cameraAngle: "eye level wide shot",
          lighting: "natural daylight",
          mood: "peaceful",
          generatedPrompt: "Rough pencil sketch storyboard drawing, loose lines, sketchy style, black and white, wide shot showing the entire environment, Wide establishing shot of a peaceful city park, in city park, during afternoon, green park with trees, grass, and walking paths, Setting the scene in a green park with trees and walking paths, camera angle: eye level wide shot, lighting: natural daylight, mood: peaceful, wide framing, full body characters visible, good amount of background, storyboard panel, concept art style, unfinished sketch look, hand-drawn appearance",
          style: StoryboardStyle.ROUGH_SKETCH
        },
        isGenerating: false,
        isEdited: false
      },
      {
        id: "panel-2",
        panelNumber: 2,
        prompt: {
          id: "prompt-2",
          panelNumber: 2,
          panelType: PanelType.CHARACTER_INTRO,
          composition: CompositionType.MEDIUM_SHOT,
          sceneDescription: "A friendly man in his 30s appears in the scene",
          characters: ["char-1"],
          sceneId: "scene-1",
          action: "Introducing Main Character in city park",
          cameraAngle: "medium shot focusing on character",
          lighting: "natural daylight",
          mood: "introduction",
          generatedPrompt: "Rough pencil sketch storyboard drawing, loose lines, sketchy style, black and white, medium shot from waist up, A friendly man in his 30s appears in the scene, featuring A friendly man in his 30s (adult, male, average build, brown hair, wearing casual jeans and t-shirt), in city park, during afternoon, green park with trees, grass, and walking paths, Introducing Main Character in city park, camera angle: medium shot focusing on character, lighting: natural daylight, mood: introduction, medium framing, characters from waist up, balanced character and background, storyboard panel, concept art style, unfinished sketch look, hand-drawn appearance",
          style: StoryboardStyle.ROUGH_SKETCH
        },
        isGenerating: false,
        isEdited: false
      },
      {
        id: "panel-3",
        panelNumber: 3,
        prompt: {
          id: "prompt-3",
          panelNumber: 3,
          panelType: PanelType.ACTION,
          composition: CompositionType.CLOSE_UP,
          sceneDescription: "Main Character walking with Buddy",
          characters: ["char-1", "char-2"],
          sceneId: "scene-1",
          action: "Main action: Main Character walking with Buddy",
          cameraAngle: "close-up on the action",
          lighting: "natural daylight",
          mood: "engaging",
          generatedPrompt: "Rough pencil sketch storyboard drawing, loose lines, sketchy style, black and white, close-up shot focusing on character faces or important details, Main Character walking with Buddy, featuring A friendly man in his 30s (adult, male, average build, brown hair, wearing casual jeans and t-shirt) and A golden retriever dog (medium build, golden fur, friendly expression, wagging tail), in city park, during afternoon, green park with trees, grass, and walking paths, Main action: Main Character walking with Buddy, camera angle: close-up on the action, lighting: natural daylight, mood: engaging, tight framing, focus on faces or key objects, minimal background, storyboard panel, concept art style, unfinished sketch look, hand-drawn appearance",
          style: StoryboardStyle.ROUGH_SKETCH
        },
        isGenerating: false,
        isEdited: false
      },
      {
        id: "panel-4",
        panelNumber: 4,
        prompt: {
          id: "prompt-4",
          panelNumber: 4,
          panelType: PanelType.RESOLUTION,
          composition: CompositionType.MEDIUM_SHOT,
          sceneDescription: "Resolution of the scene with Main Character",
          characters: ["char-1", "char-2"],
          sceneId: "scene-1",
          action: "Concluding moment showing the result or reaction",
          cameraAngle: "medium shot showing resolution",
          lighting: "natural daylight",
          mood: "conclusive",
          generatedPrompt: "Rough pencil sketch storyboard drawing, loose lines, sketchy style, black and white, medium shot from waist up, Resolution of the scene with Main Character, featuring A friendly man in his 30s (adult, male, average build, brown hair, wearing casual jeans and t-shirt) and A golden retriever dog (medium build, golden fur, friendly expression, wagging tail), in city park, during afternoon, green park with trees, grass, and walking paths, Concluding moment showing the result or reaction, camera angle: medium shot showing resolution, lighting: natural daylight, mood: conclusive, medium framing, characters from waist up, balanced character and background, storyboard panel, concept art style, unfinished sketch look, hand-drawn appearance",
          style: StoryboardStyle.ROUGH_SKETCH
        },
        isGenerating: false,
        isEdited: false
      }
    ],
    style: StoryboardStyle.ROUGH_SKETCH,
    createdAt: new Date("2024-01-15T10:00:00Z"),
    updatedAt: new Date("2024-01-15T10:00:00Z"),
    isComplete: true,
    metadata: {
      targetAudience: "general",
      genre: "slice of life",
      aspectRatio: "1:1"
    }
  },
  {
    id: "mock-2",
    title: "Product Launch Presentation",
    description: "Product launch presentation for a new smartphone",
    userInput: "Product launch presentation for a new smartphone",
    characters: [
      {
        id: "char-3",
        name: "Presenter",
        description: "Professional presenter in business attire",
        appearance: {
          age: "adult",
          gender: "female",
          build: "average",
          clothing: "business suit",
          hair: "professional hairstyle"
        },
        role: "protagonist"
      }
    ],
    scenes: [
      {
        id: "scene-2",
        name: "Conference Room",
        location: "modern conference room",
        timeOfDay: "morning",
        lighting: "professional indoor lighting",
        mood: "professional",
        environment: "sleek conference room with presentation screen and modern furniture",
        props: ["presentation screen", "smartphone", "podium", "audience seating"]
      }
    ],
    panels: [
      {
        id: "panel-5",
        panelNumber: 1,
        prompt: {
          id: "prompt-5",
          panelNumber: 1,
          panelType: PanelType.ESTABLISHING,
          composition: CompositionType.WIDE_SHOT,
          sceneDescription: "Wide establishing shot of modern conference room",
          characters: [],
          sceneId: "scene-2",
          action: "Setting the scene in sleek conference room with presentation screen and modern furniture",
          cameraAngle: "eye level wide shot",
          lighting: "professional indoor lighting",
          mood: "professional",
          generatedPrompt: "Clean line art storyboard, precise lines, minimal shading, black and white, wide shot showing full characters and environment, Wide establishing shot of modern conference room, in modern conference room, during morning, sleek conference room with presentation screen and modern furniture, Setting the scene in sleek conference room with presentation screen and modern furniture, camera angle: eye level wide shot, lighting: professional indoor lighting, mood: professional, wide framing, full body characters visible, good amount of background, clear product visibility, brand-appropriate styling, commercial appeal, storyboard panel, sequential art, narrative flow, cinematic composition, professional storyboard quality, clear visual storytelling, appropriate for pre-visualization",
          style: StoryboardStyle.CLEAN_LINES
        },
        isGenerating: false,
        isEdited: false
      },
      {
        id: "panel-6",
        panelNumber: 2,
        prompt: {
          id: "prompt-6",
          panelNumber: 2,
          panelType: PanelType.CHARACTER_INTRO,
          composition: CompositionType.MEDIUM_SHOT,
          sceneDescription: "Professional presenter in business attire appears in the scene",
          characters: ["char-3"],
          sceneId: "scene-2",
          action: "Introducing Presenter in modern conference room",
          cameraAngle: "medium shot focusing on character",
          lighting: "professional indoor lighting",
          mood: "introduction",
          generatedPrompt: "Clean line art storyboard, precise lines, minimal shading, black and white, medium shot from waist up, Professional presenter in business attire appears in the scene, featuring Professional presenter in business attire (adult, female, average build, wearing business suit, professional hairstyle), in modern conference room, during morning, sleek conference room with presentation screen and modern furniture, Introducing Presenter in modern conference room, camera angle: medium shot focusing on character, lighting: professional indoor lighting, mood: introduction, medium framing, characters from waist up, balanced character and background, clear product visibility, brand-appropriate styling, commercial appeal, storyboard panel, sequential art, narrative flow, cinematic composition, professional storyboard quality, clear visual storytelling, appropriate for pre-visualization",
          style: StoryboardStyle.CLEAN_LINES
        },
        isGenerating: false,
        isEdited: false
      },
      {
        id: "panel-7",
        panelNumber: 3,
        prompt: {
          id: "prompt-7",
          panelNumber: 3,
          panelType: PanelType.ACTION,
          composition: CompositionType.CLOSE_UP,
          sceneDescription: "Presenter interacting with smartphone",
          characters: ["char-3"],
          sceneId: "scene-2",
          action: "Main action: Presenter interacting with smartphone",
          cameraAngle: "close-up on the action",
          lighting: "professional indoor lighting",
          mood: "engaging",
          generatedPrompt: "Clean line art storyboard, precise lines, minimal shading, black and white, close-up shot focusing on character faces or important details, Presenter interacting with smartphone, featuring Professional presenter in business attire (adult, female, average build, wearing business suit, professional hairstyle), in modern conference room, during morning, sleek conference room with presentation screen and modern furniture, Main action: Presenter interacting with smartphone, camera angle: close-up on the action, lighting: professional indoor lighting, mood: engaging, tight framing, focus on faces or key objects, minimal background, clear product visibility, brand-appropriate styling, commercial appeal, storyboard panel, sequential art, narrative flow, cinematic composition, professional storyboard quality, clear visual storytelling, appropriate for pre-visualization",
          style: StoryboardStyle.CLEAN_LINES
        },
        isGenerating: false,
        isEdited: false
      },
      {
        id: "panel-8",
        panelNumber: 4,
        prompt: {
          id: "prompt-8",
          panelNumber: 4,
          panelType: PanelType.RESOLUTION,
          composition: CompositionType.MEDIUM_SHOT,
          sceneDescription: "Resolution of the scene with Presenter",
          characters: ["char-3"],
          sceneId: "scene-2",
          action: "Concluding moment showing the result or reaction",
          cameraAngle: "medium shot showing resolution",
          lighting: "professional indoor lighting",
          mood: "conclusive",
          generatedPrompt: "Clean line art storyboard, precise lines, minimal shading, black and white, medium shot from waist up, Resolution of the scene with Presenter, featuring Professional presenter in business attire (adult, female, average build, wearing business suit, professional hairstyle), in modern conference room, during morning, sleek conference room with presentation screen and modern furniture, Concluding moment showing the result or reaction, camera angle: medium shot showing resolution, lighting: professional indoor lighting, mood: conclusive, medium framing, characters from waist up, balanced character and background, clear product visibility, brand-appropriate styling, commercial appeal, storyboard panel, sequential art, narrative flow, cinematic composition, professional storyboard quality, clear visual storytelling, appropriate for pre-visualization",
          style: StoryboardStyle.CLEAN_LINES
        },
        isGenerating: false,
        isEdited: false
      }
    ],
    style: StoryboardStyle.CLEAN_LINES,
    createdAt: new Date("2024-01-16T14:30:00Z"),
    updatedAt: new Date("2024-01-16T14:30:00Z"),
    isComplete: true,
    metadata: {
      targetAudience: "marketers",
      genre: "commercial",
      aspectRatio: "16:9"
    }
  }
];

/**
 * Example user inputs for testing the parser
 */
export const exampleUserInputs = [
  "A guy with a dog walking in the park",
  "Product launch presentation for a new smartphone", 
  "Character meeting their best friend after years",
  "Architect showing building design to client",
  "Animation sequence of a cat chasing a mouse",
  "Two people having coffee and talking",
  "Robot helping an elderly person with groceries",
  "Child discovering a magical forest",
  "Business meeting about quarterly results",
  "Superhero saving a cat from a tree"
];

/**
 * Get a random mock project for testing
 */
export function getRandomMockProject(): StoryboardProject {
  return mockStoryboardProjects[Math.floor(Math.random() * mockStoryboardProjects.length)];
}

/**
 * Get a random example input for testing
 */
export function getRandomExampleInput(): string {
  return exampleUserInputs[Math.floor(Math.random() * exampleUserInputs.length)];
}