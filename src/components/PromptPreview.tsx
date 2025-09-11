import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StoryboardPrompt } from "../types/storyboard";
import { cn } from "../utils/cn";

interface PromptPreviewProps {
  prompt: StoryboardPrompt;
  characters: Array<{ id: string; name: string; description: string }>;
  scene: { name: string; location: string; environment: string };
  onEdit?: () => void;
}

export default function PromptPreview({ prompt, characters, scene, onEdit }: PromptPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const panelCharacters = characters.filter(char => 
    prompt.characters.includes(char.id)
  );

  return (
    <View className="bg-white border border-gray-200 rounded-lg p-3">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-sm font-semibold text-gray-700">
          Generated Prompt
        </Text>
        <View className="flex-row items-center space-x-2">
          {onEdit && (
            <Pressable
              onPress={onEdit}
              className="p-1 rounded"
            >
              <Ionicons name="pencil" size={14} color="#6B7280" />
            </Pressable>
          )}
          <Pressable
            onPress={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded"
          >
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={14} 
              color="#6B7280" 
            />
          </Pressable>
        </View>
      </View>

      {/* Quick Info */}
      <View className="flex-row flex-wrap gap-1 mb-2">
        <View className="bg-blue-100 px-2 py-1 rounded">
          <Text className="text-blue-700 text-xs font-medium">
            {prompt.composition.replace("_", " ")}
          </Text>
        </View>
        <View className="bg-green-100 px-2 py-1 rounded">
          <Text className="text-green-700 text-xs font-medium">
            {prompt.panelType.replace("_", " ")}
          </Text>
        </View>
        {panelCharacters.length > 0 && (
          <View className="bg-purple-100 px-2 py-1 rounded">
            <Text className="text-purple-700 text-xs font-medium">
              {panelCharacters.length} character{panelCharacters.length > 1 ? "s" : ""}
            </Text>
          </View>
        )}
      </View>

      {/* Preview Text */}
      <Text className="text-gray-600 text-xs leading-4 mb-2">
        {prompt.sceneDescription}
      </Text>

      {/* Expanded Details */}
      {isExpanded && (
        <View className="border-t border-gray-100 pt-3 mt-2">
          <ScrollView className="max-h-40">
            {/* Characters */}
            {panelCharacters.length > 0 && (
              <View className="mb-3">
                <Text className="text-xs font-semibold text-gray-700 mb-1">Characters:</Text>
                {panelCharacters.map(char => (
                  <Text key={char.id} className="text-xs text-gray-600 ml-2">
                    • {char.name}: {char.description}
                  </Text>
                ))}
              </View>
            )}

            {/* Scene Info */}
            <View className="mb-3">
              <Text className="text-xs font-semibold text-gray-700 mb-1">Scene:</Text>
              <Text className="text-xs text-gray-600 ml-2">
                {scene.location} - {scene.environment}
              </Text>
            </View>

            {/* Action */}
            {prompt.action && (
              <View className="mb-3">
                <Text className="text-xs font-semibold text-gray-700 mb-1">Action:</Text>
                <Text className="text-xs text-gray-600 ml-2">{prompt.action}</Text>
              </View>
            )}

            {/* Technical Details */}
            <View className="mb-3">
              <Text className="text-xs font-semibold text-gray-700 mb-1">Technical:</Text>
              <Text className="text-xs text-gray-600 ml-2">
                Camera: {prompt.cameraAngle || "Standard angle"}
              </Text>
              <Text className="text-xs text-gray-600 ml-2">
                Lighting: {prompt.lighting || "Natural"}
              </Text>
              <Text className="text-xs text-gray-600 ml-2">
                Mood: {prompt.mood || "Neutral"}
              </Text>
            </View>

            {/* Full Generated Prompt */}
            {prompt.generatedPrompt && (
              <View className="mb-2">
                <Text className="text-xs font-semibold text-gray-700 mb-1">Full AI Prompt:</Text>
                <View className="bg-gray-50 p-2 rounded border">
                  <Text className="text-xs text-gray-700 leading-4">
                    {prompt.generatedPrompt}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}