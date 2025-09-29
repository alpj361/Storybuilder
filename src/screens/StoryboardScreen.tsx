import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useCurrentProject, useProjects, useStoryboardStore } from "../state/storyboardStore";
import {
  StoryboardPanel as StoryboardPanelType,
  ProjectType,
  ArchitecturalProjectKind
} from "../types/storyboard";
import StoryboardInputModal from "../components/StoryboardInputModal";
import PromptPreview from "../components/PromptPreview";
import CharacterTag from "../components/CharacterTag";

const Chip: React.FC<{ label: string; tone?: "blue" | "gray" }> = ({ label, tone = "blue" }) => (
  <View
    className={
      tone === "blue"
        ? "px-2 py-1 bg-blue-100 rounded-full mr-1 mb-1"
        : "px-2 py-1 bg-gray-100 rounded-full mr-1 mb-1"
    }
  >
    <Text className={tone === "blue" ? "text-blue-700 text-xs" : "text-gray-600 text-xs"}>{label}</Text>
  </View>
);

interface StoryboardPanelProps {
  panel?: StoryboardPanelType;
  panelNumber: number;
  mode: "storyboard" | "architectural";
}

const StoryboardPanel: React.FC<StoryboardPanelProps> = ({ panel, panelNumber, mode }) => {
  const currentProject = useCurrentProject();
  const generatePanelImage = useStoryboardStore(state => state.generatePanelImage);
  const isArchitectural = mode === "architectural";
  
  if (!panel) {
    return (
      <View className="flex-1 bg-white border border-gray-300 rounded-lg m-1 p-4 min-h-[200px]">
        {/* Panel Header */}
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-sm font-semibold text-gray-600">Panel {panelNumber}</Text>
          <Ionicons name="ellipsis-horizontal" size={16} color="#6B7280" />
        </View>
        
        {/* Drawing Area */}
        <View className="flex-1 bg-gray-50 rounded border-2 border-dashed border-gray-300 justify-center items-center">
          <Ionicons name="camera-outline" size={32} color="#9CA3AF" />
          <Text className="text-gray-400 text-xs mt-2">
            {isArchitectural ? "Generate detail first" : "Generate storyboard first"}
          </Text>
        </View>
        
        {/* Notes Section */}
        <View className="mt-3 p-2 bg-gray-50 rounded">
          <Text className="text-xs text-gray-500 mb-1">Notes:</Text>
          <Text className="text-xs text-gray-400">No prompt generated yet</Text>
        </View>
      </View>
    );
  }

  const panelCharacters = isArchitectural
    ? []
    : currentProject?.characters.filter(char => panel.prompt.characters.includes(char.id)) || [];

  const architecturalMetadata = currentProject?.architecturalMetadata;
  const panelComponents = Array.from(new Set(panel.prompt.components || architecturalMetadata?.components || []));
  const panelView = panel.prompt.viewType;
  const panelScale = panel.prompt.scale || architecturalMetadata?.scale;
  const panelDetail = panel.prompt.detailLevel;

  const scene = currentProject?.scenes.find(s => s.id === panel.prompt.sceneId) || 
    currentProject?.scenes[0];

  const handleGenerateImage = async () => {
    if (!panel) return;
    
    try {
      await generatePanelImage(panel.id);
    } catch (error) {
      Alert.alert("Error", "Failed to generate image for this panel");
    }
  };

  return (
    <View className="flex-1 bg-white border border-gray-300 rounded-lg m-1 p-4 min-h-[200px]">
      {/* Panel Header */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-sm font-semibold text-gray-600">Panel {panelNumber}</Text>
        <View className="flex-row items-center space-x-2">
          {panel.isGenerating && (
            <Ionicons name="hourglass" size={14} color="#3B82F6" />
          )}
          <Pressable onPress={handleGenerateImage} disabled={panel.isGenerating}>
            <Ionicons 
              name={panel.generatedImageUrl ? "refresh" : "camera"} 
              size={16} 
              color={panel.isGenerating ? "#9CA3AF" : "#3B82F6"} 
            />
          </Pressable>
          <Ionicons name="ellipsis-horizontal" size={16} color="#6B7280" />
        </View>
      </View>
      
      {/* Tags */}
      {isArchitectural ? (
        <View className="flex-row flex-wrap mb-3">
          {panelView && <Chip label={panelView.replace(/_/g, " ")} />}
          {panelDetail && <Chip label={panelDetail.replace(/_/g, " ")} tone="gray" />}
          {panelScale && <Chip label={`Scale ${panelScale}`} tone="gray" />}
          {panel.prompt.planLevel && <Chip label={panel.prompt.planLevel} tone="gray" />}
          {panelComponents.map(component => (
            <Chip key={component} label={component} tone="gray" />
          ))}
          {panel.prompt.diagramLayers?.map(layer => (
            <Chip key={layer} label={`${layer} diagram`} tone="gray" />
          ))}
        </View>
      ) : (
        panelCharacters.length > 0 && (
          <View className="flex-row flex-wrap gap-1 mb-3">
            {panelCharacters.map(character => (
              <CharacterTag key={character.id} character={character} size="small" />
            ))}
          </View>
        )
      )}
      
      {/* Drawing Area */}
      <View className="flex-1 bg-gray-50 rounded border-2 border-dashed border-gray-300 justify-center items-center overflow-hidden">
        {panel.generatedImageUrl ? (
          <Image 
            source={{ uri: panel.generatedImageUrl }} 
            className="w-full h-full rounded"
            resizeMode="cover"
          />
        ) : panel.isGenerating ? (
          <View className="flex-col items-center">
            <Ionicons name="hourglass" size={32} color="#3B82F6" />
            <Text className="text-blue-500 text-xs mt-2">Generating image...</Text>
          </View>
        ) : (
          <View className="flex-col items-center">
            <Ionicons name="image-outline" size={32} color="#9CA3AF" />
            <Text className="text-gray-400 text-xs mt-2">Ready for image generation</Text>
            <Pressable 
              onPress={handleGenerateImage}
              className="mt-2 px-3 py-1 bg-blue-500 rounded-full"
            >
              <Text className="text-white text-xs font-medium">Generate</Text>
            </Pressable>
          </View>
        )}
      </View>
      
      {/* Prompt Preview */}
      {scene && (
        <View className="mt-3">
          <PromptPreview 
            prompt={panel.prompt}
            characters={panelCharacters}
            scene={scene}
            mode={mode}
            metadata={architecturalMetadata}
          />
        </View>
      )}
    </View>
  );
};

interface StoryboardScreenProps {
  title?: string;
  mode?: "storyboard" | "architectural";
  architecturalKind?: ArchitecturalProjectKind;
  onArchitecturalKindChange?: (kind: ArchitecturalProjectKind) => void;
}

export default function StoryboardScreen({
  title: titleProp = "Storyboard",
  mode = "storyboard",
  architecturalKind = "detalles",
  onArchitecturalKindChange
}: StoryboardScreenProps) {
  const title = titleProp;
  const isArchitectural = mode === "architectural";
  const [showInputModal, setShowInputModal] = useState(false);
  const currentProject = useCurrentProject();
  const projects = useProjects();
  const clearCurrentProject = useStoryboardStore(state => state.clearCurrentProject);
  const generateAllPanelImages = useStoryboardStore(state => state.generateAllPanelImages);
  const isGenerating = useStoryboardStore(state => state.isGenerating);
  const setCurrentProject = useStoryboardStore(state => state.setCurrentProject);

  useEffect(() => {
    if (!isArchitectural) {
      if (currentProject && currentProject.projectType === ProjectType.ARCHITECTURAL) {
        const storyboardProject = [...projects]
          .filter(project => project.projectType !== ProjectType.ARCHITECTURAL)
          .pop();
        if (storyboardProject) {
          setCurrentProject(storyboardProject);
        }
      }
    } else {
      if (!currentProject || currentProject.projectType !== ProjectType.ARCHITECTURAL) {
        const architecturalProject = [...projects]
          .filter(project => project.projectType === ProjectType.ARCHITECTURAL)
          .pop();
        if (architecturalProject) {
          setCurrentProject(architecturalProject);
        }
      }
    }
  }, [currentProject, projects, isArchitectural, setCurrentProject]);

  const activeProject = useMemo(() => {
    if (!currentProject) return null;
    if (isArchitectural) {
      return currentProject.projectType === ProjectType.ARCHITECTURAL ? currentProject : null;
    }
    return currentProject.projectType === ProjectType.ARCHITECTURAL ? null : currentProject;
  }, [currentProject, isArchitectural]);

  const handleNewProject = () => {
    setShowInputModal(true);
  };

  const handleClearProject = () => {
    clearCurrentProject();
  };

  const handleGenerateAllImages = async () => {
    if (!activeProject) return;

    try {
      await generateAllPanelImages();
    } catch (error) {
      Alert.alert("Error", "Failed to generate images for all panels");
    }
  };

  const architecturalKindLabelMap: Record<ArchitecturalProjectKind, string> = {
    detalles: "Detail Set",
    planos: "Plan Set",
    prototipos: "Prototype"
  };

  const activeArchitecturalKind = activeProject?.architecturalProjectKind ?? architecturalKind;

  const placeholderCount = isArchitectural
    ? activeArchitecturalKind === "detalles"
      ? 2
      : activeArchitecturalKind === "planos"
        ? 3
        : 3
    : 4;

  const buttonLabel = isArchitectural
    ? activeProject
      ? `Generate New ${architecturalKindLabelMap[activeArchitecturalKind]}`
      : `Create Your First ${architecturalKindLabelMap[architecturalKind]}`
    : activeProject
      ? "Generate New Storyboard"
      : "Create Your First Storyboard";

  const displayPanels = useMemo(() => {
    if (activeProject?.panels?.length) return activeProject.panels;
    return new Array(placeholderCount).fill(undefined);
  }, [activeProject?.panels, placeholderCount]);

  const architecturalMetadata = activeProject?.architecturalMetadata;
  const showArchitecturalMetadata = isArchitectural && architecturalMetadata;

  const handleArchitecturalKindChange = (kind: ArchitecturalProjectKind) => {
    if (onArchitecturalKindChange) {
      onArchitecturalKindChange(kind);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-xl font-bold text-gray-900">{title}</Text>
            <Text className="text-sm text-gray-500">
              {activeProject?.title || "No Project"}
            </Text>
          </View>
          <View className="flex-row space-x-3">
            {activeProject && (
              <Pressable onPress={handleGenerateAllImages} disabled={isGenerating}>
                <Ionicons 
                  name="images-outline" 
                  size={24} 
                  color={isGenerating ? "#9CA3AF" : "#3B82F6"} 
                />
              </Pressable>
            )}
            <Pressable onPress={handleNewProject}>
              <Ionicons name="add-circle-outline" size={24} color="#3B82F6" />
            </Pressable>
            {activeProject && (
              <Pressable onPress={handleClearProject}>
                <Ionicons name="trash-outline" size={24} color="#6B7280" />
              </Pressable>
            )}
            <Ionicons name="settings-outline" size={24} color="#6B7280" />
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        {isArchitectural && (
          <View className="mb-4 bg-white border border-gray-200 rounded-lg p-3">
            <Text className="text-xs font-semibold text-gray-600 mb-2">Architectural Mode</Text>
            <View className="flex-row bg-gray-100 rounded-lg overflow-hidden">
              {([
                { key: "detalles", label: "Detalles" },
                { key: "planos", label: "Planos" },
                { key: "prototipos", label: "Prototipos" }
              ] as { key: ArchitecturalProjectKind; label: string }[]).map(option => {
                const isSelected = architecturalKind === option.key;
                return (
                  <Pressable
                    key={option.key}
                    className={`flex-1 py-2 items-center ${isSelected ? "bg-blue-500" : ""}`}
                    onPress={() => handleArchitecturalKindChange(option.key)}
                    disabled={onArchitecturalKindChange == null}
                  >
                    <Text className={`text-sm font-medium ${isSelected ? "text-white" : "text-gray-700"}`}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text className="text-xs text-gray-500 mt-2">
              {architecturalKind === "detalles" && "Generate technical connection or material details with reinforcement and annotations."}
              {architecturalKind === "planos" && "Produce plan sets with floor plans, sections, elevations, and legends."}
              {architecturalKind === "prototipos" && "Create conceptual prototypes with massing, program, and diagrammatic overlays."}
            </Text>
          </View>
        )}

        {/* Project Info */}
        {activeProject && (
          <View className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
            <Text className="text-sm font-semibold text-gray-700 mb-1">Project Description</Text>
            <Text className="text-sm text-gray-600 mb-3">{activeProject.description}</Text>

            {showArchitecturalMetadata ? (
              <View>
                <View className="flex-row flex-wrap mb-2">
                  <Chip label={architecturalKindLabelMap[activeProject.architecturalProjectKind ?? architecturalKind]} />
                  {architecturalMetadata?.scale && (
                    <Chip label={`Scale ${architecturalMetadata.scale}`} tone="gray" />
                  )}
                  <Chip
                    label={`${(architecturalMetadata?.unitSystem || "metric").toUpperCase()} units`}
                    tone="gray"
                  />
                  {architecturalMetadata?.standards?.map(standard => (
                    <Chip key={standard} label={standard} />
                  ))}
                </View>
                <View className="flex-row flex-wrap mb-2">
                  {architecturalMetadata?.levels?.map(level => (
                    <Chip key={level} label={level} tone="gray" />
                  ))}
                  {architecturalMetadata?.grids?.map(grid => (
                    <Chip key={grid} label={grid} tone="gray" />
                  ))}
                </View>
                {architecturalMetadata?.components?.length ? (
                  <View className="mb-2">
                    <Text className="text-xs font-semibold text-gray-600 mb-1">Components</Text>
                    <View className="flex-row flex-wrap">
                      {architecturalMetadata.components.map(component => (
                        <Chip key={component} label={component} tone="gray" />
                      ))}
                    </View>
                  </View>
                ) : null}
                {architecturalMetadata?.programItems?.length ? (
                  <View className="mb-2">
                    <Text className="text-xs font-semibold text-gray-600 mb-1">Program</Text>
                    <View className="flex-row flex-wrap">
                      {architecturalMetadata.programItems.map(item => (
                        <Chip key={item} label={item} tone="gray" />
                      ))}
                    </View>
                  </View>
                ) : null}
                {(architecturalMetadata?.buildingType || architecturalMetadata?.floors || architecturalMetadata?.footprint || architecturalMetadata?.orientation) && (
                  <View className="mb-2">
                    <Text className="text-xs font-semibold text-gray-600 mb-1">Prototype Info</Text>
                    {architecturalMetadata?.buildingType && (
                      <Text className="text-xs text-gray-500 mb-0.5">• Building Type: {architecturalMetadata.buildingType}</Text>
                    )}
                    {architecturalMetadata?.floors && (
                      <Text className="text-xs text-gray-500 mb-0.5">• Floors: {architecturalMetadata.floors}</Text>
                    )}
                    {architecturalMetadata?.footprint && (
                      <Text className="text-xs text-gray-500 mb-0.5">• Footprint: {architecturalMetadata.footprint}</Text>
                    )}
                    {architecturalMetadata?.orientation && (
                      <Text className="text-xs text-gray-500 mb-0.5">• Orientation: {architecturalMetadata.orientation}</Text>
                    )}
                  </View>
                )}
                {architecturalMetadata?.diagramLayers?.length ? (
                  <View className="mb-2">
                    <Text className="text-xs font-semibold text-gray-600 mb-1">Diagram Layers</Text>
                    <View className="flex-row flex-wrap">
                      {architecturalMetadata.diagramLayers.map(layer => (
                        <Chip key={layer} label={layer} tone="gray" />
                      ))}
                    </View>
                  </View>
                ) : null}
                {architecturalMetadata?.materials?.length ? (
                  <View className="mb-2">
                    <Text className="text-xs font-semibold text-gray-600 mb-1">Materials</Text>
                    <View className="flex-row flex-wrap">
                      {architecturalMetadata.materials.map(material => (
                        <Chip key={material} label={material} tone="gray" />
                      ))}
                    </View>
                  </View>
                ) : null}
                {architecturalMetadata?.dimensions?.length ? (
                  <View>
                    <Text className="text-xs font-semibold text-gray-600 mb-1">Key Dimensions</Text>
                    {architecturalMetadata.dimensions.map(dimension => (
                      <Text key={dimension} className="text-xs text-gray-500 mb-0.5">• {dimension}</Text>
                    ))}
                  </View>
                ) : null}
                {architecturalMetadata?.conceptNotes?.length ? (
                  <View className="mt-2">
                    <Text className="text-xs font-semibold text-gray-600 mb-1">Concept Notes</Text>
                    {architecturalMetadata.conceptNotes.map(note => (
                      <Text key={note} className="text-xs text-gray-500 mb-0.5">• {note}</Text>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : (
              activeProject.characters.length > 0 && (
                <View className="flex-row flex-wrap gap-1">
                  {activeProject.characters.map(character => (
                    <CharacterTag key={character.id} character={character} size="medium" />
                  ))}
                </View>
              )
            )}
          </View>
        )}

        {/* Panels Grid (dynamic) */}
        <View className="flex-1">
          <View className="flex-row flex-wrap -mx-1">
            {displayPanels.map((panel: StoryboardPanelType | undefined, idx: number) => (
              <View key={panel ? panel.id : `placeholder-${idx}`} className="w-1/2 px-1 mb-2">
                <StoryboardPanel 
                  panel={panel}
                  panelNumber={idx + 1}
                  mode={mode}
                />
              </View>
            ))}
          </View>
        </View>
        
        {/* Generate/Add More Panels Button */}
        <Pressable 
          onPress={handleNewProject}
          className="mt-6 p-4 bg-white rounded-lg border border-dashed border-gray-300"
        >
          <View className="flex-row justify-center items-center">
            <Ionicons 
              name={activeProject ? "refresh" : "add"} 
              size={20} 
              color="#3B82F6" 
            />
            <Text className="ml-2 text-blue-500 font-medium">
              {buttonLabel}
            </Text>
          </View>
        </Pressable>
      </ScrollView>

      {/* Input Modal */}
      <StoryboardInputModal 
        visible={showInputModal}
        onClose={() => setShowInputModal(false)}
        mode={mode}
        hasCurrentProject={!!activeProject}
        architecturalKind={architecturalKind}
        onArchitecturalKindChange={onArchitecturalKindChange}
      />
    </SafeAreaView>
  );
}
