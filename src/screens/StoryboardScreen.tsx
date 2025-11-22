import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, Image, Alert, Modal, InteractionManager } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useCurrentProject, useProjects, useStoryboardStore } from "../state/storyboardStore";
import {
  StoryboardPanel as StoryboardPanelType,
  ProjectType,
  ArchitecturalProjectKind,
  Character,
  Location,
  GenerationQuality
} from "../types/storyboard";
import StoryboardInputModal from "../components/StoryboardInputModal";
import PromptPreview from "../components/PromptPreview";
import CharacterTag from "../components/CharacterTag";
import LocationTag from "../components/LocationTag";
import { CharacterDetailsModal } from "../components/CharacterDetailsModal";
import { CharacterEditModal } from "../components/CharacterEditModal";
import { LocationDetailsModal } from "../components/LocationDetailsModal";
import { LocationEditModal } from "../components/LocationEditModal";
import LocationLibraryModal from "../components/LocationLibraryModal";
import TagsManagementModal from "../components/TagsManagementModal";
import { ImageEditModal } from "../components/ImageEditModal";
import { ProjectSelectorModal } from "../components/ProjectSelectorModal";
import PanelIdeaEditModal from "../components/PanelIdeaEditModal";
import ExportOptionsModal from "../components/ExportOptionsModal";
import pdfExportService from "../services/pdfExportService";
import { ExportOptions } from "../types/export";

const waitForNextFrame = () => new Promise(resolve => requestAnimationFrame(() => resolve(null)));
const waitForInteractionsToFinish = () =>
  new Promise(resolve => InteractionManager.runAfterInteractions(() => resolve(null)));
// Increased delay to 1000ms to prevent Share Sheet freezing on iOS
const waitForIosWindowCleanup = () => new Promise(resolve => setTimeout(resolve, 1000));

const Chip: React.FC<{ label: string; tone?: "blue" | "gray" }> = ({ label, tone = "blue" }) => (
  <View
    className={
      tone === "blue"
        ? "px-3 py-2 bg-blue-100 rounded-full border border-blue-200"
        : "px-3 py-2 bg-gray-100 rounded-full border border-gray-200"
    }
  >
    <Text className={tone === "blue" ? "text-blue-700 text-sm font-medium" : "text-gray-700 text-sm font-medium"}>{label}</Text>
  </View>
);

interface StoryboardPanelProps {
  panel?: StoryboardPanelType;
  panelNumber: number;
  mode: "storyboard" | "architectural";
  onCharacterPress?: (character: Character) => void;
  onLocationPress?: (location: Location) => void;
  onManageTags?: (panelId: string) => void;
  onDelete?: (panelId: string) => void;
  onEditImage?: (panelId: string) => void;
  onUndoImageEdit?: (panelId: string) => void;
}

