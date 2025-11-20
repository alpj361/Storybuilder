import React, { useState, useMemo, useEffect } from "react";
import { View, Text, ScrollView, Pressable, Image, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useStoryboardStore } from "../state/storyboardStore";
import {
  ProjectType,
  Character,
  Location,
  GenerationQuality
} from "../types/storyboard";
import { MiniWorldInputModal } from "../components/MiniWorldInputModal";
import CharacterTag from "../components/CharacterTag";
import LocationTag from "../components/LocationTag";
import { CharacterDetailsModal } from "../components/CharacterDetailsModal";
import { LocationDetailsModal } from "../components/LocationDetailsModal";
import { ImageEditModal } from "../components/ImageEditModal";
import { ProjectSelectorModal } from "../components/ProjectSelectorModal";
import PanelIdeaEditModal from "../components/PanelIdeaEditModal";

const MiniWorldsScreen = () => {
  const [showInputModal, setShowInputModal] = useState(false);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [showIdeaEditModal, setShowIdeaEditModal] = useState(false);
  const [showImageEditModal, setShowImageEditModal] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [currentPanelIdea, setCurrentPanelIdea] = useState("");
  const [selectedImageForEdit, setSelectedImageForEdit] = useState<string | null>(null);
  const [editingPanel, setEditingPanel] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Use individual selectors to avoid infinite loops (object selector creates new object every render)
  const currentProject = useStoryboardStore(state => state.currentProject);
  const projects = useStoryboardStore(state => state.projects);
  const setCurrentProject = useStoryboardStore(state => state.setCurrentProject);
  const deleteProject = useStoryboardStore(state => state.deleteProject);
  const generatePanelImage = useStoryboardStore(state => state.generatePanelImage);
  const regeneratePanelPromptFromIdea = useStoryboardStore(state => state.regeneratePanelPromptFromIdea);
  const editPanelImage = useStoryboardStore(state => state.editPanelImage);
  const undoPanelImageEdit = useStoryboardStore(state => state.undoPanelImageEdit);
  const isGenerating = useStoryboardStore(state => state.isGenerating);

  // Wait for store rehydration and navigation context to be ready
  useEffect(() => {
    // Use a small delay to ensure navigation context is available after store rehydration
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 100); // Small delay to let navigation context initialize

    return () => clearTimeout(timer);
  }, []);

  // Show loading screen until store and navigation are ready
  if (!isInitialized) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6366F1" />
          <Text className="mt-4 text-gray-600">Loading MiniWorlds...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Memoize computed values to prevent unnecessary recalculations
  const miniWorldProjects = useMemo(() =>
    projects.filter(p => p.projectType === ProjectType.MINIWORLD),
    [projects]
  );

  const activeMiniWorld = useMemo(() =>
    currentProject?.projectType === ProjectType.MINIWORLD ? currentProject : null,
    [currentProject]
  );

  const panel = useMemo(() =>
    activeMiniWorld?.panels[0] || null,
    [activeMiniWorld]
  );

  const panelCharacters = useMemo(() =>
    activeMiniWorld?.characters.filter(char =>
      panel?.prompt.characters.includes(char.id)
    ) || [],
    [activeMiniWorld?.characters, panel?.prompt.characters]
  );

  const panelLocations = useMemo(() =>
    activeMiniWorld?.locations?.filter(loc =>
      panel?.prompt.locations?.includes(loc.id)
    ) || [],
    [activeMiniWorld?.locations, panel?.prompt.locations]
  );

  const handleGenerateImage = async () => {
    if (!panel) return;

    try {
      // Always use high quality (Seeddream) for MiniWorlds
      await generatePanelImage(panel.id, GenerationQuality.HIGH);
    } catch (error) {
      Alert.alert("Error", "Failed to generate MiniWorld image");
    }
  };

  const handleEditIdea = async (newIdea: string) => {
    if (!panel) return;

    try {
      await regeneratePanelPromptFromIdea(panel.id, newIdea);
      setShowIdeaEditModal(false);
    } catch (error) {
      Alert.alert("Error", "Failed to update MiniWorld idea");
    }
  };

  const handleEditImage = async (editPrompt: string) => {
    if (!panel) return;

    try {
      await editPanelImage(panel.id, editPrompt);
      setShowImageEditModal(false);
    } catch (error) {
      Alert.alert("Error", "Failed to edit MiniWorld image");
    }
  };

  const handleUndoImageEdit = () => {
    if (!panel) return;

    Alert.alert(
      'Undo Image Edit',
      'Are you sure you want to restore the original image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: () => undoPanelImageEdit(panel.id)
        }
      ]
    );
  };

  const handleDeleteProject = () => {
    if (!activeMiniWorld) return;

    Alert.alert(
      "Delete MiniWorld",
      `Are you sure you want to delete "${activeMiniWorld.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteProject(activeMiniWorld.id);
            // Set to first available MiniWorld project or null
            const remainingProjects = miniWorldProjects.filter(p => p.id !== activeMiniWorld.id);
            setCurrentProject(remainingProjects[0] || null);
          }
        }
      ]
    );
  };

  const handleCharacterPress = (character: Character) => {
    setSelectedCharacter(character);
  };

  const handleLocationPress = (location: Location) => {
    setSelectedLocation(location);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-5 py-4">
        <View className="flex-row justify-between items-center">
          <View className="flex-1 mr-3">
            <Text className="text-2xl font-bold text-gray-900 mb-2">MiniWorlds</Text>
            <Pressable
              onPress={() => setShowProjectSelector(true)}
              className="bg-indigo-50 border-2 border-indigo-200 rounded-lg px-3 py-2 active:bg-indigo-100"
              style={{ minHeight: 44 }}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-indigo-900 font-bold flex-1">
                  {activeMiniWorld?.title || "No Project Selected"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6366F1" />
              </View>
            </Pressable>
          </View>
          <View className="flex-row items-center" style={{ gap: 12 }}>
            <Pressable
              onPress={() => setShowInputModal(true)}
              className="p-2 rounded-full active:bg-gray-100"
              style={{ minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="add-circle-outline" size={26} color="#6366F1" />
            </Pressable>
            {activeMiniWorld && (
              <Pressable
                onPress={handleDeleteProject}
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
        {isGenerating && !activeMiniWorld ? (
          // Creating MiniWorld State
          <View className="flex-1 items-center justify-center py-20">
            <View className="bg-indigo-500 rounded-full p-8 mb-6">
              <Ionicons name="hourglass" size={80} color="#FFFFFF" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-2">Creating Your MiniWorld...</Text>
            <Text className="text-base text-gray-600 text-center px-8">
              Generating your isometric diorama scene
            </Text>
          </View>
        ) : !activeMiniWorld || !panel ? (
          // Empty State
          <View className="flex-1 items-center py-20">
            <View className="bg-indigo-100 rounded-full p-8 mb-6">
              <Ionicons name="cube" size={80} color="#6366F1" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-2">Create Your First MiniWorld</Text>
            <Text className="text-base text-gray-600 text-center mb-8 px-8">
              Generate beautiful isometric diorama scenes with warm pastel colors and cozy atmosphere
            </Text>
            <Pressable
              onPress={() => setShowInputModal(true)}
              className="bg-indigo-600 px-6 py-3 rounded-lg flex-row items-center"
              style={{ minHeight: 48 }}
            >
              <Ionicons name="add-circle" size={24} color="#FFFFFF" />
              <Text className="text-white text-lg font-bold ml-2">Create MiniWorld</Text>
            </Pressable>
          </View>
        ) : (
          // MiniWorld Display
          <View>
            {/* Project Info Card */}
            <View className="mb-5 p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
              <Text className="text-base font-bold text-gray-800 mb-2">{activeMiniWorld.title}</Text>
              <Text className="text-sm text-gray-600 mb-4">{activeMiniWorld.description}</Text>

              {/* Characters and Locations */}
              {(panelCharacters.length > 0 || panelLocations.length > 0) && (
                <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                  {panelCharacters.map(char => (
                    <CharacterTag
                      key={char.id}
                      character={char}
                      size="small"
                      onPress={() => handleCharacterPress(char)}
                    />
                  ))}
                  {panelLocations.map(loc => (
                    <LocationTag
                      key={loc.id}
                      location={loc}
                      size="small"
                      onPress={() => handleLocationPress(loc)}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* Large Image Display */}
            <View className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 mb-5">
              {panel.generatedImageUrl ? (
                <View className="relative">
                  <Image
                    source={{ uri: panel.generatedImageUrl }}
                    className="w-full"
                    style={{ aspectRatio: 1, height: 400 }}
                    resizeMode="cover"
                  />
                </View>
              ) : (
                <View
                  className="w-full bg-gray-50 justify-center items-center border-2 border-dashed border-gray-300"
                  style={{ aspectRatio: 1, height: 400 }}
                >
                  <Ionicons name="cube-outline" size={64} color="#9CA3AF" />
                  <Text className="text-gray-500 text-lg font-medium mt-4">No MiniWorld generated yet</Text>
                  <Text className="text-gray-400 text-sm mt-2">Tap Generate Image to create your scene</Text>
                </View>
              )}

              {panel.isGenerating && (
                <View className="absolute inset-0 bg-black bg-opacity-50 justify-center items-center">
                  <View className="bg-white px-6 py-4 rounded-xl">
                    <View className="flex-row items-center">
                      <Ionicons name="hourglass" size={24} color="#6366F1" />
                      <Text className="text-gray-800 text-lg font-bold ml-3">Generating...</Text>
                    </View>
                  </View>
                </View>
              )}

              {panel.isEditing && (
                <View className="absolute inset-0 bg-black bg-opacity-50 justify-center items-center">
                  <View className="bg-white px-6 py-4 rounded-xl">
                    <View className="flex-row items-center">
                      <Ionicons name="brush" size={24} color="#6366F1" />
                      <Text className="text-gray-800 text-lg font-bold ml-3">Editing...</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View className="mb-5" style={{ gap: 10 }}>
              {/* Generate/Regenerate Button */}
              <Pressable
                onPress={handleGenerateImage}
                disabled={panel.isGenerating}
                className={`px-4 py-3 rounded-lg flex-row items-center justify-center ${panel.isGenerating ? 'bg-gray-200 border border-gray-300' : 'bg-indigo-600'
                  }`}
                style={{ minHeight: 48 }}
              >
                <Ionicons
                  name={panel.generatedImageUrl ? "refresh" : "sparkles"}
                  size={20}
                  color={panel.isGenerating ? "#9CA3AF" : "#FFFFFF"}
                />
                <Text className={`text-base font-bold ml-2 ${panel.isGenerating ? 'text-gray-500' : 'text-white'
                  }`}>
                  {panel.generatedImageUrl ? "Regenerate Image" : "Generate Image"}
                </Text>
              </Pressable>

              {/* Edit Idea Button */}
              <Pressable
                onPress={() => setShowIdeaEditModal(true)}
                disabled={panel.isGenerating}
                className={`px-4 py-3 rounded-lg flex-row items-center justify-center ${panel.isGenerating ? 'bg-gray-100 border border-gray-200' : 'bg-white border-2 border-blue-300'
                  }`}
                style={{ minHeight: 44 }}
              >
                <Ionicons name="create-outline" size={18} color={panel.isGenerating ? "#9CA3AF" : "#3B82F6"} />
                <Text className={`text-sm font-semibold ml-2 ${panel.isGenerating ? 'text-gray-400' : 'text-blue-600'
                  }`}>
                  Edit Idea
                </Text>
              </Pressable>

              {/* Edit Image Button */}
              {panel.generatedImageUrl && (
                <Pressable
                  onPress={() => setShowImageEditModal(true)}
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

              {/* Undo Edit Button */}
              {panel.originalImageUrl && (
                <Pressable
                  onPress={handleUndoImageEdit}
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
            </View>

            {/* Prompt Preview */}
            {panel.prompt.generatedPrompt && (
              <View className="bg-gray-800 rounded-xl p-4 shadow-sm">
                <Text className="text-xs font-semibold text-gray-400 uppercase mb-2">Generated Prompt</Text>
                <Text className="text-sm text-gray-100 leading-6">{panel.prompt.generatedPrompt}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modals - Only render when needed to avoid navigation context issues */}
      {showInputModal && (
        <MiniWorldInputModal
          visible={true}
          onClose={() => setShowInputModal(false)}
        />
      )}

      {showProjectSelector && (
        <ProjectSelectorModal
          visible={true}
          onClose={() => setShowProjectSelector(false)}
          currentProjectType={ProjectType.MINIWORLD}
          onSelectProject={(project) => {
            setCurrentProject(project);
          }}
          onCreateNew={() => {
            setShowInputModal(true);
          }}
        />
      )}

      {editingPanel && showIdeaEditModal && (
        <PanelIdeaEditModal
          visible={showIdeaEditModal}
          onClose={() => setShowIdeaEditModal(false)}
          currentIdea={currentPanelIdea}
          onSave={async (newIdea: string) => {
            if (editingPanel) {
              try {
                await regeneratePanelPromptFromIdea(editingPanel.id, newIdea);
                setShowIdeaEditModal(false);
              } catch (error) {
                console.error('Failed to save panel idea:', error);
              }
            }
          }}
          panelNumber={editingPanel?.panelNumber || 1}
        />
      )}

      {editingPanel && showImageEditModal && selectedImageForEdit && (
        <ImageEditModal
          visible={showImageEditModal}
          onClose={() => setShowImageEditModal(false)}
          onSubmit={async (editPrompt: string) => {
            if (editingPanel) {
              try {
                await editPanelImage(editingPanel.id, editPrompt);
                setShowImageEditModal(false);
              } catch (error) {
                console.error('Failed to edit image:', error);
              }
            }
          }}
          isProcessing={isGenerating}
        />
      )}

      {selectedCharacter && (
        <CharacterDetailsModal
          visible={true}
          onClose={() => setSelectedCharacter(null)}
          character={selectedCharacter}
        />
      )}

      {selectedLocation && (
        <LocationDetailsModal
          visible={true}
          onClose={() => setSelectedLocation(null)}
          location={selectedLocation}
        />
      )}
    </SafeAreaView>
  );
}

export default React.memo(MiniWorldsScreen);
