import {
  ArchitecturalDetailLevel,
  ArchitecturalMetadata,
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
  [ArchitecturalDetailLevel.LEGEND]: "display symbol legend, annotation keys, material hatch legend"
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
    detailLevels: uniqueConcat(base.detailLevels, next.detailLevels)
  };
}

export function getDefaultArchitecturalMetadata(): ArchitecturalMetadata {
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
    detailLevels: [ArchitecturalDetailLevel.OVERVIEW, ArchitecturalDetailLevel.REINFORCEMENT]
  };
}

export function generateArchitecturalPanelPrompts(
  prompts: StoryboardPrompt[],
  metadata: ArchitecturalMetadata
): StoryboardPrompt[] {
  return prompts.map(prompt => {
    const enriched = buildArchitecturalPrompt(prompt, metadata);
    return {
      ...prompt,
      ...enriched
    };
  });
}

function buildArchitecturalPrompt(
  prompt: StoryboardPrompt,
  metadata: ArchitecturalMetadata
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
  parts.push("include dimension lines, leader arrows, text height 2.5mm, consistent line weights");
  parts.push(BASE_EXCLUSIONS);

  const generatedPrompt = parts.filter(Boolean).join(", ");

  return {
    generatedPrompt,
    style: prompt.style
  };
}
