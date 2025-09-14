import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { 
  StoryboardProject, 
  StoryboardPanel, 
  StoryboardStyle,
  GenerationOptions 
} from "../types/storyboard";
import { parseUserInput } from "../services/promptParser";
import { generateAllPanelPrompts } from "../templates/storyboardTemplates";
import { generateDraftStoryboardImage } from "../api/stable-diffusion";

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
            // Generate enhanced prompts for all panels
            const enhancedPanels = result.project.panels.map(panel => ({
              ...panel,
              prompt: {
                ...panel.prompt,
                style: get().defaultStyle
              }
            }));

            const enhancedPrompts = generateAllPanelPrompts(
              enhancedPanels.map(p => p.prompt),
              result.project.characters,
              result.project.scenes
            );

            // Update panels with generated prompts
            const finalPanels = enhancedPanels.map((panel, index) => ({
              ...panel,
              prompt: enhancedPrompts[index]
            }));

            const finalProject: StoryboardProject = {
              ...result.project,
              panels: finalPanels,
              style: get().defaultStyle
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

          // Regenerate the prompt using templates
          const enhancedPrompts = generateAllPanelPrompts(
            [panel.prompt],
            state.currentProject.characters,
            state.currentProject.scenes
          );

          const updatedPanel: StoryboardPanel = {
            ...panel,
            prompt: enhancedPrompts[0],
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
          const enhancedPrompts = generateAllPanelPrompts(
            state.currentProject.panels.map(p => p.prompt),
            state.currentProject.characters,
            state.currentProject.scenes
          );

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