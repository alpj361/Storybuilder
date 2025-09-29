import {
  ArchitecturalDetailLevel,
  ArchitecturalMetadata,
  ArchitecturalViewType,
  CompositionType,
  PanelType,
  ProjectType,
  Scene,
  StoryboardPanel,
  StoryboardProject,
  StoryboardPrompt,
  StoryboardStyle,
  UnitSystem
} from "../types/storyboard";
import { PromptGenerationResult } from "../types/storyboard";
import { v4 as uuidv4 } from "uuid";
import { getDefaultArchitecturalMetadata } from "../templates/architecturalTemplates";

const PANEL_COUNT_REGEX = /(\d{1,2})\s*(?:panels?|frames?)/i;
const DIMENSION_REGEX = /(\d+[\.,]?\d*)\s?[×xby\-*]\s?(\d+[\.,]?\d*)\s?(mm|cm|m|in|inch|inches)?/gi;
const SIMPLE_DIMENSION_REGEX = /(\d+[\.,]?\d*)\s?(mm|cm|m|in|inch|inches)/gi;
const SCALE_REGEX = /(1\s*:\s*\d+)/i;
const UNIT_REGEX = /(mm|millimeter|millimetre|cm|centimeter|metre|meter|inch|inches|ft|feet)/i;
const STANDARD_REGEX = /(aci\s*318|aci|eurocode|aisc|iso|bs\s*8110)/i;
const BAR_REGEX = /(ø|phi|#)?\s?\d{1,2}\s?(@|at)\s?\d{2,3}/gi;

const COMPONENT_KEYWORDS: Record<string, string> = {
  beam: "reinforced concrete beam",
  column: "reinforced concrete column",
  slab: "reinforced concrete slab",
  footing: "footing",
  foundation: "foundation",
  rebar: "reinforcing steel",
  reinforcement: "reinforcing steel",
  stirrup: "stirrups",
  shear: "shear reinforcement",
  plate: "steel plate",
  bolt: "anchor bolts",
  anchor: "anchor bolts",
  weld: "weld",
  joint: "joint",
  gusset: "gusset plate",
  bracket: "bracket",
  truss: "truss"
};

const MATERIAL_KEYWORDS: Record<string, string> = {
  concrete: "concrete",
  steel: "steel",
  timber: "timber",
  wood: "wood",
  stainless: "stainless steel",
  composite: "composite material"
};

const REINFORCEMENT_NOTES = [
  "show rebar callouts",
  "label spacing and sizes",
  "indicate concrete cover"
];

export async function parseArchitecturalInput(input: string): Promise<PromptGenerationResult> {
  const startTime = Date.now();

  try {
    const normalized = input.toLowerCase();
    const panelCount = detectPanelCount(normalized);
    const unitSystem = detectUnitSystem(normalized);
    const scale = detectScale(normalized);
    const standards = detectStandards(normalized);
    const components = extractMatches(normalized, COMPONENT_KEYWORDS);
    const materials = extractMatches(normalized, MATERIAL_KEYWORDS);
    const dimensions = extractDimensions(input);
    const reinforcement = extractReinforcement(input);
    const view = detectPrimaryView(normalized);
    const secondaryView = view === ArchitecturalViewType.SECTION ? ArchitecturalViewType.DETAIL : ArchitecturalViewType.SECTION;

    const metadata: ArchitecturalMetadata = {
      ...getDefaultArchitecturalMetadata(),
      unitSystem,
      primaryView: view,
      secondaryView,
      scale,
      standards: standards.length ? standards : ["ACI 318"],
      drawingStyle: "CAD drafting, orthographic line art, black and white",
      components: components.length ? components : ["reinforced concrete beam", "reinforcing steel"],
      materials: materials.length ? materials : ["concrete", "steel"],
      dimensions: dimensions.length ? dimensions : ["overall width and depth"],
      annotations: ["dimension strings", "leader annotations", "labelled components"],
      reinforcementNotes: reinforcement.length ? reinforcement : REINFORCEMENT_NOTES,
      generalNotes: ["all dimensions in" + (unitSystem === "metric" ? " millimeters" : " inches"), "comply with structural code"],
      detailLevels: buildDetailLevels(panelCount)
    };

    const scene: Scene = {
      id: uuidv4(),
      name: "Technical Draft Space",
      location: "architectural drafting workspace",
      timeOfDay: "unknown",
      lighting: "neutral",
      mood: "technical",
      environment: "technical drawing workspace with CAD references"
    };

    const panels = generatePanelSequence(input, metadata, panelCount, scene);

    const project: StoryboardProject = {
      id: uuidv4(),
      title: generateTitle(input, metadata.primaryView),
      description: input,
      userInput: input,
      characters: [],
      scenes: [scene],
      panels,
      style: StoryboardStyle.CLEAN_LINES,
      createdAt: new Date(),
      updatedAt: new Date(),
      isComplete: true,
      metadata: {
        targetAudience: "architects",
        genre: "technical",
        aspectRatio: "4:3"
      },
      projectType: ProjectType.ARCHITECTURAL,
      architecturalMetadata: metadata
    };

    return {
      success: true,
      project,
      processingTime: Date.now() - startTime
    };
  } catch (error) {
    return {
      success: false,
      project: {} as StoryboardProject,
      errors: [error instanceof Error ? error.message : "Unknown architectural parsing error"],
      processingTime: Date.now() - startTime
    };
  }
}

function detectPanelCount(input: string): number {
  const match = input.match(PANEL_COUNT_REGEX);
  if (match) {
    const n = parseInt(match[1], 10);
    if (!Number.isNaN(n) && n > 0) return Math.min(Math.max(n, 1), 12);
  }
  return 4;
}

function detectUnitSystem(input: string): UnitSystem {
  if (/(inch|inches|ft|feet)/i.test(input)) return "imperial";
  return "metric";
}

function detectScale(input: string): string {
  const match = input.match(SCALE_REGEX);
  if (match) return match[1].replace(/\s+/g, "");
  return "1:20";
}

function detectStandards(input: string): string[] {
  const matches = input.match(new RegExp(STANDARD_REGEX, "gi")) || [];
  return Array.from(new Set(matches.map(m => m.toUpperCase())));
}

function extractMatches(input: string, dictionary: Record<string, string>): string[] {
  const found = new Set<string>();
  Object.entries(dictionary).forEach(([keyword, value]) => {
    if (input.includes(keyword)) {
      found.add(value);
    }
  });
  return Array.from(found);
}

function extractDimensions(input: string): string[] {
  const dims = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = DIMENSION_REGEX.exec(input)) !== null) {
    const [, a, b, unit] = match;
    dims.add(`${sanitizeNumber(a)} × ${sanitizeNumber(b)} ${normalizeUnit(unit)}`.trim());
  }

  while ((match = SIMPLE_DIMENSION_REGEX.exec(input)) !== null) {
    const [, value, unit] = match;
    dims.add(`${sanitizeNumber(value)} ${normalizeUnit(unit)}`.trim());
  }

  return Array.from(dims);
}

