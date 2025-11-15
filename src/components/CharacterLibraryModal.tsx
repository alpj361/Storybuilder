import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getAllSavedCharacters,
  deleteCharacterFromLibrary,
  searchCharacters,
  SavedCharacter
} from '../services/characterLibrary';
import { Character } from '../types/storyboard';

interface CharacterLibraryModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCharacter: (character: Character) => void;
  onEditCharacter?: (character: Character) => void;
}

export default function CharacterLibraryModal({
  visible,
  onClose,
  onSelectCharacter,
  onEditCharacter
}: CharacterLibraryModalProps) {
  const [characters, setCharacters] = useState<SavedCharacter[]>([]);
  const [filteredCharacters, setFilteredCharacters] = useState<SavedCharacter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load characters when modal opens
  useEffect(() => {
    if (visible) {
      loadCharacters();
      setSearchQuery('');
    }
  }, [visible]);

  // Filter characters when search query changes
  useEffect(() => {
    filterCharacters();
  }, [searchQuery, characters]);

  const loadCharacters = async () => {
    setIsLoading(true);
    try {
      const savedCharacters = await getAllSavedCharacters();
      setCharacters(savedCharacters);
    } catch (error) {
      console.error('[CharacterLibraryModal] Error loading characters:', error);
      Alert.alert('Error', 'Could not load character library.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterCharacters = async () => {
    if (!searchQuery.trim()) {
      setFilteredCharacters(characters);
      return;
    }

    const results = await searchCharacters(searchQuery);
    setFilteredCharacters(results);
  };

  const handleSelectCharacter = (character: SavedCharacter) => {
    // Create a clean copy without the savedAt/lastModified fields
    const { savedAt, lastModified, ...cleanCharacter } = character;
    onSelectCharacter(cleanCharacter as Character);
    onClose();
  };

  const handleEditCharacter = (character: SavedCharacter) => {
    const { savedAt, lastModified, ...cleanCharacter } = character;
    if (onEditCharacter) {
      onEditCharacter(cleanCharacter as Character);
    }
    onClose();
  };

  const handleDeleteCharacter = (character: SavedCharacter) => {
    Alert.alert(
      'Delete Character',
      `Are you sure you want to delete "${character.name}" from your library?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCharacterFromLibrary(character.id);
              await loadCharacters();
              Alert.alert('Deleted', `${character.name} has been removed from your library.`);
            } catch (error) {
              Alert.alert('Error', 'Could not delete character.');
            }
          }
        }
      ]
    );
  };

  const getRoleBadgeColor = (role: Character['role']) => {
    switch (role) {
      case 'protagonist':
        return 'bg-blue-100 text-blue-700';
      case 'antagonist':
        return 'bg-red-100 text-red-700';
      case 'supporting':
        return 'bg-green-100 text-green-700';
      case 'background':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

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
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-2xl font-bold text-gray-900">Character Library</Text>
            <Pressable
              onPress={onClose}
              className="w-10 h-10 items-center justify-center rounded-full bg-gray-200"
            >
              <Ionicons name="close" size={24} color="#374151" />
            </Pressable>
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center bg-white border border-gray-300 rounded-lg px-3 py-2">
            <Ionicons name="search" size={20} color="#9ca3af" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search characters by name, role, or description..."
              className="flex-1 ml-2 text-sm"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9ca3af" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Content */}
        <ScrollView className="flex-1 px-6 py-4">
          {isLoading ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color="#9333ea" />
              <Text className="text-gray-500 mt-3">Loading characters...</Text>
            </View>
          ) : filteredCharacters.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <Ionicons name="person-outline" size={64} color="#d1d5db" />
              <Text className="text-gray-500 text-lg font-medium mt-4">
                {searchQuery ? 'No characters found' : 'No saved characters'}
              </Text>
              <Text className="text-gray-400 text-sm mt-2 text-center">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Save characters from the character editor to reuse them later'}
              </Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap -mx-2">
              {filteredCharacters.map((character) => (
                <View key={character.id} className="w-1/2 px-2 mb-4">
                  <View className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                    {/* Portrait */}
                    {character.portraitImage ? (
                      <Image
                        source={{ uri: character.portraitImage }}
                        className="w-full h-40"
                        resizeMode="cover"
                      />
                    ) : character.referenceImage ? (
                      <Image
                        source={{ uri: character.referenceImage }}
                        className="w-full h-40"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-full h-40 bg-gray-200 items-center justify-center">
                        <Ionicons name="person" size={48} color="#9ca3af" />
                      </View>
                    )}

                    {/* Character Info */}
                    <View className="p-3">
                      <Text className="text-sm font-bold text-gray-900 mb-1" numberOfLines={1}>
                        {character.name}
                      </Text>

                      {/* Role Badge */}
                      <View className="mb-2">
                        <View
                          className={`px-2 py-1 rounded-full self-start ${getRoleBadgeColor(character.role)}`}
                        >
                          <Text className="text-xs font-medium capitalize">{character.role}</Text>
                        </View>
                      </View>

                      {/* Description */}
                      {character.description && (
                        <Text className="text-xs text-gray-600 mb-3" numberOfLines={2}>
                          {character.description}
                        </Text>
                      )}

                      {/* Action Buttons */}
                      <View className="flex-row gap-2">
                        <Pressable
                          onPress={() => handleSelectCharacter(character)}
                          className="flex-1 bg-purple-600 py-2 rounded-lg items-center"
                        >
                          <Text className="text-white text-xs font-medium">Use</Text>
                        </Pressable>

                        {onEditCharacter && (
                          <Pressable
                            onPress={() => handleEditCharacter(character)}
                            className="bg-gray-300 px-3 py-2 rounded-lg items-center"
                          >
                            <Ionicons name="pencil" size={14} color="#374151" />
                          </Pressable>
                        )}

                        <Pressable
                          onPress={() => handleDeleteCharacter(character)}
                          className="bg-red-100 px-3 py-2 rounded-lg items-center"
                        >
                          <Ionicons name="trash" size={14} color="#dc2626" />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        {!isLoading && filteredCharacters.length > 0 && (
          <View className="border-t border-gray-200 px-6 py-3 bg-gray-50">
            <Text className="text-xs text-gray-500 text-center">
              {filteredCharacters.length} character{filteredCharacters.length !== 1 ? 's' : ''} in library
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}
