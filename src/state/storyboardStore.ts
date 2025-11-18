import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  StoryboardProject,
  StoryboardPanel,
  StoryboardPrompt,
  StoryboardStyle,
  GenerationOptions,
  GenerationQuality,
  ProjectType,
  ArchitecturalMetadata,
  ArchitecturalProjectKind,
  Character,
  Location
} from "../types/storyboard";
import { parseUserInput } from "../services/promptParser";
import { parseUserInputWithAI, convertAIResultToAppFormat } from "../services/aiParser";
import { generateAllPanelPrompts, applyAudienceTemplate, AUDIENCE_TEMPLATES } from "../templates/storyboardTemplates";
import { parseArchitecturalInput } from "../services/architecturalParser";
import { generateArchitecturalPanelPrompts, mergeArchitecturalMetadata, getDefaultArchitecturalMetadata } from "../templates/architecturalTemplates";
import { generateDraftStoryboardImage } from "../api/stable-diffusion";
import { v4 as uuidv4 } from "uuid";

interface StoryboardState {
  // Current project state
  currentProject: StoryboardProject | null;
  pendingProject: StoryboardProject | null; // Project awaiting prompt review
  projects: StoryboardProject[];

  // UI state
  isGenerating: boolean;
  isLoading: boolean;
  error: string | null;

  // User preferences
  defaultStyle: StoryboardStyle;
  generationOptions: GenerationOptions;

  // Actions
  createProjectFromInput: (input: string, customCharacters?: Character[], customLocations?: Location[]) => Promise<void>;
  createProjectWithPromptReview: (input: string, customCharacters?: Character[], customLocations?: Location[]) => Promise<StoryboardProject | null>;
  setPendingProject: (project: StoryboardProject | null) => void;
  updatePendingProjectPanels: (panels: StoryboardPanel[]) => void;
  generateImagesForPendingProject: (quality?: GenerationQuality) => Promise<void>;
  createArchitecturalProjectFromInput: (input: string, options?: { kind?: ArchitecturalProjectKind }) => Promise<void>;
  appendPanelsFromInput: (input: string, options?: { count?: number }) => Promise<void>;
  appendArchitecturalPanelsFromInput: (input: string, options?: { count?: number; kind?: ArchitecturalProjectKind }) => Promise<void>;
  updatePanel: (panelId: string, updates: Partial<StoryboardPanel>) => void;
  deletePanel: (panelId: string) => void;
  updatePanelPrompt: (panelId: string, newPromptText: string) => void;
  regeneratePanelPromptFromIdea: (panelId: string, newIdea: string) => Promise<void>;
  updateProject: (projectId: string, updates: Partial<StoryboardProject>) => void;
  updateCharacter: (characterId: string, updates: Partial<Character>) => void;
  addLocationToProject: (location: Location) => void;
  updateLocation: (locationId: string, updates: Partial<Location>) => void;
  deleteLocation: (locationId: string) => void;
  addLocationToPanel: (panelId: string, locationId: string) => void;
  removeLocationFromPanel: (panelId: string, locationId: string) => void;
  deleteProject: (projectId: string) => void;
  duplicateProject: (projectId: string) => void;
  renameProject: (projectId: string, newTitle: string) => void;
  toggleFavorite: (projectId: string) => void;
  addProjectTags: (projectId: string, tags: string[]) => void;
  setCurrentProject: (project: StoryboardProject | null) => void;
  regeneratePanel: (panelId: string) => Promise<void>;
  regenerateAllPanels: () => Promise<void>;
  generatePanelImage: (panelId: string, quality?: GenerationQuality) => Promise<void>;
  generateAllPanelImages: (quality?: GenerationQuality) => Promise<void>;
  saveProject: () => Promise<void>;
  loadProject: (projectId: string) => void;
  setError: (error: string | null) => void;
  setGenerationOptions: (options: Partial<GenerationOptions>) => void;
  clearCurrentProject: () => void;
}

const defaultGenerationOptions: GenerationOptions = {
  style: StoryboardStyle.ROUGH_SKETCH,
  composition: "medium_shot" as any,
  quality: "medium",
  size: "1024x1024",
  enhancePrompt: true,
  maintainCharacterConsistency: true,
  generationQuality: GenerationQuality.STANDARD // Default: Gama baja (Stable Diffusion)
};

/**
 * Migrate old projects that have string location to Location objects
 * This ensures backward compatibility with projects created before the location system was added
 */
function migrateProjectLocations(project: StoryboardProject): StoryboardProject {
  // Check if project needs migration
  const needsMigration = project.panels.some(panel =>
    panel.prompt.location && // Has old string location
    panel.prompt.locations.length === 0 // But no Location objects
  );

  if (!needsMigration) {
    return project;
  }

  console.log('[Migration] Migrating project locations for:', project.title);

  // Collect unique location strings from all panels
  const uniqueLocationStrings = new Set<string>();
  project.panels.forEach(panel => {
    if (panel.prompt.location && panel.prompt.locations.length === 0) {
      uniqueLocationStrings.add(panel.prompt.location);
    }
  });

  // Create Location objects for each unique location string
  const migratedLocations = Array.from(uniqueLocationStrings).map((locationString): Location => ({
    id: `migrated_${uuidv4()}`,
    name: locationString.slice(0, 50), // Use first 50 chars as name
    description: locationString,
    type: "exterior", // Default to exterior
    details: {
      locationType: 'other',
      setting: locationString,
    },
  }));

  // Create a map of location string to Location id
  const locationStringToId = new Map<string, string>();
  migratedLocations.forEach(loc => {
    const originalString = uniqueLocationStrings.size === 1
      ? Array.from(uniqueLocationStrings)[0]
      : loc.description;
    locationStringToId.set(originalString, loc.id);
  });

  // Update panels to reference the new Location objects
  const updatedPanels = project.panels.map(panel => {
    if (panel.prompt.location && panel.prompt.locations.length === 0) {
      const locationId = locationStringToId.get(panel.prompt.location);
      return {
        ...panel,
        prompt: {
          ...panel.prompt,
          locations: locationId ? [locationId] : []
        }
      };
    }
    return panel;
  });

  // Merge migrated locations with existing ones (if any)
  const updatedProject = {
    ...project,
    locations: [...(project.locations || []), ...migratedLocations],
    panels: updatedPanels,
    updatedAt: new Date()
  };

  console.log(`[Migration] Migrated ${migratedLocations.length} locations`);

  return updatedProject;
}

