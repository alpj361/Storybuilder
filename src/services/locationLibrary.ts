import AsyncStorage from '@react-native-async-storage/async-storage';
import { Location } from '../types/storyboard';

const LOCATION_LIBRARY_KEY = '@storybuilder_location_library';

/**
 * Location Library Service
 * Manages saving, loading, and deleting locations from local storage
 * for reuse across different storyboard projects.
 */

export interface SavedLocation extends Location {
  savedAt: string; // ISO timestamp
  lastModified: string; // ISO timestamp
}

/**
 * Save a location to the library
 */
export async function saveLocationToLibrary(location: Location): Promise<void> {
  try {
    // Get existing library
    const library = await getAllSavedLocations();

    // Check if location already exists in library (by ID)
    const existingIndex = library.findIndex(l => l.id === location.id);

    const savedLocation: SavedLocation = {
      ...location,
      savedAt: existingIndex === -1 ? new Date().toISOString() : library[existingIndex].savedAt,
      lastModified: new Date().toISOString()
    };

    if (existingIndex !== -1) {
      // Update existing location
      library[existingIndex] = savedLocation;
    } else {
      // Add new location
      library.push(savedLocation);
    }

    // Save to AsyncStorage
    await AsyncStorage.setItem(LOCATION_LIBRARY_KEY, JSON.stringify(library));
    console.log('[LocationLibrary] Location saved:', location.name);
  } catch (error) {
    console.error('[LocationLibrary] Error saving location:', error);
    throw new Error('Failed to save location to library');
  }
}

/**
 * Get all saved locations from the library
 */
export async function getAllSavedLocations(): Promise<SavedLocation[]> {
  try {
    const libraryData = await AsyncStorage.getItem(LOCATION_LIBRARY_KEY);

    if (!libraryData) {
      return [];
    }

    const library: SavedLocation[] = JSON.parse(libraryData);

    // Sort by last modified (most recent first)
    library.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

    return library;
  } catch (error) {
    console.error('[LocationLibrary] Error loading locations:', error);
    return [];
  }
}

/**
 * Get a single location from the library by ID
 */
export async function getLocationFromLibrary(locationId: string): Promise<SavedLocation | null> {
  try {
    const library = await getAllSavedLocations();
    const location = library.find(l => l.id === locationId);
    return location || null;
  } catch (error) {
    console.error('[LocationLibrary] Error getting location:', error);
    return null;
  }
}

/**
 * Delete a location from the library
 */
export async function deleteLocationFromLibrary(locationId: string): Promise<void> {
  try {
    const library = await getAllSavedLocations();
    const filteredLibrary = library.filter(l => l.id !== locationId);

    await AsyncStorage.setItem(LOCATION_LIBRARY_KEY, JSON.stringify(filteredLibrary));
    console.log('[LocationLibrary] Location deleted:', locationId);
  } catch (error) {
    console.error('[LocationLibrary] Error deleting location:', error);
    throw new Error('Failed to delete location from library');
  }
}

/**
 * Update an existing location in the library
 */
export async function updateSavedLocation(location: Location): Promise<void> {
  try {
    // saveLocationToLibrary already handles updates
    await saveLocationToLibrary(location);
  } catch (error) {
    console.error('[LocationLibrary] Error updating location:', error);
    throw new Error('Failed to update location in library');
  }
}

/**
 * Check if a location exists in the library
 */
export async function isLocationInLibrary(locationId: string): Promise<boolean> {
  try {
    const library = await getAllSavedLocations();
    return library.some(l => l.id === locationId);
  } catch (error) {
    console.error('[LocationLibrary] Error checking location:', error);
    return false;
  }
}

/**
 * Search locations in the library by name, city, country, or description
 */
export async function searchLocations(query: string): Promise<SavedLocation[]> {
  try {
    const library = await getAllSavedLocations();

    if (!query.trim()) {
      return library;
    }

    const lowerQuery = query.toLowerCase();
    return library.filter(l =>
      l.name.toLowerCase().includes(lowerQuery) ||
      l.description.toLowerCase().includes(lowerQuery) ||
      l.details.locationType?.toLowerCase().includes(lowerQuery) ||
      l.details.setting?.toLowerCase().includes(lowerQuery) ||
      l.details.realPlaceInfo?.city?.toLowerCase().includes(lowerQuery) ||
      l.details.realPlaceInfo?.country?.toLowerCase().includes(lowerQuery) ||
      l.details.realPlaceInfo?.specificLocation?.toLowerCase().includes(lowerQuery)
    );
  } catch (error) {
    console.error('[LocationLibrary] Error searching locations:', error);
    return [];
  }
}

/**
 * Filter locations by type
 */
export async function filterLocationsByType(
  locationType?: 'natural' | 'urban' | 'indoor' | 'fantasy' | 'sci-fi' | 'historical' | 'other',
  isRealPlace?: boolean
): Promise<SavedLocation[]> {
  try {
    const library = await getAllSavedLocations();

    return library.filter(l => {
      let matches = true;

      if (locationType !== undefined) {
        matches = matches && l.details.locationType === locationType;
      }

      if (isRealPlace !== undefined) {
        matches = matches && l.details.isRealPlace === isRealPlace;
      }

      return matches;
    });
  } catch (error) {
    console.error('[LocationLibrary] Error filtering locations:', error);
    return [];
  }
}

/**
 * Clear the entire location library (use with caution!)
 */
export async function clearLocationLibrary(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LOCATION_LIBRARY_KEY);
    console.log('[LocationLibrary] Library cleared');
  } catch (error) {
    console.error('[LocationLibrary] Error clearing library:', error);
    throw new Error('Failed to clear location library');
  }
}
