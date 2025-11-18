import React from "react";
import { View, Text, Modal, ScrollView, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Location } from "../types/storyboard";

interface LocationDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  location: Location | null;
  panelNumbers?: number[]; // Which panels this location appears in
  onEdit?: (location: Location) => void; // Optional edit handler
}

export function LocationDetailsModal({
  visible,
  onClose,
  location,
  panelNumbers = [],
  onEdit
}: LocationDetailsModalProps) {
  if (!location) return null;

  // Type-based color mapping
  const typeColors: Record<string, { bg: string; text: string; border: string }> = {
    natural: { bg: "bg-green-100", text: "text-green-700", border: "border-green-300" },
    urban: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
    indoor: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-300" },
    fantasy: { bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-300" },
    "sci-fi": { bg: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-300" },
    historical: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300" },
    other: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" }
  };

  const colors = typeColors[location.details.locationType || 'other'] || typeColors.other;

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
                {location.name}
              </Text>
              <View className="flex-row items-center gap-2">
                <View className={`self-start px-3 py-1 rounded-full ${colors.bg} border ${colors.border}`}>
                  <Text className={`text-xs font-semibold ${colors.text} capitalize`}>
                    {location.details.locationType || 'location'}
                  </Text>
                </View>
                {location.details.isRealPlace && (
                  <View className="self-start px-3 py-1 rounded-full bg-orange-100 border border-orange-300">
                    <Text className="text-xs font-semibold text-orange-700">
                      REAL PLACE
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View className="flex-row gap-2">
              {onEdit && (
                <Pressable
                  onPress={() => onEdit(location)}
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
          {location.referenceImage && (
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-2 flex-row items-center">
                <Ionicons name="image-outline" size={16} color="#374151" />
                {" "}Reference Image
              </Text>
              <Image
                source={{ uri: location.referenceImage }}
                className="w-full h-64 rounded-lg mb-2"
                resizeMode="cover"
              />
              {location.useReferenceInPrompt && (
                <View className="space-y-2">
                  <View className="bg-green-50 border border-green-200 rounded-lg p-2 flex-row items-center">
                    <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                    <Text className="text-xs text-green-700 ml-2">
                      Used in prompt generation for visual consistency
                    </Text>
                  </View>

                  {/* Show AI-generated description if available */}
                  {location.aiGeneratedDescription && (
                    <View className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <Text className="text-xs font-semibold text-purple-900 mb-1">
                        AI Visual Description:
                      </Text>
                      <Text className="text-xs text-purple-700 leading-5">
                        {location.aiGeneratedDescription}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Real Place Information */}
          {location.details.isRealPlace && location.details.realPlaceInfo && (
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-3 flex-row items-center">
                <Ionicons name="location-outline" size={16} color="#374151" />
                {" "}Real Place Information
              </Text>
              <View className="bg-orange-50 rounded-lg p-4 space-y-2 border border-orange-200">
                {location.details.realPlaceInfo.specificLocation && (
                  <DetailRow label="Location" value={location.details.realPlaceInfo.specificLocation} />
                )}
                {location.details.realPlaceInfo.city && (
                  <DetailRow label="City" value={location.details.realPlaceInfo.city} />
                )}
                {location.details.realPlaceInfo.country && (
                  <DetailRow label="Country" value={location.details.realPlaceInfo.country} />
                )}
                {location.details.realPlaceInfo.region && (
                  <DetailRow label="Region" value={location.details.realPlaceInfo.region} />
                )}
                {location.details.realPlaceInfo.landmark && (
                  <DetailRow label="Landmark" value={location.details.realPlaceInfo.landmark} />
                )}
                {location.details.realPlaceInfo.knownFor && (
                  <View className="pt-2">
                    <Text className="text-xs font-semibold text-gray-500 mb-1">
                      Known For:
                    </Text>
                    <Text className="text-sm text-gray-600">
                      {location.details.realPlaceInfo.knownFor}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Description */}
          {location.description && (
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-2 flex-row items-center">
                <Ionicons name="document-text-outline" size={16} color="#374151" />
                {" "}Description
              </Text>
              <Text className="text-base text-gray-600 leading-6">
                {location.description}
              </Text>
            </View>
          )}

          {/* Visual Details */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-700 mb-3 flex-row items-center">
              <Ionicons name="eye-outline" size={16} color="#374151" />
              {" "}Visual Details
            </Text>
            <View className="bg-gray-50 rounded-lg p-4 space-y-2">
              {location.details.setting && (
                <DetailRow label="Setting" value={location.details.setting} />
              )}
              {location.details.timeOfDay && (
                <DetailRow label="Time of Day" value={location.details.timeOfDay} />
              )}
              {location.details.weather && (
                <DetailRow label="Weather" value={location.details.weather} />
              )}
              {location.details.lighting && (
                <DetailRow label="Lighting" value={location.details.lighting} />
              )}
              {location.details.atmosphere && (
                <DetailRow label="Atmosphere" value={location.details.atmosphere} />
              )}
              {location.details.architecture && (
                <DetailRow label="Architecture" value={location.details.architecture} />
              )}
              {location.details.terrain && (
                <DetailRow label="Terrain" value={location.details.terrain} />
              )}
              {location.details.vegetation && (
                <DetailRow label="Vegetation" value={location.details.vegetation} />
              )}
              {location.details.colorPalette && (
                <DetailRow label="Color Palette" value={location.details.colorPalette} />
              )}
              {location.details.scale && (
                <DetailRow label="Scale" value={location.details.scale} />
              )}
              {location.details.condition && (
                <DetailRow label="Condition" value={location.details.condition} />
              )}
              {location.details.crowdLevel && (
                <DetailRow label="Crowd Level" value={location.details.crowdLevel} />
              )}
              {location.details.soundscape && (
                <DetailRow label="Soundscape" value={location.details.soundscape} />
              )}
              {location.details.culturalContext && (
                <DetailRow label="Cultural Context" value={location.details.culturalContext} />
              )}

              {/* Prominent Features */}
              {location.details.prominentFeatures &&
               location.details.prominentFeatures.length > 0 && (
                <View className="pt-2">
                  <Text className="text-xs font-semibold text-gray-500 mb-1">
                    Prominent Features:
                  </Text>
                  {location.details.prominentFeatures.map((feature, index) => (
                    <Text key={index} className="text-sm text-gray-600 ml-2">
                      • {feature}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          </View>

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

          {/* Location Consistency Note */}
          {location.details.isRealPlace && (
            <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <View className="flex-row items-start">
                <Ionicons name="information-circle" size={20} color="#2563eb" />
                <View className="flex-1 ml-2">
                  <Text className="text-sm font-semibold text-blue-900 mb-1">
                    Real Place Enhancement
                  </Text>
                  <Text className="text-xs text-blue-700 leading-5">
                    GPT-4o uses its extensive knowledge of this real-world location to enhance the visual details and ensure accurate representation in generated panels.
                  </Text>
                </View>
              </View>
            </View>
          )}
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
      <Text className="text-xs font-semibold text-gray-500 w-28">{label}:</Text>
      <Text className="text-sm text-gray-700 flex-1 capitalize">{value}</Text>
    </View>
  );
}
