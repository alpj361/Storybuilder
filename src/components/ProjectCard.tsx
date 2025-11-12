import React, { useState } from 'react';
import { View, Text, Pressable, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { StoryboardProject } from '../types/storyboard';
import { useStoryboardStore } from '../state/storyboardStore';

interface ProjectCardProps {
  project: StoryboardProject;
  onPress: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onPress }) => {
  const [showMenu, setShowMenu] = useState(false);
  const deleteProject = useStoryboardStore(state => state.deleteProject);
  const duplicateProject = useStoryboardStore(state => state.duplicateProject);
  const renameProject = useStoryboardStore(state => state.renameProject);
  const toggleFavorite = useStoryboardStore(state => state.toggleFavorite);

  const handleLongPress = () => {
    setShowMenu(true);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${project.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteProject(project.id);
            setShowMenu(false);
          }
        }
      ]
    );
  };

  const handleDuplicate = () => {
    duplicateProject(project.id);
    setShowMenu(false);
  };

  const handleRename = () => {
    Alert.prompt(
      'Rename Project',
      'Enter a new name for this project:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rename',
          onPress: (newTitle) => {
            if (newTitle && newTitle.trim()) {
              renameProject(project.id, newTitle.trim());
            }
          }
        }
      ],
      'plain-text',
      project.title
    );
    setShowMenu(false);
  };

  const handleToggleFavorite = () => {
    toggleFavorite(project.id);
  };

  const panelCount = project.panels.length;
  const characterCount = project.characters.length;
  const isArchitectural = project.projectType === 'architectural';
  const projectTypeBadge = isArchitectural ? 'Architectural' : 'Storyboard';
  const projectTypeBadgeColor = isArchitectural ? 'bg-purple-100' : 'bg-blue-100';
  const projectTypeBadgeTextColor = isArchitectural ? 'text-purple-700' : 'text-blue-700';

  // Truncate description to 60 characters
  const truncatedDescription = project.description.length > 60
    ? `${project.description.substring(0, 60)}...`
    : project.description;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={handleLongPress}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-3"
    >
      {/* Thumbnail */}
      <View className="h-32 bg-gray-100 relative">
        {project.thumbnailUrl ? (
          <Image
            source={{ uri: project.thumbnailUrl }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full justify-center items-center">
            <Ionicons
              name={isArchitectural ? 'construct-outline' : 'images-outline'}
              size={40}
              color="#9CA3AF"
            />
          </View>
        )}
        
        {/* Favorite Star */}
        {project.isFavorite && (
          <View className="absolute top-2 right-2 bg-yellow-400 rounded-full p-1">
            <Ionicons name="star" size={16} color="#FFFFFF" />
          </View>
        )}

        {/* Project Type Badge */}
        <View className={`absolute bottom-2 left-2 ${projectTypeBadgeColor} px-2 py-1 rounded-full`}>
          <Text className={`text-xs font-medium ${projectTypeBadgeTextColor}`}>
            {projectTypeBadge}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View className="p-3">
        {/* Title */}
        <View className="flex-row justify-between items-start mb-1">
          <Text className="text-base font-semibold text-gray-900 flex-1" numberOfLines={1}>
            {project.title}
          </Text>
          <Pressable onPress={handleToggleFavorite} className="ml-2">
            <Ionicons
              name={project.isFavorite ? 'star' : 'star-outline'}
              size={20}
              color={project.isFavorite ? '#FBBF24' : '#9CA3AF'}
            />
          </Pressable>
        </View>

        {/* Description */}
        <Text className="text-sm text-gray-600 mb-2" numberOfLines={2}>
          {truncatedDescription}
        </Text>

        {/* Stats */}
        <View className="flex-row items-center mb-2">
          <View className="flex-row items-center mr-4">
            <Ionicons name="images-outline" size={14} color="#6B7280" />
            <Text className="text-xs text-gray-600 ml-1">{panelCount} panels</Text>
          </View>
          {!isArchitectural && characterCount > 0 && (
            <View className="flex-row items-center">
              <Ionicons name="people-outline" size={14} color="#6B7280" />
              <Text className="text-xs text-gray-600 ml-1">{characterCount} characters</Text>
            </View>
          )}
        </View>

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <View className="flex-row flex-wrap mb-2">
            {project.tags.slice(0, 3).map((tag, index) => (
              <View key={index} className="bg-gray-100 px-2 py-1 rounded-full mr-1 mb-1">
                <Text className="text-xs text-gray-600">{tag}</Text>
              </View>
            ))}
            {project.tags.length > 3 && (
              <View className="bg-gray-100 px-2 py-1 rounded-full">
                <Text className="text-xs text-gray-600">+{project.tags.length - 3}</Text>
              </View>
            )}
          </View>
        )}

        {/* Dates */}
        <View className="flex-row justify-between items-center">
          <Text className="text-xs text-gray-500">
            Created {format(new Date(project.createdAt), 'MMM d, yyyy')}
          </Text>
          {project.lastOpenedAt && (
            <Text className="text-xs text-gray-500">
              Opened {format(new Date(project.lastOpenedAt), 'MMM d')}
            </Text>
          )}
        </View>
      </View>

      {/* Action Menu Modal */}
      {showMenu && (
        <View className="absolute inset-0 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-lg p-4 w-4/5">
            <Text className="text-lg font-semibold mb-4 text-gray-900">Project Actions</Text>
            
            <Pressable
              onPress={handleRename}
              className="flex-row items-center py-3 border-b border-gray-200"
            >
              <Ionicons name="pencil-outline" size={20} color="#3B82F6" />
              <Text className="ml-3 text-base text-gray-900">Rename</Text>
            </Pressable>

            <Pressable
              onPress={handleDuplicate}
              className="flex-row items-center py-3 border-b border-gray-200"
            >
              <Ionicons name="copy-outline" size={20} color="#3B82F6" />
              <Text className="ml-3 text-base text-gray-900">Duplicate</Text>
            </Pressable>

            <Pressable
              onPress={handleToggleFavorite}
              className="flex-row items-center py-3 border-b border-gray-200"
            >
              <Ionicons
                name={project.isFavorite ? 'star' : 'star-outline'}
                size={20}
                color="#FBBF24"
              />
              <Text className="ml-3 text-base text-gray-900">
                {project.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleDelete}
              className="flex-row items-center py-3 border-b border-gray-200"
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text className="ml-3 text-base text-red-600">Delete</Text>
            </Pressable>

            <Pressable
              onPress={() => setShowMenu(false)}
              className="flex-row items-center justify-center py-3 mt-2"
            >
              <Text className="text-base text-gray-600 font-medium">Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}
    </Pressable>
  );
};