import {
  ArchitecturalDetailLevel,
  ArchitecturalMetadata,
  ArchitecturalProjectKind,
  ArchitecturalViewType,
  StoryboardPrompt,
  UnitSystem
} from "../types/storyboard";

const BASE_STYLE = "technical drawing, CAD line art, monochrome, high contrast, orthographic projection, precise line weights, blueprint aesthetic";
const BASE_EXCLUSIONS = "no people, no characters, no cinematic camera, no photorealism, no shading, no background scenery";

const DETAIL_FOCUS: Record<ArchitecturalDetailLevel, string> = {
  [ArchitecturalDetailLevel.OVERVIEW]: "show overall geometry, reference grids, global dimensions",
  [ArchitecturalDetailLevel.REINFORCEMENT]: "focus on reinforcement layout, bar labels, spacing callouts, cover dimensions",
  [ArchitecturalDetailLevel.CONNECTION]: "focus on connection components, plates, bolts, weld symbols, edge distances",
  [ArchitecturalDetailLevel.NOTES]: "present legend, material list, general notes, annotation symbols",
  [ArchitecturalDetailLevel.EXPLODED]: "explode assembly, numbered balloons, part references",
  [ArchitecturalDetailLevel.LEGEND]: "display symbol legend, annotation keys, material hatch legend",
  [ArchitecturalDetailLevel.PLAN]: "floor plan with grids, dimensions, room tags, callouts",
  [ArchitecturalDetailLevel.SECTION]: "section cut showing levels, heights, structural members",
  [ArchitecturalDetailLevel.ELEVATION]: "elevation view highlighting facade elements and levels",
  [ArchitecturalDetailLevel.SITE]: "site plan with property lines, setbacks, north arrow",
  [ArchitecturalDetailLevel.ROOF]: "roof plan with slopes, drains, equipment",
  [ArchitecturalDetailLevel.PROGRAM]: "diagram showing program zones with labels",
  [ArchitecturalDetailLevel.MASSING]: "massing diagram showing building volumes and hierarchy",
  [ArchitecturalDetailLevel.FACADE]: "facade concept with pattern, apertures, shading elements",
  [ArchitecturalDetailLevel.STRUCTURE]: "structural diagram highlighting load paths and systems",
  [ArchitecturalDetailLevel.CIRCULATION]: "circulation/egress diagram with primary routes",
  [ArchitecturalDetailLevel.DIAGRAM]: "conceptual diagram overlay with annotations"
};

const VIEW_DESCRIPTIONS: Record<ArchitecturalViewType, string> = {
  [ArchitecturalViewType.SECTION]: "section view, cut plane through element, show depth and reinforcement",
  [ArchitecturalViewType.PLAN]: "plan view, orthographic top-down projection, show grid and layout",
  [ArchitecturalViewType.ELEVATION]: "elevation view, orthographic side projection",
  [ArchitecturalViewType.DETAIL]: "enlarged detail view, high scale for clarity",
  [ArchitecturalViewType.ISOMETRIC]: "isometric projection, 3D axonometric lines, no perspective",
  [ArchitecturalViewType.AXONOMETRIC]: "axonometric projection, consistent scale on axes",
  [ArchitecturalViewType.EXPLODED]: "exploded axonometric, spaced components, numbered callouts",
  [ArchitecturalViewType.LEGEND]: "legend layout, organized lists and symbols"
};

const UNIT_SYNONYMS: Record<UnitSystem, string> = {
  metric: "metric units (mm)",
  imperial: "imperial units (inches)"
};

function uniqueConcat<T>(base: T[] = [], next: T[] = []): T[] {
  const seen = new Set<T>();
  const result: T[] = [];
  [...base, ...next].forEach(item => {
    if (item === undefined || item === null) return;
    if (!seen.has(item)) {
      seen.add(item);
      result.push(item);
    }
  });
  return result;
}

