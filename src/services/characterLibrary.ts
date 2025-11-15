import AsyncStorage from '@react-native-async-storage/async-storage';
import { Character } from '../types/storyboard';

const CHARACTER_LIBRARY_KEY = '@storybuilder_character_library';

/**
 * Character Library Service
 * Manages saving, loading, and deleting characters from local storage
 * for reuse across different storyboard projects.
 */

export interface SavedCharacter extends Character {
  savedAt: string; // ISO timestamp
  lastModified: string; // ISO timestamp
}

/**
 * Save a character to the library
 */
export async function saveCharacterToLibrary(character: Character): Promise<void> {
  try {
    // Get existing library
    const library = await getAllSavedCharacters();

    // Check if character already exists in library (by ID)
    const existingIndex = library.findIndex(c => c.id === character.id);

    const savedCharacter: SavedCharacter = {
      ...character,
      savedAt: existingIndex === -1 ? new Date().toISOString() : library[existingIndex].savedAt,
      lastModified: new Date().toISOString()
    };

    if (existingIndex !== -1) {
      // Update existing character
      library[existingIndex] = savedCharacter;
    } else {
      // Add new character
      library.push(savedCharacter);
    }

    // Save to AsyncStorage
    await AsyncStorage.setItem(CHARACTER_LIBRARY_KEY, JSON.stringify(library));
    console.log('[CharacterLibrary] Character saved:', character.name);
  } catch (error) {
    console.error('[CharacterLibrary] Error saving character:', error);
    throw new Error('Failed to save character to library');
  }
}

/**
 * Get all saved characters from the library
 */
export async function getAllSavedCharacters(): Promise<SavedCharacter[]> {
  try {
    const libraryData = await AsyncStorage.getItem(CHARACTER_LIBRARY_KEY);

    if (!libraryData) {
      return [];
    }

    const library: SavedCharacter[] = JSON.parse(libraryData);

    // Sort by last modified (most recent first)
    library.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

    return library;
  } catch (error) {
    console.error('[CharacterLibrary] Error loading characters:', error);
    return [];
  }
}

/**
 * Get a single character from the library by ID
 */
export async function getCharacterFromLibrary(characterId: string): Promise<SavedCharacter | null> {
  try {
    const library = await getAllSavedCharacters();
    const character = library.find(c => c.id === characterId);
    return character || null;
  } catch (error) {
    console.error('[CharacterLibrary] Error getting character:', error);
    return null;
  }
}

/**
 * Delete a character from the library
 */
export async function deleteCharacterFromLibrary(characterId: string): Promise<void> {
  try {
    const library = await getAllSavedCharacters();
    const filteredLibrary = library.filter(c => c.id !== characterId);

    await AsyncStorage.setItem(CHARACTER_LIBRARY_KEY, JSON.stringify(filteredLibrary));
    console.log('[CharacterLibrary] Character deleted:', characterId);
  } catch (error) {
    console.error('[CharacterLibrary] Error deleting character:', error);
    throw new Error('Failed to delete character from library');
  }
}

/**
 * Update an existing character in the library
 */
export async function updateSavedCharacter(character: Character): Promise<void> {
  try {
    // saveCharacterToLibrary already handles updates
    await saveCharacterToLibrary(character);
  } catch (error) {
    console.error('[CharacterLibrary] Error updating character:', error);
    throw new Error('Failed to update character in library');
  }
}

/**
 * Check if a character exists in the library
 */
export async function isCharacterInLibrary(characterId: string): Promise<boolean> {
  try {
    const library = await getAllSavedCharacters();
    return library.some(c => c.id === characterId);
  } catch (error) {
    console.error('[CharacterLibrary] Error checking character:', error);
    return false;
  }
}

/**
 * Search characters in the library by name
 */
export async function searchCharacters(query: string): Promise<SavedCharacter[]> {
  try {
    const library = await getAllSavedCharacters();

    if (!query.trim()) {
      return library;
    }

    const lowerQuery = query.toLowerCase();
    return library.filter(c =>
      c.name.toLowerCase().includes(lowerQuery) ||
      c.description.toLowerCase().includes(lowerQuery) ||
      c.role.toLowerCase().includes(lowerQuery)
    );
  } catch (error) {
    console.error('[CharacterLibrary] Error searching characters:', error);
    return [];
  }
}

/**
 * Clear the entire character library (use with caution!)
 */
export async function clearCharacterLibrary(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CHARACTER_LIBRARY_KEY);
    console.log('[CharacterLibrary] Library cleared');
  } catch (error) {
    console.error('[CharacterLibrary] Error clearing library:', error);
    throw new Error('Failed to clear character library');
  }
}