const StoryboardPanel: React.FC<StoryboardPanelProps> = ({ panel, panelNumber, mode, onCharacterPress, onLocationPress, onManageTags, onDelete, onEditImage, onUndoImageEdit }) => {
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
          <Text className="text-gray-500 text-base font-medium mt-3">
            {isArchitectural ? "No detail yet" : "No panel yet"}
          </Text>
          <Text className="text-gray-400 text-sm mt-1.5">
            {isArchitectural ? "Create a detail set to start" : "Create a storyboard to start"}
          </Text>
        </View>
      </View>
    );
  }

  const panelCharacters = isArchitectural
    ? []
    : currentProject?.characters.filter(char => panel.prompt.characters.includes(char.id)) || [];

  const panelLocations = isArchitectural
    ? []
    : currentProject?.locations?.filter(loc => panel.prompt.locations?.includes(loc.id)) || [];

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
    <View className="bg-white border border-gray-300 rounded-xl p-4 min-h-[220px] shadow-sm">
      {/* Panel Header */}
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center flex-1">
          <Text className="text-base font-bold text-gray-700">Panel {panelNumber}</Text>
          {onDelete && !panel.isGenerating && (
            <Pressable
              onPress={() => {
                Alert.alert(
                  "Delete Panel",
                  `Are you sure you want to delete Panel ${panelNumber}?`,
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: () => onDelete(panel.id)
                    }
                  ]
                );
              }}
              className="ml-3 p-2 rounded-full active:bg-red-50"
              style={{ minHeight: 32, minWidth: 32 }}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </Pressable>
          )}
        </View>
        {panel.isGenerating && (
          <View className="flex-row items-center bg-blue-500 px-4 py-2 rounded-full shadow-sm">
            <Ionicons name="hourglass" size={16} color="#FFFFFF" />
            <Text className="text-white text-sm font-bold ml-2">Generating...</Text>
          </View>
        )}
      </View>

      {/* Action Buttons - Improved sizing and spacing */}
      <View className="mb-4" style={{ gap: 10 }}>
        {/* Primary Action: Generate/Regenerate */}
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
          className={`px-4 py-3 rounded-lg flex-row items-center justify-center ${panel.isGenerating ? 'bg-gray-200 border border-gray-300' : 'bg-gradient-to-r from-purple-600 to-purple-500 shadow-md'
            }`}
          style={{
            minHeight: 48,
            backgroundColor: panel.isGenerating ? undefined : '#9333ea'
          }}
        >
          <Ionicons
            name={panel.generatedImageUrl ? "refresh" : "sparkles"}
            size={18}
            color={panel.isGenerating ? "#9CA3AF" : "#FFFFFF"}
          />
          <Text className={`text-base font-bold ml-2 ${panel.isGenerating ? 'text-gray-500' : 'text-white'
            }`}>
            {panel.generatedImageUrl ? "Regenerate Image" : "Generate Image"}
          </Text>
        </Pressable>

        {/* Secondary Action: Edit Idea */}
        <Pressable
          onPress={() => setShowIdeaEditModal(true)}
          disabled={panel.isGenerating}
          className={`px-4 py-3 rounded-lg flex-row items-center justify-center ${panel.isGenerating ? 'bg-gray-100 border border-gray-200' : 'bg-white border-2 border-blue-300'
            }`}
          style={{ minHeight: 44 }}
        >
          <Ionicons
            name="create-outline"
            size={18}
            color={panel.isGenerating ? "#9CA3AF" : "#3B82F6"}
          />
          <Text className={`text-sm font-semibold ml-2 ${panel.isGenerating ? 'text-gray-400' : 'text-blue-600'
            }`}>
            Edit Panel Idea
          </Text>
        </Pressable>

        {/* Edit Image with AI (only if image exists) */}
        {panel.generatedImageUrl && onEditImage && (
          <Pressable
            onPress={() => onEditImage(panel.id)}
            disabled={panel.isGenerating || panel.isEditing}
            className={`px-4 py-3 rounded-lg flex-row items-center justify-center ${panel.isGenerating || panel.isEditing ? 'bg-gray-100 border border-gray-200' : 'bg-white border-2 border-orange-300'
              }`}
            style={{ minHeight: 44 }}
          >
            <Ionicons
              name="hand-left-outline"
              size={18}
              color={panel.isGenerating || panel.isEditing ? "#9CA3AF" : "#ea580c"}
            />
            <Text className={`text-sm font-semibold ml-2 ${panel.isGenerating || panel.isEditing ? 'text-gray-400' : 'text-orange-600'
              }`}>
              {panel.isEditing ? 'Editing...' : 'Edit Image'}
            </Text>
          </Pressable>
        )}

        {/* Undo Image Edit (only if has original) */}
        {panel.originalImageUrl && onUndoImageEdit && (
          <Pressable
            onPress={() => onUndoImageEdit(panel.id)}
            disabled={panel.isGenerating || panel.isEditing}
            className={`px-4 py-3 rounded-lg flex-row items-center justify-center ${panel.isGenerating || panel.isEditing ? 'bg-gray-100 border border-gray-200' : 'bg-white border-2 border-gray-300'
              }`}
            style={{ minHeight: 44 }}
          >
            <Ionicons
              name="arrow-undo-outline"
              size={18}
              color={panel.isGenerating || panel.isEditing ? "#9CA3AF" : "#6b7280"}
            />
            <Text className={`text-sm font-semibold ml-2 ${panel.isGenerating || panel.isEditing ? 'text-gray-400' : 'text-gray-600'
              }`}>
              Undo Edit
            </Text>
          </Pressable>
        )}

        {/* Tertiary Action: Manage Tags (Storyboard mode only) */}
        {!isArchitectural && onManageTags && (
          <Pressable
            onPress={() => onManageTags(panel.id)}
            disabled={panel.isGenerating}
            className={`px-4 py-3 rounded-lg flex-row items-center justify-center ${panel.isGenerating ? 'bg-gray-100 border border-gray-200' : 'bg-white border-2 border-purple-300'
              }`}
            style={{ minHeight: 44 }}
          >
            <Ionicons
              name="pricetags-outline"
              size={18}
              color={panel.isGenerating ? "#9CA3AF" : "#9333ea"}
            />
            <Text className={`text-sm font-semibold ml-2 ${panel.isGenerating ? 'text-gray-400' : 'text-purple-600'
              }`}>
              Manage Tags
            </Text>
          </Pressable>
        )}
      </View>

      {/* Tags */}
      {isArchitectural ? (
        <View className="flex-row flex-wrap mb-4" style={{ gap: 6 }}>
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
        <>
          {panelCharacters.length > 0 && (
            <View className="flex-row flex-wrap mb-4" style={{ gap: 6 }}>
              {panelCharacters.map(character => (
                <CharacterTag
                  key={character.id}
                  character={character}
                  size="small"
                  onPress={onCharacterPress ? () => onCharacterPress(character) : undefined}
                />
              ))}
            </View>
          )}
          {panelLocations.length > 0 && (
            <View className="flex-row flex-wrap mb-4" style={{ gap: 6 }}>
              {panelLocations.map(location => (
                <LocationTag
                  key={location.id}
                  location={location}
                  size="small"
                  onPress={onLocationPress ? () => onLocationPress(location) : undefined}
                />
              ))}
            </View>
          )}
        </>
      )}

      {/* Drawing Area */}
      <View className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden relative">
        {panel.isGenerating ? (
          <View className="h-36 flex-col items-center justify-center bg-blue-50">
            <View className="bg-blue-500 rounded-full p-4 mb-3">
              <Ionicons name="sparkles" size={32} color="#FFFFFF" />
            </View>
            <Text className="text-blue-700 text-base font-bold">Generating image...</Text>
            <Text className="text-blue-600 text-sm mt-1">This may take a moment</Text>
          </View>
        ) : showQualitySelector ? (
          <View className="p-4">
            <Text className="text-base font-bold text-gray-900 mb-3">
              {panel.generatedImageUrl ? "Regenerate Quality" : "Select Quality"}
            </Text>
            <View className="flex-row mb-4" style={{ gap: 10 }}>
              <Pressable
                onPress={() => setSelectedQuality(GenerationQuality.STANDARD)}
                className={`flex-1 p-3 rounded-lg border-2 ${selectedQuality === GenerationQuality.STANDARD
                  ? 'bg-blue-50 border-blue-500'
                  : 'bg-white border-gray-300'
                  }`}
                style={{ minHeight: 60 }}
              >
                <View className="items-center">
                  <View className="flex-row items-center mb-1">
                    <Ionicons
                      name={selectedQuality === GenerationQuality.STANDARD ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={selectedQuality === GenerationQuality.STANDARD ? '#3b82f6' : '#9ca3af'}
                    />
                    <Text className={`text-base font-bold ml-1.5 ${selectedQuality === GenerationQuality.STANDARD ? 'text-blue-700' : 'text-gray-600'
                      }`}>
                      Standard
                    </Text>
                  </View>
                  <Text className={`text-sm ${selectedQuality === GenerationQuality.STANDARD ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                    Stable Diffusion
                  </Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => setSelectedQuality(GenerationQuality.HIGH)}
                className={`flex-1 p-3 rounded-lg border-2 ${selectedQuality === GenerationQuality.HIGH
                  ? 'bg-purple-50 border-purple-500'
                  : 'bg-white border-gray-300'
                  }`}
                style={{ minHeight: 60 }}
              >
                <View className="items-center">
                  <View className="flex-row items-center mb-1">
                    <Ionicons
                      name={selectedQuality === GenerationQuality.HIGH ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={selectedQuality === GenerationQuality.HIGH ? '#9333ea' : '#9ca3af'}
                    />
                    <Text className={`text-base font-bold ml-1.5 ${selectedQuality === GenerationQuality.HIGH ? 'text-purple-700' : 'text-gray-600'
                      }`}>
                      High
                    </Text>
                  </View>
                  <Text className={`text-sm ${selectedQuality === GenerationQuality.HIGH ? 'text-purple-600' : 'text-gray-500'
                    }`}>
                    Seeddream 4
                  </Text>
                </View>
              </Pressable>
            </View>
            <View className="flex-row" style={{ gap: 10 }}>
              <Pressable
                onPress={() => setShowQualitySelector(false)}
                className="flex-1 px-4 py-3 bg-gray-200 rounded-lg"
                style={{ minHeight: 44 }}
              >
                <Text className="text-gray-700 text-sm font-bold text-center">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleGenerateImage}
                className="flex-1 px-4 py-3 bg-purple-600 rounded-lg"
                style={{ minHeight: 44 }}
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                  <Text className="text-white text-sm font-bold ml-2">
                    {panel.generatedImageUrl ? "Regen" : "Generate"}
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        ) : panel.generatedImageUrl ? (
          <View className="h-36">
            <Image
              source={{ uri: panel.generatedImageUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
            <Pressable
              onPress={() => setIsImageExpanded(true)}
              className="absolute right-3 top-3 bg-black/70 rounded-full p-2"
              style={{ minHeight: 36, minWidth: 36 }}
            >
              <Ionicons name="expand" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <View className="h-36 flex-col items-center justify-center px-4">
            <Ionicons name="image-outline" size={36} color="#9CA3AF" />
            <Text className="text-gray-500 text-sm font-medium mt-3">Ready to generate</Text>
          </View>
        )}
      </View>

      {/* Fullscreen image modal */}
      {panel.generatedImageUrl && (
        <Modal visible={isImageExpanded} animationType="fade" transparent onRequestClose={() => setIsImageExpanded(false)}>
          <View className="flex-1 bg-black/95">
            <Pressable
              onPress={() => setIsImageExpanded(false)}
              className="absolute top-12 right-6 z-10 bg-black/80 rounded-full p-3"
              style={{ minHeight: 48, minWidth: 48 }}
            >
              <Ionicons name="close" size={26} color="#FFFFFF" />
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
        <View className="mt-4">
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
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [showCharacterEditModal, setShowCharacterEditModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showLocationEditModal, setShowLocationEditModal] = useState(false);
  const [showLocationLibraryModal, setShowLocationLibraryModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const [showImageEditModal, setShowImageEditModal] = useState(false);
  const [editingPanelId, setEditingPanelId] = useState<string | null>(null);
  const currentProject = useCurrentProject();
  const projects = useProjects();
  const clearCurrentProject = useStoryboardStore(state => state.clearCurrentProject);
  const generateAllPanelImages = useStoryboardStore(state => state.generateAllPanelImages);
  const isGenerating = useStoryboardStore(state => state.isGenerating);
  const setCurrentProject = useStoryboardStore(state => state.setCurrentProject);
  const updateCharacter = useStoryboardStore(state => state.updateCharacter);
  const updateLocation = useStoryboardStore(state => state.updateLocation);
  const addCharacterToProject = useStoryboardStore(state => state.addCharacterToProject);
  const addLocationToProject = useStoryboardStore(state => state.addLocationToProject);
  const addCharacterToPanel = useStoryboardStore(state => state.addCharacterToPanel);
  const removeCharacterFromPanel = useStoryboardStore(state => state.removeCharacterFromPanel);
  const addLocationToPanel = useStoryboardStore(state => state.addLocationToPanel);
  const removeLocationFromPanel = useStoryboardStore(state => state.removeLocationFromPanel);
  const deletePanel = useStoryboardStore(state => state.deletePanel);
  const editPanelImage = useStoryboardStore(state => state.editPanelImage);
  const undoPanelImageEdit = useStoryboardStore(state => state.undoPanelImageEdit);

  const exportModalDismissResolverRef = useRef<(() => void) | null>(null);

  const handleExportModalDismiss = useCallback(() => {
    console.log('[StoryboardScreen] Export modal dismissed (native onDismiss)');
    exportModalDismissResolverRef.current?.();
  }, []);

  const waitForModalDismissal = useCallback(() => {
    console.log('[StoryboardScreen] Waiting for export modal dismissal...');

    // Clear out any stale resolver to avoid leaks
    if (exportModalDismissResolverRef.current) {
      exportModalDismissResolverRef.current();
    }

    return new Promise<void>(resolve => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const resolveOnce = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (exportModalDismissResolverRef.current === resolveOnce) {
          exportModalDismissResolverRef.current = null;
        }
        resolve();
      };

      timeoutId = setTimeout(() => {
        console.log('[StoryboardScreen] Export modal dismissal timeout reached');
        resolveOnce();
      }, 800);

      exportModalDismissResolverRef.current = resolveOnce;
    });
  }, []);

  const waitForModalTeardown = useCallback(async () => {
    await waitForModalDismissal();
    await waitForNextFrame();
    await waitForInteractionsToFinish();
    await waitForIosWindowCleanup();
  }, [waitForModalDismissal]);

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

  // Handler for opening location details modal
  const handleLocationPress = (location: Location) => {
    setSelectedLocation(location);
    setShowLocationModal(true);
  };

  // Handler for opening location edit modal
  const handleEditLocation = (location: Location) => {
    setSelectedLocation(location);
    setShowLocationModal(false);
    setShowLocationEditModal(true);
  };

  // Handler for saving location edits
  const handleSaveLocation = (location: Location) => {
    updateLocation(location.id, location);
  };

  // Handler for deleting a panel
  const handleDeletePanel = (panelId: string) => {
    deletePanel(panelId);
  };

  // Handler for managing tags (characters and locations) for a panel
  const handleManageTags = (panelId: string) => {
    setSelectedPanelId(panelId);
    setShowTagsModal(true);
  };

  // Handle Edit Image button press
  const handleEditImage = (panelId: string) => {
    setEditingPanelId(panelId);
    setShowImageEditModal(true);
  };

  // Handle image edit submission
  const handleImageEditSubmit = async (editPrompt: string) => {
    if (!editingPanelId) return;

    try {
      await editPanelImage(editingPanelId, editPrompt);
      setShowImageEditModal(false);
      setEditingPanelId(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to edit panel image');
    }
  };

  // Handle undo image edit
  const handleUndoImageEdit = (panelId: string) => {
    Alert.alert(
      'Undo Image Edit',
      'Are you sure you want to restore the original image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: () => undoPanelImageEdit(panelId)
        }
      ]
    );
  };

  // Calculate which panels a character appears in
  const getCharacterPanelNumbers = (characterId: string): number[] => {
    if (!currentProject) return [];
    return currentProject.panels
      .filter(panel => panel.prompt.characters.includes(characterId))
      .map(panel => panel.panelNumber)
      .sort((a, b) => a - b);
  };

  // Calculate which panels a location appears in
  const getLocationPanelNumbers = (locationId: string): number[] => {
    if (!currentProject) return [];
    return currentProject.panels
      .filter(panel => panel.prompt.locations?.includes(locationId))
      .map(panel => panel.panelNumber)
      .sort((a, b) => a - b);
  };

  // Only show currentProject if it matches the current mode, otherwise show empty state
  const activeProject = useMemo(() => {
    if (!currentProject) return null;
    if (isArchitectural) {
      return currentProject.projectType === ProjectType.ARCHITECTURAL ? currentProject : null;
    }
    // For storyboard mode, only show STORYBOARD projects (not ARCHITECTURAL or MINIWORLD)
    return currentProject.projectType === ProjectType.STORYBOARD ? currentProject : null;
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

  const handleExportPDF = async (options: ExportOptions) => {
    if (!activeProject) return;

    try {
      console.log('[StoryboardScreen] Starting PDF export...');

      // Generate PDF while modal shows loading state
      const result = await pdfExportService.generateComicPDF(activeProject, options);
      console.log('[StoryboardScreen] PDF generated:', result.filename);

      // CRITICAL FIX: Close modal BEFORE sharing to prevent view hierarchy conflicts
      // The share sheet must be presented from a stable view hierarchy
      console.log('[StoryboardScreen] Closing export modal before sharing...');
      setShowExportModal(false);

      // Wait for modal to fully dismiss before presenting share sheet
      // This prevents the share sheet from freezing
      await waitForModalDismissal();

      console.log('[StoryboardScreen] Opening share sheet...');
      try {
        await pdfExportService.sharePDF(result.uri);
        console.log('[StoryboardScreen] Share completed successfully');

        // Don't show alert immediately - it can interfere with share sheet
        // The share sheet will handle user interaction, and we can show
        // a subtle success message if needed (but not an Alert that blocks)
      } catch (shareError: any) {
        console.error('[StoryboardScreen] Share failed:', shareError);

        // Check error type
        const isTimeout = shareError?.message?.includes('timeout');
        const isModuleMissing = shareError?.message?.includes('native module not available');

        Alert.alert(
          "Share Failed",
          isTimeout
            ? "Share sheet timed out. Please try again."
            : isModuleMissing
              ? "Native share module not available. Please rebuild the app."
              : "Failed to open share sheet. Please try again.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error('[StoryboardScreen] Export failed:', error);
      setShowExportModal(false);
      Alert.alert(
        "Export Failed",
        "Failed to export PDF. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-5 py-4">
        <View className="flex-row justify-between items-center">
          <View className="flex-1 mr-3">
            <Text className="text-2xl font-bold text-gray-900 mb-2">{title}</Text>
            <Pressable
              onPress={() => setShowProjectSelector(true)}
              className="bg-blue-50 border-2 border-blue-200 rounded-lg px-3 py-2 active:bg-blue-100"
              style={{ minHeight: 44 }}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-blue-900 font-bold flex-1">
                  {activeProject?.title || "No Project Selected"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#1E40AF" />
              </View>
            </Pressable>
          </View>
          <View className="flex-row items-center" style={{ gap: 12 }}>
            {activeProject && (
              <Pressable
                onPress={handleGenerateAllImages}
                disabled={isGenerating}
                className="p-2 rounded-full active:bg-gray-100"
                style={{ minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons
                  name="images-outline"
                  size={26}
                  color={isGenerating ? "#9CA3AF" : "#3B82F6"}
                />
              </Pressable>
            )}
            {activeProject && activeProject.panels.some(p => p.generatedImageUrl) && (
              <Pressable
                onPress={() => setShowExportModal(true)}
                className="p-2 rounded-full active:bg-gray-100"
                style={{ minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="download-outline" size={26} color="#3B82F6" />
              </Pressable>
            )}
            <Pressable
              onPress={handleNewProject}
              className="p-2 rounded-full active:bg-gray-100"
              style={{ minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="add-circle-outline" size={26} color="#3B82F6" />
            </Pressable>
            {activeProject && (
              <Pressable
                onPress={handleClearProject}
                className="p-2 rounded-full active:bg-gray-100"
                style={{ minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="trash-outline" size={26} color="#6B7280" />
              </Pressable>
            )}
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 py-5">
        {isArchitectural && (
          <View className="mb-5 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <Text className="text-sm font-bold text-gray-700 mb-3">Architectural Mode</Text>
            <View className="flex-row bg-gray-100 rounded-xl overflow-hidden" style={{ gap: 2 }}>
              {([
                { key: "detalles", label: "Detalles" },
                { key: "planos", label: "Planos" },
                { key: "prototipos", label: "Prototipos" }
              ] as { key: ArchitecturalProjectKind; label: string }[]).map(option => {
                const isSelected = architecturalKind === option.key;
                return (
                  <Pressable
                    key={option.key}
                    className={`flex-1 py-3 items-center ${isSelected ? "bg-blue-500 rounded-lg" : ""}`}
                    onPress={() => handleArchitecturalKindChange(option.key)}
                    disabled={onArchitecturalKindChange == null}
                    style={{ minHeight: 44 }}
                  >
                    <Text className={`text-sm font-bold ${isSelected ? "text-white" : "text-gray-700"}`}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text className="text-sm text-gray-600 mt-3 leading-5">
              {architecturalKind === "detalles" && "Generate technical connection or material details with reinforcement and annotations."}
              {architecturalKind === "planos" && "Produce plan sets with floor plans, sections, elevations, and legends."}
              {architecturalKind === "prototipos" && "Create conceptual prototypes with massing, program, and diagrammatic overlays."}
            </Text>
          </View>
        )}

        {/* Project Info */}
        {activeProject && (
          <View className="mb-5 p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
            <Text className="text-base font-bold text-gray-800 mb-2">Project Description</Text>
            <Text className="text-sm text-gray-600 mb-4 leading-5">{activeProject.description}</Text>

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
                    <Text className="text-sm font-semibold text-gray-700 mb-1">Components</Text>
                    <View className="flex-row flex-wrap">
                      {architecturalMetadata.components.map(component => (
                        <Chip key={component} label={component} tone="gray" />
                      ))}
                    </View>
                  </View>
                ) : null}
                {architecturalMetadata?.programItems?.length ? (
                  <View className="mb-2">
                    <Text className="text-sm font-semibold text-gray-700 mb-1">Program</Text>
                    <View className="flex-row flex-wrap">
                      {architecturalMetadata.programItems.map(item => (
                        <Chip key={item} label={item} tone="gray" />
                      ))}
                    </View>
                  </View>
                ) : null}
                {(architecturalMetadata?.buildingType || architecturalMetadata?.floors || architecturalMetadata?.footprint || architecturalMetadata?.orientation) && (
                  <View className="mb-2">
                    <Text className="text-sm font-semibold text-gray-700 mb-1">Prototype Info</Text>
                    {architecturalMetadata?.buildingType && (
                      <Text className="text-sm text-gray-600 mb-0.5">• Building Type: {architecturalMetadata.buildingType}</Text>
                    )}
                    {architecturalMetadata?.floors && (
                      <Text className="text-sm text-gray-600 mb-0.5">• Floors: {architecturalMetadata.floors}</Text>
                    )}
                    {architecturalMetadata?.footprint && (
                      <Text className="text-sm text-gray-600 mb-0.5">• Footprint: {architecturalMetadata.footprint}</Text>
                    )}
                    {architecturalMetadata?.orientation && (
                      <Text className="text-sm text-gray-600 mb-0.5">• Orientation: {architecturalMetadata.orientation}</Text>
                    )}
                  </View>
                )}
                {architecturalMetadata?.diagramLayers?.length ? (
                  <View className="mb-2">
                    <Text className="text-sm font-semibold text-gray-700 mb-1">Diagram Layers</Text>
                    <View className="flex-row flex-wrap">
                      {architecturalMetadata.diagramLayers.map(layer => (
                        <Chip key={layer} label={layer} tone="gray" />
                      ))}
                    </View>
                  </View>
                ) : null}
                {architecturalMetadata?.materials?.length ? (
                  <View className="mb-2">
                    <Text className="text-sm font-semibold text-gray-700 mb-1">Materials</Text>
                    <View className="flex-row flex-wrap">
                      {architecturalMetadata.materials.map(material => (
                        <Chip key={material} label={material} tone="gray" />
                      ))}
                    </View>
                  </View>
                ) : null}
                {architecturalMetadata?.dimensions?.length ? (
                  <View>
                    <Text className="text-sm font-semibold text-gray-700 mb-1">Key Dimensions</Text>
                    {architecturalMetadata.dimensions.map(dimension => (
                      <Text key={dimension} className="text-sm text-gray-600 mb-0.5">• {dimension}</Text>
                    ))}
                  </View>
                ) : null}
                {architecturalMetadata?.conceptNotes?.length ? (
                  <View className="mt-2">
                    <Text className="text-sm font-semibold text-gray-700 mb-1">Concept Notes</Text>
                    {architecturalMetadata.conceptNotes.map(note => (
                      <Text key={note} className="text-sm text-gray-600 mb-0.5">• {note}</Text>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : (
              activeProject.characters.length > 0 && (
                <View className="flex-row flex-wrap" style={{ gap: 8 }}>
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
        <View className="flex-1 mb-5">
          <View className="flex-row flex-wrap" style={{ gap: 12 }}>
            {displayPanels.map((panel: StoryboardPanelType | undefined, idx: number) => (
              <View
                key={panel ? panel.id : `placeholder-${idx}`}
                style={{ width: '48%' }}
              >
                <StoryboardPanel
                  panel={panel}
                  panelNumber={idx + 1}
                  mode={mode}
                  onCharacterPress={handleCharacterPress}
                  onLocationPress={handleLocationPress}
                  onManageTags={panel && !isArchitectural ? handleManageTags : undefined}
                  onDelete={panel && !isArchitectural ? handleDeletePanel : undefined}
                  onEditImage={panel && !isArchitectural ? handleEditImage : undefined}
                  onUndoImageEdit={panel && !isArchitectural ? handleUndoImageEdit : undefined}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Generate/Add More Panels Button */}
        <Pressable
          onPress={handleNewProject}
          className="mb-6 p-5 bg-white rounded-xl border-2 border-dashed border-gray-300 shadow-sm active:bg-gray-50"
          style={{ minHeight: 60 }}
        >
          <View className="flex-row justify-center items-center">
            <Ionicons
              name={activeProject ? "refresh" : "add"}
              size={24}
              color="#3B82F6"
            />
            <Text className="ml-3 text-blue-600 font-bold text-base">
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

      {/* Location Details Modal */}
      <LocationDetailsModal
        visible={showLocationModal}
        onClose={() => {
          setShowLocationModal(false);
          setSelectedLocation(null);
        }}
        location={selectedLocation}
        panelNumbers={selectedLocation ? getLocationPanelNumbers(selectedLocation.id) : []}
        onEdit={handleEditLocation}
      />

      {/* Location Edit Modal */}
      <LocationEditModal
        visible={showLocationEditModal}
        onClose={() => {
          setShowLocationEditModal(false);
          setSelectedLocation(null);
        }}
        location={selectedLocation}
        onSave={handleSaveLocation}
        mode="edit"
      />

      {/* Location Library Modal */}
      <LocationLibraryModal
        visible={showLocationLibraryModal}
        onClose={() => setShowLocationLibraryModal(false)}
        onSelectLocation={(location) => {
          // This will be used when adding locations to panels in the future
          setShowLocationLibraryModal(false);
        }}
        onEditLocation={handleEditLocation}
      />

      {/* Tags Management Modal */}
      {selectedPanelId && currentProject && (
        <TagsManagementModal
          visible={showTagsModal}
          onClose={() => {
            setShowTagsModal(false);
            setSelectedPanelId(null);
          }}
          panelNumber={
            currentProject.panels.find(p => p.id === selectedPanelId)?.panelNumber || 1
          }
          panelCharacterIds={
            currentProject.panels.find(p => p.id === selectedPanelId)?.prompt.characters || []
          }
          panelLocationIds={
            currentProject.panels.find(p => p.id === selectedPanelId)?.prompt.locations || []
          }
          projectCharacters={currentProject.characters}
          projectLocations={currentProject.locations || []}
          onAddCharacterToPanel={(characterId) => addCharacterToPanel(selectedPanelId, characterId)}
          onRemoveCharacterFromPanel={(characterId) => removeCharacterFromPanel(selectedPanelId, characterId)}
          onAddLocationToPanel={(locationId) => addLocationToPanel(selectedPanelId, locationId)}
          onRemoveLocationFromPanel={(locationId) => removeLocationFromPanel(selectedPanelId, locationId)}
          onCreateCharacter={(character) => addCharacterToProject(character)}
          onCreateLocation={(location) => addLocationToProject(location)}
        />
      )}

      {/* Image Edit Modal */}
      <ImageEditModal
        visible={showImageEditModal}
        onClose={() => {
          setShowImageEditModal(false);
          setEditingPanelId(null);
        }}
        onSubmit={handleImageEditSubmit}
        isProcessing={editingPanelId ? currentProject?.panels.find(p => p.id === editingPanelId)?.isEditing || false : false}
      />

      {/* Project Selector Modal */}
      <ProjectSelectorModal
        visible={showProjectSelector}
        onClose={() => setShowProjectSelector(false)}
        currentProjectType={isArchitectural ? ProjectType.ARCHITECTURAL : ProjectType.STORYBOARD}
        onSelectProject={handleSelectProject}
        onCreateNew={handleCreateNewFromSelector}
      />

      {/* Export PDF Modal */}
      {activeProject && (
        <ExportOptionsModal
          visible={showExportModal}
          onClose={() => setShowExportModal(false)}
          project={activeProject}
          onExport={handleExportPDF}
          onDismissComplete={handleExportModalDismiss}
        />
      )}
    </SafeAreaView>
  );
}
