import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useStoryboardStore } from '../state/storyboardStore';
import { StoryboardProject, ProjectType } from '../types/storyboard';
import { ProjectCard } from '../components/ProjectCard';

type FilterType = 'all' | 'storyboards' | 'architectural' | 'favorites';
type SortType = 'newest' | 'oldest' | 'name' | 'lastOpened';

export default function ProjectsLibraryScreen() {
  const navigation = useNavigation();
  const projects = useStoryboardStore(state => state.projects);
  const setCurrentProject = useStoryboardStore(state => state.setCurrentProject);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('newest');
  const [refreshing, setRefreshing] = useState(false);

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = [...projects];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query) ||
        project.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply type/favorite filter
    switch (activeFilter) {
      case 'storyboards':
        filtered = filtered.filter(p => p.projectType !== ProjectType.ARCHITECTURAL);
        break;
      case 'architectural':
        filtered = filtered.filter(p => p.projectType === ProjectType.ARCHITECTURAL);
        break;
      case 'favorites':
        filtered = filtered.filter(p => p.isFavorite);
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name':
          return a.title.localeCompare(b.title);
        case 'lastOpened':
          const aTime = a.lastOpenedAt ? new Date(a.lastOpenedAt).getTime() : 0;
          const bTime = b.lastOpenedAt ? new Date(b.lastOpenedAt).getTime() : 0;
          return bTime - aTime;
        default:
          return 0;
      }
    });

    return filtered;
  }, [projects, searchQuery, activeFilter, sortBy]);

  const handleProjectPress = (project: StoryboardProject) => {
    console.log('[ProjectsLibraryScreen] Opening project:', project.id, project.title);
    setCurrentProject(project);
    
    // Navigate to appropriate screen based on project type
    if (project.projectType === ProjectType.ARCHITECTURAL) {
      navigation.navigate('Arquitectural' as never);
    } else {
      navigation.navigate('Storyboard' as never);
    }
  };

  const handleNewProject = () => {
    // Navigate to Storyboard screen to create new project
    navigation.navigate('Storyboard' as never);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 500));
    setRefreshing(false);
  };

  const filterButtons: { key: FilterType; label: string; icon: string }[] = [
    { key: 'all', label: 'All', icon: 'apps-outline' },
    { key: 'storyboards', label: 'Storyboards', icon: 'images-outline' },
    { key: 'architectural', label: 'Architectural', icon: 'construct-outline' },
    { key: 'favorites', label: 'Favorites', icon: 'star-outline' }
  ];

  const sortOptions: { key: SortType; label: string }[] = [
    { key: 'newest', label: 'Newest First' },
    { key: 'oldest', label: 'Oldest First' },
    { key: 'name', label: 'Name A-Z' },
    { key: 'lastOpened', label: 'Last Opened' }
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-2xl font-bold text-gray-900">Projects Library</Text>
          <Pressable
            onPress={handleNewProject}
            className="bg-blue-500 px-4 py-2 rounded-lg flex-row items-center"
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text className="text-white font-medium ml-1">New Project</Text>
          </Pressable>
        </View>

        {/* Search Bar */}
        <View className="bg-gray-100 rounded-lg px-3 py-2 flex-row items-center mb-3">
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            className="flex-1 ml-2 text-base text-gray-900"
            placeholder="Search projects..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </Pressable>
          )}
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-2"
        >
          {filterButtons.map(filter => (
            <Pressable
              key={filter.key}
              onPress={() => setActiveFilter(filter.key)}
              className={`mr-2 px-3 py-2 rounded-full flex-row items-center ${
                activeFilter === filter.key
                  ? 'bg-blue-500'
                  : 'bg-gray-200'
              }`}
            >
              <Ionicons
                name={filter.icon as any}
                size={16}
                color={activeFilter === filter.key ? '#FFFFFF' : '#6B7280'}
              />
              <Text
                className={`ml-1 text-sm font-medium ${
                  activeFilter === filter.key
                    ? 'text-white'
                    : 'text-gray-700'
                }`}
              >
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Sort Dropdown */}
        <View className="flex-row items-center">
          <Text className="text-sm text-gray-600 mr-2">Sort by:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {sortOptions.map(option => (
              <Pressable
                key={option.key}
                onPress={() => setSortBy(option.key)}
                className={`mr-2 px-3 py-1 rounded-full ${
                  sortBy === option.key
                    ? 'bg-gray-800'
                    : 'bg-gray-200'
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    sortBy === option.key
                      ? 'text-white'
                      : 'text-gray-700'
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Projects Grid */}
      <ScrollView
        className="flex-1 px-4 pt-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredAndSortedProjects.length === 0 ? (
          // Empty State
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons
              name={searchQuery ? 'search-outline' : 'folder-open-outline'}
              size={64}
              color="#D1D5DB"
            />
            <Text className="text-lg font-semibold text-gray-600 mt-4">
              {searchQuery
                ? 'No projects found'
                : activeFilter === 'favorites'
                ? 'No favorite projects yet'
                : 'No projects yet'}
            </Text>
            <Text className="text-sm text-gray-500 mt-2 text-center px-8">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Create your first project to get started'}
            </Text>
            {!searchQuery && (
              <Pressable
                onPress={handleNewProject}
                className="mt-6 bg-blue-500 px-6 py-3 rounded-lg"
              >
                <Text className="text-white font-medium">Create New Project</Text>
              </Pressable>
            )}
          </View>
        ) : (
          // Projects Grid (2 columns)
          <View className="flex-row flex-wrap -mx-2">
            {filteredAndSortedProjects.map(project => (
              <View key={project.id} className="w-1/2 px-2">
                <ProjectCard
                  project={project}
                  onPress={() => handleProjectPress(project)}
                />
              </View>
            ))}
          </View>
        )}

        {/* Bottom Padding */}
        <View className="h-6" />
      </ScrollView>

      {/* Stats Footer */}
      {filteredAndSortedProjects.length > 0 && (
        <View className="bg-white border-t border-gray-200 px-4 py-2">
          <Text className="text-xs text-gray-600 text-center">
            Showing {filteredAndSortedProjects.length} of {projects.length} projects
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}