function extractReinforcement(input: string): string[] {
  const notes = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = BAR_REGEX.exec(input)) !== null) {
    notes.add(match[0].replace(/\s+/g, " ").trim());
  }
  if (/(stirrups|links)/i.test(input)) notes.add("include stirrups/links spacing");
  if (/(cover)/i.test(input)) notes.add("note concrete cover");
  return Array.from(notes);
}

function sanitizeNumber(value: string): string {
  return value.replace(/,/g, ".");
}

function normalizeUnit(unit?: string): string {
  if (!unit) return "";
  const lower = unit.toLowerCase();
  if (lower.startsWith("mm")) return "mm";
  if (lower.startsWith("cm")) return "cm";
  if (lower === "m" || lower.startsWith("met")) return "m";
  if (lower.startsWith("inch")) return "in";
  if (lower === "in") return "in";
  if (lower.startsWith("ft") || lower.startsWith("feet")) return "ft";
  return unit;
}

function detectPrimaryView(input: string): ArchitecturalViewType {
  if (/elevation/i.test(input)) return ArchitecturalViewType.ELEVATION;
  if (/plan/i.test(input)) return ArchitecturalViewType.PLAN;
  if (/axonometric|isometric/i.test(input)) return ArchitecturalViewType.AXONOMETRIC;
  if (/exploded/i.test(input)) return ArchitecturalViewType.EXPLODED;
  if (/legend|notes/i.test(input)) return ArchitecturalViewType.LEGEND;
  if (/detail|connection|joint/i.test(input)) return ArchitecturalViewType.DETAIL;
  return ArchitecturalViewType.SECTION;
}

