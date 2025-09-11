import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Modal, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useStoryboardStore } from "../state/storyboardStore";
import { cn } from "../utils/cn";

interface StoryboardInputModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function StoryboardInputModal({ visible, onClose }: StoryboardInputModalProps) {
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const createProjectFromInput = useStoryboardStore(state => state.createProjectFromInput);
  const error = useStoryboardStore(state => state.error);

  const handleGenerate = async () => {
    if (!input.trim()) {
      Alert.alert("Input Required", "Please describe your storyboard idea");
      return;
    }

    setIsGenerating(true);
    try {
      await createProjectFromInput(input.trim());
      setInput("");
      onClose();
    } catch (err) {
      console.error("Generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      setInput("");
      onClose();
    }
  };

  const examplePrompts = [
    "A guy with a dog walking in the park",
    "Product launch presentation for a new smartphone",
    "Character meeting their best friend after years",
    "Architect showing building design to client",
    "Animation sequence of a cat chasing a mouse"
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
          <Text className="text-xl font-bold text-gray-900">Create Storyboard</Text>
          <Pressable 
            onPress={handleClose}
            disabled={isGenerating}
            className={cn(
              "p-2 rounded-full",
              isGenerating ? "opacity-50" : "opacity-100"
            )}
          >
            <Ionicons name="close" size={24} color="#6B7280" />
          </Pressable>
        </View>

        <ScrollView className="flex-1 p-4">
          {/* Instructions */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Describe Your Story
            </Text>
            <Text className="text-gray-600 text-sm leading-5">
              Tell us about your storyboard idea in simple terms. We'll automatically create a 4-panel sequence with characters, scenes, and detailed prompts ready for image generation.
            </Text>
          </View>

          {/* Input Area */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Your Idea
            </Text>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Example: A guy with a dog walking in the park..."
              multiline
              numberOfLines={4}
              className="border border-gray-300 rounded-lg p-3 text-gray-900 text-base"
              style={{ 
                minHeight: 100,
                textAlignVertical: "top"
              }}
              editable={!isGenerating}
            />
          </View>

          {/* Example Prompts */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-3">
              Example Ideas
            </Text>
            <View className="space-y-2">
              {examplePrompts.map((example, index) => (
                <Pressable
                  key={index}
                  onPress={() => setInput(example)}
                  disabled={isGenerating}
                  className={cn(
                    "p-3 bg-gray-50 rounded-lg border border-gray-200",
                    isGenerating && "opacity-50"
                  )}
                >
                  <Text className="text-gray-700 text-sm">{example}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Error Display */}
          {error && (
            <View className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <View className="flex-row items-center">
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text className="ml-2 text-red-700 text-sm font-medium">Error</Text>
              </View>
              <Text className="text-red-600 text-sm mt-1">{error}</Text>
            </View>
          )}

          {/* Generation Info */}
          <View className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <View className="flex-row items-center mb-2">
              <Ionicons name="information-circle" size={16} color="#2563EB" />
              <Text className="ml-2 text-blue-700 text-sm font-medium">What We'll Create</Text>
            </View>
            <View className="space-y-1">
              <Text className="text-blue-600 text-xs">• 4-panel storyboard sequence</Text>
              <Text className="text-blue-600 text-xs">• Character descriptions and consistency</Text>
              <Text className="text-blue-600 text-xs">• Scene settings and compositions</Text>
              <Text className="text-blue-600 text-xs">• AI-ready prompts for image generation</Text>
            </View>
          </View>
        </ScrollView>

        {/* Generate Button */}
        <View className="p-4 border-t border-gray-200">
          <Pressable
            onPress={handleGenerate}
            disabled={isGenerating || !input.trim()}
            className={cn(
              "flex-row justify-center items-center py-4 px-6 rounded-lg",
              isGenerating || !input.trim()
                ? "bg-gray-300"
                : "bg-blue-500"
            )}
          >
            {isGenerating ? (
              <>
                <Ionicons name="hourglass" size={20} color="white" />
                <Text className="ml-2 text-white font-semibold">Generating...</Text>
              </>
            ) : (
              <>
                <Ionicons name="create" size={20} color="white" />
                <Text className="ml-2 text-white font-semibold">Generate Storyboard</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}