export const useStoryboardStore = create<StoryboardState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentProject: null,
      pendingProject: null,
      projects: [],
      isGenerating: false,
      isLoading: false,
      error: null,
      defaultStyle: StoryboardStyle.ROUGH_SKETCH,
      generationOptions: defaultGenerationOptions,

      // Create a new project from natural language input
      createProjectFromInput: async (input: string, customCharacters?: Character[]) => {
        set({ isGenerating: true, error: null });

        try {
          console.log("[storyboardStore] Creating project from input:", input);
          console.log("[storyboardStore] Custom characters provided:", customCharacters?.length || 0);

          // Extract panel count from input for AI parser
          const panelCountMatch = input.toLowerCase().match(/\((?:panels?|frames?):\s*(\d{1,2})\)|(\d{1,2})\s*(?:panels?|frames?)/);
          const panelCount = panelCountMatch ? parseInt(panelCountMatch[1] || panelCountMatch[2], 10) : 4;

          let result;
          let useAI = true;

          // Try AI parsing first with GPT-4
          try {
            console.log("[storyboardStore] Attempting AI parsing with GPT-4, panel count:", panelCount);
            const aiResult = await parseUserInputWithAI(input, panelCount);
            const converted = convertAIResultToAppFormat(aiResult);

            console.log("[storyboardStore] AI parsing successful:", {
              characters: converted.characters.length,
              scenes: converted.scenes.length,
              storyBeats: converted.storyBeats.length
            });

            // Use custom characters if provided, otherwise use AI-detected characters
            const finalCharacters = customCharacters && customCharacters.length > 0
              ? customCharacters
              : converted.characters;

            // Use custom locations if provided
            const finalLocations = customLocations && customLocations.length > 0
              ? customLocations
              : [];

            console.log("[storyboardStore] Using characters:", {
              custom: customCharacters?.length || 0,
              aiDetected: converted.characters.length,
              final: finalCharacters.length
            });

            console.log("[storyboardStore] Using locations:", {
              custom: customLocations?.length || 0,
              final: finalLocations.length
            });

            // Build panels from AI-generated story beats
            const panels = aiResult.storyBeats.map((beat, index) => ({
              id: uuidv4(),
              panelNumber: index + 1,
              prompt: {
                id: uuidv4(),
                panelNumber: index + 1,
                panelType: index === 0 ? "establishing" as any : "action" as any,
                action: beat,
                sceneDescription: beat,
                characters: finalCharacters.map(c => c.id),
                sceneId: converted.scenes[0]?.id || uuidv4(),
                style: get().defaultStyle,
                composition: "medium_shot" as any,
                mood: aiResult.mood,
                lighting: converted.scenes[0]?.lighting || "natural lighting",
                generatedPrompt: ""
              },
              isGenerating: false,
              isEdited: false
            }));

            result = {
              success: true,
              project: {
                id: uuidv4(),
                title: input.slice(0, 50),
                description: input,
                userInput: input,
                panels,
                characters: finalCharacters,
                locations: finalLocations,
                scenes: converted.scenes,
                style: get().defaultStyle,
                metadata: {
                  genre: aiResult.genre,
                  targetAudience: aiResult.targetAudience as any,
                  aspectRatio: "4:3" as const
                },
                createdAt: new Date(),
                updatedAt: new Date(),
                isComplete: true,
                projectType: ProjectType.STORYBOARD
              }
            };
          } catch (aiError) {
            console.warn("[storyboardStore] AI parsing failed, falling back to regex parser:", aiError);
            useAI = false;
            result = await parseUserInput(input);

            // If using regex parser and custom characters provided, override the parsed characters
            if (result.success && customCharacters && customCharacters.length > 0) {
              result.project.characters = customCharacters;
              // Update panel character references
              result.project.panels = result.project.panels.map(panel => ({
                ...panel,
                prompt: {
                  ...panel.prompt,
                  characters: customCharacters.map(c => c.id)
                }
              }));
            }
          }

          if (result.success) {
            // Apply audience-specific template first, then generate prompts
            const audience = result.project.metadata.targetAudience as keyof typeof AUDIENCE_TEMPLATES;
            const audienceStyle = AUDIENCE_TEMPLATES[audience]?.style_preference ?? get().defaultStyle;

            const audiencePreparedPanels = result.project.panels.map(panel => ({
              ...panel,
              prompt: applyAudienceTemplate({
                ...panel.prompt,
                style: audienceStyle
              }, audience)
            }));

            // Generate final prompts with template system
            const enhancedPrompts = await generateAllPanelPrompts(
              audiencePreparedPanels.map(p => p.prompt),
              result.project.characters,
              result.project.scenes
            );

            const finalPanels = audiencePreparedPanels.map((panel, index) => ({
              ...panel,
              prompt: enhancedPrompts[index]
            }));

            const finalProject: StoryboardProject = {
              ...result.project,
              panels: finalPanels,
              style: audienceStyle,
              projectType: ProjectType.STORYBOARD
            };

            console.log("[storyboardStore] Project created successfully using", useAI ? "AI" : "regex", "parser");
            console.log("[storyboardStore] Final project:", {
              panels: finalProject.panels.length,
              characters: finalProject.characters.length,
              scenes: finalProject.scenes.length
            });

            set(state => ({
              currentProject: finalProject,
              projects: [...state.projects, finalProject],
              isGenerating: false
            }));
          } else {
            set({
              error: result.errors?.join(", ") || "Failed to generate storyboard",
              isGenerating: false
            });
          }
        } catch (error) {
          console.error("[storyboardStore] Project creation error:", error);
          set({
            error: error instanceof Error ? error.message : "Unknown error occurred",
            isGenerating: false
          });
        }
      },

      // Create a new project with prompt review (two-stage generation)
      createProjectWithPromptReview: async (input: string, customCharacters?: Character[], customLocations?: Location[]): Promise<StoryboardProject | null> => {
        set({ isGenerating: true, error: null });

        try {
          console.log("[storyboardStore] Creating project with prompt review:", input);
          console.log("[storyboardStore] Custom characters provided:", customCharacters?.length || 0);
          console.log("[storyboardStore] Custom locations provided:", customLocations?.length || 0);

          // Extract panel count from input for AI parser
          const panelCountMatch = input.toLowerCase().match(/\((?:panels?|frames?):\s*(\d{1,2})\)|(\d{1,2})\s*(?:panels?|frames?)/);
          const panelCount = panelCountMatch ? parseInt(panelCountMatch[1] || panelCountMatch[2], 10) : 4;

          let result;
          let useAI = true;

          // Try AI parsing first with GPT-4
          try {
            console.log("[storyboardStore] Attempting AI parsing with GPT-4, panel count:", panelCount);
            const aiResult = await parseUserInputWithAI(input, panelCount);
            const converted = convertAIResultToAppFormat(aiResult);

            console.log("[storyboardStore] AI parsing successful:", {
              characters: converted.characters.length,
              scenes: converted.scenes.length,
              storyBeats: converted.storyBeats.length
            });

            // Use custom characters if provided, otherwise use AI-detected characters
            const finalCharacters = customCharacters && customCharacters.length > 0
              ? customCharacters
              : converted.characters;

            // Use custom locations if provided
            const finalLocations = customLocations && customLocations.length > 0
              ? customLocations
              : [];

            console.log("[storyboardStore] Using characters:", {
              custom: customCharacters?.length || 0,
              aiDetected: converted.characters.length,
              final: finalCharacters.length
            });

            console.log("[storyboardStore] Using locations:", {
              custom: customLocations?.length || 0,
              final: finalLocations.length
            });

            // Build panels from AI-generated story beats
            const panels = aiResult.storyBeats.map((beat, index) => ({
              id: uuidv4(),
              panelNumber: index + 1,
              prompt: {
                id: uuidv4(),
                panelNumber: index + 1,
                panelType: index === 0 ? "establishing" as any : "action" as any,
                action: beat,
                sceneDescription: beat,
                characters: finalCharacters.map(c => c.id),
                sceneId: converted.scenes[0]?.id || uuidv4(),
                style: get().defaultStyle,
                composition: "medium_shot" as any,
                mood: aiResult.mood,
                lighting: converted.scenes[0]?.lighting || "natural lighting",
                generatedPrompt: ""
              },
              isGenerating: false,
              isEdited: false
            }));

            result = {
              success: true,
              project: {
                id: uuidv4(),
                title: input.slice(0, 50),
                description: input,
                userInput: input,
                panels,
                characters: finalCharacters,
                locations: finalLocations,
                scenes: converted.scenes,
                style: get().defaultStyle,
                metadata: {
                  genre: aiResult.genre,
                  targetAudience: aiResult.targetAudience as any,
                  aspectRatio: "4:3" as const
                },
                createdAt: new Date(),
                updatedAt: new Date(),
                isComplete: true,
                projectType: ProjectType.STORYBOARD
              }
            };
          } catch (aiError) {
            console.warn("[storyboardStore] AI parsing failed, falling back to regex parser:", aiError);
            useAI = false;
            result = await parseUserInput(input);

            // If using regex parser and custom characters provided, override the parsed characters
            if (result.success && customCharacters && customCharacters.length > 0) {
              result.project.characters = customCharacters;
              // Update panel character references
              result.project.panels = result.project.panels.map(panel => ({
                ...panel,
                prompt: {
                  ...panel.prompt,
                  characters: customCharacters.map(c => c.id)
                }
              }));
            }
          }

          if (result.success) {
            // Apply audience-specific template first, then generate prompts
            const audience = result.project.metadata.targetAudience as keyof typeof AUDIENCE_TEMPLATES;
            const audienceStyle = AUDIENCE_TEMPLATES[audience]?.style_preference ?? get().defaultStyle;

            const audiencePreparedPanels = result.project.panels.map(panel => ({
              ...panel,
              prompt: applyAudienceTemplate({
                ...panel.prompt,
                style: audienceStyle
              }, audience)
            }));

            // Generate final prompts with template system
            const enhancedPrompts = await generateAllPanelPrompts(
              audiencePreparedPanels.map(p => p.prompt),
              result.project.characters,
              result.project.scenes
            );

            const finalPanels = audiencePreparedPanels.map((panel, index) => ({
              ...panel,
              prompt: enhancedPrompts[index]
            }));

            const pendingProject: StoryboardProject = {
              ...result.project,
              panels: finalPanels,
              style: audienceStyle,
              projectType: ProjectType.STORYBOARD
            };

            console.log("[storyboardStore] Pending project created successfully using", useAI ? "AI" : "regex", "parser");
            console.log("[storyboardStore] Pending project:", {
              panels: pendingProject.panels.length,
              characters: pendingProject.characters.length,
              scenes: pendingProject.scenes.length
            });

            set({ pendingProject, isGenerating: false });
            return pendingProject;
          } else {
            set({
              error: result.errors?.join(", ") || "Failed to generate storyboard",
              isGenerating: false
            });
            return null;
          }
        } catch (error) {
          console.error("[storyboardStore] Project creation error:", error);
          set({
            error: error instanceof Error ? error.message : "Unknown error occurred",
            isGenerating: false
          });
          return null;
        }
      },

      // Set pending project
      setPendingProject: (project: StoryboardProject | null) => {
        set({ pendingProject: project });
      },

      // Update pending project panels (for edit/delete in review modal)
      updatePendingProjectPanels: (panels: StoryboardPanel[]) => {
        set(state => {
          if (!state.pendingProject) return state;

          return {
            pendingProject: {
              ...state.pendingProject,
              panels,
              updatedAt: new Date()
            }
          };
        });
      },

      // Generate images for pending project and save it
      generateImagesForPendingProject: async (quality?: GenerationQuality) => {
        const state = get();
        if (!state.pendingProject) {
          set({ error: "No pending project to generate images for" });
          return;
        }

        set({ isGenerating: true, error: null });

        try {
          const project = state.pendingProject;
          console.log("[storyboardStore] Generating images for pending project:", project.id);
          console.log("[storyboardStore] Quality tier:", quality || 'default');

          // Set project as current and add to projects (without images yet)
          set(state => ({
            currentProject: project,
            projects: [...state.projects, project],
            pendingProject: null
          }));

          // Generate images for all panels with specified quality
          await get().generateAllPanelImages(quality);

          set({ isGenerating: false });
        } catch (error) {
          console.error("[storyboardStore] Error generating images for pending project:", error);
          set({
            error: error instanceof Error ? error.message : "Failed to generate images",
            isGenerating: false
          });
        }
      },

      // Create a new architectural project from natural language input
      createArchitecturalProjectFromInput: async (input: string, options?: { kind?: ArchitecturalProjectKind }) => {
        set({ isGenerating: true, error: null });

        try {
          const kind = options?.kind ?? "detalles";
          const result = await parseArchitecturalInput(input, kind);

          if (result.success) {
            const metadata = result.project.architecturalMetadata ?? getDefaultArchitecturalMetadata(kind);
            const prompts = generateArchitecturalPanelPrompts(
              result.project.panels.map(panel => ({
                ...panel.prompt,
                components: panel.prompt.components ?? metadata.components,
                materials: panel.prompt.materials ?? metadata.materials,
                dimensions: panel.prompt.dimensions ?? metadata.dimensions,
                annotations: panel.prompt.annotations ?? metadata.annotations,
                unitSystem: panel.prompt.unitSystem ?? metadata.unitSystem,
                scale: panel.prompt.scale ?? metadata.scale,
                standards: panel.prompt.standards ?? metadata.standards,
                planLevel: panel.prompt.planLevel,
                diagramLayers: panel.prompt.diagramLayers
              })),
              metadata,
              kind
            );

            const finalPanels = result.project.panels.map((panel, index) => ({
              ...panel,
              prompt: prompts[index],
              detailLevel: panel.detailLevel
            }));

            const finalProject: StoryboardProject = {
              ...result.project,
              panels: finalPanels,
              architecturalMetadata: metadata,
              projectType: ProjectType.ARCHITECTURAL,
              architecturalProjectKind: kind,
              style: StoryboardStyle.CLEAN_LINES
            };

            set(state => ({
              currentProject: finalProject,
              projects: [...state.projects, finalProject],
              isGenerating: false
            }));
          } else {
            set({
              error: result.errors?.join(", ") || "Failed to generate architectural storyboard",
              isGenerating: false
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Unknown error occurred",
            isGenerating: false
          });
        }
      },

      // Append new panels derived from user input to the current project
      appendPanelsFromInput: async (input: string, options?: { count?: number }) => {
        const state = get();
        if (!state.currentProject) return;
        if (state.currentProject.projectType === ProjectType.ARCHITECTURAL) {
          set({ isGenerating: false });
          return;
        }
        set({ isGenerating: true, error: null });

        try {
          const result = await parseUserInput(input);
          if (!result.success) {
            set({ error: result.errors?.join(", ") || "Failed to parse input", isGenerating: false });
            return;
          }

          const audience = result.project.metadata.targetAudience;
          const audienceStyle = AUDIENCE_TEMPLATES[audience]?.style_preference ?? state.currentProject.style ?? get().defaultStyle;

          // Determine how many panels to take
          const requestedCount = Math.max(1, options?.count || result.project.panels.length || 1);
          const newPanelsSource = result.project.panels.slice(0, requestedCount);

          // Merge characters and scenes (simple append)
          const mergedCharacters = [...state.currentProject.characters, ...result.project.characters];
          const mergedScenes = [...state.currentProject.scenes, ...result.project.scenes];

          // Prepare prompts with audience template and style
          const preparedPrompts = newPanelsSource.map(p => applyAudienceTemplate({
            ...p.prompt,
            style: audienceStyle
          }, audience));

          // Generate final prompts for the new panels using merged entities
          const generatedPrompts = await generateAllPanelPrompts(preparedPrompts, mergedCharacters, mergedScenes);

          // Build StoryboardPanel objects with incremented numbering
          const startIndex = state.currentProject.panels.length;
          const panelsToAppend: StoryboardPanel[] = generatedPrompts.map((prompt, idx) => ({
            id: uuidv4(),
            panelNumber: startIndex + idx + 1,
            prompt,
            isGenerating: false,
            isEdited: false
          }));

          const updatedProject: StoryboardProject = {
            ...state.currentProject,
            characters: mergedCharacters,
            scenes: mergedScenes,
            panels: [...state.currentProject.panels, ...panelsToAppend],
            updatedAt: new Date()
          };

          set({
            currentProject: updatedProject,
            projects: state.projects.map(p => p.id === updatedProject.id ? updatedProject : p),
            isGenerating: false
          });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Failed to append panels", isGenerating: false });
        }
      },

      // Append architectural panels to the current architectural project
      appendArchitecturalPanelsFromInput: async (input: string, options?: { count?: number; kind?: ArchitecturalProjectKind }) => {
        const state = get();
        const currentProject = state.currentProject;
        if (!currentProject || currentProject.projectType !== ProjectType.ARCHITECTURAL) {
          set({ error: "No architectural project selected", isGenerating: false });
          return;
        }

        set({ isGenerating: true, error: null });

        try {
          const targetKind = options?.kind || currentProject.architecturalProjectKind || "detalles";
          if (currentProject.architecturalProjectKind && currentProject.architecturalProjectKind !== targetKind) {
            set({ error: "Architectural mode mismatch. Switch to the matching mode before adding panels.", isGenerating: false });
            return;
          }

          const result = await parseArchitecturalInput(input, targetKind);
          if (!result.success) {
            set({ error: result.errors?.join(", ") || "Failed to parse architectural input", isGenerating: false });
            return;
          }

          const requestedCount = Math.max(1, options?.count || result.project.panels.length || 1);
          const newPanelsSource = result.project.panels.slice(0, requestedCount);
          const mergedMetadata: ArchitecturalMetadata = mergeArchitecturalMetadata(
            currentProject.architecturalMetadata,
            result.project.architecturalMetadata ?? getDefaultArchitecturalMetadata(targetKind)
          );

          const generatedPrompts = generateArchitecturalPanelPrompts(
            newPanelsSource.map(panel => ({
              ...panel.prompt,
              components: panel.prompt.components ?? mergedMetadata.components,
              materials: panel.prompt.materials ?? mergedMetadata.materials,
              dimensions: panel.prompt.dimensions ?? mergedMetadata.dimensions,
              annotations: panel.prompt.annotations ?? mergedMetadata.annotations,
              unitSystem: mergedMetadata.unitSystem,
              scale: mergedMetadata.scale,
              standards: mergedMetadata.standards,
              planLevel: panel.prompt.planLevel,
              diagramLayers: panel.prompt.diagramLayers
            })),
            mergedMetadata,
            targetKind
          );

          const startIndex = currentProject.panels.length;
          const panelsToAppend: StoryboardPanel[] = generatedPrompts.map((prompt, idx) => ({
            id: uuidv4(),
            panelNumber: startIndex + idx + 1,
            prompt,
            isGenerating: false,
            isEdited: false,
            detailLevel: newPanelsSource[idx]?.detailLevel
          }));

          const updatedProject: StoryboardProject = {
            ...currentProject,
            panels: [...currentProject.panels, ...panelsToAppend],
            architecturalMetadata: mergedMetadata,
            architecturalProjectKind: targetKind,
            updatedAt: new Date()
          };

          set({
            currentProject: updatedProject,
            projects: state.projects.map(p => (p.id === updatedProject.id ? updatedProject : p)),
            isGenerating: false
          });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Failed to append architectural panels", isGenerating: false });
        }
      },

      // Update a specific panel
      updatePanel: (panelId: string, updates: Partial<StoryboardPanel>) => {
        set(state => {
          if (!state.currentProject) return state;

          const updatedPanels = state.currentProject.panels.map(panel =>
            panel.id === panelId
              ? { ...panel, ...updates, isEdited: true }
              : panel
          );

          const updatedProject = {
            ...state.currentProject,
            panels: updatedPanels,
            updatedAt: new Date()
          };

          return {
            currentProject: updatedProject,
            projects: state.projects.map(p =>
              p.id === updatedProject.id ? updatedProject : p
            )
          };
        });
      },

      // Delete a specific panel
      deletePanel: (panelId: string) => {
        set(state => {
          if (!state.currentProject) return state;

          // Filter out the panel to delete
          const remainingPanels = state.currentProject.panels.filter(
            panel => panel.id !== panelId
          );

          // Renumber remaining panels
          const renumberedPanels = remainingPanels.map((panel, index) => ({
            ...panel,
            panelNumber: index + 1,
            prompt: {
              ...panel.prompt,
              panelNumber: index + 1
            }
          }));

          const updatedProject = {
            ...state.currentProject,
            panels: renumberedPanels,
            updatedAt: new Date()
          };

          return {
            currentProject: updatedProject,
            projects: state.projects.map(p =>
              p.id === updatedProject.id ? updatedProject : p
            )
          };
        });
      },

      // Update a panel's prompt text
      updatePanelPrompt: (panelId: string, newPromptText: string) => {
        set(state => {
          if (!state.currentProject) return state;

          const updatedPanels = state.currentProject.panels.map(panel => {
            if (panel.id === panelId) {
              return {
                ...panel,
                prompt: {
                  ...panel.prompt,
                  generatedPrompt: newPromptText
                },
                isEdited: true
              };
            }
            return panel;
          });

          const updatedProject = {
            ...state.currentProject,
            panels: updatedPanels,
            updatedAt: new Date()
          };

          return {
            currentProject: updatedProject,
            projects: state.projects.map(p =>
              p.id === updatedProject.id ? updatedProject : p
            )
          };
        });
      },

      // Regenerate a panel's prompt from a new idea/scene description
      regeneratePanelPromptFromIdea: async (panelId: string, newIdea: string) => {
        const state = get();
        if (!state.currentProject) {
          set({ error: "No current project" });
          return;
        }

        const panel = state.currentProject.panels.find(p => p.id === panelId);
        if (!panel) {
          set({ error: "Panel not found" });
          return;
        }

        set({ isGenerating: true, error: null });

        try {
          console.log("[storyboardStore] Regenerating prompt for panel", panel.panelNumber, "with new idea:", newIdea);

          // Update panel with new scene description
          const updatedPrompt = {
            ...panel.prompt,
            sceneDescription: newIdea,
            action: newIdea
          };

          // Generate new structured prompt using GPT
          const enhancedPrompts = await generateAllPanelPrompts(
            [updatedPrompt],
            state.currentProject.characters,
            state.currentProject.scenes
          );

          const newPrompt = enhancedPrompts[0];

          // Update panel with new prompt
          get().updatePanel(panelId, {
            prompt: newPrompt,
            isEdited: true
          });

          console.log("[storyboardStore] Panel prompt regenerated successfully");
          set({ isGenerating: false });
        } catch (error) {
          console.error("[storyboardStore] Error regenerating panel prompt:", error);
          set({
            error: error instanceof Error ? error.message : "Failed to regenerate prompt",
            isGenerating: false
          });
        }
      },

      // Update project metadata
      updateProject: (projectId: string, updates: Partial<StoryboardProject>) => {
        set(state => {
          const updatedProjects = state.projects.map(project =>
            project.id === projectId
              ? { ...project, ...updates, updatedAt: new Date() }
              : project
          );

          return {
            projects: updatedProjects,
            currentProject: state.currentProject?.id === projectId
              ? { ...state.currentProject, ...updates, updatedAt: new Date() }
              : state.currentProject
          };
        });
      },

      // Update a character in the current project
      updateCharacter: (characterId: string, updates: Partial<Character>) => {
        set(state => {
          if (!state.currentProject) return state;

          const updatedCharacters = state.currentProject.characters.map(character =>
            character.id === characterId
              ? { ...character, ...updates }
              : character
          );

          const updatedProject = {
            ...state.currentProject,
            characters: updatedCharacters,
            updatedAt: new Date()
          };

          return {
            currentProject: updatedProject,
            projects: state.projects.map(p =>
              p.id === updatedProject.id ? updatedProject : p
            )
          };
        });
      },

      // Add a location to the current project
      addLocationToProject: (location: Location) => {
        set(state => {
          if (!state.currentProject) return state;

          const updatedProject = {
            ...state.currentProject,
            locations: [...state.currentProject.locations, location],
            updatedAt: new Date()
          };

          return {
            currentProject: updatedProject,
            projects: state.projects.map(p =>
              p.id === updatedProject.id ? updatedProject : p
            )
          };
        });
      },

      // Update a location in the current project
      updateLocation: (locationId: string, updates: Partial<Location>) => {
        set(state => {
          if (!state.currentProject) return state;

          const updatedLocations = state.currentProject.locations.map(location =>
            location.id === locationId
              ? { ...location, ...updates }
              : location
          );

          const updatedProject = {
            ...state.currentProject,
            locations: updatedLocations,
            updatedAt: new Date()
          };

          return {
            currentProject: updatedProject,
            projects: state.projects.map(p =>
              p.id === updatedProject.id ? updatedProject : p
            )
          };
        });
      },

      // Delete a location from the current project
      deleteLocation: (locationId: string) => {
        set(state => {
          if (!state.currentProject) return state;

          // Remove location from project
          const updatedLocations = state.currentProject.locations.filter(l => l.id !== locationId);

          // Remove location from all panels
          const updatedPanels = state.currentProject.panels.map(panel => ({
            ...panel,
            prompt: {
              ...panel.prompt,
              locations: panel.prompt.locations.filter(id => id !== locationId)
            }
          }));

          const updatedProject = {
            ...state.currentProject,
            locations: updatedLocations,
            panels: updatedPanels,
            updatedAt: new Date()
          };

          return {
            currentProject: updatedProject,
            projects: state.projects.map(p =>
              p.id === updatedProject.id ? updatedProject : p
            )
          };
        });
      },

      // Add a location to a specific panel
      addLocationToPanel: (panelId: string, locationId: string) => {
        set(state => {
          if (!state.currentProject) return state;

          const updatedPanels = state.currentProject.panels.map(panel => {
            if (panel.id === panelId) {
              // Don't add if already exists
              if (panel.prompt.locations.includes(locationId)) {
                return panel;
              }

              return {
                ...panel,
                prompt: {
                  ...panel.prompt,
                  locations: [...panel.prompt.locations, locationId]
                }
              };
            }
            return panel;
          });

          const updatedProject = {
            ...state.currentProject,
            panels: updatedPanels,
            updatedAt: new Date()
          };

          return {
            currentProject: updatedProject,
            projects: state.projects.map(p =>
              p.id === updatedProject.id ? updatedProject : p
            )
          };
        });
      },

      // Remove a location from a specific panel
      removeLocationFromPanel: (panelId: string, locationId: string) => {
        set(state => {
          if (!state.currentProject) return state;

          const updatedPanels = state.currentProject.panels.map(panel => {
            if (panel.id === panelId) {
              return {
                ...panel,
                prompt: {
                  ...panel.prompt,
                  locations: panel.prompt.locations.filter(id => id !== locationId)
                }
              };
            }
            return panel;
          });

          const updatedProject = {
            ...state.currentProject,
            panels: updatedPanels,
            updatedAt: new Date()
          };

          return {
            currentProject: updatedProject,
            projects: state.projects.map(p =>
              p.id === updatedProject.id ? updatedProject : p
            )
          };
        });
      },

      // Delete a project
      deleteProject: (projectId: string) => {
        set(state => ({
          projects: state.projects.filter(p => p.id !== projectId),
          currentProject: state.currentProject?.id === projectId
            ? null
            : state.currentProject
        }));
      },

      // Duplicate a project
      duplicateProject: (projectId: string) => {
        set(state => {
          const projectToDuplicate = state.projects.find(p => p.id === projectId);
          if (!projectToDuplicate) return state;

          const duplicatedProject: StoryboardProject = {
            ...projectToDuplicate,
            id: uuidv4(),
            title: `${projectToDuplicate.title} (Copy)`,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastOpenedAt: undefined,
            // Generate new IDs for panels
            panels: projectToDuplicate.panels.map(panel => ({
              ...panel,
              id: uuidv4(),
              prompt: {
                ...panel.prompt,
                id: uuidv4()
              }
            }))
          };

          console.log('[storyboardStore] Duplicated project:', duplicatedProject.id);
          return {
            projects: [...state.projects, duplicatedProject]
          };
        });
      },

      // Rename a project
      renameProject: (projectId: string, newTitle: string) => {
        set(state => {
          const updatedProjects = state.projects.map(project =>
            project.id === projectId
              ? { ...project, title: newTitle, updatedAt: new Date() }
              : project
          );

          return {
            projects: updatedProjects,
            currentProject: state.currentProject?.id === projectId
              ? { ...state.currentProject, title: newTitle, updatedAt: new Date() }
              : state.currentProject
          };
        });
      },

      // Toggle favorite status
      toggleFavorite: (projectId: string) => {
        set(state => {
          const updatedProjects = state.projects.map(project =>
            project.id === projectId
              ? { ...project, isFavorite: !project.isFavorite, updatedAt: new Date() }
              : project
          );

          return {
            projects: updatedProjects,
            currentProject: state.currentProject?.id === projectId
              ? { ...state.currentProject, isFavorite: !state.currentProject.isFavorite, updatedAt: new Date() }
              : state.currentProject
          };
        });
      },

      // Add tags to a project
      addProjectTags: (projectId: string, tags: string[]) => {
        set(state => {
          const updatedProjects = state.projects.map(project => {
            if (project.id === projectId) {
              const existingTags = project.tags || [];
              const newTags = tags.filter(tag => !existingTags.includes(tag));
              return {
                ...project,
                tags: [...existingTags, ...newTags],
                updatedAt: new Date()
              };
            }
            return project;
          });

          let updatedCurrentProject = state.currentProject;
          if (state.currentProject?.id === projectId) {
            const currentTags = state.currentProject.tags || [];
            const newUniqueTags = tags.filter(tag => !currentTags.includes(tag));
            updatedCurrentProject = {
              ...state.currentProject,
              tags: [...currentTags, ...newUniqueTags],
              updatedAt: new Date()
            };
          }

          return {
            projects: updatedProjects,
            currentProject: updatedCurrentProject
          };
        });
      },

      // Set current active project
      setCurrentProject: (project: StoryboardProject | null) => {
        const current = get().currentProject;
        if ((current?.id || null) === (project?.id || null)) return;

        // Update lastOpenedAt when setting a project
        if (project) {
          // Apply migration for old projects
          const migratedProject = migrateProjectLocations(project);
          const updatedProject = { ...migratedProject, lastOpenedAt: new Date() };
          set(state => ({
            currentProject: updatedProject,
            projects: state.projects.map(p =>
              p.id === project.id ? updatedProject : p
            )
          }));
        } else {
          set({ currentProject: null });
        }
      },

      // Regenerate a specific panel's prompt
      regeneratePanel: async (panelId: string) => {
        const state = get();
        if (!state.currentProject) return;

        set({ isGenerating: true });

        try {
          const panel = state.currentProject.panels.find(p => p.id === panelId);
          if (!panel) return;

          let updatedPrompt: StoryboardPrompt[];

          if (state.currentProject.projectType === ProjectType.ARCHITECTURAL) {
            const kind = state.currentProject.architecturalProjectKind ?? "detalles";
            const metadata = state.currentProject.architecturalMetadata ?? getDefaultArchitecturalMetadata(kind);
            updatedPrompt = generateArchitecturalPanelPrompts([
              {
                ...panel.prompt,
                components: panel.prompt.components ?? metadata.components,
                materials: panel.prompt.materials ?? metadata.materials,
                dimensions: panel.prompt.dimensions ?? metadata.dimensions,
                annotations: panel.prompt.annotations ?? metadata.annotations,
                unitSystem: metadata.unitSystem,
                scale: metadata.scale,
                standards: metadata.standards,
                planLevel: panel.prompt.planLevel,
                diagramLayers: panel.prompt.diagramLayers
              }
            ], metadata, kind);
          } else {
            updatedPrompt = await generateAllPanelPrompts(
              [panel.prompt],
              state.currentProject.characters,
              state.currentProject.scenes
            );
          }

          const updatedPanel: StoryboardPanel = {
            ...panel,
            prompt: updatedPrompt[0],
            isEdited: false,
            generatedImageUrl: undefined // Clear previous image
          };

          get().updatePanel(panelId, updatedPanel);
          set({ isGenerating: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to regenerate panel",
            isGenerating: false 
          });
        }
      },

      // Regenerate all panels
      regenerateAllPanels: async () => {
        const state = get();
        if (!state.currentProject) return;

        set({ isGenerating: true });

        try {
          let enhancedPrompts: StoryboardPrompt[];

          if (state.currentProject.projectType === ProjectType.ARCHITECTURAL) {
            const kind = state.currentProject.architecturalProjectKind ?? "detalles";
            const metadata = state.currentProject.architecturalMetadata ?? getDefaultArchitecturalMetadata(kind);
            enhancedPrompts = generateArchitecturalPanelPrompts(
              state.currentProject.panels.map(panel => ({
                ...panel.prompt,
                components: panel.prompt.components ?? metadata.components,
                materials: panel.prompt.materials ?? metadata.materials,
                dimensions: panel.prompt.dimensions ?? metadata.dimensions,
                annotations: panel.prompt.annotations ?? metadata.annotations,
                unitSystem: metadata.unitSystem,
                scale: metadata.scale,
                standards: metadata.standards,
                planLevel: panel.prompt.planLevel,
                diagramLayers: panel.prompt.diagramLayers
              })),
              metadata,
              kind
            );
          } else {
            enhancedPrompts = await generateAllPanelPrompts(
              state.currentProject.panels.map(p => p.prompt),
              state.currentProject.characters,
              state.currentProject.scenes
            );
          }

          const updatedPanels = state.currentProject.panels.map((panel, index) => ({
            ...panel,
            prompt: enhancedPrompts[index],
            isEdited: false,
            generatedImageUrl: undefined
          }));

          const updatedProject = {
            ...state.currentProject,
            panels: updatedPanels,
            updatedAt: new Date()
          };

          set({
            currentProject: updatedProject,
            projects: state.projects.map(p => 
              p.id === updatedProject.id ? updatedProject : p
            ),
            isGenerating: false
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to regenerate panels",
            isGenerating: false 
          });
        }
      },

      // Generate image for a specific panel
      generatePanelImage: async (panelId: string, quality?: GenerationQuality) => {
        const state = get();
        if (!state.currentProject) return;

        // Capture currentProject to avoid null checks in async callbacks
        const currentProject = state.currentProject;

        const panel = currentProject.panels.find(p => p.id === panelId);
        if (!panel) return;

        // Use provided quality or fall back to stored generation options
        const qualityTier = quality || state.generationOptions.generationQuality;

        console.log("[storyboardStore] generatePanelImage called for panel:", panelId);
        console.log("[storyboardStore] Quality tier:", qualityTier);
        console.log("[storyboardStore] Panel prompt data:", {
          generatedPrompt: panel.prompt.generatedPrompt,
          action: panel.prompt.action,
          sceneDescription: panel.prompt.sceneDescription,
          style: panel.prompt.style,
          composition: panel.prompt.composition
        });

        // Set panel as generating
        get().updatePanel(panelId, { isGenerating: true });

        try {
          console.log("[storyboardStore] Sending prompt to API:", panel.prompt.generatedPrompt);

          // Get characters for this panel to check for visual identity preservation
          const panelCharacterIds = panel.prompt.characters || [];
          const panelCharacters = currentProject.characters.filter(c =>
            panelCharacterIds.includes(c.id)
          );

          // Generate image using visual identity if available, otherwise standard text-to-image
          const { generateStoryboardPanelWithVisualIdentity } = await import('../api/stable-diffusion');
          const imageUrl = await generateStoryboardPanelWithVisualIdentity(
            panel.prompt.generatedPrompt,
            panelCharacters,
            qualityTier // Pass quality tier (standard/high)
          );

          console.log("[storyboardStore] Received image URL, length:", imageUrl.length);

          // Update panel with generated image
          get().updatePanel(panelId, {
            generatedImageUrl: imageUrl,
            isGenerating: false,
            lastGenerated: new Date()
          });

          // If this is the first panel and project doesn't have a thumbnail, set it
          const currentState = get();
          if (panel.panelNumber === 1 && currentState.currentProject && !currentState.currentProject.thumbnailUrl) {
            console.log("[storyboardStore] Setting project thumbnail from first panel");
            get().updateProject(currentState.currentProject.id, {
              thumbnailUrl: imageUrl
            });
          }
        } catch (error) {
          console.error("[storyboardStore] Panel image generation error:", error);
          get().updatePanel(panelId, {
            isGenerating: false
          });
          set({
            error: error instanceof Error ? error.message : "Failed to generate panel image"
          });
        }
      },

      // Generate images for all panels
      generateAllPanelImages: async (quality?: GenerationQuality) => {
        const state = get();
        if (!state.currentProject) return;

        // Capture currentProject to avoid null checks in async callbacks
        const currentProject = state.currentProject;

        // Use provided quality or fall back to stored generation options
        const qualityTier = quality || state.generationOptions.generationQuality;

        console.log("[storyboardStore] generateAllPanelImages called with quality:", qualityTier);

        set({ isGenerating: true });

        try {
          // Import the visual identity function
          const { generateStoryboardPanelWithVisualIdentity } = await import('../api/stable-diffusion');

          // Generate images for all panels in parallel
          const imagePromises = currentProject.panels.map(async (panel) => {
            try {
              // Get characters for this panel to check for visual identity preservation
              const panelCharacterIds = panel.prompt.characters || [];
              const panelCharacters = currentProject.characters.filter(c =>
                panelCharacterIds.includes(c.id)
              );

              // Generate image using visual identity if available, otherwise standard text-to-image
              const imageUrl = await generateStoryboardPanelWithVisualIdentity(
                panel.prompt.generatedPrompt,
                panelCharacters,
                qualityTier // Pass quality tier (standard/high)
              );
              return { panelId: panel.id, imageUrl };
            } catch (error) {
              console.error(`Failed to generate image for panel ${panel.id}:`, error);
              return { panelId: panel.id, imageUrl: null, error };
            }
          });

          const results = await Promise.all(imagePromises);

          // Update panels with generated images
          const updatedPanels = currentProject.panels.map(panel => {
            const result = results.find(r => r.panelId === panel.id);
            return {
              ...panel,
              generatedImageUrl: result?.imageUrl || undefined,
              isGenerating: false,
              lastGenerated: result?.imageUrl ? new Date() : undefined
            };
          });

          const updatedProject = {
            ...currentProject,
            panels: updatedPanels,
            updatedAt: new Date()
          };

          set({
            currentProject: updatedProject,
            projects: state.projects.map(p => 
              p.id === updatedProject.id ? updatedProject : p
            ),
            isGenerating: false
          });

          // Check for any errors
          const errors = results.filter(r => r.error).map(r => r.error);
          if (errors.length > 0) {
            set({ 
              error: `Failed to generate ${errors.length} panel images`
            });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to generate panel images",
            isGenerating: false 
          });
        }
      },

      // Save current project
      saveProject: async () => {
        const state = get();
        if (!state.currentProject) return;

        set({ isLoading: true });

        try {
          // Update the project in the projects array
          const updatedProjects = state.projects.map(p =>
            p.id === state.currentProject!.id
              ? { ...state.currentProject!, updatedAt: new Date() }
              : p
          );

          set({ 
            projects: updatedProjects,
            currentProject: { ...state.currentProject, updatedAt: new Date() },
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to save project",
            isLoading: false 
          });
        }
      },

      // Load a specific project
      loadProject: (projectId: string) => {
        const state = get();
        const project = state.projects.find(p => p.id === projectId);
        if (project) {
          set({ currentProject: project });
        }
      },

      // Set error message
      setError: (error: string | null) => {
        set({ error });
      },

      // Update generation options
      setGenerationOptions: (options: Partial<GenerationOptions>) => {
        set(state => ({
          generationOptions: { ...state.generationOptions, ...options }
        }));
      },

      // Clear current project
      clearCurrentProject: () => {
        set({ currentProject: null });
      }
    }),
    {
      name: "storyboard-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist projects and user preferences, not UI state
      partialize: (state) => ({
        projects: state.projects,
        defaultStyle: state.defaultStyle,
        generationOptions: state.generationOptions
      }),
      onRehydrateStorage: () => (state) => {
        console.log('[storyboardStore] Rehydration complete, projects loaded:', state?.projects.length || 0);
      }
    }
  )
);

// Selector hooks for better performance
export const useCurrentProject = () => useStoryboardStore(state => state.currentProject);
export const useProjects = () => useStoryboardStore(state => state.projects);
export const useIsGenerating = () => useStoryboardStore(state => state.isGenerating);
export const useStoryboardError = () => useStoryboardStore(state => state.error);
export const useGenerationOptions = () => useStoryboardStore(state => state.generationOptions);
