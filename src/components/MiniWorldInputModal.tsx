import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, Modal, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useStoryboardStore } from "../state/storyboardStore";
import { Character, Location } from "../types/storyboard";
import { cn } from "../utils/cn";
import { CharacterEditModal } from "./CharacterEditModal";
import CharacterTag from "./CharacterTag";
import { LocationEditModal } from "./LocationEditModal";
import LocationTag from "./LocationTag";
import LocationLibraryModal from "./LocationLibraryModal";

interface MiniWorldInputModalProps {
  visible: boolean;
  onClose: () => void;
}

export function MiniWorldInputModal({
  visible,
  onClose
}: MiniWorldInputModalProps) {
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [showCharacterEditModal, setShowCharacterEditModal] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [showLocationEditModal, setShowLocationEditModal] = useState(false);
  const [showLocationLibraryModal, setShowLocationLibraryModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const createMiniWorldProject = useStoryboardStore(state => state.createMiniWorldProject);
  const error = useStoryboardStore(state => state.error);

  useEffect(() => {
    if (!visible) {
      setInput("");
      setCharacters([]);
      setLocations([]);
    }
  }, [visible]);

  // Character management handlers
  const handleAddCharacter = () => {
    setEditingCharacter(null);
    setShowCharacterEditModal(true);
  };

  const handleEditCharacter = (character: Character) => {
    setEditingCharacter(character);
    setShowCharacterEditModal(true);
  };

  const handleSaveCharacter = (character: Character) => {
    if (editingCharacter) {
      // Update existing character
      setCharacters(prev => prev.map(c => c.id === character.id ? character : c));
    } else {
      // Add new character
      setCharacters(prev => [...prev, character]);
    }
  };

  const handleDeleteCharacter = (characterId: string) => {
    Alert.alert(
      "Delete Character",
      "Are you sure you want to delete this character?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => setCharacters(prev => prev.filter(c => c.id !== characterId))
        }
      ]
    );
  };

  // Location management handlers
  const handleAddLocation = () => {
    setEditingLocation(null);
    setShowLocationEditModal(true);
  };

  const handleSelectFromLibrary = () => {
    setShowLocationLibraryModal(true);
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setShowLocationEditModal(true);
  };

  const handleSaveLocation = (location: Location) => {
    if (editingLocation) {
      // Update existing location
      setLocations(prev => prev.map(l => l.id === location.id ? location : l));
    } else {
      // Add new location
      setLocations(prev => [...prev, location]);
    }
  };

  const handleSelectLocationFromLibrary = (location: Location) => {
    // Check if location already exists in the list
    const exists = locations.some(l => l.id === location.id);
    if (!exists) {
      setLocations(prev => [...prev, location]);
    }
    setShowLocationLibraryModal(false);
  };

  const handleDeleteLocation = (locationId: string) => {
    Alert.alert(
      "Delete Location",
      "Are you sure you want to delete this location?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => setLocations(prev => prev.filter(l => l.id !== locationId))
        }
      ]
    );
  };

  const handleGenerate = async () => {
    if (!input.trim()) {
      Alert.alert("Input Required", "Please describe your MiniWorld scene");
      return;
    }

    setIsGenerating(true);
    try {
      await createMiniWorldProject(
        input.trim(),
        characters.length > 0 ? characters : undefined,
        locations.length > 0 ? locations : undefined
      );

      // Clear and close
      setInput("");
      setCharacters([]);
      setLocations([]);
      onClose();
    } catch (err) {
      Alert.alert("Error", "Failed to generate MiniWorld");
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
    "Cozy coffee shop with plants and warm lighting",
    "Miniature home office with desk and bookshelf",
    "Small park with bench and cherry blossom tree",
    "Tiny kitchen with pastel colors and morning light",
    "Bedroom corner with reading nook and soft pillows"
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
          <Text className="text-xl font-bold text-gray-900">Create New MiniWorld</Text>
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
              What MiniWorld would you like to create?
            </Text>
            <Text className="text-gray-600 text-sm leading-5">
              Describe your isometric diorama scene. Add characters and locations to bring it to life.
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
              placeholder="Example: Cozy coffee shop with plants and warm lighting..."
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

          {/* Character Management */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Ionicons name="people" size={18} color="#374151" />
                <Text className="text-sm font-medium text-gray-700 ml-2">
                  Characters ({characters.length})
                </Text>
              </View>
              <Pressable
                onPress={handleAddCharacter}
                disabled={isGenerating}
                className={cn(
                  "flex-row items-center px-3 py-1.5 rounded-lg bg-blue-100",
                  isGenerating && "opacity-50"
                )}
              >
                <Ionicons name="add" size={16} color="#3b82f6" />
                <Text className="text-blue-600 font-medium text-xs ml-1">Add Character</Text>
              </Pressable>
            </View>

            {characters.length > 0 ? (
              <View className="space-y-2">
                {characters.map((character) => (
                  <View
                    key={character.id}
                    className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <View className="flex-1 flex-row items-center">
                      <CharacterTag character={character} size="small" />
                      <View className="ml-3 flex-1">
                        {character.description && (
                          <Text className="text-xs text-gray-600 line-clamp-1">
                            {character.description}
                          </Text>
                        )}
                        {character.referenceImage && (
                          <View className="flex-row items-center mt-1">
                            <Ionicons name="image" size={12} color="#16a34a" />
                            <Text className="text-xs text-green-600 ml-1">Has reference</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Pressable
                        onPress={() => handleEditCharacter(character)}
                        disabled={isGenerating}
                        className={cn(
                          "p-2 rounded-full bg-blue-100",
                          isGenerating && "opacity-50"
                        )}
                      >
                        <Ionicons name="pencil" size={14} color="#3b82f6" />
                      </Pressable>
                      <Pressable
                        onPress={() => handleDeleteCharacter(character.id)}
                        disabled={isGenerating}
                        className={cn(
                          "p-2 rounded-full bg-red-100",
                          isGenerating && "opacity-50"
                        )}
                      >
                        <Ionicons name="trash" size={14} color="#ef4444" />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <Text className="text-gray-500 text-xs text-center">
                  No characters added yet. Characters will be automatically detected from your idea, or you can add them manually.
                </Text>
              </View>
            )}
          </View>

          {/* Location Management */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Ionicons name="location" size={18} color="#374151" />
                <Text className="text-sm font-medium text-gray-700 ml-2">
                  Locations ({locations.length})
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={handleSelectFromLibrary}
                  disabled={isGenerating}
                  className={cn(
                    "flex-row items-center px-3 py-1.5 rounded-lg bg-orange-100",
                    isGenerating && "opacity-50"
                  )}
                >
                  <Ionicons name="library" size={16} color="#ea580c" />
                  <Text className="text-orange-600 font-medium text-xs ml-1">From Library</Text>
                </Pressable>
                <Pressable
                  onPress={handleAddLocation}
                  disabled={isGenerating}
                  className={cn(
                    "flex-row items-center px-3 py-1.5 rounded-lg bg-blue-100",
                    isGenerating && "opacity-50"
                  )}
                >
                  <Ionicons name="add" size={16} color="#3b82f6" />
                  <Text className="text-blue-600 font-medium text-xs ml-1">Add Location</Text>
                </Pressable>
              </View>
            </View>

            {locations.length > 0 ? (
              <View className="space-y-2">
                {locations.map((location) => (
                  <View
                    key={location.id}
                    className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <View className="flex-1 flex-row items-center">
                      <LocationTag location={location} size="small" />
                      <View className="ml-3 flex-1">
                        {location.description && (
                          <Text className="text-xs text-gray-600 line-clamp-1">
                            {location.description}
                          </Text>
                        )}
                        {location.details.isRealPlace && location.details.realPlaceInfo && (
                          <View className="flex-row items-center mt-1">
                            <Ionicons name="globe" size={12} color="#ea580c" />
                            <Text className="text-xs text-orange-600 ml-1">
                              {location.details.realPlaceInfo.city && location.details.realPlaceInfo.country
                                ? `${location.details.realPlaceInfo.city}, ${location.details.realPlaceInfo.country}`
                                : 'Real place'}
                            </Text>
                          </View>
                        )}
                        {location.referenceImage && (
                          <View className="flex-row items-center mt-1">
                            <Ionicons name="image" size={12} color="#16a34a" />
                            <Text className="text-xs text-green-600 ml-1">Has reference</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Pressable
                        onPress={() => handleEditLocation(location)}
                        disabled={isGenerating}
                        className={cn(
                          "p-2 rounded-full bg-blue-100",
                          isGenerating && "opacity-50"
                        )}
                      >
                        <Ionicons name="pencil" size={14} color="#3b82f6" />
                      </Pressable>
                      <Pressable
                        onPress={() => handleDeleteLocation(location.id)}
                        disabled={isGenerating}
                        className={cn(
                          "p-2 rounded-full bg-red-100",
                          isGenerating && "opacity-50"
                        )}
                      >
                        <Ionicons name="trash" size={14} color="#ef4444" />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <Text className="text-gray-500 text-xs text-center">
                  No locations added yet. Add locations to give your MiniWorld specific settings and environments.
                </Text>
              </View>
            )}
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
              <Text className="text-blue-600 text-xs">• Single isometric diorama scene</Text>
              <Text className="text-blue-600 text-xs">• Warm pastel colors and cozy atmosphere</Text>
              <Text className="text-blue-600 text-xs">• Character and location integration</Text>
              <Text className="text-blue-600 text-xs">• High-quality image generation</Text>
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
                <Text className="ml-2 text-white font-semibold">Generate MiniWorld</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>

      {/* Character Edit Modal */}
      <CharacterEditModal
        visible={showCharacterEditModal}
        onClose={() => {
          setShowCharacterEditModal(false);
          setEditingCharacter(null);
        }}
        character={editingCharacter}
        onSave={handleSaveCharacter}
        mode={editingCharacter ? "edit" : "create"}
      />

      {/* Location Edit Modal */}
      <LocationEditModal
        visible={showLocationEditModal}
        onClose={() => {
          setShowLocationEditModal(false);
          setEditingLocation(null);
        }}
        location={editingLocation}
        onSave={handleSaveLocation}
        mode={editingLocation ? "edit" : "create"}
      />

      {/* Location Library Modal */}
      <LocationLibraryModal
        visible={showLocationLibraryModal}
        onClose={() => setShowLocationLibraryModal(false)}
        onSelectLocation={handleSelectLocationFromLibrary}
        onEditLocation={handleEditLocation}
      />
    </Modal>
  );
}
