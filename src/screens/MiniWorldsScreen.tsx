import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, Image, Alert, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useCurrentProject, useProjects, useStoryboardStore } from "../state/storyboardStore";
import { ProjectType, GenerationQuality } from "../types/storyboard";
import { MiniWorldInputModal } from "../components/MiniWorldInputModal";
import { ProjectSelectorModal } from "../components/ProjectSelectorModal";

interface MiniWorldsScreenProps {
  // React Navigation injects props automatically
}

export default function MiniWorldsScreen({ }: MiniWorldsScreenProps = {}) {
  const [showInputModal, setShowInputModal] = useState(false);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [localPrompt, setLocalPrompt] = useState("");

  const currentProject = useCurrentProject();
  const projects = useProjects();
  const setCurrentProject = useStoryboardStore(state => state.setCurrentProject);
  const generatePanelImage = useStoryboardStore(state => state.generatePanelImage);
  const updatePanelPrompt = useStoryboardStore(state => state.updatePanelPrompt);
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

  // Sync local prompt with active panel prompt
  useEffect(() => {
    if (activePanel) {
      setLocalPrompt(activePanel.prompt.sceneDescription);
    }
  }, [activePanel?.id, activePanel?.prompt.sceneDescription]);

  const handleSelectProject = (project: any) => {
    setCurrentProject(project);
  };

  const handleCreateNewFromSelector = () => {
    setShowInputModal(true);
  };

  const handleNanoBanana = async () => {
    if (!activePanel) return;

    // Save prompt first if changed
    if (localPrompt !== activePanel.prompt.sceneDescription) {
      updatePanelPrompt(activePanel.id, localPrompt);
    }

    try {
      // Trigger generation
      await generatePanelImage(activePanel.id, GenerationQuality.STANDARD);
    } catch (error) {
      Alert.alert("Error", "NanoBanana slipped! Failed to generate image.");
    }
  };

  const handleSavePrompt = () => {
    if (activePanel && localPrompt !== activePanel.prompt.sceneDescription) {
      updatePanelPrompt(activePanel.id, localPrompt);
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
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

          <View className="flex-row gap-2">
            {/* Export Button could go here */}
          </View>
        </View>

        {/* Main Content Area */}
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 items-center pt-4 pb-24 px-4">

            {/* Big Image Display */}
            <View className="w-full aspect-square max-w-md bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-200 relative">
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

              {/* Loading Overlay */}
              {(isGenerating || activePanel?.isGenerating) && (
                <View className="absolute inset-0 bg-white/80 items-center justify-center">
                  <ActivityIndicator size="large" color="#3B82F6" />
                  <Text className="text-blue-600 font-bold mt-3 text-lg">Generating...</Text>
                </View>
              )}
            </View>

          </View>
        </ScrollView>

        {/* Bottom Controls */}
        <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 shadow-lg border-t border-gray-100">

          {/* Prompt Input */}
          <View className="mb-6">
            <Text className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2 ml-1">
              Prompt
            </Text>
            <View className="bg-gray-50 rounded-xl border border-gray-200 p-3">
              <TextInput
                value={localPrompt}
                onChangeText={setLocalPrompt}
                onBlur={handleSavePrompt}
                placeholder="Describe your MiniWorld..."
                placeholderTextColor="#9CA3AF"
                multiline
                className="text-gray-900 text-base leading-5 min-h-[60px] max-h-[100px]"
                style={{ textAlignVertical: 'top' }}
              />
            </View>
          </View>

          {/* Edit/Generate Button */}
          <Pressable
            onPress={handleNanoBanana}
            disabled={isGenerating || activePanel?.isGenerating}
            className={`w-full py-4 rounded-2xl flex-row items-center justify-center shadow-sm ${isGenerating ? 'bg-gray-100' : 'bg-blue-600 active:bg-blue-700'
              }`}
          >
            {isGenerating ? (
              <ActivityIndicator color="#6B7280" />
            ) : (
              <>
                <Ionicons name="pencil" size={20} color="white" style={{ marginRight: 8 }} />
                <Text className="text-white text-xl font-bold tracking-wide">
                  Editar
                </Text>
              </>
            )}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
