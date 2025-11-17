import React, { useState, useEffect } from "react";
import { View, Text, Modal, TextInput, Pressable, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface PromptEditModalProps {
  visible: boolean;
  onClose: () => void;
  prompt: string;
  onSave: (editedPrompt: string) => void;
  title?: string;
}

export default function PromptEditModal({
  visible,
  onClose,
  prompt,
  onSave,
  title = "Edit Prompt"
}: PromptEditModalProps) {
  const [editedPrompt, setEditedPrompt] = useState("");

  useEffect(() => {
    if (visible) {
      setEditedPrompt(prompt);
    }
  }, [visible, prompt]);

  const handleSave = () => {
    if (!editedPrompt.trim()) {
      Alert.alert("Validation Error", "Prompt cannot be empty.");
      return;
    }

    onSave(editedPrompt.trim());
    onClose();
  };

  const handleClose = () => {
    // Check if there are unsaved changes
    if (editedPrompt.trim() !== prompt.trim()) {
      Alert.alert(
        "Unsaved Changes",
        "You have unsaved changes. Are you sure you want to close?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Discard", style: "destructive", onPress: onClose }
        ]
      );
    } else {
      onClose();
    }
  };

  // Parse sections from the prompt (CHARACTER, ACTION, CAMERA, etc.)
  const sections = editedPrompt.split('\n\n').filter(s => s.trim());

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="bg-gray-50 border-b border-gray-200 px-6 pt-4 pb-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-gray-900">{title}</Text>
            <Pressable
              onPress={handleClose}
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
                  <Text className="font-semibold">Tip:</Text> This is the structured prompt that will be sent to the AI for image generation. You can edit any section to fine-tune the results.
                </Text>
              </View>
            </View>
          </View>

          {/* Section Count */}
          <View className="mb-3">
            <Text className="text-sm text-gray-600">
              Sections: {sections.length} • Characters: {editedPrompt.length}
            </Text>
          </View>

          {/* Edit Area */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Prompt Content
            </Text>
            <TextInput
              value={editedPrompt}
              onChangeText={setEditedPrompt}
              placeholder="Enter your structured prompt here..."
              multiline
              numberOfLines={20}
              className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-white"
              style={{
                minHeight: 400,
                textAlignVertical: "top",
                fontFamily: "monospace"
              }}
            />
          </View>

          {/* Preview Sections */}
          <View className="bg-gray-50 rounded-lg p-4 mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-3">
              Section Preview
            </Text>
            {sections.map((section, index) => {
              const match = section.match(/^([A-Z\s]+):/);
              const sectionName = match ? match[1].trim() : `Section ${index + 1}`;
              const content = match ? section.substring(match[0].length).trim() : section;

              return (
                <View key={index} className="mb-3">
                  <View className="flex-row items-center mb-1">
                    <View className="bg-purple-100 px-2 py-1 rounded">
                      <Text className="text-purple-700 text-xs font-semibold">
                        {sectionName}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-xs text-gray-600 leading-4 ml-2">
                    {content.substring(0, 150)}{content.length > 150 ? '...' : ''}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Helpful Tips */}
          <View className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <View className="flex-row items-start">
              <Ionicons name="bulb" size={18} color="#f59e0b" />
              <View className="flex-1 ml-2">
                <Text className="text-xs font-semibold text-amber-900 mb-2">
                  Editing Guidelines:
                </Text>
                <Text className="text-xs text-amber-800 leading-4 mb-1">
                  • Keep the section labels (CHARACTER:, ACTION:, etc.)
                </Text>
                <Text className="text-xs text-amber-800 leading-4 mb-1">
                  • Separate sections with double line breaks
                </Text>
                <Text className="text-xs text-amber-800 leading-4 mb-1">
                  • Be specific and descriptive for better results
                </Text>
                <Text className="text-xs text-amber-800 leading-4">
                  • Avoid contradictory instructions
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View className="border-t border-gray-200 p-4 bg-white flex-row gap-3">
          <Pressable
            onPress={handleClose}
            className="flex-1 bg-gray-200 py-3 px-6 rounded-lg items-center active:opacity-80"
          >
            <Text className="text-gray-700 font-semibold text-base">Cancel</Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            className="flex-1 bg-blue-600 py-3 px-6 rounded-lg items-center active:opacity-80"
          >
            <Text className="text-white font-semibold text-base">Save Changes</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
