import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, Image, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useCurrentProject, useProjects, useStoryboardStore } from "../state/storyboardStore";
import { ProjectType, GenerationQuality } from "../types/storyboard";
import { MiniWorldInputModal } from "../components/MiniWorldInputModal";
import { ProjectSelectorModal } from "../components/ProjectSelectorModal";
import { ImageEditModal } from "../components/ImageEditModal";

interface MiniWorldsScreenProps {
  // React Navigation injects props automatically
}

export default function MiniWorldsScreen({ }: MiniWorldsScreenProps = {}) {
  const [showInputModal, setShowInputModal] = useState(false);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [showImageEditModal, setShowImageEditModal] = useState(false);
  const [showQualitySelector, setShowQualitySelector] = useState(false);
  const [showPromptViewer, setShowPromptViewer] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<GenerationQuality>(GenerationQuality.STANDARD);

  const currentProject = useCurrentProject();
  const projects = useProjects();
  const setCurrentProject = useStoryboardStore(state => state.setCurrentProject);
  const generatePanelImage = useStoryboardStore(state => state.generatePanelImage);
  const editPanelImage = useStoryboardStore(state => state.editPanelImage);
  const isGenerating = useStoryboardStore(state => state.isGenerating);

  // Filter for MiniWorld projects
  const activeProject = useMemo(() => {
    if (!currentProject) return null;
    return currentProject.projectType === ProjectType.MINIWORLD ? currentProject : null;
  }, [currentProject]);

  // Get the first panel (MiniWorld focus)
  const activePanel = useMemo(() => {
    if (!activeProject?.panels?.length) return null;
    return activeProject.panels[0];
  }, [activeProject]);

  const handleSelectProject = (project: any) => {
    setCurrentProject(project);
  };

  const handleCreateNewFromSelector = () => {
    setShowInputModal(true);
  };

  const handleGenerateImage = async () => {
    if (!activePanel) return;

    try {
      await generatePanelImage(activePanel.id, GenerationQuality.STANDARD);
    } catch (error) {
      Alert.alert("Error", "Failed to generate image.");
    }
  };

  const handleRegenerateWithQuality = async () => {
    if (!activePanel) return;

    try {
      await generatePanelImage(activePanel.id, selectedQuality);
      setShowQualitySelector(false);
    } catch (error) {
      Alert.alert("Error", "Failed to regenerate image.");
    }
  };

  const handleEditImage = () => {
    if (!activePanel?.generatedImageUrl) {
      Alert.alert("No Image", "Generate an image first before editing.");
      return;
    }
    setShowImageEditModal(true);
  };

  const handleImageEditSubmit = async (editPrompt: string) => {
    if (!activePanel) return;

    try {
      await editPanelImage(activePanel.id, editPrompt);
      setShowImageEditModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to edit image');
    }
  };

  // If no project selected or available
  if (!activeProject) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center p-6">
          <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-6">
            <Ionicons name="cube-outline" size={48} color="#3B82F6" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Welcome to MiniWorlds
          </Text>
          <Text className="text-gray-500 text-center mb-8 leading-6">
            Create bite-sized worlds with a single prompt. Select an existing project or start a new one.
          </Text>

          <Pressable
            onPress={() => setShowInputModal(true)}
            className="bg-blue-600 px-8 py-4 rounded-xl shadow-lg active:bg-blue-700 w-full"
          >
            <Text className="text-white text-lg font-bold text-center">Create New MiniWorld</Text>
          </Pressable>

          <Pressable
            onPress={() => setShowProjectSelector(true)}
            className="mt-4 py-3"
          >
            <Text className="text-blue-600 font-semibold text-base">Select Existing Project</Text>
          </Pressable>
        </View>

        {/* Modals */}
        <MiniWorldInputModal
          visible={showInputModal}
          onClose={() => setShowInputModal(false)}
        />
        <ProjectSelectorModal
          visible={showProjectSelector}
          onClose={() => setShowProjectSelector(false)}
          currentProjectType={ProjectType.MINIWORLD}
          onSelectProject={handleSelectProject}
          onCreateNew={handleCreateNewFromSelector}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="px-4 py-3 flex-row justify-between items-center bg-white border-b border-gray-200 z-10">
        <Pressable
          onPress={() => setShowProjectSelector(true)}
          className="flex-row items-center bg-gray-50 px-4 py-2 rounded-full border border-gray-200"
        >
          <Text className="text-gray-900 font-bold mr-2 truncate max-w-[200px]" numberOfLines={1}>
            {activeProject.title}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#6B7280" />
        </Pressable>

        <Pressable
          onPress={() => setShowInputModal(true)}
          className="p-2 rounded-full active:bg-gray-100"
          style={{ minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="add-circle-outline" size={26} color="#3B82F6" />
        </Pressable>
      </View>

      {/* Content - Flex Layout */}
      <View className="flex-1">
        {/* Image Container - Takes available space */}
        <View className="flex-1 items-center justify-center px-4 pt-4">
          <View className="w-full aspect-square max-w-sm bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-200 relative">
            {activePanel?.generatedImageUrl ? (
              <Image
                source={{ uri: activePanel.generatedImageUrl }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="flex-1 items-center justify-center bg-gray-50">
                <Ionicons name="image-outline" size={64} color="#9CA3AF" />
                <Text className="text-gray-400 mt-4 font-medium">No image generated yet</Text>
              </View>
            )}

            {/* Regenerate Button (only when image exists) */}
            {activePanel?.generatedImageUrl && !activePanel?.isGenerating && !activePanel?.isEditing && (
              <Pressable
                onPress={() => setShowQualitySelector(true)}
                className="absolute top-3 right-3 bg-white/90 rounded-full p-2 shadow-md"
                style={{ minHeight: 36, minWidth: 36 }}
              >
                <Ionicons name="refresh" size={20} color="#3B82F6" />
              </Pressable>
            )}

            {/* Loading Overlay */}
            {(isGenerating || activePanel?.isGenerating || activePanel?.isEditing) && (
              <View className="absolute inset-0 bg-white/80 items-center justify-center">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="text-blue-600 font-bold mt-3 text-lg">
                  {activePanel?.isEditing ? 'Editing...' : 'Generating...'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Bottom Controls - Scrollable if needed */}
        <View className="bg-white border-t border-gray-100" style={{ maxHeight: '50%' }}>
          <ScrollView className="px-4 py-4">
            {/* Idea Display */}
            <View className="mb-3">
              <Text className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                Idea
              </Text>
              <View className="bg-gray-50 rounded-xl border border-gray-200 p-3">
                <Text className="text-gray-700 text-sm leading-5">
                  {activePanel?.prompt.sceneDescription || "No idea yet"}
                </Text>
              </View>
            </View>

            {/* Generated Prompt Display with Expand */}
            <View className="mb-4">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                  Generated Prompt
                </Text>
                {activePanel?.prompt.generatedPrompt && (
                  <Pressable onPress={() => setShowPromptViewer(true)}>
                    <Ionicons name="expand-outline" size={18} color="#3B82F6" />
                  </Pressable>
                )}
              </View>
              <View className="bg-blue-50 rounded-xl border border-blue-100 p-3">
                <Text className="text-gray-900 text-sm leading-5" numberOfLines={4}>
                  {activePanel?.prompt.generatedPrompt || "No prompt generated yet"}
                </Text>
              </View>
            </View>

            {/* Generate/Edit Button */}
            {!activePanel?.generatedImageUrl ? (
              // Generate Button - when no image exists
              <Pressable
                onPress={handleGenerateImage}
                disabled={activePanel?.isGenerating}
                className={`w-full py-3 rounded-2xl flex-row items-center justify-center shadow-sm mb-4 ${activePanel?.isGenerating ? 'bg-gray-100' : 'bg-purple-600 active:bg-purple-700'
                  }`}
              >
                {activePanel?.isGenerating ? (
                  <ActivityIndicator color="#6B7280" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={20} color="white" style={{ marginRight: 8 }} />
                    <Text className="text-white text-lg font-bold tracking-wide">
                      Generate
                    </Text>
                  </>
                )}
              </Pressable>
            ) : (
              // Edit Button - when image exists
              <Pressable
                onPress={handleEditImage}
                disabled={activePanel?.isEditing}
                className={`w-full py-3 rounded-2xl flex-row items-center justify-center shadow-sm mb-4 ${activePanel?.isEditing ? 'bg-gray-100' : 'bg-blue-600 active:bg-blue-700'
                  }`}
              >
                {activePanel?.isEditing ? (
                  <ActivityIndicator color="#6B7280" />
                ) : (
                  <>
                    <Ionicons name="pencil" size={20} color="white" style={{ marginRight: 8 }} />
                    <Text className="text-white text-lg font-bold tracking-wide">
                      Editar
                    </Text>
                  </>
                )}
              </Pressable>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Quality Selector Modal */}
      <Modal visible={showQualitySelector} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-gray-900 mb-4">Regenerate Image</Text>
            <Text className="text-gray-600 mb-6">Choose generation quality:</Text>

            {/* Quality Options */}
            <Pressable
              onPress={() => setSelectedQuality(GenerationQuality.STANDARD)}
              className={`p-4 rounded-xl mb-3 border-2 ${selectedQuality === GenerationQuality.STANDARD
                  ? 'bg-blue-50 border-blue-500'
                  : 'bg-gray-50 border-gray-200'
                }`}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name={selectedQuality === GenerationQuality.STANDARD ? 'radio-button-on' : 'radio-button-off'}
                  size={24}
                  color={selectedQuality === GenerationQuality.STANDARD ? '#3B82F6' : '#9CA3AF'}
                />
                <View className="ml-3 flex-1">
                  <Text className="text-base font-bold text-gray-900">Standard</Text>
                  <Text className="text-sm text-gray-600">Seedream 4</Text>
                </View>
              </View>
            </Pressable>

            <Pressable
              onPress={() => setSelectedQuality(GenerationQuality.STANDARD_PLUS)}
              className={`p-4 rounded-xl mb-3 border-2 ${selectedQuality === GenerationQuality.STANDARD_PLUS
                  ? 'bg-yellow-50 border-yellow-500'
                  : 'bg-gray-50 border-gray-200'
                }`}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name={selectedQuality === GenerationQuality.STANDARD_PLUS ? 'radio-button-on' : 'radio-button-off'}
                  size={24}
                  color={selectedQuality === GenerationQuality.STANDARD_PLUS ? '#EAB308' : '#9CA3AF'}
                />
                <View className="ml-3 flex-1">
                  <Text className="text-base font-bold text-gray-900">Standard+</Text>
                  <Text className="text-sm text-gray-600">NanoBanana</Text>
                </View>
              </View>
            </Pressable>

            <Pressable
              onPress={() => setSelectedQuality(GenerationQuality.HIGH)}
              className={`p-4 rounded-xl mb-6 border-2 ${selectedQuality === GenerationQuality.HIGH
                  ? 'bg-purple-50 border-purple-500'
                  : 'bg-gray-50 border-gray-200'
                }`}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name={selectedQuality === GenerationQuality.HIGH ? 'radio-button-on' : 'radio-button-off'}
                  size={24}
                  color={selectedQuality === GenerationQuality.HIGH ? '#9333EA' : '#9CA3AF'}
                />
                <View className="ml-3 flex-1">
                  <Text className="text-base font-bold text-gray-900">High</Text>
                  <Text className="text-sm text-gray-600">NanoBanana Pro</Text>
                </View>
              </View>
            </Pressable>

            {/* Buttons */}
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowQualitySelector(false)}
                className="flex-1 py-3 bg-gray-200 rounded-xl"
              >
                <Text className="text-gray-700 font-bold text-center">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleRegenerateWithQuality}
                disabled={activePanel?.isGenerating}
                className="flex-1 py-3 bg-purple-600 rounded-xl"
              >
                <Text className="text-white font-bold text-center">Regenerate</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Prompt Viewer Modal */}
      <Modal visible={showPromptViewer} animationType="fade" transparent>
        <View className="flex-1 bg-black/80 justify-center items-center p-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-md">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-900">Generated Prompt</Text>
              <Pressable onPress={() => setShowPromptViewer(false)}>
                <Ionicons name="close-circle" size={28} color="#6B7280" />
              </Pressable>
            </View>
            <ScrollView className="max-h-96">
              <Text className="text-gray-700 text-base leading-6">
                {activePanel?.prompt.generatedPrompt || "No prompt available"}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modals */}
      <MiniWorldInputModal
        visible={showInputModal}
        onClose={() => setShowInputModal(false)}
      />
      <ProjectSelectorModal
        visible={showProjectSelector}
        onClose={() => setShowProjectSelector(false)}
        currentProjectType={ProjectType.MINIWORLD}
        onSelectProject={handleSelectProject}
        onCreateNew={handleCreateNewFromSelector}
      />
      <ImageEditModal
        visible={showImageEditModal}
        onClose={() => setShowImageEditModal(false)}
        onSubmit={handleImageEditSubmit}
        isProcessing={activePanel?.isEditing || false}
      />
    </SafeAreaView>
  );
}