function buildDetailLevels(count: number): ArchitecturalDetailLevel[] {
  const base: ArchitecturalDetailLevel[] = [ArchitecturalDetailLevel.OVERVIEW];
  if (count >= 2) base.push(ArchitecturalDetailLevel.REINFORCEMENT);
  if (count >= 3) base.push(ArchitecturalDetailLevel.CONNECTION);
  if (count >= 4) base.push(ArchitecturalDetailLevel.NOTES);
  if (count >= 5) base.push(ArchitecturalDetailLevel.EXPLODED);
  return base;
}

function generatePanelSequence(
  input: string,
  metadata: ArchitecturalMetadata,
  count: number,
  scene: Scene
): StoryboardPanel[] {
  const panels: StoryboardPanel[] = [];
  const detailLevels = buildDetailLevels(count);

  for (let index = 0; index < count; index++) {
    const panelNumber = index + 1;
    const detailLevel = detailLevels[Math.min(index, detailLevels.length - 1)];
    const viewType = selectViewType(detailLevel, metadata, index);

    const prompt: StoryboardPrompt = {
      id: uuidv4(),
      panelNumber,
      panelType: mapPanelType(detailLevel, panelNumber),
      composition: CompositionType.WIDE_SHOT,
      sceneDescription: buildSceneDescription(detailLevel, viewType, metadata),
      characters: [],
      sceneId: scene.id,
      action: buildAction(detailLevel),
      generatedPrompt: "",
      style: StoryboardStyle.CLEAN_LINES,
      viewType,
      detailLevel,
      components: metadata.components,
      materials: metadata.materials,
      dimensions: metadata.dimensions,
      annotations: metadata.annotations,
      unitSystem: metadata.unitSystem,
      scale: metadata.scale,
      standards: metadata.standards,
      drawingConventions: ["orthographic projection", "dimension annotations", "leader labels"],
      legendItems: detailLevel === ArchitecturalDetailLevel.NOTES ? ["symbol legend", "material legend"] : undefined,
      metadataNotes: detailLevel === ArchitecturalDetailLevel.REINFORCEMENT ? metadata.reinforcementNotes : metadata.generalNotes
    };

    const panel: StoryboardPanel = {
      id: uuidv4(),
      panelNumber,
      prompt,
      isGenerating: false,
      isEdited: false,
      detailLevel
    };

    panels.push(panel);
  }

  return panels;
}

function selectViewType(
  detailLevel: ArchitecturalDetailLevel,
  metadata: ArchitecturalMetadata,
  index: number
): ArchitecturalViewType {
  switch (detailLevel) {
    case ArchitecturalDetailLevel.OVERVIEW:
      return metadata.primaryView;
    case ArchitecturalDetailLevel.REINFORCEMENT:
      return metadata.primaryView === ArchitecturalViewType.PLAN
        ? ArchitecturalViewType.PLAN
        : metadata.secondaryView || ArchitecturalViewType.SECTION;
    case ArchitecturalDetailLevel.CONNECTION:
      return ArchitecturalViewType.DETAIL;
    case ArchitecturalDetailLevel.NOTES:
      return ArchitecturalViewType.LEGEND;
    case ArchitecturalDetailLevel.EXPLODED:
      return ArchitecturalViewType.EXPLODED;
    case ArchitecturalDetailLevel.LEGEND:
      return ArchitecturalViewType.LEGEND;
    default:
      return metadata.primaryView;
  }
}

