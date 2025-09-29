import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useCurrentProject, useStoryboardStore } from "../state/storyboardStore";
import { StoryboardPanel as StoryboardPanelType } from "../types/storyboard";
import StoryboardInputModal from "../components/StoryboardInputModal";
import PromptPreview from "../components/PromptPreview";
import CharacterTag from "../components/CharacterTag";

interface StoryboardPanelProps {
  panel?: StoryboardPanelType;
  panelNumber: number;
}

const StoryboardPanel: React.FC<StoryboardPanelProps> = ({ panel, panelNumber }) => {
  const currentProject = useCurrentProject();
  const generatePanelImage = useStoryboardStore(state => state.generatePanelImage);
  
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
          <Text className="text-gray-400 text-xs mt-2">Generate storyboard first</Text>
        </View>
        
        {/* Notes Section */}
        <View className="mt-3 p-2 bg-gray-50 rounded">
          <Text className="text-xs text-gray-500 mb-1">Notes:</Text>
          <Text className="text-xs text-gray-400">No prompt generated yet</Text>
        </View>
      </View>
    );
  }

  const panelCharacters = currentProject?.characters.filter(char => 
    panel.prompt.characters.includes(char.id)
  ) || [];

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
      
      {/* Character Tags */}
      {panelCharacters.length > 0 && (
        <View className="flex-row flex-wrap gap-1 mb-3">
          {panelCharacters.map(character => (
            <CharacterTag key={character.id} character={character} size="small" />
          ))}
        </View>
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
          />
        </View>
      )}
    </View>
  );
};

export default function StoryboardScreen() {
  const [showInputModal, setShowInputModal] = useState(false);
  const currentProject = useCurrentProject();
  const clearCurrentProject = useStoryboardStore(state => state.clearCurrentProject);
  const generateAllPanelImages = useStoryboardStore(state => state.generateAllPanelImages);
  const isGenerating = useStoryboardStore(state => state.isGenerating);
  
  const handleNewProject = () => {
    setShowInputModal(true);
  };

  const handleClearProject = () => {
    clearCurrentProject();
  };

  const handleGenerateAllImages = async () => {
    if (!currentProject) return;
    
    try {
      await generateAllPanelImages();
    } catch (error) {
      Alert.alert("Error", "Failed to generate images for all panels");
    }
  };
  
  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-xl font-bold text-gray-900">Storyboard</Text>
            <Text className="text-sm text-gray-500">
              {currentProject?.title || "No Project"}
            </Text>
          </View>
          <View className="flex-row space-x-3">
            {currentProject && (
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
            {currentProject && (
              <Pressable onPress={handleClearProject}>
                <Ionicons name="trash-outline" size={24} color="#6B7280" />
              </Pressable>
            )}
            <Ionicons name="settings-outline" size={24} color="#6B7280" />
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Project Info */}
        {currentProject && (
          <View className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
            <Text className="text-sm font-semibold text-gray-700 mb-1">Project Description</Text>
            <Text className="text-sm text-gray-600 mb-3">{currentProject.description}</Text>
            
            {currentProject.characters.length > 0 && (
              <View className="flex-row flex-wrap gap-1">
                {currentProject.characters.map(character => (
                  <CharacterTag key={character.id} character={character} size="medium" />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Panels Grid (dynamic) */}
        <View className="flex-1">
          <View className="flex-row flex-wrap -mx-1">
            {(currentProject?.panels?.length ? currentProject.panels : [undefined, undefined, undefined, undefined]).map((panel, idx) => (
              <View key={panel ? panel.id : `placeholder-${idx}`} className="w-1/2 px-1 mb-2">
                <StoryboardPanel 
                  panel={panel as any}
                  panelNumber={idx + 1}
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
              name={currentProject ? "refresh" : "add"} 
              size={20} 
              color="#3B82F6" 
            />
            <Text className="ml-2 text-blue-500 font-medium">
              {currentProject ? "Generate New Storyboard" : "Create Your First Storyboard"}
            </Text>
          </View>
        </Pressable>
      </ScrollView>

      {/* Input Modal */}
      <StoryboardInputModal 
        visible={showInputModal}
        onClose={() => setShowInputModal(false)}
      />
    </SafeAreaView>
  );
}
