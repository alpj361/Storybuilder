import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { 
  StoryboardProject, 
  StoryboardPanel, 
  StoryboardPrompt,
  StoryboardStyle,
  GenerationOptions,
  ProjectType,
  ArchitecturalMetadata,
  ArchitecturalProjectKind
} from "../types/storyboard";
import { parseUserInput } from "../services/promptParser";
import { generateAllPanelPrompts, applyAudienceTemplate, AUDIENCE_TEMPLATES } from "../templates/storyboardTemplates";
import { parseArchitecturalInput } from "../services/architecturalParser";
import { generateArchitecturalPanelPrompts, mergeArchitecturalMetadata, getDefaultArchitecturalMetadata } from "../templates/architecturalTemplates";
import { generateDraftStoryboardImage } from "../api/stable-diffusion";
import { v4 as uuidv4 } from "uuid";

interface StoryboardState {
  // Current project state
  currentProject: StoryboardProject | null;
  projects: StoryboardProject[];
  
  // UI state
  isGenerating: boolean;
  isLoading: boolean;
  error: string | null;
  
  // User preferences
  defaultStyle: StoryboardStyle;
  generationOptions: GenerationOptions;
  
  // Actions
  createProjectFromInput: (input: string) => Promise<void>;
  createArchitecturalProjectFromInput: (input: string, options?: { kind?: ArchitecturalProjectKind }) => Promise<void>;
  appendPanelsFromInput: (input: string, options?: { count?: number }) => Promise<void>;
  appendArchitecturalPanelsFromInput: (input: string, options?: { count?: number; kind?: ArchitecturalProjectKind }) => Promise<void>;
  updatePanel: (panelId: string, updates: Partial<StoryboardPanel>) => void;
  updateProject: (projectId: string, updates: Partial<StoryboardProject>) => void;
  deleteProject: (projectId: string) => void;
  setCurrentProject: (project: StoryboardProject | null) => void;
  regeneratePanel: (panelId: string) => Promise<void>;
  regenerateAllPanels: () => Promise<void>;
  generatePanelImage: (panelId: string) => Promise<void>;
  generateAllPanelImages: () => Promise<void>;
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
  maintainCharacterConsistency: true
};

export const useStoryboardStore = create<StoryboardState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentProject: null,
      projects: [],
      isGenerating: false,
      isLoading: false,
      error: null,
      defaultStyle: StoryboardStyle.ROUGH_SKETCH,
      generationOptions: defaultGenerationOptions,

      // Create a new project from natural language input
      createProjectFromInput: async (input: string) => {
        set({ isGenerating: true, error: null });
        
        try {
          const result = await parseUserInput(input);
          
          if (result.success) {
            // Apply audience-specific template first, then generate prompts
            const audience = result.project.metadata.targetAudience;
            const audienceStyle = AUDIENCE_TEMPLATES[audience]?.style_preference ?? get().defaultStyle;

            const audiencePreparedPanels = result.project.panels.map(panel => ({
              ...panel,
              prompt: applyAudienceTemplate({
                ...panel.prompt,
                style: audienceStyle
              }, audience)
            }));

            // Check if panels already have contextual prompts (from enhanced parser)
            const hasContextualPrompts = audiencePreparedPanels.some(panel => 
              panel.prompt.generatedPrompt && 
              panel.prompt.generatedPrompt.length > 0 &&
              !panel.prompt.generatedPrompt.includes("Wide establishing shot of generic setting")
            );

            let finalPanels;
            
            if (hasContextualPrompts) {
              // Use the contextual prompts that were already generated
              finalPanels = audiencePreparedPanels;
            } else {
              // Fallback to template-based prompt generation for backward compatibility
              const enhancedPrompts = generateAllPanelPrompts(
                audiencePreparedPanels.map(p => p.prompt),
                result.project.characters,
                result.project.scenes
              );

              finalPanels = audiencePreparedPanels.map((panel, index) => ({
                ...panel,
                prompt: enhancedPrompts[index]
              }));
            }

            const finalProject: StoryboardProject = {
              ...result.project,
              panels: finalPanels,
              style: audienceStyle,
              projectType: ProjectType.STORYBOARD
            };

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
          set({ 
            error: error instanceof Error ? error.message : "Unknown error occurred",
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
          const generatedPrompts = generateAllPanelPrompts(preparedPrompts, mergedCharacters, mergedScenes);

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

      // Delete a project
      deleteProject: (projectId: string) => {
        set(state => ({
          projects: state.projects.filter(p => p.id !== projectId),
          currentProject: state.currentProject?.id === projectId 
            ? null 
            : state.currentProject
        }));
      },

      // Set current active project
      setCurrentProject: (project: StoryboardProject | null) => {
        const current = get().currentProject;
        if ((current?.id || null) === (project?.id || null)) return;
        set({ currentProject: project });
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
            updatedPrompt = generateAllPanelPrompts(
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
            enhancedPrompts = generateAllPanelPrompts(
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
      generatePanelImage: async (panelId: string) => {
        const state = get();
        if (!state.currentProject) return;

        const panel = state.currentProject.panels.find(p => p.id === panelId);
        if (!panel) return;

        // Set panel as generating
        get().updatePanel(panelId, { isGenerating: true });

        try {
          const imageUrl = await generateDraftStoryboardImage(panel.prompt.generatedPrompt);
          
          // Update panel with generated image
          get().updatePanel(panelId, {
            generatedImageUrl: imageUrl,
            isGenerating: false,
            lastGenerated: new Date()
          });
        } catch (error) {
          console.error("Panel image generation error:", error);
          get().updatePanel(panelId, { 
            isGenerating: false 
          });
          set({ 
            error: error instanceof Error ? error.message : "Failed to generate panel image"
          });
        }
      },

      // Generate images for all panels
      generateAllPanelImages: async () => {
        const state = get();
        if (!state.currentProject) return;

        set({ isGenerating: true });

        try {
          // Generate images for all panels in parallel
          const imagePromises = state.currentProject.panels.map(async (panel) => {
            try {
              const imageUrl = await generateDraftStoryboardImage(panel.prompt.generatedPrompt);
              return { panelId: panel.id, imageUrl };
            } catch (error) {
              console.error(`Failed to generate image for panel ${panel.id}:`, error);
              return { panelId: panel.id, imageUrl: null, error };
            }
          });

          const results = await Promise.all(imagePromises);

          // Update panels with generated images
          const updatedPanels = state.currentProject.panels.map(panel => {
            const result = results.find(r => r.panelId === panel.id);
            return {
              ...panel,
              generatedImageUrl: result?.imageUrl || undefined,
              isGenerating: false,
              lastGenerated: result?.imageUrl ? new Date() : undefined
            };
          });

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
      })
    }
  )
);

// Selector hooks for better performance
export const useCurrentProject = () => useStoryboardStore(state => state.currentProject);
export const useProjects = () => useStoryboardStore(state => state.projects);
export const useIsGenerating = () => useStoryboardStore(state => state.isGenerating);
export const useStoryboardError = () => useStoryboardStore(state => state.error);
export const useGenerationOptions = () => useStoryboardStore(state => state.generationOptions);
