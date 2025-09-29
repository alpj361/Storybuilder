import {
  ArchitecturalDetailLevel,
  ArchitecturalMetadata,
  ArchitecturalProjectKind,
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

function unique(...lists: (string[] | undefined)[]): string[] {
  const set = new Set<string>();
  lists.forEach(list => {
    list?.forEach(item => {
      const normalized = item.trim();
      if (normalized) set.add(normalized);
    });
  });
  return Array.from(set);
}

export async function parseArchitecturalInput(
  input: string,
  kind: ArchitecturalProjectKind = "detalles"
): Promise<PromptGenerationResult> {
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
    const defaults = getDefaultArchitecturalMetadata(kind);
    const view = detectPrimaryView(normalized, kind) || defaults.primaryView;
    const secondaryView = defaults.secondaryView || (view === ArchitecturalViewType.SECTION ? ArchitecturalViewType.DETAIL : ArchitecturalViewType.SECTION);

    const levelsDetected = kind === "planos" ? detectPlanLevels(input) : [];
    const gridsDetected = kind === "planos" ? detectGrids(input) : [];
    const viewSetDetected = kind === "planos" ? detectViewSet(input) : [];

    const programDetected = kind === "prototipos" ? detectProgramItems(input) : [];
    const diagramLayersDetected = kind === "prototipos" ? detectDiagramLayers(input) : [];
    const conceptNotesDetected = kind === "prototipos" ? detectConceptNotes(input) : [];

    const buildingType = kind === "prototipos" ? detectBuildingType(normalized) || defaults.buildingType : defaults.buildingType;
    const floors = kind === "prototipos" ? detectFloors(normalized) || defaults.floors : defaults.floors;
    const footprint = kind === "prototipos" ? detectFootprint(input) || defaults.footprint : defaults.footprint;
    const orientation = kind === "prototipos" ? detectOrientation(input) || defaults.orientation : defaults.orientation;

    const planNotes = kind === "planos" ? detectPlanNotes(input) : [];

    const metadata: ArchitecturalMetadata = {
      ...defaults,
      projectKind: kind,
      unitSystem,
      primaryView: view,
      secondaryView,
      scale,
      standards: standards.length ? standards.map(s => s.toUpperCase()) : defaults.standards,
      drawingStyle: defaults.drawingStyle,
      components: components.length ? components : defaults.components,
      materials: materials.length ? materials : defaults.materials,
      dimensions: dimensions.length ? dimensions : defaults.dimensions,
      annotations: defaults.annotations,
      reinforcementNotes: kind === "detalles" ? (reinforcement.length ? reinforcement : defaults.reinforcementNotes) : undefined,
      generalNotes: unique([...(defaults.generalNotes || []), `all dimensions in ${(unitSystem === "metric" ? "millimeters" : "inches")}`], planNotes),
      detailLevels: buildDetailLevels(kind, panelCount, defaults),
      levels: unique(defaults.levels, levelsDetected),
      grids: unique(defaults.grids, gridsDetected),
      viewSet: viewSetDetected.length ? viewSetDetected : defaults.viewSet,
      sheetTitle: kind === "planos" ? detectSheetTitle(input) || defaults.sheetTitle : defaults.sheetTitle,
      sheetNumber: kind === "planos" ? detectSheetNumber(input) || defaults.sheetNumber : defaults.sheetNumber,
      buildingType,
      floors,
      footprint,
      orientation,
      programItems: unique(defaults.programItems, programDetected),
      diagramLayers: unique(defaults.diagramLayers, diagramLayersDetected),
      conceptNotes: unique(defaults.conceptNotes || [], conceptNotesDetected)
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

    const panels = generatePanelSequence(input, metadata, panelCount, scene, kind);

    const project: StoryboardProject = {
      id: uuidv4(),
      title: generateTitle(input, metadata.primaryView, kind),
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
      architecturalMetadata: metadata,
      architecturalProjectKind: kind
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

function detectPrimaryView(input: string, kind: ArchitecturalProjectKind): ArchitecturalViewType {
  if (kind === "planos") {
    if (/section/i.test(input)) return ArchitecturalViewType.SECTION;
    if (/elevation/i.test(input)) return ArchitecturalViewType.ELEVATION;
    return ArchitecturalViewType.PLAN;
  }
  if (kind === "prototipos") {
    if (/axon|isometric|massing/i.test(input)) return ArchitecturalViewType.AXONOMETRIC;
    if (/diagram/i.test(input)) return ArchitecturalViewType.DETAIL;
    return ArchitecturalViewType.AXONOMETRIC;
  }

  if (/elevation/i.test(input)) return ArchitecturalViewType.ELEVATION;
  if (/plan/i.test(input)) return ArchitecturalViewType.PLAN;
  if (/axonometric|isometric/i.test(input)) return ArchitecturalViewType.AXONOMETRIC;
  if (/exploded/i.test(input)) return ArchitecturalViewType.EXPLODED;
  if (/legend|notes/i.test(input)) return ArchitecturalViewType.LEGEND;
  if (/detail|connection|joint/i.test(input)) return ArchitecturalViewType.DETAIL;
  return ArchitecturalViewType.SECTION;
}

function buildDetailLevels(
  kind: ArchitecturalProjectKind,
  count: number,
  defaults: ArchitecturalMetadata
): ArchitecturalDetailLevel[] {
  if (kind === "planos") {
    const base: ArchitecturalDetailLevel[] = [
      ArchitecturalDetailLevel.PLAN,
      ArchitecturalDetailLevel.SECTION,
      ArchitecturalDetailLevel.ELEVATION,
      ArchitecturalDetailLevel.LEGEND,
      ArchitecturalDetailLevel.ROOF
    ];
    if (count > 4) base.unshift(ArchitecturalDetailLevel.SITE);
    return base.slice(0, Math.max(1, count));
  }

  if (kind === "prototipos") {
    const base: ArchitecturalDetailLevel[] = [
      ArchitecturalDetailLevel.MASSING,
      ArchitecturalDetailLevel.PROGRAM,
      ArchitecturalDetailLevel.FACADE,
      ArchitecturalDetailLevel.STRUCTURE,
      ArchitecturalDetailLevel.CIRCULATION,
      ArchitecturalDetailLevel.DIAGRAM
    ];
    return base.slice(0, Math.max(1, count));
  }

  const base: ArchitecturalDetailLevel[] = defaults.detailLevels?.length
    ? [...defaults.detailLevels]
    : [ArchitecturalDetailLevel.OVERVIEW, ArchitecturalDetailLevel.REINFORCEMENT];

  const sequence: ArchitecturalDetailLevel[] = [];
  for (let i = 0; i < count; i++) {
    if (i < base.length) {
      sequence.push(base[i]);
    } else {
      sequence.push(base[base.length - 1]);
    }
  }
  return sequence;
}

function generatePanelSequence(
  input: string,
  metadata: ArchitecturalMetadata,
  count: number,
  scene: Scene,
  kind: ArchitecturalProjectKind
): StoryboardPanel[] {
  const panels: StoryboardPanel[] = [];
  const detailLevels = buildDetailLevels(kind, count, metadata);
  const levels = metadata.levels || [];

  for (let index = 0; index < count; index++) {
    const panelNumber = index + 1;
    const detailLevel = detailLevels[Math.min(index, detailLevels.length - 1)];
    const viewType = selectViewType(detailLevel, metadata, index, kind);
    const planLevel = detailLevel === ArchitecturalDetailLevel.PLAN && levels.length
      ? levels[Math.min(index, levels.length - 1)]
      : undefined;

    const componentsForPanel = (() => {
      if (detailLevel === ArchitecturalDetailLevel.PROGRAM && metadata.programItems?.length) {
        return metadata.programItems;
      }
      if (detailLevel === ArchitecturalDetailLevel.MASSING && metadata.components?.length) {
        return metadata.components;
      }
      return metadata.components;
    })();

    const annotationsForPanel = (() => {
      const base = [...(metadata.annotations || [])];
      if (detailLevel === ArchitecturalDetailLevel.CIRCULATION) {
        base.push("circulation arrows", "egress paths");
      }
      if (detailLevel === ArchitecturalDetailLevel.PROGRAM) {
        base.push("program labels", "area callouts");
      }
      if (detailLevel === ArchitecturalDetailLevel.FACADE) {
        base.push("facade pattern notes");
      }
      return unique(base);
    })();

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
      annotations: annotationsForPanel,
      unitSystem: metadata.unitSystem,
      scale: metadata.scale,
      standards: metadata.standards,
      drawingConventions: ["orthographic projection", "dimension annotations", "leader labels"],
      legendItems: detailLevel === ArchitecturalDetailLevel.NOTES || detailLevel === ArchitecturalDetailLevel.LEGEND
        ? ["symbol legend", "material legend"]
        : undefined,
      metadataNotes: detailLevel === ArchitecturalDetailLevel.REINFORCEMENT
        ? metadata.reinforcementNotes
        : metadata.generalNotes,
      planLevel,
      diagramLayers: detailLevel === ArchitecturalDetailLevel.DIAGRAM || detailLevel === ArchitecturalDetailLevel.CIRCULATION || detailLevel === ArchitecturalDetailLevel.PROGRAM
        ? metadata.diagramLayers
        : undefined
    };

    if (componentsForPanel?.length) {
      prompt.components = componentsForPanel;
    }

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
  index: number,
  kind: ArchitecturalProjectKind
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
    case ArchitecturalDetailLevel.PLAN:
      return ArchitecturalViewType.PLAN;
    case ArchitecturalDetailLevel.SECTION:
      return ArchitecturalViewType.SECTION;
    case ArchitecturalDetailLevel.ELEVATION:
      return ArchitecturalViewType.ELEVATION;
    case ArchitecturalDetailLevel.SITE:
      return ArchitecturalViewType.PLAN;
    case ArchitecturalDetailLevel.ROOF:
      return ArchitecturalViewType.PLAN;
    case ArchitecturalDetailLevel.MASSING:
      return ArchitecturalViewType.AXONOMETRIC;
    case ArchitecturalDetailLevel.PROGRAM:
      return ArchitecturalViewType.PLAN;
    case ArchitecturalDetailLevel.FACADE:
      return ArchitecturalViewType.ELEVATION;
    case ArchitecturalDetailLevel.STRUCTURE:
      return ArchitecturalViewType.AXONOMETRIC;
    case ArchitecturalDetailLevel.CIRCULATION:
      return ArchitecturalViewType.PLAN;
    case ArchitecturalDetailLevel.DIAGRAM:
      return kind === "prototipos" ? ArchitecturalViewType.AXONOMETRIC : ArchitecturalViewType.DETAIL;
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
    case ArchitecturalDetailLevel.LEGEND:
      return `Legend panel listing symbols, hatch patterns, and abbreviations`;
    case ArchitecturalDetailLevel.PLAN:
      return `Floor plan with grids, room tags, and key dimensions`;
    case ArchitecturalDetailLevel.SECTION:
      return `Section cut indicating levels, structure, and heights`;
    case ArchitecturalDetailLevel.ELEVATION:
      return `Elevation highlighting facade composition and datum lines`;
    case ArchitecturalDetailLevel.SITE:
      return `Site plan showing property boundaries, context, and orientation`;
    case ArchitecturalDetailLevel.ROOF:
      return `Roof plan depicting slopes, drains, and roof equipment`;
    case ArchitecturalDetailLevel.MASSING:
      return `Massing diagram illustrating building volumes and hierarchy`;
    case ArchitecturalDetailLevel.PROGRAM:
      return `Program plan depicting functional zones with labels and area tags`;
    case ArchitecturalDetailLevel.FACADE:
      return `Facade concept view showcasing pattern, aperture rhythm, and shading`;
    case ArchitecturalDetailLevel.STRUCTURE:
      return `Structural diagram indicating primary load paths and structural elements`;
    case ArchitecturalDetailLevel.CIRCULATION:
      return `Circulation diagram showing primary routes, entries, and vertical cores`;
    case ArchitecturalDetailLevel.DIAGRAM:
      return `Conceptual diagram overlay summarizing design strategy`;
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
    case ArchitecturalDetailLevel.LEGEND:
      return "Document legend, symbols, and abbreviations";
    case ArchitecturalDetailLevel.PLAN:
      return "Illustrate plan with grid, dimensions, and room labels";
    case ArchitecturalDetailLevel.SECTION:
      return "Show section cut with level markers and structural information";
    case ArchitecturalDetailLevel.ELEVATION:
      return "Present facade alignment, openings, and elevation notes";
    case ArchitecturalDetailLevel.SITE:
      return "Define site context, boundaries, setbacks, and orientation";
    case ArchitecturalDetailLevel.ROOF:
      return "Document roof slopes, drainage, and equipment placement";
    case ArchitecturalDetailLevel.MASSING:
      return "Communicate volumetric hierarchy and massing relationships";
    case ArchitecturalDetailLevel.PROGRAM:
      return "Map program zones with labels and area allocations";
    case ArchitecturalDetailLevel.FACADE:
      return "Describe facade concept, pattern, and shading elements";
    case ArchitecturalDetailLevel.STRUCTURE:
      return "Highlight structural systems and load paths";
    case ArchitecturalDetailLevel.CIRCULATION:
      return "Illustrate circulation routes, cores, and access points";
    case ArchitecturalDetailLevel.DIAGRAM:
      return "Summarize design strategy with diagram overlays";
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

function generateTitle(input: string, view: ArchitecturalViewType, kind: ArchitecturalProjectKind): string {
  const baseWords = input.split(" ").filter(Boolean).slice(0, 6).join(" ");
  const base = capitalizeWords(baseWords || kind.toUpperCase());
  if (kind === "planos") {
    return `${base} Plan Set`.trim();
  }
  if (kind === "prototipos") {
    return `${base} Prototype`.trim();
  }
  const suffix = view === ArchitecturalViewType.SECTION ? "Section" : view === ArchitecturalViewType.PLAN ? "Plan" : "Detail";
  return `${base} ${suffix}`.trim();
}

function capitalizeWords(text: string): string {
  return text
    .split(" ")
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function detectPlanLevels(input: string): string[] {
  const levels = new Set<string>();
  const levelRegex = /(ground|first|second|third|fourth|roof|basement|mezzanine)\s*(floor|level)/gi;
  let match: RegExpExecArray | null;
  while ((match = levelRegex.exec(input)) !== null) {
    const label = `${capitalizeWords(match[1])} ${match[2].toLowerCase() === "floor" ? "Floor" : "Level"}`;
    levels.add(label);
  }

  const explicitRegex = /(level|floor)\s*(\d+[a-z]?)/gi;
  while ((match = explicitRegex.exec(input)) !== null) {
    levels.add(`${capitalizeWords(match[1])} ${match[2].toUpperCase()}`);
  }

  return levels.size ? Array.from(levels) : [];
}

function detectGrids(input: string): string[] {
  const grids = new Set<string>();
  const gridRegex = /grid\s*([A-Z]+(?:-[A-Z]+)?|\d+(?:-\d+)?)/gi;
  let match: RegExpExecArray | null;
  while ((match = gridRegex.exec(input)) !== null) {
    grids.add(`Grid ${match[1].toUpperCase()}`);
  }
  return Array.from(grids);
}

function detectViewSet(input: string): ArchitecturalViewType[] {
  const views = new Set<ArchitecturalViewType>();
  if (/site\s*plan/i.test(input)) views.add(ArchitecturalViewType.PLAN);
  if (/floor\s*plan|plan\s*view/i.test(input)) views.add(ArchitecturalViewType.PLAN);
  if (/section/i.test(input)) views.add(ArchitecturalViewType.SECTION);
  if (/elevation/i.test(input)) views.add(ArchitecturalViewType.ELEVATION);
  if (/roof\s*plan/i.test(input)) views.add(ArchitecturalViewType.PLAN);
  if (/legend/i.test(input)) views.add(ArchitecturalViewType.LEGEND);
  return Array.from(views);
}

function detectProgramItems(input: string): string[] {
  const PROGRAM_KEYWORDS = [
    "retail",
    "office",
    "residential",
    "lobby",
    "parking",
    "amenity",
    "public",
    "private",
    "service",
    "core",
    "green",
    "terrace",
    "restaurant",
    "cafe",
    "hotel"
  ];
  return PROGRAM_KEYWORDS
    .filter(keyword => input.includes(keyword))
    .map(keyword => capitalizeWords(keyword.replace(/-/g, " ")));
}

function detectBuildingType(input: string): string | undefined {
  if (/mixed[-\s]?use/.test(input)) return "mixed-use";
  if (/residential/.test(input)) return "residential";
  if (/office/.test(input)) return "office";
  if (/educational|school|university/.test(input)) return "educational";
  if (/health|hospital|clinic/.test(input)) return "healthcare";
  return undefined;
}

function detectFloors(input: string): number | undefined {
  const match = input.match(/(\d+)\s*(floors?|stories|storeys|levels)/i);
  if (!match) return undefined;
  const value = parseInt(match[1], 10);
  return Number.isFinite(value) ? value : undefined;
}

function detectFootprint(input: string): string | undefined {
  const match = input.match(/footprint\s*(?:of)?\s*(\d+[\.,]?\d*\s*(?:m|meters|metres|ft|feet)(?:\s*x\s*\d+[\.,]?\d*\s*(?:m|meters|metres|ft|feet))?)/i);
  if (match) return match[1];
  return undefined;
}

function detectOrientation(input: string): string | undefined {
  if (/north\s*(?:arrow)?\s*(?:at)?\s*(?:top|up)/i.test(input)) return "north-up";
  if (/east\s*-\s*west/i.test(input)) return "east-west";
  if (/north\s*-\s*south/i.test(input)) return "north-south";
  return undefined;
}

function detectDiagramLayers(input: string): string[] {
  const layers: string[] = [];
  if (/program\s*diagram/i.test(input)) layers.push("program");
  if (/structure\s*diagram/i.test(input)) layers.push("structure");
  if (/circulation\s*diagram/i.test(input)) layers.push("circulation");
  if (/environmental|climate/i.test(input)) layers.push("environmental");
  return layers;
}

function detectConceptNotes(input: string): string[] {
  const notes: string[] = [];
  if (/concept/i.test(input)) notes.push("highlight concept strategy");
  if (/sustain/i.test(input)) notes.push("emphasize sustainability measures");
  if (/public/i.test(input)) notes.push("clarify public realm");
  return notes;
}

function detectPlanNotes(input: string): string[] {
  const notes: string[] = [];
  if (/verify on site/i.test(input)) notes.push("verify on site");
  if (/contractor/i.test(input)) notes.push("contractor to confirm dimensions");
  return notes;
}

function detectSheetTitle(input: string): string | undefined {
  const match = input.match(/sheet\s*title\s*:?\s*([\w\s]+)/i);
  return match ? match[1].trim() : undefined;
}

function detectSheetNumber(input: string): string | undefined {
  const match = input.match(/(a|s|p|m)-\d{2,3}/i);
  return match ? match[0].toUpperCase() : undefined;
}
