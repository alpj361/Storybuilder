import React, { useState } from "react";
import { View, Text, Modal, Pressable, ScrollView, Alert, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StoryboardPanel, Character } from "../types/storyboard";
import PromptEditModal from "./PromptEditModal";

interface PromptReviewModalProps {
  visible: boolean;
  onClose: () => void;
  panels: StoryboardPanel[];
  characters: Character[];
  onPanelsUpdate: (panels: StoryboardPanel[]) => void;
  onContinueToStoryboard: () => void;
  isGenerating?: boolean;
}

export default function PromptReviewModal({
  visible,
  onClose,
  panels,
  characters,
  onPanelsUpdate,
  onContinueToStoryboard,
  isGenerating = false
}: PromptReviewModalProps) {
  const [editingPanel, setEditingPanel] = useState<StoryboardPanel | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleDeletePanel = (panelId: string) => {
    Alert.alert(
      "Delete Panel",
      "Are you sure you want to delete this panel?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const updatedPanels = panels.filter(p => p.id !== panelId);
            // Renumber remaining panels
            const renumberedPanels = updatedPanels.map((panel, index) => ({
              ...panel,
              panelNumber: index + 1,
              prompt: {
                ...panel.prompt,
                panelNumber: index + 1
              }
            }));
            onPanelsUpdate(renumberedPanels);
          }
        }
      ]
    );
  };

  const handleEditPanel = (panel: StoryboardPanel) => {
    setEditingPanel(panel);
    setShowEditModal(true);
  };

  const handleSavePrompt = (newPrompt: string) => {
    if (!editingPanel) return;

    const updatedPanels = panels.map(p =>
      p.id === editingPanel.id
        ? {
            ...p,
            prompt: {
              ...p.prompt,
              generatedPrompt: newPrompt
            },
            isEdited: true
          }
        : p
    );

    onPanelsUpdate(updatedPanels);
    setEditingPanel(null);
  };

  const handleClose = () => {
    if (!isGenerating) {
      Alert.alert(
        "Cancel Generation",
        "Are you sure you want to cancel? Your prompts will be lost.",
        [
          { text: "Stay", style: "cancel" },
          { text: "Cancel", style: "destructive", onPress: onClose }
        ]
      );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-6 pt-4 pb-3">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold text-gray-900">Review Prompts</Text>
              <Text className="text-sm text-gray-600 mt-1">
                {panels.length} panel{panels.length !== 1 ? 's' : ''} • Edit or delete before generating images
              </Text>
            </View>
            <Pressable
              onPress={handleClose}
              disabled={isGenerating}
              className="w-10 h-10 items-center justify-center rounded-full bg-gray-200"
            >
              <Ionicons name="close" size={24} color="#374151" />
            </Pressable>
          </View>
        </View>

        {/* Content */}
        <ScrollView className="flex-1 px-6 py-4">
          {/* Info Banner */}
          <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#3b82f6" />
              <View className="flex-1 ml-2">
                <Text className="text-sm text-blue-900 leading-5">
                  <Text className="font-semibold">Review your prompts:</Text> You can edit any prompt to refine it, or delete panels you don't need. When you're ready, continue to the storyboard to generate images individually.
                </Text>
              </View>
            </View>
          </View>

          {/* Panels List */}
          {panels.map((panel, index) => {
            const panelChars = characters.filter(c => panel.prompt.characters.includes(c.id));
            const promptPreview = panel.prompt.generatedPrompt.substring(0, 200);

            return (
              <View key={panel.id} className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
                {/* Panel Header */}
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1 mr-2">
                    <Text className="text-lg font-bold text-gray-900 mb-1">
                      Panel {panel.panelNumber}
                    </Text>
                    {panelChars.length > 0 && (
                      <View className="flex-row flex-wrap gap-1 mt-1">
                        {panelChars.map(char => (
                          <View key={char.id} className="bg-purple-100 px-2 py-1 rounded">
                            <Text className="text-purple-700 text-xs font-medium">
                              {char.name}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                  <View className="flex-row items-center gap-2 ml-2">
                    <Pressable
                      onPress={() => handleEditPanel(panel)}
                      disabled={isGenerating}
                      className="bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg"
                    >
                      <View className="flex-row items-center">
                        <Ionicons name="pencil" size={14} color="#3b82f6" />
                        <Text className="text-blue-600 text-xs font-medium ml-1">Edit</Text>
                      </View>
                    </Pressable>
                    <Pressable
                      onPress={() => handleDeletePanel(panel.id)}
                      disabled={isGenerating || panels.length === 1}
                      className={`${panels.length === 1 ? 'bg-gray-100 border border-gray-300' : 'bg-red-50 border border-red-200'} p-2 rounded-lg`}
                    >
                      <Ionicons
                        name="trash"
                        size={14}
                        color={panels.length === 1 ? '#9ca3af' : '#ef4444'}
                      />
                    </Pressable>
                  </View>
                </View>

                {/* Scene Description */}
                <View className="mb-2">
                  <Text className="text-xs font-semibold text-gray-600 mb-1">Scene:</Text>
                  <Text className="text-sm text-gray-700">{panel.prompt.sceneDescription}</Text>
                </View>

                {/* Prompt Preview */}
                <View className="bg-gray-50 rounded-lg p-3 mt-2">
                  <Text className="text-xs font-semibold text-gray-600 mb-1">Prompt Preview:</Text>
                  <Text className="text-xs text-gray-700 leading-4 font-mono">
                    {promptPreview}
                    {panel.prompt.generatedPrompt.length > 200 && '...'}
                  </Text>
                  <Pressable
                    onPress={() => handleEditPanel(panel)}
                    disabled={isGenerating}
                    className="mt-2"
                  >
                    <Text className="text-blue-600 text-xs font-medium">
                      Click to expand and edit →
                    </Text>
                  </Pressable>
                </View>

                {panel.isEdited && (
                  <View className="flex-row items-center mt-2">
                    <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
                    <Text className="text-green-600 text-xs ml-1">Edited</Text>
                  </View>
                )}
              </View>
            );
          })}

          {panels.length === 0 && (
            <View className="bg-white border border-gray-200 rounded-lg p-8 items-center">
              <Ionicons name="albums-outline" size={48} color="#9ca3af" />
              <Text className="text-gray-500 text-center mt-3">
                No panels to review. All panels have been deleted.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Action Buttons */}
        {panels.length > 0 && (
          <View className="border-t border-gray-200 p-4 bg-white">
            <Pressable
              onPress={onContinueToStoryboard}
              disabled={isGenerating}
              className={`py-4 px-6 rounded-lg items-center ${
                isGenerating ? 'bg-gray-300' : 'bg-blue-600'
              }`}
            >
              <View className="flex-row items-center">
                <Ionicons name="arrow-forward" size={20} color="white" />
                <Text className="text-white font-semibold text-base ml-2">
                  Continue to Storyboard
                </Text>
              </View>
            </Pressable>
          </View>
        )}
      </View>

      {/* Prompt Edit Modal */}
      {editingPanel && (
        <PromptEditModal
          visible={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingPanel(null);
          }}
          prompt={editingPanel.prompt.generatedPrompt}
          onSave={handleSavePrompt}
          title={`Edit Panel ${editingPanel.panelNumber} Prompt`}
        />
      )}
    </Modal>
  );
}
