import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ArchitecturalMetadata, StoryboardPrompt } from "../types/storyboard";

const formatLabel = (label: string) =>
  label
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, char => char.toUpperCase());

interface PromptPreviewProps {
  prompt: StoryboardPrompt;
  characters: Array<{ id: string; name: string; description: string }>;
  scene: { name: string; location: string; environment: string };
  metadata?: ArchitecturalMetadata;
  mode?: "storyboard" | "architectural";
  onEdit?: () => void;
}

export default function PromptPreview({ prompt, characters, scene, metadata, mode = "storyboard", onEdit }: PromptPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isArchitectural = mode === "architectural";

  const panelCharacters = isArchitectural
    ? []
    : characters.filter(char => prompt.characters.includes(char.id));

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
        {isArchitectural ? (
          <>
            {prompt.viewType && (
              <View className="bg-blue-100 px-2 py-1 rounded">
                <Text className="text-blue-700 text-xs font-medium">
                  {prompt.viewType.replace(/_/g, " ")}
                </Text>
              </View>
            )}
            {prompt.detailLevel && (
              <View className="bg-green-100 px-2 py-1 rounded">
                <Text className="text-green-700 text-xs font-medium">
                  {prompt.detailLevel.replace(/_/g, " ")}
                </Text>
              </View>
            )}
            {(prompt.scale || metadata?.scale) && (
              <View className="bg-gray-100 px-2 py-1 rounded">
                <Text className="text-gray-700 text-xs font-medium">
                  Scale {prompt.scale || metadata?.scale}
                </Text>
              </View>
            )}
            {(prompt.unitSystem || metadata?.unitSystem) && (
              <View className="bg-gray-100 px-2 py-1 rounded">
                <Text className="text-gray-700 text-xs font-medium">
                  {(prompt.unitSystem || metadata?.unitSystem || "metric").toUpperCase()} units
                </Text>
              </View>
            )}
            {(prompt.standards || metadata?.standards)?.map(standard => (
              <View key={standard} className="bg-blue-50 px-2 py-1 rounded">
                <Text className="text-blue-600 text-xs font-medium">{standard}</Text>
              </View>
            ))}
          </>
        ) : (
          <>
            {prompt.composition && (
              <View className="bg-blue-100 px-2 py-1 rounded">
                <Text className="text-blue-700 text-xs font-medium">
                  {prompt.composition.replace("_", " ")}
                </Text>
              </View>
            )}
            {prompt.panelType && typeof prompt.panelType === 'string' && (
              <View className="bg-green-100 px-2 py-1 rounded">
                <Text className="text-green-700 text-xs font-medium">
                  {prompt.panelType.replace("_", " ")}
                </Text>
              </View>
            )}
            {panelCharacters.length > 0 && (
              <View className="bg-purple-100 px-2 py-1 rounded">
                <Text className="text-purple-700 text-xs font-medium">
                  {panelCharacters.length} character{panelCharacters.length > 1 ? "s" : ""}
                </Text>
              </View>
            )}
          </>
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
            {isArchitectural ? (
              <>
                <View className="mb-3">
                  <Text className="text-xs font-semibold text-gray-700 mb-1">View:</Text>
                  <Text className="text-xs text-gray-600 ml-2">
                    {prompt.viewType?.replace(/_/g, " ") || "Section"} • Scale {prompt.scale || metadata?.scale || "1:20"} • {(prompt.unitSystem || metadata?.unitSystem || "metric").toUpperCase()} units
                  </Text>
                </View>

                {prompt.components?.length || metadata?.components?.length ? (
                  <View className="mb-3">
                    <Text className="text-xs font-semibold text-gray-700 mb-1">Components:</Text>
                    {(prompt.components || metadata?.components || []).map(component => (
                      <Text key={component} className="text-xs text-gray-600 ml-2">• {component}</Text>
                    ))}
                  </View>
                ) : null}

                {prompt.materials?.length || metadata?.materials?.length ? (
                  <View className="mb-3">
                    <Text className="text-xs font-semibold text-gray-700 mb-1">Materials:</Text>
                    {(prompt.materials || metadata?.materials || []).map(material => (
                      <Text key={material} className="text-xs text-gray-600 ml-2">• {material}</Text>
                    ))}
                  </View>
                ) : null}

                {prompt.dimensions?.length || metadata?.dimensions?.length ? (
                  <View className="mb-3">
                    <Text className="text-xs font-semibold text-gray-700 mb-1">Dimensions:</Text>
                    {(prompt.dimensions || metadata?.dimensions || []).map(dimension => (
                      <Text key={dimension} className="text-xs text-gray-600 ml-2">• {dimension}</Text>
                    ))}
                  </View>
                ) : null}

                {prompt.annotations?.length || metadata?.annotations?.length ? (
                  <View className="mb-3">
                    <Text className="text-xs font-semibold text-gray-700 mb-1">Annotations:</Text>
                    {(prompt.annotations || metadata?.annotations || []).map(annotation => (
                      <Text key={annotation} className="text-xs text-gray-600 ml-2">• {annotation}</Text>
                    ))}
                  </View>
                ) : null}

                {prompt.diagramLayers?.length || metadata?.diagramLayers?.length ? (
                  <View className="mb-3">
                    <Text className="text-xs font-semibold text-gray-700 mb-1">Diagram Layers:</Text>
                    {(prompt.diagramLayers || metadata?.diagramLayers || []).map(layer => (
                      <Text key={layer} className="text-xs text-gray-600 ml-2">• {formatLabel(layer)}</Text>
                    ))}
                  </View>
                ) : null}

                {metadata?.programItems?.length ? (
                  <View className="mb-3">
                    <Text className="text-xs font-semibold text-gray-700 mb-1">Program:</Text>
                    {metadata.programItems.map(item => (
                      <Text key={item} className="text-xs text-gray-600 ml-2">• {item}</Text>
                    ))}
                  </View>
                ) : null}

                {(prompt.metadataNotes?.length || metadata?.generalNotes?.length) && (
                  <View className="mb-3">
                    <Text className="text-xs font-semibold text-gray-700 mb-1">Notes:</Text>
                    {Array.from(new Set([...(prompt.metadataNotes || []), ...(metadata?.generalNotes || [])])).map(note => (
                      <Text key={note} className="text-xs text-gray-600 ml-2">• {note}</Text>
                    ))}
                  </View>
                )}
              </>
            ) : (
              <>
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

                <View className="mb-3">
                  <Text className="text-xs font-semibold text-gray-700 mb-1">Scene:</Text>
                  <Text className="text-xs text-gray-600 ml-2">
                    {scene.location} - {scene.environment}
                  </Text>
                </View>

                {prompt.action && (
                  <View className="mb-3">
                    <Text className="text-xs font-semibold text-gray-700 mb-1">Action:</Text>
                    <Text className="text-xs text-gray-600 ml-2">{prompt.action}</Text>
                  </View>
                )}

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
              </>
            )}

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