export function mergeArchitecturalMetadata(
  base: ArchitecturalMetadata | undefined,
  next: ArchitecturalMetadata
): ArchitecturalMetadata {
  if (!base) return next;

  return {
    unitSystem: base.unitSystem || next.unitSystem,
    primaryView: base.primaryView || next.primaryView,
    secondaryView: base.secondaryView || next.secondaryView,
    scale: base.scale || next.scale,
    standards: uniqueConcat(base.standards, next.standards),
    drawingStyle: base.drawingStyle || next.drawingStyle,
    components: uniqueConcat(base.components, next.components),
    materials: uniqueConcat(base.materials, next.materials),
    dimensions: uniqueConcat(base.dimensions, next.dimensions),
    annotations: uniqueConcat(base.annotations, next.annotations),
    reinforcementNotes: uniqueConcat(base.reinforcementNotes, next.reinforcementNotes),
    generalNotes: uniqueConcat(base.generalNotes, next.generalNotes),
    detailLevels: uniqueConcat(base.detailLevels, next.detailLevels),
    projectKind: base.projectKind || next.projectKind,
    levels: uniqueConcat(base.levels, next.levels),
    grids: uniqueConcat(base.grids, next.grids),
    viewSet: uniqueConcat(base.viewSet, next.viewSet),
    sheetTitle: base.sheetTitle || next.sheetTitle,
    sheetNumber: base.sheetNumber || next.sheetNumber,
    buildingType: base.buildingType || next.buildingType,
    floors: base.floors || next.floors,
    footprint: base.footprint || next.footprint,
    orientation: base.orientation || next.orientation,
    programItems: uniqueConcat(base.programItems, next.programItems),
    diagramLayers: uniqueConcat(base.diagramLayers, next.diagramLayers),
    conceptNotes: uniqueConcat(base.conceptNotes, next.conceptNotes)
  };
}

export function getDefaultArchitecturalMetadata(kind: ArchitecturalProjectKind = "detalles"): ArchitecturalMetadata {
  switch (kind) {
    case "planos":
      return {
        unitSystem: "metric",
        primaryView: ArchitecturalViewType.PLAN,
        secondaryView: ArchitecturalViewType.SECTION,
        scale: "1:100",
        standards: ["ISO 128"],
        drawingStyle: "architectural plan drafting, CAD line work",
        components: ["floor layout", "walls", "openings", "structural grid"],
        materials: ["concrete", "masonry", "glass"],
        dimensions: ["overall building dimensions", "room dimensions", "grid spacing"],
        annotations: ["grid bubbles", "dimension strings", "room tags", "north arrow"],
        generalNotes: ["all dimensions in millimeters unless noted", "verify on site"],
        detailLevels: [
          ArchitecturalDetailLevel.SITE,
          ArchitecturalDetailLevel.PLAN,
          ArchitecturalDetailLevel.SECTION,
          ArchitecturalDetailLevel.ELEVATION,
          ArchitecturalDetailLevel.LEGEND
        ],
        projectKind: "planos",
        levels: ["Ground Floor", "First Floor"],
        grids: ["Grid A-F", "Grid 1-6"],
        viewSet: [ArchitecturalViewType.PLAN, ArchitecturalViewType.SECTION]
      };
    case "prototipos":
      return {
        unitSystem: "metric",
        primaryView: ArchitecturalViewType.AXONOMETRIC,
        secondaryView: ArchitecturalViewType.PLAN,
        scale: "1:200",
        standards: ["Conceptual diagram"],
        drawingStyle: "concept massing line art, diagram overlays",
        components: ["building volumes", "public plaza", "core"],
        materials: ["concept massing"],
        dimensions: ["overall footprint", "height zoning"],
        annotations: ["program labels", "flow arrows", "legend"],
        generalNotes: ["conceptual prototype visualization"],
        detailLevels: [
          ArchitecturalDetailLevel.MASSING,
          ArchitecturalDetailLevel.PROGRAM,
          ArchitecturalDetailLevel.FACADE,
          ArchitecturalDetailLevel.STRUCTURE,
          ArchitecturalDetailLevel.CIRCULATION
        ],
        projectKind: "prototipos",
        buildingType: "mixed-use",
        floors: 5,
        footprint: "45m x 25m",
        orientation: "north-up",
        programItems: ["retail", "office", "residential"],
        diagramLayers: ["program", "structure", "circulation"],
        conceptNotes: ["highlight public-private transition", "optimize daylight"]
      };
    case "detalles":
    default:
      return {
        unitSystem: "metric",
        primaryView: ArchitecturalViewType.SECTION,
        secondaryView: ArchitecturalViewType.DETAIL,
        scale: "1:20",
        standards: ["ACI 318"],
        drawingStyle: "CAD drafting style, black and white line work",
        components: ["reinforced concrete beam", "reinforcing steel"],
        materials: ["concrete f'c 28 MPa", "steel grade 60"],
        dimensions: ["overall dimensions", "cover 25 mm", "stirrups @150 mm"],
        annotations: ["dimension strings", "leader labels", "section markers"],
        reinforcementNotes: ["use standard hooks", "lap splice per code"],
        generalNotes: ["all dimensions in mm unless noted"],
        detailLevels: [ArchitecturalDetailLevel.OVERVIEW, ArchitecturalDetailLevel.REINFORCEMENT],
        projectKind: "detalles"
      };
  }
}

