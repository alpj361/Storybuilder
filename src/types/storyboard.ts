export enum StoryboardStyle {
  ROUGH_SKETCH = "rough_sketch",
  PENCIL_DRAWING = "pencil_drawing",
  CLEAN_LINES = "clean_lines",
  CONCEPT_ART = "concept_art",
  COMIC_STYLE = "comic_style"
}

export enum ProjectType {
  STORYBOARD = "storyboard",
  ARCHITECTURAL = "architectural"
}

export type ArchitecturalProjectKind = "detalles" | "planos" | "prototipos";

export enum ArchitecturalViewType {
  SECTION = "section",
  PLAN = "plan",
  ELEVATION = "elevation",
  DETAIL = "detail",
  ISOMETRIC = "isometric",
  AXONOMETRIC = "axonometric",
  EXPLODED = "exploded",
  LEGEND = "legend"
}

export enum ArchitecturalDetailLevel {
  OVERVIEW = "overview",
  REINFORCEMENT = "reinforcement",
  CONNECTION = "connection",
  NOTES = "notes",
  EXPLODED = "exploded",
  LEGEND = "legend",
  PLAN = "plan",
  SECTION = "section",
  ELEVATION = "elevation",
  SITE = "site",
  ROOF = "roof",
  PROGRAM = "program",
  MASSING = "massing",
  FACADE = "facade",
  STRUCTURE = "structure",
  CIRCULATION = "circulation",
  DIAGRAM = "diagram"
}

export type UnitSystem = "metric" | "imperial";

export interface ArchitecturalMetadata {
  unitSystem: UnitSystem;
  primaryView: ArchitecturalViewType;
  secondaryView?: ArchitecturalViewType;
  scale: string;
  standards: string[];
  drawingStyle: string;
  components: string[];
  materials: string[];
  dimensions: string[];
  annotations: string[];
  reinforcementNotes?: string[];
  generalNotes?: string[];
  detailLevels?: ArchitecturalDetailLevel[];
  projectKind?: ArchitecturalProjectKind;
  // Planos-specific
  levels?: string[];
  grids?: string[];
  viewSet?: ArchitecturalViewType[];
  sheetTitle?: string;
  sheetNumber?: string;
  // Prototipo-specific
  buildingType?: string;
  floors?: number;
  footprint?: string;
  orientation?: string;
  programItems?: string[];
  diagramLayers?: string[];
  conceptNotes?: string[];
}

export enum CompositionType {
  EXTREME_WIDE = "extreme_wide",
  WIDE_SHOT = "wide_shot", 
  MEDIUM_SHOT = "medium_shot",
  CLOSE_UP = "close_up",
  EXTREME_CLOSE_UP = "extreme_close_up",
  OVER_SHOULDER = "over_shoulder",
  BIRD_EYE = "bird_eye",
  WORM_EYE = "worm_eye"
}

export enum PanelType {
  ESTABLISHING = "establishing",
  CHARACTER_INTRO = "character_intro", 
  ACTION = "action",
  DIALOGUE = "dialogue",
  REACTION = "reaction",
  TRANSITION = "transition",
  RESOLUTION = "resolution"
}

export interface Character {
  id: string;
  name: string;
  description: string;
  appearance: {
    age?: string;
    gender?: string;
    height?: string;
    build?: string;
    hair?: string;
    clothing?: string;
    distinctiveFeatures?: string[];
  };
  personality?: string[];
  role: "protagonist" | "antagonist" | "supporting" | "background";
  referenceImage?: string; // Base64 or URI of reference image
  useReferenceInPrompt?: boolean; // Whether to use reference image in generation
}

export interface Scene {
  id: string;
  name: string;
  location: string;
  timeOfDay: "dawn" | "morning" | "noon" | "afternoon" | "evening" | "night" | "unknown";
  weather?: string;
  lighting: string;
  mood: string;
  environment: string;
  props?: string[];
}

export interface StoryboardPrompt {
  id: string;
  panelNumber: number;
  panelType: PanelType;
  composition: CompositionType;
  sceneDescription: string;
  characters: string[]; // Character IDs present in this panel
  sceneId: string;
  action: string;
  dialogue?: string;
  cameraAngle?: string;
  lighting?: string;
  mood?: string;
  visualNotes?: string;
  generatedPrompt: string; // Final AI-ready prompt
  style: StoryboardStyle;
  // Architectural extensions
  viewType?: ArchitecturalViewType;
  detailLevel?: ArchitecturalDetailLevel;
  components?: string[];
  materials?: string[];
  dimensions?: string[];
  annotations?: string[];
  scale?: string;
  unitSystem?: UnitSystem;
  standards?: string[];
  drawingConventions?: string[];
  legendItems?: string[];
  metadataNotes?: string[];
  diagramLayers?: string[];
  planLevel?: string;
}

export interface StoryboardPanel {
  id: string;
  panelNumber: number;
  prompt: StoryboardPrompt;
  generatedImageUrl?: string;
  isGenerating: boolean;
  lastGenerated?: Date;
  userNotes?: string;
  isEdited: boolean;
  detailLevel?: ArchitecturalDetailLevel;
}

export interface StoryboardProject {
  id: string;
  title: string;
  description: string;
  userInput: string; // Original natural language input
  characters: Character[];
  scenes: Scene[];
  panels: StoryboardPanel[];
  style: StoryboardStyle;
  createdAt: Date;
  updatedAt: Date;
  isComplete: boolean;
  metadata: {
    targetAudience: "animators" | "filmmakers" | "marketers" | "architects" | "general";
    genre?: string;
    duration?: number; // estimated seconds if animated
    aspectRatio: "1:1" | "16:9" | "4:3" | "3:2";
  };
  projectType?: ProjectType;
  architecturalMetadata?: ArchitecturalMetadata;
  architecturalProjectKind?: ArchitecturalProjectKind;
}

export interface GenerationOptions {
  style: StoryboardStyle;
  composition: CompositionType;
  quality: "low" | "medium" | "high";
  size: "1024x1024" | "1536x1024" | "1024x1536";
  enhancePrompt: boolean;
  maintainCharacterConsistency: boolean;
}

export interface PromptGenerationResult {
  success: boolean;
  project: StoryboardProject;
  errors?: string[];
  warnings?: string[];
  processingTime: number;
}

export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100
  issues: {
    type: "error" | "warning" | "suggestion";
    message: string;
    panelNumber?: number;
  }[];
  suggestions: string[];
}
