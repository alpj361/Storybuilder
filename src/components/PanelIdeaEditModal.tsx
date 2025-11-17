import React, { useState, useEffect } from "react";
import { View, Text, Modal, TextInput, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface PanelIdeaEditModalProps {
  visible: boolean;
  onClose: () => void;
  panelNumber: number;
  currentIdea: string;
  onSave: (newIdea: string) => void;
}

export default function PanelIdeaEditModal({
  visible,
  onClose,
  panelNumber,
  currentIdea,
  onSave
}: PanelIdeaEditModalProps) {
  const [idea, setIdea] = useState("");

  useEffect(() => {
    if (visible) {
      setIdea(currentIdea);
    }
  }, [visible, currentIdea]);

  const handleSave = () => {
    if (!idea.trim()) {
      Alert.alert("Validation Error", "Panel idea cannot be empty.");
      return;
    }

    onSave(idea.trim());
    onClose();
  };

  const handleClose = () => {
    if (idea.trim() !== currentIdea.trim()) {
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="bg-gray-50 border-b border-gray-200 px-6 pt-4 pb-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-gray-900">
              Edit Panel {panelNumber} Idea
            </Text>
            <Pressable
              onPress={handleClose}
              className="w-10 h-10 items-center justify-center rounded-full bg-gray-200"
            >
              <Ionicons name="close" size={24} color="#374151" />
            </Pressable>
          </View>
        </View>

        {/* Content */}
        <View className="flex-1 px-6 py-4">
          {/* Info Banner */}
          <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#3b82f6" />
              <View className="flex-1 ml-2">
                <Text className="text-sm text-blue-900 leading-5">
                  <Text className="font-semibold">Edit the panel idea:</Text> Describe what should happen in this panel. After saving, a new structured prompt will be generated and you can review it before regenerating the image.
                </Text>
              </View>
            </View>
          </View>

          {/* Edit Area */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Panel Idea / Scene Description
            </Text>
            <TextInput
              value={idea}
              onChangeText={setIdea}
              placeholder="Describe what happens in this panel..."
              multiline
              numberOfLines={8}
              className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-white"
              style={{
                minHeight: 200,
                textAlignVertical: "top"
              }}
              autoFocus
            />
          </View>

          {/* Character Counter */}
          <View className="mb-4">
            <Text className="text-xs text-gray-500">
              {idea.length} characters
            </Text>
          </View>

          {/* Tips */}
          <View className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <View className="flex-row items-start">
              <Ionicons name="bulb" size={18} color="#f59e0b" />
              <View className="flex-1 ml-2">
                <Text className="text-xs font-semibold text-amber-900 mb-2">
                  Tips for better panels:
                </Text>
                <Text className="text-xs text-amber-800 leading-4 mb-1">
                  • Be specific about character actions and expressions
                </Text>
                <Text className="text-xs text-amber-800 leading-4 mb-1">
                  • Describe the camera angle and framing
                </Text>
                <Text className="text-xs text-amber-800 leading-4 mb-1">
                  • Mention important environmental details
                </Text>
                <Text className="text-xs text-amber-800 leading-4">
                  • Keep it concise but descriptive
                </Text>
              </View>
            </View>
          </View>
        </View>

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
            <Text className="text-white font-semibold text-base">
              Save & Regenerate Prompt
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