export function generateArchitecturalPanelPrompts(
  prompts: StoryboardPrompt[],
  metadata: ArchitecturalMetadata,
  kind: ArchitecturalProjectKind = "detalles"
): StoryboardPrompt[] {
  return prompts.map(prompt => {
    const enriched = buildArchitecturalPrompt(prompt, metadata, kind);
    return {
      ...prompt,
      ...enriched
    };
  });
}

function buildArchitecturalPrompt(
  prompt: StoryboardPrompt,
  metadata: ArchitecturalMetadata,
  kind: ArchitecturalProjectKind
): Pick<StoryboardPrompt, "generatedPrompt" | "style"> {
  const viewType = prompt.viewType || metadata.primaryView;
  const detailLevel = prompt.detailLevel || metadata.detailLevels?.[0] || ArchitecturalDetailLevel.OVERVIEW;
  const scale = prompt.scale || metadata.scale;
  const unitSystem = prompt.unitSystem || metadata.unitSystem;
  const standards = prompt.standards || metadata.standards;
  const drawingStyle = metadata.drawingStyle;
  const components = prompt.components?.length ? prompt.components : metadata.components;
  const materials = prompt.materials?.length ? prompt.materials : metadata.materials;
  const dimensions = prompt.dimensions?.length ? prompt.dimensions : metadata.dimensions;
  const annotations = prompt.annotations?.length ? prompt.annotations : metadata.annotations;
  const legendItems = prompt.legendItems ?? [];
  const additionalNotes = uniqueConcat(metadata.generalNotes, prompt.metadataNotes);
  const diagramLayers = uniqueConcat(metadata.diagramLayers, prompt.diagramLayers);
  const programItems = uniqueConcat(metadata.programItems, prompt.components?.filter(component => component.includes("program"))); // fallback
  const planLevel = prompt.planLevel || metadata.levels?.[0];

  const parts: string[] = [];

  parts.push(BASE_STYLE);
  if (drawingStyle) parts.push(drawingStyle);
  const viewDescriptor = VIEW_DESCRIPTIONS[viewType];
  if (viewDescriptor) parts.push(viewDescriptor);
  if (DETAIL_FOCUS[detailLevel]) parts.push(DETAIL_FOCUS[detailLevel]);
  parts.push(`scale ${scale}`);
  parts.push(UNIT_SYNONYMS[unitSystem] || unitSystem);
  if (components.length) parts.push(`components: ${components.join(", ")}`);
  if (materials.length) parts.push(`materials: ${materials.join(", ")}`);
  if (dimensions.length) parts.push(`dimensions: ${dimensions.join(", ")}`);
  if (annotations.length) parts.push(`annotations: ${annotations.join(", ")}`);
  if (legendItems.length) parts.push(`legend items: ${legendItems.join(", ")}`);
  if (standards.length) parts.push(`standards: ${standards.join(", ")}`);
  if (additionalNotes.length) parts.push(`notes: ${additionalNotes.join(", ")}`);
  if (kind === "planos") {
    if (metadata.levels?.length) parts.push(`levels included: ${metadata.levels.join(", ")}`);
    if (metadata.grids?.length) parts.push(`grid references: ${metadata.grids.join(", ")}`);
    if (metadata.viewSet?.length) parts.push(`sheet views: ${metadata.viewSet.map(v => v.replace(/_/g, " ")).join(", ")}`);
    if (planLevel) parts.push(`current level: ${planLevel}`);
    parts.push("include north arrow, sheet title block, clean dimension strings");
  }
  if (kind === "prototipos") {
    if (metadata.buildingType) parts.push(`building type: ${metadata.buildingType}`);
    if (metadata.floors) parts.push(`number of floors: ${metadata.floors}`);
    if (metadata.footprint) parts.push(`footprint: ${metadata.footprint}`);
    if (metadata.orientation) parts.push(`orientation: ${metadata.orientation}`);
    if (programItems.length) parts.push(`program zones: ${programItems.join(", ")}`);
    if (diagramLayers.length) parts.push(`diagram layers: ${diagramLayers.join(", ")}`);
    if (metadata.conceptNotes?.length) parts.push(`concept notes: ${metadata.conceptNotes.join(", ")}`);
    parts.push("diagram overlays with arrows and labels, no shading, conceptual massing emphasis");
  }
  parts.push("include dimension lines, leader arrows, text height 2.5mm, consistent line weights");
  parts.push(BASE_EXCLUSIONS);

  const generatedPrompt = parts.filter(Boolean).join(", ");

  return {
    generatedPrompt,
    style: prompt.style
  };
}
