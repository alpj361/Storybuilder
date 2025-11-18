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
  getAllSavedLocations,
  deleteLocationFromLibrary,
  searchLocations,
  filterLocationsByType,
  SavedLocation
} from '../services/locationLibrary';
import { Location } from '../types/storyboard';

interface LocationLibraryModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (location: Location) => void;
  onEditLocation?: (location: Location) => void;
}

export default function LocationLibraryModal({
  visible,
  onClose,
  onSelectLocation,
  onEditLocation
}: LocationLibraryModalProps) {
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<SavedLocation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string | undefined>(undefined);
  const [selectedRealPlaceFilter, setSelectedRealPlaceFilter] = useState<boolean | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Load locations when modal opens
  useEffect(() => {
    if (visible) {
      loadLocations();
      setSearchQuery('');
      setSelectedTypeFilter(undefined);
      setSelectedRealPlaceFilter(undefined);
    }
  }, [visible]);

  // Filter locations when search query or filters change
  useEffect(() => {
    filterLocations();
  }, [searchQuery, selectedTypeFilter, selectedRealPlaceFilter, locations]);

  const loadLocations = async () => {
    setIsLoading(true);
    try {
      const savedLocations = await getAllSavedLocations();
      setLocations(savedLocations);
    } catch (error) {
      console.error('[LocationLibraryModal] Error loading locations:', error);
      Alert.alert('Error', 'Could not load location library.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterLocations = async () => {
    let results = locations;

    // Apply search query
    if (searchQuery.trim()) {
      results = await searchLocations(searchQuery);
    }

    // Apply type filter
    if (selectedTypeFilter) {
      results = results.filter(loc => loc.details.locationType === selectedTypeFilter);
    }

    // Apply real place filter
    if (selectedRealPlaceFilter !== undefined) {
      results = results.filter(loc => loc.details.isRealPlace === selectedRealPlaceFilter);
    }

    setFilteredLocations(results);
  };

  const handleSelectLocation = (location: SavedLocation) => {
    // Create a clean copy without the savedAt/lastModified fields
    const { savedAt, lastModified, ...cleanLocation } = location;
    onSelectLocation(cleanLocation as Location);
    onClose();
  };

  const handleEditLocation = (location: SavedLocation) => {
    const { savedAt, lastModified, ...cleanLocation } = location;
    if (onEditLocation) {
      onEditLocation(cleanLocation as Location);
    }
    onClose();
  };

  const handleDeleteLocation = (location: SavedLocation) => {
    Alert.alert(
      'Delete Location',
      `Are you sure you want to delete "${location.name}" from your library?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLocationFromLibrary(location.id);
              await loadLocations();
              Alert.alert('Deleted', `${location.name} has been removed from your library.`);
            } catch (error) {
              Alert.alert('Error', 'Could not delete location.');
            }
          }
        }
      ]
    );
  };

  const getTypeBadgeColor = (locationType?: string) => {
    switch (locationType) {
      case 'natural':
        return 'bg-green-100 text-green-700';
      case 'urban':
        return 'bg-blue-100 text-blue-700';
      case 'indoor':
        return 'bg-purple-100 text-purple-700';
      case 'fantasy':
        return 'bg-pink-100 text-pink-700';
      case 'sci-fi':
        return 'bg-cyan-100 text-cyan-700';
      case 'historical':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (locationType?: string) => {
    switch (locationType) {
      case 'natural':
        return '🌲';
      case 'urban':
        return '🏙️';
      case 'indoor':
        return '🏛️';
      case 'fantasy':
        return '✨';
      case 'sci-fi':
        return '🚀';
      case 'historical':
        return '🏰';
      default:
        return '📍';
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
            <Text className="text-2xl font-bold text-gray-900">Location Library</Text>
            <Pressable
              onPress={onClose}
              className="w-10 h-10 items-center justify-center rounded-full bg-gray-200"
            >
              <Ionicons name="close" size={24} color="#374151" />
            </Pressable>
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center bg-white border border-gray-300 rounded-lg px-3 py-2 mb-3">
            <Ionicons name="search" size={20} color="#9ca3af" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search locations by name, city, country..."
              className="flex-1 ml-2 text-sm"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9ca3af" />
              </Pressable>
            )}
          </View>

          {/* Filters */}
          <View className="mb-2">
            <Text className="text-xs font-semibold text-gray-600 mb-2">Filter by:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
              <Pressable
                onPress={() => setSelectedTypeFilter(undefined)}
                className={`px-3 py-1.5 rounded-full ${!selectedTypeFilter ? 'bg-blue-500' : 'bg-gray-200'}`}
              >
                <Text className={`text-xs font-medium ${!selectedTypeFilter ? 'text-white' : 'text-gray-700'}`}>
                  All Types
                </Text>
              </Pressable>
              {['natural', 'urban', 'indoor', 'fantasy', 'sci-fi', 'historical'].map((type) => (
                <Pressable
                  key={type}
                  onPress={() => setSelectedTypeFilter(type)}
                  className={`px-3 py-1.5 rounded-full ${selectedTypeFilter === type ? 'bg-blue-500' : 'bg-gray-200'}`}
                >
                  <Text className={`text-xs font-medium capitalize ${selectedTypeFilter === type ? 'text-white' : 'text-gray-700'}`}>
                    {getTypeIcon(type)} {type}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setSelectedRealPlaceFilter(undefined)}
              className={`px-3 py-1.5 rounded-full ${selectedRealPlaceFilter === undefined ? 'bg-orange-500' : 'bg-gray-200'}`}
            >
              <Text className={`text-xs font-medium ${selectedRealPlaceFilter === undefined ? 'text-white' : 'text-gray-700'}`}>
                All Places
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setSelectedRealPlaceFilter(true)}
              className={`px-3 py-1.5 rounded-full ${selectedRealPlaceFilter === true ? 'bg-orange-500' : 'bg-gray-200'}`}
            >
              <Text className={`text-xs font-medium ${selectedRealPlaceFilter === true ? 'text-white' : 'text-gray-700'}`}>
                Real Places
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setSelectedRealPlaceFilter(false)}
              className={`px-3 py-1.5 rounded-full ${selectedRealPlaceFilter === false ? 'bg-orange-500' : 'bg-gray-200'}`}
            >
              <Text className={`text-xs font-medium ${selectedRealPlaceFilter === false ? 'text-white' : 'text-gray-700'}`}>
                Fictional
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Content */}
        <ScrollView className="flex-1 px-6 py-4">
          {isLoading ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text className="text-gray-500 mt-3">Loading locations...</Text>
            </View>
          ) : filteredLocations.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <Ionicons name="location-outline" size={64} color="#d1d5db" />
              <Text className="text-gray-500 text-lg font-medium mt-4">
                {searchQuery || selectedTypeFilter || selectedRealPlaceFilter !== undefined
                  ? 'No locations found'
                  : 'No saved locations'}
              </Text>
              <Text className="text-gray-400 text-sm mt-2 text-center">
                {searchQuery || selectedTypeFilter || selectedRealPlaceFilter !== undefined
                  ? 'Try a different search or filter'
                  : 'Save locations from the location editor to reuse them later'}
              </Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap -mx-2">
              {filteredLocations.map((location) => (
                <View key={location.id} className="w-1/2 px-2 mb-4">
                  <View className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                    {/* Reference Image */}
                    {location.referenceImage ? (
                      <Image
                        source={{ uri: location.referenceImage }}
                        className="w-full h-32"
                        resizeMode="cover"
                      />
                    ) : location.conceptImage ? (
                      <Image
                        source={{ uri: location.conceptImage }}
                        className="w-full h-32"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-full h-32 bg-gray-200 items-center justify-center">
                        <Text className="text-5xl">{getTypeIcon(location.details.locationType)}</Text>
                      </View>
                    )}

                    {/* Info */}
                    <View className="p-3">
                      <Text className="text-sm font-semibold text-gray-900 mb-1" numberOfLines={1}>
                        {location.name}
                      </Text>

                      {location.details.isRealPlace && location.details.realPlaceInfo?.city && (
                        <Text className="text-xs text-gray-600 mb-2" numberOfLines={1}>
                          📍 {location.details.realPlaceInfo.city}, {location.details.realPlaceInfo.country}
                        </Text>
                      )}

                      {/* Badges */}
                      <View className="flex-row items-center gap-1 mb-3">
                        <View className={`px-2 py-0.5 rounded-full ${getTypeBadgeColor(location.details.locationType)}`}>
                          <Text className={`text-[10px] font-semibold ${getTypeBadgeColor(location.details.locationType).split(' ')[1]} capitalize`}>
                            {location.details.locationType || 'location'}
                          </Text>
                        </View>
                        {location.details.isRealPlace && (
                          <View className="px-2 py-0.5 rounded-full bg-orange-100">
                            <Text className="text-[10px] font-semibold text-orange-700">
                              REAL
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Actions */}
                      <View className="flex-row gap-2">
                        <Pressable
                          onPress={() => handleSelectLocation(location)}
                          className="flex-1 bg-blue-500 py-2 rounded items-center active:opacity-80"
                        >
                          <Text className="text-white text-xs font-semibold">Add</Text>
                        </Pressable>

                        {onEditLocation && (
                          <Pressable
                            onPress={() => handleEditLocation(location)}
                            className="bg-gray-300 px-3 py-2 rounded items-center active:opacity-80"
                          >
                            <Ionicons name="pencil" size={14} color="#374151" />
                          </Pressable>
                        )}

                        <Pressable
                          onPress={() => handleDeleteLocation(location)}
                          className="bg-red-100 px-3 py-2 rounded items-center active:opacity-80"
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

        {/* Close Button */}
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
