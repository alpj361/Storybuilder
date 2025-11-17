import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, Image, Alert, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { useCurrentProject, useProjects, useStoryboardStore } from "../state/storyboardStore";
import {
  StoryboardPanel as StoryboardPanelType,
  ProjectType,
  ArchitecturalProjectKind,
  Character,
  GenerationQuality
} from "../types/storyboard";
import StoryboardInputModal from "../components/StoryboardInputModal";
import PromptPreview from "../components/PromptPreview";
import CharacterTag from "../components/CharacterTag";
import { CharacterDetailsModal } from "../components/CharacterDetailsModal";
import { CharacterEditModal } from "../components/CharacterEditModal";
import { ProjectSelectorModal } from "../components/ProjectSelectorModal";
import PanelIdeaEditModal from "../components/PanelIdeaEditModal";

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
  onCharacterPress?: (character: Character) => void;
}

const StoryboardPanel: React.FC<StoryboardPanelProps> = ({ panel, panelNumber, mode, onCharacterPress }) => {
  const currentProject = useCurrentProject();
  const generatePanelImage = useStoryboardStore(state => state.generatePanelImage);
  const updatePanelPrompt = useStoryboardStore(state => state.updatePanelPrompt);
  const regeneratePanelPromptFromIdea = useStoryboardStore(state => state.regeneratePanelPromptFromIdea);
  const isArchitectural = mode === "architectural";
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [showIdeaEditModal, setShowIdeaEditModal] = useState(false);
  const [showQualitySelector, setShowQualitySelector] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<GenerationQuality>(GenerationQuality.STANDARD);
  
  if (!panel) {
    return (
      <View className="bg-white border border-gray-300 rounded-xl p-4 min-h-[220px] shadow-sm">
        {/* Panel Header */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-sm font-semibold text-gray-600">Panel {panelNumber}</Text>
        </View>

        {/* Drawing Area */}
        <View className="h-36 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 justify-center items-center">
          <Ionicons name="images-outline" size={48} color="#9CA3AF" />
          <Text className="text-gray-500 text-sm font-medium mt-3">
            {isArchitectural ? "No detail yet" : "No panel yet"}
          </Text>
          <Text className="text-gray-400 text-xs mt-1.5">
            {isArchitectural ? "Create a detail set to start" : "Create a storyboard to start"}
          </Text>
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

    // If no image exists yet, show quality selector first
    if (!panel.generatedImageUrl && !showQualitySelector) {
      setShowQualitySelector(true);
      return;
    }

    try {
      await generatePanelImage(panel.id, selectedQuality);
      setShowQualitySelector(false);
    } catch (error) {
      Alert.alert("Error", "Failed to generate image for this panel");
    }
  };

  return (
    <View className="flex-1 bg-white border border-gray-300 rounded-lg m-1 p-4 min-h-[200px]">
      {/* Panel Header */}
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-sm font-semibold text-gray-600">Panel {panelNumber}</Text>
        {panel.isGenerating && (
          <View className="flex-row items-center bg-blue-50 px-2 py-1 rounded">
            <Ionicons name="hourglass" size={12} color="#3B82F6" />
            <Text className="text-blue-600 text-xs font-medium ml-1">Generating...</Text>
          </View>
        )}
      </View>

      {/* Action Buttons - More visible */}
      <View className="flex-row gap-2 mb-3">
        <Pressable
          onPress={() => setShowIdeaEditModal(true)}
          disabled={panel.isGenerating}
          className={`flex-1 px-3 py-2 rounded-lg flex-row items-center justify-center ${
            panel.isGenerating ? 'bg-gray-100 border border-gray-200' : 'bg-blue-50 border border-blue-300'
          }`}
        >
          <Ionicons
            name="pencil"
            size={14}
            color={panel.isGenerating ? "#9CA3AF" : "#3B82F6"}
          />
          <Text className={`text-xs font-semibold ml-1 ${
            panel.isGenerating ? 'text-gray-400' : 'text-blue-600'
          }`}>
            Edit Idea
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            if (panel.generatedImageUrl) {
              // For regeneration, show quality selector
              setShowQualitySelector(true);
            } else {
              handleGenerateImage();
            }
          }}
          disabled={panel.isGenerating}
          className={`flex-1 px-3 py-2 rounded-lg flex-row items-center justify-center ${
            panel.isGenerating ? 'bg-gray-100 border border-gray-200' : 'bg-purple-50 border border-purple-300'
          }`}
        >
          <Ionicons
            name={panel.generatedImageUrl ? "refresh" : "image"}
            size={14}
            color={panel.isGenerating ? "#9CA3AF" : "#9333ea"}
          />
          <Text className={`text-xs font-semibold ml-1 ${
            panel.isGenerating ? 'text-gray-400' : 'text-purple-600'
          }`}>
            {panel.generatedImageUrl ? "Regenerate" : "Generate"}
          </Text>
        </Pressable>
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
              <CharacterTag
                key={character.id}
                character={character}
                size="small"
                onPress={onCharacterPress ? () => onCharacterPress(character) : undefined}
              />
            ))}
          </View>
        )
      )}
      
      {/* Drawing Area */}
      <View className="bg-gray-50 rounded border-2 border-dashed border-gray-300 overflow-hidden relative">
        {panel.isGenerating ? (
          <View className="h-28 flex-col items-center justify-center">
            <Ionicons name="hourglass" size={32} color="#3B82F6" />
            <Text className="text-blue-500 text-xs mt-2">Generating image...</Text>
          </View>
        ) : showQualitySelector ? (
          <View className="p-3 min-h-[112px]">
            <Text className="text-sm font-semibold text-gray-800 mb-2">
              {panel.generatedImageUrl ? "Regenerate with:" : "Select Quality:"}
            </Text>
            <View className="flex-row gap-2 mb-3">
              <Pressable
                onPress={() => setSelectedQuality(GenerationQuality.STANDARD)}
                className={`flex-1 p-2.5 rounded-lg border-2 ${
                  selectedQuality === GenerationQuality.STANDARD
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-white border-gray-300'
                }`}
              >
                <View className="flex-row items-center justify-center mb-0.5">
                  <Ionicons
                    name={selectedQuality === GenerationQuality.STANDARD ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color={selectedQuality === GenerationQuality.STANDARD ? '#3b82f6' : '#9ca3af'}
                  />
                  <Text className={`text-xs font-bold ml-1 ${
                    selectedQuality === GenerationQuality.STANDARD ? 'text-blue-700' : 'text-gray-600'
                  }`}>
                    Gama Baja
                  </Text>
                </View>
                <Text className={`text-[10px] text-center ${
                  selectedQuality === GenerationQuality.STANDARD ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  Stable Diffusion
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setSelectedQuality(GenerationQuality.HIGH)}
                className={`flex-1 p-2.5 rounded-lg border-2 ${
                  selectedQuality === GenerationQuality.HIGH
                    ? 'bg-purple-50 border-purple-500'
                    : 'bg-white border-gray-300'
                }`}
              >
                <View className="flex-row items-center justify-center mb-0.5">
                  <Ionicons
                    name={selectedQuality === GenerationQuality.HIGH ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color={selectedQuality === GenerationQuality.HIGH ? '#9333ea' : '#9ca3af'}
                  />
                  <Text className={`text-xs font-bold ml-1 ${
                    selectedQuality === GenerationQuality.HIGH ? 'text-purple-700' : 'text-gray-600'
                  }`}>
                    Gama Alta
                  </Text>
                </View>
                <Text className={`text-[10px] text-center ${
                  selectedQuality === GenerationQuality.HIGH ? 'text-purple-600' : 'text-gray-500'
                }`}>
                  Seeddream 4
                </Text>
              </Pressable>
            </View>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setShowQualitySelector(false)}
                className="flex-1 px-3 py-2 bg-gray-200 rounded-lg"
              >
                <Text className="text-gray-700 text-xs font-semibold text-center">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleGenerateImage}
                className="flex-1 px-3 py-2 bg-purple-600 rounded-lg"
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons name="sparkles" size={12} color="#FFFFFF" />
                  <Text className="text-white text-xs font-semibold ml-1">
                    {panel.generatedImageUrl ? "Regenerate" : "Generate"}
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        ) : panel.generatedImageUrl ? (
          <View className="h-28">
            <Image
              source={{ uri: panel.generatedImageUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
            <Pressable
              onPress={() => setIsImageExpanded(true)}
              className="absolute right-2 top-2 bg-black/50 rounded-full p-1"
            >
              <Ionicons name="expand" size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <View className="h-28 flex-col items-center justify-center px-3">
            <Ionicons name="image-outline" size={28} color="#9CA3AF" />
            <Text className="text-gray-500 text-xs font-medium mt-2">Ready to generate</Text>
            <Pressable
              onPress={handleGenerateImage}
              className="mt-2 px-4 py-2 bg-purple-600 rounded-lg"
            >
              <View className="flex-row items-center">
                <Ionicons name="sparkles" size={14} color="#FFFFFF" />
                <Text className="text-white text-xs font-semibold ml-1">Generate Image</Text>
              </View>
            </Pressable>
          </View>
        )}
      </View>

      {/* Fullscreen image modal */}
      {panel.generatedImageUrl && (
        <Modal visible={isImageExpanded} animationType="fade" transparent onRequestClose={() => setIsImageExpanded(false)}>
          <View className="flex-1 bg-black/90">
            <Pressable onPress={() => setIsImageExpanded(false)} className="absolute top-10 right-5 z-10 p-2 bg-black/60 rounded-full">
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </Pressable>
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center" }}
              minimumZoomScale={1}
              maximumZoomScale={4}
              centerContent
            >
              <Image
                source={{ uri: panel.generatedImageUrl }}
                style={{ width: "100%", height: undefined, aspectRatio: 1 }}
                resizeMode="contain"
              />
            </ScrollView>
          </View>
        </Modal>
      )}
      
      {/* Prompt Preview */}
      {scene && (
        <View className="mt-3">
          <PromptPreview
            prompt={panel.prompt}
            characters={panelCharacters}
            scene={scene}
            mode={mode}
            metadata={architecturalMetadata}
            onPromptSave={(newPrompt) => {
              updatePanelPrompt(panel.id, newPrompt);
              Alert.alert(
                "Prompt Updated",
                "The panel prompt has been updated. Click 'Generate Image' to regenerate with the new prompt.",
                [{ text: "OK" }]
              );
            }}
          />
        </View>
      )}

      {/* Panel Idea Edit Modal */}
      <PanelIdeaEditModal
        visible={showIdeaEditModal}
        onClose={() => setShowIdeaEditModal(false)}
        panelNumber={panel.panelNumber}
        currentIdea={panel.prompt.sceneDescription}
        onSave={async (newIdea) => {
          try {
            await regeneratePanelPromptFromIdea(panel.id, newIdea);
            Alert.alert(
              "Prompt Regenerated",
              "The panel prompt has been regenerated from your new idea. You can review and edit it, then click 'Generate Image' to create a new image.",
              [{ text: "OK" }]
            );
          } catch (error) {
            Alert.alert(
              "Error",
              "Failed to regenerate prompt. Please try again.",
              [{ text: "OK" }]
            );
          }
        }}
      />
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
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [showCharacterEditModal, setShowCharacterEditModal] = useState(false);
  const isFocused = useIsFocused();
  const currentProject = useCurrentProject();
  const projects = useProjects();
  const clearCurrentProject = useStoryboardStore(state => state.clearCurrentProject);
  const generateAllPanelImages = useStoryboardStore(state => state.generateAllPanelImages);
  const isGenerating = useStoryboardStore(state => state.isGenerating);
  const setCurrentProject = useStoryboardStore(state => state.setCurrentProject);
  const updateCharacter = useStoryboardStore(state => state.updateCharacter);

  // Handler for opening character details modal
  const handleCharacterPress = (character: Character) => {
    setSelectedCharacter(character);
    setShowCharacterModal(true);
  };

  // Handler for opening character edit modal
  const handleEditCharacter = (character: Character) => {
    setSelectedCharacter(character);
    setShowCharacterModal(false);
    setShowCharacterEditModal(true);
  };

  // Handler for saving character edits
  const handleSaveCharacter = (character: Character) => {
    updateCharacter(character.id, character);
  };

  // Calculate which panels a character appears in
  const getCharacterPanelNumbers = (characterId: string): number[] => {
    if (!currentProject) return [];
    return currentProject.panels
      .filter(panel => panel.prompt.characters.includes(characterId))
      .map(panel => panel.panelNumber)
      .sort((a, b) => a - b);
  };

  useEffect(() => {
    // Only adjust current project when this tab/screen is focused
    if (!isFocused || projects.length === 0) return;

    if (isArchitectural) {
      if (currentProject?.projectType === ProjectType.ARCHITECTURAL) return;

      const architecturalProject = [...projects]
        .filter(project => project.projectType === ProjectType.ARCHITECTURAL)
        .pop();

      if (architecturalProject && architecturalProject.id !== currentProject?.id) {
        setCurrentProject(architecturalProject);
      }
    } else {
      if (!currentProject || currentProject.projectType === ProjectType.ARCHITECTURAL) {
        const storyboardProject = [...projects]
          .filter(project => project.projectType !== ProjectType.ARCHITECTURAL)
          .pop();

        if (storyboardProject && storyboardProject.id !== currentProject?.id) {
          setCurrentProject(storyboardProject);
        }
      }
    }
  }, [isFocused, isArchitectural, currentProject?.id, currentProject?.projectType, projects, setCurrentProject]);

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

  const handleSelectProject = (project: any) => {
    setCurrentProject(project);
  };

  const handleCreateNewFromSelector = () => {
    setShowInputModal(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row justify-between items-center">
          <Pressable onPress={() => setShowProjectSelector(true)} className="flex-1">
            <Text className="text-xl font-bold text-gray-900">{title}</Text>
            <View className="flex-row items-center">
              <Text className="text-sm text-gray-500">
                {activeProject?.title || "No Project"}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#6B7280" style={{ marginLeft: 4 }} />
            </View>
          </Pressable>
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
                    <CharacterTag
                      key={character.id}
                      character={character}
                      size="medium"
                      onPress={() => handleCharacterPress(character)}
                    />
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
                  onCharacterPress={handleCharacterPress}
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

      {/* Character Details Modal */}
      <CharacterDetailsModal
        visible={showCharacterModal}
        onClose={() => {
          setShowCharacterModal(false);
          setSelectedCharacter(null);
        }}
        character={selectedCharacter}
        panelNumbers={selectedCharacter ? getCharacterPanelNumbers(selectedCharacter.id) : []}
        onEdit={handleEditCharacter}
      />

      {/* Character Edit Modal */}
      <CharacterEditModal
        visible={showCharacterEditModal}
        onClose={() => {
          setShowCharacterEditModal(false);
          setSelectedCharacter(null);
        }}
        character={selectedCharacter}
        onSave={handleSaveCharacter}
        mode="edit"
      />

      {/* Project Selector Modal */}
      <ProjectSelectorModal
        visible={showProjectSelector}
        onClose={() => setShowProjectSelector(false)}
        currentProjectType={isArchitectural ? ProjectType.ARCHITECTURAL : ProjectType.STORYBOARD}
        onSelectProject={handleSelectProject}
        onCreateNew={handleCreateNewFromSelector}
      />
    </SafeAreaView>
  );
}
