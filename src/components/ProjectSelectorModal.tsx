import React, { useMemo } from 'react';
import { View, Text, Modal, ScrollView, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { StoryboardProject, ProjectType } from '../types/storyboard';
import { useStoryboardStore } from '../state/storyboardStore';

interface ProjectSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  currentProjectType: ProjectType;
  onSelectProject: (project: StoryboardProject) => void;
  onCreateNew: () => void;
}

export function ProjectSelectorModal({
  visible,
  onClose,
  currentProjectType,
  onSelectProject,
  onCreateNew
}: ProjectSelectorModalProps) {
  const projects = useStoryboardStore(state => state.projects);
  const currentProject = useStoryboardStore(state => state.currentProject);
  const deleteProject = useStoryboardStore(state => state.deleteProject);
  const duplicateProject = useStoryboardStore(state => state.duplicateProject);
  const toggleFavorite = useStoryboardStore(state => state.toggleFavorite);

  // Filter projects by type and sort by last opened
  const filteredProjects = useMemo(() => {
    return projects
      .filter(p => p.projectType === currentProjectType)
      .sort((a, b) => {
        // Sort favorites first, then by last opened
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;

        const aTime = a.lastOpenedAt ? new Date(a.lastOpenedAt).getTime() : 0;
        const bTime = b.lastOpenedAt ? new Date(b.lastOpenedAt).getTime() : 0;
        return bTime - aTime;
      });
  }, [projects, currentProjectType]);

  const handleProjectPress = (project: StoryboardProject) => {
    onSelectProject(project);
    onClose();
  };

  const handleDeleteProject = (project: StoryboardProject, e: any) => {
    e.stopPropagation();
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
            // If deleting current project, close modal
            if (currentProject?.id === project.id) {
              onClose();
            }
          }
        }
      ]
    );
  };

  const handleDuplicateProject = (project: StoryboardProject, e: any) => {
    e.stopPropagation();
    duplicateProject(project.id);
  };

  const handleToggleFavorite = (project: StoryboardProject, e: any) => {
    e.stopPropagation();
    toggleFavorite(project.id);
  };

  const projectTypeLabel =
    currentProjectType === ProjectType.ARCHITECTURAL ? 'Architectural'
      : currentProjectType === ProjectType.MINIWORLD ? 'MiniWorld'
        : 'Storyboard';

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
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-2xl font-bold text-gray-900">
              {projectTypeLabel} Projects
            </Text>
            <Pressable
              onPress={onClose}
              className="w-10 h-10 items-center justify-center rounded-full bg-gray-200"
            >
              <Ionicons name="close" size={24} color="#374151" />
            </Pressable>
          </View>
          <Text className="text-sm text-gray-600">
            {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
          </Text>
        </View>

        {/* Projects List */}
        <ScrollView className="flex-1 px-4 pt-4">
          {filteredProjects.length === 0 ? (
            // Empty State
            <View className="flex-1 justify-center items-center py-20">
              <Ionicons
                name="folder-open-outline"
                size={64}
                color="#D1D5DB"
              />
              <Text className="text-lg font-semibold text-gray-600 mt-4">
                No {projectTypeLabel.toLowerCase()} projects yet
              </Text>
              <Text className="text-sm text-gray-500 mt-2 text-center px-8">
                Create your first {projectTypeLabel.toLowerCase()} project to get started
              </Text>
              <Pressable
                onPress={() => {
                  onCreateNew();
                  onClose();
                }}
                className="mt-6 bg-blue-500 px-6 py-3 rounded-lg"
              >
                <Text className="text-white font-medium">Create New Project</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {filteredProjects.map(project => {
                const isActive = currentProject?.id === project.id;
                const panelCount = project.panels.length;
                const characterCount = project.characters.length;

                return (
                  <Pressable
                    key={project.id}
                    onPress={() => handleProjectPress(project)}
                    className={`bg-white rounded-lg border mb-3 p-4 ${isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                  >
                    {/* Header Row */}
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1">
                        <View className="flex-row items-center">
                          {isActive && (
                            <View className="bg-blue-500 rounded-full p-1 mr-2">
                              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                            </View>
                          )}
                          <Text
                            className={`text-base font-semibold flex-1 ${isActive ? 'text-blue-900' : 'text-gray-900'
                              }`}
                            numberOfLines={1}
                          >
                            {project.title}
                          </Text>
                        </View>
                      </View>

                      {/* Actions */}
                      <View className="flex-row items-center ml-2">
                        <Pressable
                          onPress={(e) => handleToggleFavorite(project, e)}
                          className="w-8 h-8 items-center justify-center"
                        >
                          <Ionicons
                            name={project.isFavorite ? 'star' : 'star-outline'}
                            size={20}
                            color={project.isFavorite ? '#FBBF24' : '#9CA3AF'}
                          />
                        </Pressable>
                        <Pressable
                          onPress={(e) => handleDuplicateProject(project, e)}
                          className="w-8 h-8 items-center justify-center"
                        >
                          <Ionicons name="copy-outline" size={18} color="#6B7280" />
                        </Pressable>
                        <Pressable
                          onPress={(e) => handleDeleteProject(project, e)}
                          className="w-8 h-8 items-center justify-center"
                        >
                          <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </Pressable>
                      </View>
                    </View>

                    {/* Description */}
                    {project.description && (
                      <Text
                        className={`text-sm mb-2 ${isActive ? 'text-blue-700' : 'text-gray-600'
                          }`}
                        numberOfLines={2}
                      >
                        {project.description}
                      </Text>
                    )}

                    {/* Stats */}
                    <View className="flex-row items-center mb-2">
                      <View className="flex-row items-center mr-4">
                        <Ionicons
                          name="images-outline"
                          size={14}
                          color={isActive ? '#3B82F6' : '#6B7280'}
                        />
                        <Text
                          className={`text-xs ml-1 ${isActive ? 'text-blue-700' : 'text-gray-600'
                            }`}
                        >
                          {panelCount} {panelCount === 1 ? 'panel' : 'panels'}
                        </Text>
                      </View>
                      {currentProjectType !== ProjectType.ARCHITECTURAL && characterCount > 0 && (
                        <View className="flex-row items-center">
                          <Ionicons
                            name="people-outline"
                            size={14}
                            color={isActive ? '#3B82F6' : '#6B7280'}
                          />
                          <Text
                            className={`text-xs ml-1 ${isActive ? 'text-blue-700' : 'text-gray-600'
                              }`}
                          >
                            {characterCount} {characterCount === 1 ? 'character' : 'characters'}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Tags */}
                    {project.tags && project.tags.length > 0 && (
                      <View className="flex-row flex-wrap mb-2">
                        {project.tags.slice(0, 3).map((tag, index) => (
                          <View
                            key={index}
                            className={`px-2 py-1 rounded-full mr-1 mb-1 ${isActive ? 'bg-blue-200' : 'bg-gray-100'
                              }`}
                          >
                            <Text
                              className={`text-xs ${isActive ? 'text-blue-900' : 'text-gray-600'
                                }`}
                            >
                              {tag}
                            </Text>
                          </View>
                        ))}
                        {project.tags.length > 3 && (
                          <View
                            className={`px-2 py-1 rounded-full ${isActive ? 'bg-blue-200' : 'bg-gray-100'
                              }`}
                          >
                            <Text
                              className={`text-xs ${isActive ? 'text-blue-900' : 'text-gray-600'
                                }`}
                            >
                              +{project.tags.length - 3}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Date */}
                    <Text
                      className={`text-xs ${isActive ? 'text-blue-600' : 'text-gray-500'
                        }`}
                    >
                      {project.lastOpenedAt
                        ? `Opened ${format(new Date(project.lastOpenedAt), 'MMM d, yyyy')}`
                        : `Created ${format(new Date(project.createdAt), 'MMM d, yyyy')}`
                      }
                    </Text>
                  </Pressable>
                );
              })}

              {/* Bottom Padding */}
              <View className="h-6" />
            </>
          )}
        </ScrollView>

        {/* New Project Button */}
        <View className="border-t border-gray-200 p-4 bg-white">
          <Pressable
            onPress={() => {
              onCreateNew();
              onClose();
            }}
            className="bg-blue-500 py-3 px-6 rounded-lg items-center active:opacity-80 flex-row justify-center"
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text className="text-white font-semibold text-base ml-2">
              Create New {projectTypeLabel} Project
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
