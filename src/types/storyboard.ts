export enum StoryboardStyle {
  ROUGH_SKETCH = "rough_sketch",
  PENCIL_DRAWING = "pencil_drawing",
  CLEAN_LINES = "clean_lines",
  CONCEPT_ART = "concept_art",
  COMIC_STYLE = "comic_style"
}

export enum ProjectType {
  STORYBOARD = "storyboard",
  ARCHITECTURAL = "architectural",
  MINIWORLD = "miniworld"
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

// Generation quality tiers for storyboard panels
export enum GenerationQuality {
  STANDARD = "standard", // Gama baja - Stable Diffusion SDXL
  STANDARD_PLUS = "standard_plus", // Gama media - NanoBanana
  HIGH = "high"          // Gama alta - Seeddream 4
}

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
    // Character type (detected by AI or manually set)
    characterType?: 'human' | 'creature' | 'robot' | 'animal' | 'alien' | 'hybrid' | 'other';

    // Universal fields (apply to all character types)
    age?: string;
    gender?: string;
    height?: string;
    build?: string;
    clothing?: string;
    distinctiveFeatures?: string[];
    basedOn?: string; // Real or fictional character this design is based on

    // HUMAN-SPECIFIC FIELDS (only for characterType === 'human')
    hair?: string;
    faceShape?: string;
    eyeShape?: string;
    eyeColor?: string;
    eyebrows?: string;
    nose?: string;
    mouth?: string;
    jawline?: string;
    cheekbones?: string;
    shoulderWidth?: string;
    posture?: string;
    skinTone?: string;
    defaultExpression?: string;

    // NON-HUMAN SPECIFIC FIELDS (for creatures, robots, animals, aliens, etc.)
    species?: string; // e.g., "dragon", "wolf", "android", "alien being"
    bodyType?: string; // e.g., "quadruped", "bipedal", "serpentine", "humanoid"
    texture?: string; // e.g., "scales", "fur", "metallic plating", "smooth skin"
    features?: string[]; // e.g., ["wings", "horns", "tail", "claws"]
    coloration?: string; // e.g., "crimson scales with gold accents"
    size?: string; // e.g., "massive", "small", "human-sized"
  };
  personality?: string[];
  role: "protagonist" | "antagonist" | "supporting" | "background";
  referenceImage?: string; // Base64 or URI of reference image
  useReferenceInPrompt?: boolean; // Whether to use reference image in generation
  referenceMode?: "description" | "visual"; // How to use reference: text description or img2img
  imageStrength?: number; // For img2img mode: 0-1 (default 0.35)
  aiGeneratedDescription?: string; // AI-generated visual description from reference image
  portraitImage?: string; // Generated storyboard-style character portrait (Base64)
  portraitDescription?: string; // AI description of the portrait (canonical, optimized for consistency)
  isGeneratingPortrait?: boolean; // Whether portrait is currently being generated

  // Visual Identity Preservation (Consistent Character)
  useVisualIdentity?: boolean; // Use Consistent Character to preserve visual identity from reference image
  portraitSeed?: number; // Seed used for portrait generation (for reproducibility)
  portraitVersionId?: string; // Model version ID used for generation
  portraitEngine?: string; // Engine used: "consistent-character" or "stable-diffusion"
}

export interface Location {
  id: string;
  name: string;
  description: string;
  type: "interior" | "exterior" | "mixed";

  // SYSTEM OF FILLS - Main method for describing locations
  details: {
    // Location type (always required)
    locationType?: 'natural' | 'urban' | 'indoor' | 'fantasy' | 'sci-fi' | 'historical' | 'other';

    // Real vs fictional location
    isRealPlace?: boolean; // User can mark manually

    // FIELDS FOR REAL PLACES (manual fill)
    realPlaceInfo?: {
      city?: string;              // e.g., "Paris"
      country?: string;           // e.g., "France"
      region?: string;            // e.g., "Île-de-France"
      specificLocation?: string;  // e.g., "Eiffel Tower"
      landmark?: string;          // e.g., "Iconic iron tower"
      knownFor?: string;          // e.g., "Symbol of Paris, built in 1889"
    };

    // UNIVERSAL FIELDS (manual fill or auto-filled by AI)
    setting?: string;        // Forest, city, beach, space station, medieval castle
    timeOfDay?: 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'night';
    weather?: string;        // Sunny, rainy, foggy, stormy, clear, overcast
    lighting?: string;       // Natural, artificial, dim, bright, dramatic, soft
    atmosphere?: string;     // Peaceful, tense, mysterious, chaotic, romantic, eerie

    // VISUAL DETAILS (manual fill or auto-filled)
    architecture?: string;   // Gothic, modern, rustic, futuristic, Victorian, brutalist
    terrain?: string;        // Flat, hilly, mountainous, underwater, floating, rocky
    vegetation?: string;     // Dense forest, sparse trees, desert, jungle, none
    prominentFeatures?: string[]; // ["fountain", "statue", "bridge", "neon signs"]
    colorPalette?: string;   // Warm tones, cool blues, monochrome, vibrant, muted

    // CONTEXT (manual fill)
    scale?: 'intimate' | 'medium' | 'vast' | 'epic';
    condition?: string;      // Well-maintained, abandoned, ruins, pristine, decaying
    crowdLevel?: 'empty' | 'sparse' | 'moderate' | 'crowded';
    soundscape?: string;     // Silent, bustling, echoing, nature sounds, mechanical hum
    culturalContext?: string; // Western, Eastern, futuristic, tribal, medieval
  };

  // REFERENCE IMAGES (OPTIONAL - only for auto-filling)
  referenceImage?: string;      // Base64 or URI - OPTIONAL
  useReferenceInPrompt?: boolean;
  referenceMode?: "description" | "visual";
  imageStrength?: number;

  // AI GENERATED DESCRIPTIONS (only if image is used)
  aiGeneratedDescription?: string;  // Only if image is uploaded
  conceptImage?: string;            // Generated concept art (optional)
  conceptDescription?: string;      // Description of concept (optional)
  isGeneratingConcept?: boolean;    // Whether concept is being generated
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
  locations: string[]; // Location IDs present in this panel
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
  originalImageUrl?: string; // Saved before AI editing for undo
  isGenerating: boolean;
  isEditing?: boolean; // True when AI editing is in progress
  lastGenerated?: Date;
  lastEdited?: Date; // When AI edit was last applied
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
  locations: Location[]; // Location library for this project
  scenes: Scene[];
  panels: StoryboardPanel[];
  style: StoryboardStyle;
  createdAt: Date;
  updatedAt: Date;
  thumbnailUrl?: string; // URL of first generated panel image
  tags?: string[]; // User-defined tags for organization
  isFavorite?: boolean; // Star/favorite status
  lastOpenedAt?: Date; // Track when project was last opened
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
  generationQuality: GenerationQuality; // Gama baja (Stable Diffusion) o Gama alta (Seeddream 4)
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
