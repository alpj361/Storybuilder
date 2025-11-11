import React from "react";
import { View, Text, Modal, ScrollView, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Character } from "../types/storyboard";

interface CharacterDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  character: Character | null;
  panelNumbers?: number[]; // Which panels this character appears in
  onEdit?: (character: Character) => void; // Optional edit handler
}

export function CharacterDetailsModal({
  visible,
  onClose,
  character,
  panelNumbers = [],
  onEdit
}: CharacterDetailsModalProps) {
  if (!character) return null;

  // Role-based color mapping
  const roleColors = {
    protagonist: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
    antagonist: { bg: "bg-red-100", text: "text-red-700", border: "border-red-300" },
    supporting: { bg: "bg-green-100", text: "text-green-700", border: "border-green-300" },
    background: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" }
  };

  const colors = roleColors[character.role] || roleColors.background;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      transparent={false}
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="bg-gray-50 border-b border-gray-200 px-6 pt-4 pb-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900 mb-1">
                {character.name}
              </Text>
              <View className={`self-start px-3 py-1 rounded-full ${colors.bg} border ${colors.border}`}>
                <Text className={`text-xs font-semibold ${colors.text} capitalize`}>
                  {character.role}
                </Text>
              </View>
            </View>
            <View className="flex-row gap-2">
              {onEdit && (
                <Pressable
                  onPress={() => onEdit(character)}
                  className="w-10 h-10 items-center justify-center rounded-full bg-blue-100"
                >
                  <Ionicons name="pencil" size={20} color="#3b82f6" />
                </Pressable>
              )}
              <Pressable
                onPress={onClose}
                className="w-10 h-10 items-center justify-center rounded-full bg-gray-200"
              >
                <Ionicons name="close" size={24} color="#374151" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Content */}
        <ScrollView className="flex-1 px-6 py-4">
          {/* Reference Image */}
          {character.referenceImage && (
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-2 flex-row items-center">
                <Ionicons name="image-outline" size={16} color="#374151" />
                {" "}Reference Image
              </Text>
              <Image
                source={{ uri: character.referenceImage }}
                className="w-full h-64 rounded-lg mb-2"
                resizeMode="cover"
              />
              {character.useReferenceInPrompt && (
                <View className="bg-green-50 border border-green-200 rounded-lg p-2 flex-row items-center">
                  <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                  <Text className="text-xs text-green-700 ml-2">
                    Used in prompt generation for visual consistency
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Description */}
          {character.description && (
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-2 flex-row items-center">
                <Ionicons name="document-text-outline" size={16} color="#374151" />
                {" "}Description
              </Text>
              <Text className="text-base text-gray-600 leading-6">
                {character.description}
              </Text>
            </View>
          )}

          {/* Appearance */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-700 mb-3 flex-row items-center">
              <Ionicons name="person-outline" size={16} color="#374151" />
              {" "}Appearance
            </Text>
            <View className="bg-gray-50 rounded-lg p-4 space-y-2">
              {character.appearance.age && (
                <DetailRow label="Age" value={character.appearance.age} />
              )}
              {character.appearance.gender && (
                <DetailRow label="Gender" value={character.appearance.gender} />
              )}
              {character.appearance.height && (
                <DetailRow label="Height" value={character.appearance.height} />
              )}
              {character.appearance.build && (
                <DetailRow label="Build" value={character.appearance.build} />
              )}
              {character.appearance.hair && (
                <DetailRow label="Hair" value={character.appearance.hair} />
              )}
              {character.appearance.clothing && (
                <DetailRow label="Clothing" value={character.appearance.clothing} />
              )}
              {character.appearance.distinctiveFeatures &&
               character.appearance.distinctiveFeatures.length > 0 && (
                <View className="pt-2">
                  <Text className="text-xs font-semibold text-gray-500 mb-1">
                    Distinctive Features:
                  </Text>
                  {character.appearance.distinctiveFeatures.map((feature, index) => (
                    <Text key={index} className="text-sm text-gray-600 ml-2">
                      • {feature}
                    </Text>
                  ))}
                </View>
              )}

              {/* Show if no appearance data */}
              {!character.appearance.age &&
               !character.appearance.gender &&
               !character.appearance.height &&
               !character.appearance.build &&
               !character.appearance.hair &&
               !character.appearance.clothing &&
               (!character.appearance.distinctiveFeatures ||
                character.appearance.distinctiveFeatures.length === 0) && (
                <Text className="text-sm text-gray-400 italic">
                  No specific appearance details provided. Visual appearance will be generated naturally in Panel 1.
                </Text>
              )}
            </View>
          </View>

          {/* Personality (if exists) */}
          {character.personality && character.personality.length > 0 && (
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-2 flex-row items-center">
                <Ionicons name="heart-outline" size={16} color="#374151" />
                {" "}Personality
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {character.personality.map((trait, index) => (
                  <View
                    key={index}
                    className="bg-purple-100 px-3 py-1.5 rounded-full border border-purple-200"
                  >
                    <Text className="text-sm text-purple-700">{trait}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Appears in Panels */}
          {panelNumbers.length > 0 && (
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-2 flex-row items-center">
                <Ionicons name="grid-outline" size={16} color="#374151" />
                {" "}Appears in Panels
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {panelNumbers.map((num) => (
                  <View
                    key={num}
                    className="bg-indigo-100 px-3 py-1.5 rounded border border-indigo-200"
                  >
                    <Text className="text-sm font-semibold text-indigo-700">
                      Panel {num}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Character Consistency Note */}
          <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#2563eb" />
              <View className="flex-1 ml-2">
                <Text className="text-sm font-semibold text-blue-900 mb-1">
                  Character Consistency
                </Text>
                <Text className="text-xs text-blue-700 leading-5">
                  This character's visual appearance is established in Panel 1. All subsequent panels reference "same {character.name} from previous panels" to maintain consistent appearance throughout the storyboard.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Close Button at Bottom */}
        <View className="border-t border-gray-200 p-4 bg-white">
          <Pressable
            onPress={onClose}
            className="bg-gray-800 py-3 px-6 rounded-lg items-center active:opacity-80"
          >
            <Text className="text-white font-semibold text-base">Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// Helper component for detail rows
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row py-1">
      <Text className="text-xs font-semibold text-gray-500 w-24">{label}:</Text>
      <Text className="text-sm text-gray-700 flex-1 capitalize">{value}</Text>
    </View>
  );
}
