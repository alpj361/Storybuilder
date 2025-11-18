import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, Modal, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Character, Location } from "../types/storyboard";
import CharacterTag from "./CharacterTag";
import LocationTag from "./LocationTag";
import { CharacterEditModal } from "./CharacterEditModal";
import { LocationEditModal } from "./LocationEditModal";
import LocationLibraryModal from "./LocationLibraryModal";

interface TagsManagementModalProps {
  visible: boolean;
  onClose: () => void;
  panelNumber: number;
  panelCharacterIds: string[];
  panelLocationIds: string[];
  projectCharacters: Character[];
  projectLocations: Location[];
  onAddCharacterToPanel: (characterId: string) => void;
  onRemoveCharacterFromPanel: (characterId: string) => void;
  onAddLocationToPanel: (locationId: string) => void;
  onRemoveLocationFromPanel: (locationId: string) => void;
  onCreateCharacter: (character: Character) => void;
  onCreateLocation: (location: Location) => void;
}

export default function TagsManagementModal({
  visible,
  onClose,
  panelNumber,
  panelCharacterIds,
  panelLocationIds,
  projectCharacters,
  projectLocations,
  onAddCharacterToPanel,
  onRemoveCharacterFromPanel,
  onAddLocationToPanel,
  onRemoveLocationFromPanel,
  onCreateCharacter,
  onCreateLocation
}: TagsManagementModalProps) {
  const [showCharacterEditModal, setShowCharacterEditModal] = useState(false);
  const [showLocationEditModal, setShowLocationEditModal] = useState(false);
  const [showLocationLibraryModal, setShowLocationLibraryModal] = useState(false);

  // Get characters and locations for this panel
  const panelCharacters = projectCharacters.filter(char =>
    panelCharacterIds.includes(char.id)
  );
  const panelLocations = projectLocations.filter(loc =>
    panelLocationIds.includes(loc.id)
  );

  // Get available characters and locations (not yet in panel)
  const availableCharacters = projectCharacters.filter(char =>
    !panelCharacterIds.includes(char.id)
  );
  const availableLocations = projectLocations.filter(loc =>
    !panelLocationIds.includes(loc.id)
  );

  const handleCreateCharacter = useCallback((character: Character) => {
    onCreateCharacter(character);
    onAddCharacterToPanel(character.id);
    setShowCharacterEditModal(false);
  }, [onCreateCharacter, onAddCharacterToPanel]);

  const handleCreateLocation = useCallback((location: Location) => {
    onCreateLocation(location);
    onAddLocationToPanel(location.id);
    setShowLocationEditModal(false);
  }, [onCreateLocation, onAddLocationToPanel]);

  const handleSelectLocationFromLibrary = useCallback((location: Location) => {
    // Add to project if not already there
    const existsInProject = projectLocations.some(l => l.id === location.id);
    if (!existsInProject) {
      onCreateLocation(location);
    }
    // Add to panel
    onAddLocationToPanel(location.id);
    setShowLocationLibraryModal(false);
  }, [projectLocations, onCreateLocation, onAddLocationToPanel]);

  const handleCloseLocationLibrary = useCallback(() => {
    setShowLocationLibraryModal(false);
  }, []);

  const handleCloseCharacterEdit = useCallback(() => {
    setShowCharacterEditModal(false);
  }, []);

  const handleCloseLocationEdit = useCallback(() => {
    setShowLocationEditModal(false);
  }, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
          <Text className="text-xl font-bold text-gray-900">
            Panel {panelNumber} Tags
          </Text>
          <Pressable onPress={onClose} className="p-2 rounded-full">
            <Ionicons name="close" size={24} color="#6B7280" />
          </Pressable>
        </View>

        <ScrollView className="flex-1 p-4">
          {/* Characters Section */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Ionicons name="people" size={20} color="#374151" />
                <Text className="text-base font-bold text-gray-900 ml-2">
                  Characters ({panelCharacters.length})
                </Text>
              </View>
              <Pressable
                onPress={() => setShowCharacterEditModal(true)}
                className="flex-row items-center px-3 py-1.5 rounded-lg bg-blue-100"
              >
                <Ionicons name="add" size={16} color="#3b82f6" />
                <Text className="text-blue-600 font-medium text-xs ml-1">Add New</Text>
              </Pressable>
            </View>

            {/* Characters in this panel */}
            {panelCharacters.length > 0 ? (
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">In This Panel</Text>
                <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                  {panelCharacters.map(character => (
                    <CharacterTag
                      key={character.id}
                      character={character}
                      size="medium"
                      onRemove={() => {
                        Alert.alert(
                          "Remove Character",
                          `Remove ${character.name} from Panel ${panelNumber}?`,
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Remove",
                              style: "destructive",
                              onPress: () => onRemoveCharacterFromPanel(character.id)
                            }
                          ]
                        );
                      }}
                    />
                  ))}
                </View>
              </View>
            ) : (
              <View className="mb-4 p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <Text className="text-gray-500 text-xs text-center">
                  No characters in this panel
                </Text>
              </View>
            )}

            {/* Available characters */}
            {availableCharacters.length > 0 && (
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Available Characters</Text>
                <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                  {availableCharacters.map(character => (
                    <Pressable
                      key={character.id}
                      onPress={() => onAddCharacterToPanel(character.id)}
                    >
                      <CharacterTag
                        character={character}
                        size="medium"
                      />
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Locations Section */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Ionicons name="location" size={20} color="#374151" />
                <Text className="text-base font-bold text-gray-900 ml-2">
                  Locations ({panelLocations.length})
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={() => setShowLocationLibraryModal(true)}
                  className="flex-row items-center px-3 py-1.5 rounded-lg bg-orange-100"
                >
                  <Ionicons name="library" size={16} color="#ea580c" />
                  <Text className="text-orange-600 font-medium text-xs ml-1">Library</Text>
                </Pressable>
                <Pressable
                  onPress={() => setShowLocationEditModal(true)}
                  className="flex-row items-center px-3 py-1.5 rounded-lg bg-blue-100"
                >
                  <Ionicons name="add" size={16} color="#3b82f6" />
                  <Text className="text-blue-600 font-medium text-xs ml-1">Add New</Text>
                </Pressable>
              </View>
            </View>

            {/* Locations in this panel */}
            {panelLocations.length > 0 ? (
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">In This Panel</Text>
                <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                  {panelLocations.map(location => (
                    <LocationTag
                      key={location.id}
                      location={location}
                      size="medium"
                      onRemove={() => {
                        Alert.alert(
                          "Remove Location",
                          `Remove ${location.name} from Panel ${panelNumber}?`,
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Remove",
                              style: "destructive",
                              onPress: () => onRemoveLocationFromPanel(location.id)
                            }
                          ]
                        );
                      }}
                    />
                  ))}
                </View>
              </View>
            ) : (
              <View className="mb-4 p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <Text className="text-gray-500 text-xs text-center">
                  No locations in this panel
                </Text>
              </View>
            )}

            {/* Available locations */}
            {availableLocations.length > 0 && (
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Available Locations</Text>
                <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                  {availableLocations.map(location => (
                    <Pressable
                      key={location.id}
                      onPress={() => onAddLocationToPanel(location.id)}
                    >
                      <LocationTag
                        location={location}
                        size="medium"
                      />
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Info */}
          <View className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#3b82f6" />
              <View className="flex-1 ml-2">
                <Text className="text-sm text-blue-900 font-medium mb-1">
                  Managing Tags
                </Text>
                <Text className="text-xs text-blue-700 leading-5">
                  • Tap available characters/locations to add them to this panel{'\n'}
                  • Tap "X" on tags to remove them from this panel{'\n'}
                  • Use "Add New" to create and add to panel{'\n'}
                  • Changes affect the panel's generated prompt
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View className="p-4 border-t border-gray-200">
          <Pressable
            onPress={onClose}
            className="px-4 py-3 bg-blue-600 rounded-lg"
          >
            <Text className="text-white text-base font-bold text-center">
              Done
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Character Edit Modal */}
      <CharacterEditModal
        visible={showCharacterEditModal}
        onClose={handleCloseCharacterEdit}
        character={null}
        onSave={handleCreateCharacter}
        mode="create"
      />

      {/* Location Edit Modal */}
      <LocationEditModal
        visible={showLocationEditModal}
        onClose={handleCloseLocationEdit}
        location={null}
        onSave={handleCreateLocation}
        mode="create"
      />

      {/* Location Library Modal */}
      <LocationLibraryModal
        visible={showLocationLibraryModal}
        onClose={handleCloseLocationLibrary}
        onSelectLocation={handleSelectLocationFromLibrary}
        onEditLocation={handleCloseLocationLibrary}
      />
    </Modal>
  );
}
