import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Modal, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useStoryboardStore } from "../state/storyboardStore";
import { Character, Location } from "../types/storyboard";
import { CharacterEditModal } from "./CharacterEditModal";
import CharacterTag from "./CharacterTag";
import { LocationEditModal } from "./LocationEditModal";
import LocationTag from "./LocationTag";
import LocationLibraryModal from "./LocationLibraryModal";
import CharacterLibraryModal from "./CharacterLibraryModal";

interface MiniWorldInputModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function MiniWorldInputModal({ visible, onClose }: MiniWorldInputModalProps) {
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [showCharacterEditModal, setShowCharacterEditModal] = useState(false);
  const [showCharacterLibraryModal, setShowCharacterLibraryModal] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [showLocationEditModal, setShowLocationEditModal] = useState(false);
  const [showLocationLibraryModal, setShowLocationLibraryModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const createMiniWorldProject = useStoryboardStore(state => state.createMiniWorldProject);
  const error = useStoryboardStore(state => state.error);

  // Character management handlers
  const handleAddCharacter = () => {
    setEditingCharacter(null);
    setShowCharacterEditModal(true);
  };

  const handleSelectCharacterFromLibrary = () => {
    setShowCharacterLibraryModal(true);
  };

  const handleCharacterFromLibrarySelected = (character: Character) => {
    // Check if character already exists in the list
    const exists = characters.some(c => c.id === character.id);
    if (!exists) {
      setCharacters(prev => [...prev, character]);
    }
    setShowCharacterLibraryModal(false);
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
      "Remove Character",
      "Remove this character from the MiniWorld?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
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
      "Remove Location",
      "Remove this location from the MiniWorld?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
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
      console.error("Generation error:", err);
      Alert.alert("Error", error || "Failed to generate MiniWorld");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      setInput("");
      setCharacters([]);
      setLocations([]);
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
      transparent={false}
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-4 pt-12 pb-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="cube" size={28} color="#6366F1" />
              <Text className="text-2xl font-bold text-gray-800 ml-3">New MiniWorld</Text>
            </View>
            <Pressable
              onPress={handleClose}
              disabled={isGenerating}
              className="p-2 rounded-full active:bg-gray-100"
            >
              <Ionicons name="close" size={28} color="#6B7280" />
            </Pressable>
          </View>
        </View>

        <ScrollView className="flex-1 px-4 py-6">
          {/* Description Section */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-700 mb-2">
              Describe Your MiniWorld
            </Text>
            <Text className="text-sm text-gray-500 mb-3">
              Describe the place and what's happening in your isometric diorama scene
            </Text>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="E.g., Cozy coffee shop with warm lighting and plants..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              className="bg-white border border-gray-300 rounded-xl p-4 text-base text-gray-800"
              style={{ minHeight: 120, textAlignVertical: 'top' }}
            />
          </View>

          {/* Example Prompts */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-600 mb-3">Example Ideas:</Text>
            <View className="flex-row flex-wrap gap-2">
              {examplePrompts.map((prompt, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => setInput(prompt)}
                  className="bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2"
                >
                  <Text className="text-sm text-indigo-700">{prompt}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Characters Section */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-semibold text-gray-700">
                Characters (Optional)
              </Text>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={handleSelectCharacterFromLibrary}
                  className="bg-blue-50 px-3 py-2 rounded-lg flex-row items-center border border-blue-200"
                >
                  <Ionicons name="library-outline" size={16} color="#3B82F6" />
                  <Text className="text-sm font-medium text-blue-600 ml-1">Library</Text>
                </Pressable>
                <Pressable
                  onPress={handleAddCharacter}
                  className="bg-indigo-600 px-3 py-2 rounded-lg flex-row items-center"
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text className="text-sm font-semibold text-white ml-1">Add</Text>
                </Pressable>
              </View>
            </View>
            {characters.length > 0 ? (
              <View className="flex-row flex-wrap gap-2">
                {characters.map(char => (
                  <View key={char.id} className="flex-row items-center bg-blue-50 rounded-full pr-2 border border-blue-200">
                    <CharacterTag
                      character={char}
                      onPress={() => handleEditCharacter(char)}
                    />
                    <Pressable
                      onPress={() => handleDeleteCharacter(char.id)}
                      className="ml-1 p-1 active:opacity-50"
                    >
                      <Ionicons name="close-circle" size={18} color="#3B82F6" />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : (
              <View className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4">
                <Text className="text-sm text-gray-500 text-center">
                  No characters added. Add characters to include them in your MiniWorld.
                </Text>
              </View>
            )}
          </View>

          {/* Locations Section */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-semibold text-gray-700">
                Locations (Optional)
              </Text>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={handleSelectFromLibrary}
                  className="bg-green-50 px-3 py-2 rounded-lg flex-row items-center border border-green-200"
                >
                  <Ionicons name="library-outline" size={16} color="#10B981" />
                  <Text className="text-sm font-medium text-green-600 ml-1">Library</Text>
                </Pressable>
                <Pressable
                  onPress={handleAddLocation}
                  className="bg-indigo-600 px-3 py-2 rounded-lg flex-row items-center"
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text className="text-sm font-semibold text-white ml-1">Add</Text>
                </Pressable>
              </View>
            </View>
            {locations.length > 0 ? (
              <View className="flex-row flex-wrap gap-2">
                {locations.map(loc => (
                  <LocationTag
                    key={loc.id}
                    location={loc}
                    onPress={() => handleEditLocation(loc)}
                    onRemove={() => handleDeleteLocation(loc.id)}
                  />
                ))}
              </View>
            ) : (
              <View className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4">
                <Text className="text-sm text-gray-500 text-center">
                  No locations added. Add locations to use them in your MiniWorld.
                </Text>
              </View>
            )}
          </View>

          {/* Error Display */}
          {error && (
            <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <View className="flex-row items-center">
                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                <Text className="text-red-700 text-sm font-medium ml-2">{error}</Text>
              </View>
            </View>
          )}

          {/* Info Box */}
          <View className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#6366F1" />
              <View className="flex-1 ml-2">
                <Text className="text-sm font-semibold text-indigo-900 mb-1">
                  About MiniWorlds
                </Text>
                <Text className="text-sm text-indigo-700 leading-5">
                  MiniWorlds are isometric diorama scenes with warm pastel colors, soft lighting,
                  and a cozy miniature aesthetic. Perfect for creating small, contained worlds!
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Action Bar */}
        <View className="bg-white border-t border-gray-200 px-4 py-4">
          <Pressable
            onPress={handleGenerate}
            disabled={isGenerating || !input.trim()}
            className={`rounded-xl py-4 flex-row items-center justify-center ${
              isGenerating || !input.trim()
                ? 'bg-gray-200'
                : 'bg-indigo-600 shadow-lg'
            }`}
          >
            {isGenerating ? (
              <>
                <Ionicons name="hourglass" size={20} color="#9CA3AF" />
                <Text className="text-gray-500 text-lg font-bold ml-2">Generating...</Text>
              </>
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                <Text className="text-white text-lg font-bold ml-2">Generate MiniWorld</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>

      {/* Modals */}
      <CharacterEditModal
        visible={showCharacterEditModal}
        onClose={() => {
          setShowCharacterEditModal(false);
          setEditingCharacter(null);
        }}
        character={editingCharacter}
        onSave={handleSaveCharacter}
      />

      <CharacterLibraryModal
        visible={showCharacterLibraryModal}
        onClose={() => setShowCharacterLibraryModal(false)}
        onSelectCharacter={handleCharacterFromLibrarySelected}
      />

      <LocationEditModal
        visible={showLocationEditModal}
        onClose={() => {
          setShowLocationEditModal(false);
          setEditingLocation(null);
        }}
        location={editingLocation}
        onSave={handleSaveLocation}
      />

      <LocationLibraryModal
        visible={showLocationLibraryModal}
        onClose={() => setShowLocationLibraryModal(false)}
        onSelectLocation={handleSelectLocationFromLibrary}
      />
    </Modal>
  );
}