function mapPanelType(detailLevel: ArchitecturalDetailLevel, panelNumber: number): PanelType {
  if (detailLevel === ArchitecturalDetailLevel.OVERVIEW) return PanelType.ESTABLISHING;
  if (detailLevel === ArchitecturalDetailLevel.NOTES || detailLevel === ArchitecturalDetailLevel.LEGEND) return PanelType.RESOLUTION;
  if (detailLevel === ArchitecturalDetailLevel.EXPLODED && panelNumber > 1) return PanelType.ACTION;
  return PanelType.ACTION;
}

function buildSceneDescription(
  detailLevel: ArchitecturalDetailLevel,
  viewType: ArchitecturalViewType,
  metadata: ArchitecturalMetadata
): string {
  switch (detailLevel) {
    case ArchitecturalDetailLevel.OVERVIEW:
      return `${viewTypeDescription(viewType)} showing overall geometry and key dimensions`;
    case ArchitecturalDetailLevel.REINFORCEMENT:
      return `${viewTypeDescription(viewType)} highlighting reinforcement layout, bar sizes, spacing, and cover`;
    case ArchitecturalDetailLevel.CONNECTION:
      return `Detail view of connection showing plates, anchors, bolts, weld symbols, and edge distances`;
    case ArchitecturalDetailLevel.NOTES:
      return `Legend and general notes summarizing materials, symbols, and annotation conventions`;
    case ArchitecturalDetailLevel.EXPLODED:
      return `Exploded axonometric view illustrating component assembly with numbered callouts`;
    default:
      return `${viewTypeDescription(viewType)} technical drawing`;
  }
}

function buildAction(detailLevel: ArchitecturalDetailLevel): string {
  switch (detailLevel) {
    case ArchitecturalDetailLevel.OVERVIEW:
      return "Present overall dimensions, reference grids, and section indicators";
    case ArchitecturalDetailLevel.REINFORCEMENT:
      return "Detail reinforcement bars, spacing, and cover annotations";
    case ArchitecturalDetailLevel.CONNECTION:
      return "Show connection components with dimension callouts and symbols";
    case ArchitecturalDetailLevel.NOTES:
      return "List legend items, material schedule, and general notes";
    case ArchitecturalDetailLevel.EXPLODED:
      return "Display exploded assembly with numbered parts and leader annotations";
    default:
      return "Provide technical drawing information";
  }
}

function viewTypeDescription(viewType: ArchitecturalViewType): string {
  switch (viewType) {
    case ArchitecturalViewType.SECTION:
      return "Section cut through element";
    case ArchitecturalViewType.PLAN:
      return "Plan view of element";
    case ArchitecturalViewType.ELEVATION:
      return "Elevation view";
    case ArchitecturalViewType.DETAIL:
      return "Enlarged detail view";
    case ArchitecturalViewType.ISOMETRIC:
    case ArchitecturalViewType.AXONOMETRIC:
      return "Axonometric projection";
    case ArchitecturalViewType.EXPLODED:
      return "Exploded axonometric view";
    case ArchitecturalViewType.LEGEND:
      return "Legend and notation panel";
    default:
      return "Technical view";
  }
}

function generateTitle(input: string, view: ArchitecturalViewType): string {
  const base = input.split(" ").slice(0, 6).join(" ");
  const suffix = view === ArchitecturalViewType.SECTION ? "Section" : view === ArchitecturalViewType.PLAN ? "Plan" : "Detail";
  return `${capitalizeWords(base)} ${suffix}`.trim();
}

function capitalizeWords(text: string): string {
  return text
    .split(" ")
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
