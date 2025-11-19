import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useCurrentProject, useProjects, useStoryboardStore } from "../state/storyboardStore";
import {
  ProjectType,
  Character,
  Location,
  GenerationQuality
} from "../types/storyboard";
import CharacterTag from "../components/CharacterTag";
import LocationTag from "../components/LocationTag";
import { CharacterDetailsModal } from "../components/CharacterDetailsModal";
import { LocationDetailsModal } from "../components/LocationDetailsModal";
import { ImageEditModal } from "../components/ImageEditModal";
import { ProjectSelectorModal } from "../components/ProjectSelectorModal";
import PanelIdeaEditModal from "../components/PanelIdeaEditModal";
import { MiniWorldInputModal } from "../components/MiniWorldInputModal";

export default function MiniWorldsScreen() {
  const currentProject = useCurrentProject();
  const projects = useProjects();
  const setCurrentProject = useStoryboardStore(state => state.setCurrentProject);
  const deleteProject = useStoryboardStore(state => state.deleteProject);
  const generatePanelImage = useStoryboardStore(state => state.generatePanelImage);
  const regeneratePanelPromptFromIdea = useStoryboardStore(state => state.regeneratePanelPromptFromIdea);
  const editPanelImage = useStoryboardStore(state => state.editPanelImage);
  const undoPanelImageEdit = useStoryboardStore(state => state.undoPanelImageEdit);

  const [showInputModal, setShowInputModal] = useState(false);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [showIdeaEditModal, setShowIdeaEditModal] = useState(false);
  const [showImageEditModal, setShowImageEditModal] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  // Filter only MiniWorld projects
  const miniWorldProjects = projects.filter(p => p.projectType === ProjectType.MINIWORLD);

  // Get the single panel from current MiniWorld project
  const panel = currentProject?.projectType === ProjectType.MINIWORLD ? currentProject.panels[0] : null;

  const panelCharacters = currentProject?.characters.filter(char =>
    panel?.prompt.characters.includes(char.id)
  ) || [];

  const panelLocations = currentProject?.locations?.filter(loc =>
    panel?.prompt.locations?.includes(loc.id)
  ) || [];

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
    undoPanelImageEdit(panel.id);
  };

  const handleDeleteProject = () => {
    if (!currentProject) return;

    Alert.alert(
      "Delete MiniWorld",
      `Are you sure you want to delete "${currentProject.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteProject(currentProject.id);
            // Set to first available MiniWorld project or null
            const remainingProjects = miniWorldProjects.filter(p => p.id !== currentProject.id);
            setCurrentProject(remainingProjects[0] || null);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <Ionicons name="cube-outline" size={24} color="#6366F1" />
            <Text className="text-xl font-bold text-gray-800 ml-2">MiniWorlds</Text>
          </View>

          {/* Project Selector */}
          {miniWorldProjects.length > 0 && (
            <Pressable
              onPress={() => setShowProjectSelector(true)}
              className="flex-row items-center bg-gray-100 px-3 py-2 rounded-lg border border-gray-300"
            >
              <Text className="text-sm font-medium text-gray-700 mr-2" numberOfLines={1}>
                {currentProject?.title || "Select Project"}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#6B7280" />
            </Pressable>
          )}

          {/* Delete Button */}
          {currentProject && (
            <Pressable
              onPress={handleDeleteProject}
              className="ml-2 p-2 rounded-lg active:bg-red-50"
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        {!currentProject || !panel ? (
          // Empty State
          <View className="flex-1 justify-center items-center py-20">
            <View className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full p-8 mb-6">
              <Ionicons name="cube" size={80} color="#6366F1" />
            </View>
            <Text className="text-2xl font-bold text-gray-800 mb-2">Create Your First MiniWorld</Text>
            <Text className="text-base text-gray-600 text-center mb-8 max-w-md">
              Generate beautiful isometric diorama scenes with warm pastel colors and cozy atmosphere
            </Text>
            <Pressable
              onPress={() => setShowInputModal(true)}
              className="bg-indigo-600 px-6 py-3 rounded-xl flex-row items-center shadow-lg"
            >
              <Ionicons name="add-circle" size={24} color="#FFFFFF" />
              <Text className="text-white text-lg font-bold ml-2">Create MiniWorld</Text>
            </Pressable>
          </View>
        ) : (
          // MiniWorld Display
          <View>
            {/* Project Info Card */}
            <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-200">
              <Text className="text-lg font-bold text-gray-800 mb-2">{currentProject.title}</Text>
              <Text className="text-sm text-gray-600 mb-3">{currentProject.description}</Text>

              {/* Characters and Locations */}
              {(panelCharacters.length > 0 || panelLocations.length > 0) && (
                <View className="flex-row flex-wrap gap-2">
                  {panelCharacters.map(char => (
                    <CharacterTag
                      key={char.id}
                      character={char}
                      onPress={() => setSelectedCharacter(char)}
                    />
                  ))}
                  {panelLocations.map(loc => (
                    <LocationTag
                      key={loc.id}
                      location={loc}
                      onPress={() => setSelectedLocation(loc)}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* Large Image Display */}
            <View className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200 mb-4">
              {panel.generatedImageUrl ? (
                <Pressable onPress={() => setIsImageExpanded(!isImageExpanded)}>
                  <Image
                    source={{ uri: panel.generatedImageUrl }}
                    className="w-full"
                    style={{ aspectRatio: 1, height: isImageExpanded ? 600 : 400 }}
                    resizeMode="cover"
                  />
                </Pressable>
              ) : (
                <View
                  className="w-full bg-gray-50 justify-center items-center border-2 border-dashed border-gray-300"
                  style={{ aspectRatio: 1, height: 400 }}
                >
                  <Ionicons name="cube-outline" size={64} color="#9CA3AF" />
                  <Text className="text-gray-500 text-lg font-medium mt-4">No MiniWorld generated yet</Text>
                  <Text className="text-gray-400 text-sm mt-2">Tap "Generate Image" to create your scene</Text>
                </View>
              )}

              {panel.isGenerating && (
                <View className="absolute inset-0 bg-black/50 justify-center items-center">
                  <View className="bg-white px-6 py-4 rounded-xl shadow-xl">
                    <View className="flex-row items-center">
                      <Ionicons name="hourglass" size={24} color="#6366F1" />
                      <Text className="text-gray-800 text-lg font-bold ml-3">Generating...</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View className="space-y-3 mb-4">
              {/* Generate/Regenerate Button */}
              <Pressable
                onPress={handleGenerateImage}
                disabled={panel.isGenerating}
                className={`px-4 py-3 rounded-lg flex-row items-center justify-center ${
                  panel.isGenerating ? 'bg-gray-200 border border-gray-300' : 'bg-indigo-600 shadow-md'
                }`}
                style={{ minHeight: 48 }}
              >
                <Ionicons
                  name={panel.generatedImageUrl ? "refresh" : "sparkles"}
                  size={20}
                  color={panel.isGenerating ? "#9CA3AF" : "#FFFFFF"}
                />
                <Text className={`text-base font-bold ml-2 ${
                  panel.isGenerating ? 'text-gray-500' : 'text-white'
                }`}>
                  {panel.generatedImageUrl ? "Regenerate Image" : "Generate Image"}
                </Text>
              </Pressable>

              {/* Edit Idea Button */}
              <Pressable
                onPress={() => setShowIdeaEditModal(true)}
                disabled={panel.isGenerating}
                className="px-4 py-3 bg-white rounded-lg flex-row items-center justify-center border border-gray-300"
                style={{ minHeight: 48 }}
              >
                <Ionicons name="bulb-outline" size={20} color="#6366F1" />
                <Text className="text-base font-semibold text-gray-700 ml-2">Edit Idea</Text>
              </Pressable>

              {/* Edit Image Button */}
              {panel.generatedImageUrl && (
                <Pressable
                  onPress={() => setShowImageEditModal(true)}
                  disabled={panel.isGenerating || panel.isEditing}
                  className="px-4 py-3 bg-white rounded-lg flex-row items-center justify-center border border-gray-300"
                  style={{ minHeight: 48 }}
                >
                  <Ionicons name="brush-outline" size={20} color="#8B5CF6" />
                  <Text className="text-base font-semibold text-gray-700 ml-2">Edit Image (AI)</Text>
                </Pressable>
              )}

              {/* Undo Edit Button */}
              {panel.originalImageUrl && (
                <Pressable
                  onPress={handleUndoImageEdit}
                  className="px-4 py-3 bg-amber-50 rounded-lg flex-row items-center justify-center border border-amber-200"
                  style={{ minHeight: 48 }}
                >
                  <Ionicons name="arrow-undo" size={20} color="#F59E0B" />
                  <Text className="text-base font-semibold text-amber-700 ml-2">Undo Edit</Text>
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

      {/* Floating Action Button - Create New MiniWorld */}
      <Pressable
        onPress={() => setShowInputModal(true)}
        className="absolute bottom-6 right-6 bg-indigo-600 rounded-full p-4 shadow-2xl flex-row items-center"
        style={{ elevation: 8 }}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>

      {/* Modals */}
      <MiniWorldInputModal
        visible={showInputModal}
        onClose={() => setShowInputModal(false)}
      />

      <ProjectSelectorModal
        visible={showProjectSelector}
        onClose={() => setShowProjectSelector(false)}
        projects={miniWorldProjects}
        currentProjectId={currentProject?.id}
        onSelectProject={(project) => {
          setCurrentProject(project);
          setShowProjectSelector(false);
        }}
      />

      {panel && (
        <>
          <PanelIdeaEditModal
            visible={showIdeaEditModal}
            onClose={() => setShowIdeaEditModal(false)}
            currentIdea={panel.prompt.sceneDescription || panel.prompt.action}
            onSave={handleEditIdea}
          />

          <ImageEditModal
            visible={showImageEditModal}
            onClose={() => setShowImageEditModal(false)}
            imageUrl={panel.generatedImageUrl || ''}
            onEdit={handleEditImage}
          />
        </>
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
