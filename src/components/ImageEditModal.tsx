/**
 * Image Edit Modal
 * Allows users to make light AI-powered edits to existing panel images
 * using NanoBanana model
 */

import React, { useState } from 'react';
import { View, Text, Modal, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ImageEditModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (editPrompt: string) => void;
  isProcessing: boolean;
}

// Predefined suggestions for common edits
const EDIT_SUGGESTIONS = [
  'Simplify the background',
  'Make the character expression more dynamic',
  'Enhance facial features',
  'Add more dramatic lighting',
  'Make the sketch looser and more gestural',
  'Emphasize the character silhouette',
  'Soften the background details',
  'Adjust character proportions',
];

export function ImageEditModal({
  visible,
  onClose,
  onSubmit,
  isProcessing
}: ImageEditModalProps) {
  const [editPrompt, setEditPrompt] = useState('');

  const handleSubmit = () => {
    if (editPrompt.trim()) {
      onSubmit(editPrompt.trim());
      setEditPrompt('');
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    setEditPrompt(suggestion);
  };

  const handleCancel = () => {
    setEditPrompt('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
          <Pressable onPress={handleCancel} disabled={isProcessing}>
            <Text className="text-blue-500 text-base">Cancel</Text>
          </Pressable>
          <Text className="text-lg font-semibold">Edit Image with AI</Text>
          <Pressable onPress={handleSubmit} disabled={isProcessing || !editPrompt.trim()}>
            <Text className={`text-base font-semibold ${
              isProcessing || !editPrompt.trim() ? 'text-gray-400' : 'text-blue-500'
            }`}>
              Apply
            </Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 p-4">
          {/* Info Section */}
          <View className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#3b82f6" />
              <View className="flex-1 ml-2">
                <Text className="text-sm text-blue-900 font-medium mb-1">
                  AI Image Refinement
                </Text>
                <Text className="text-xs text-blue-700 leading-5">
                  Use NanoBanana to make light edits to your panel image. Describe the changes you want, and the AI will refine the existing image without regenerating it from scratch.
                </Text>
              </View>
            </View>
          </View>

          {/* Prompt Input */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              What would you like to change?
            </Text>
            <TextInput
              value={editPrompt}
              onChangeText={setEditPrompt}
              placeholder="e.g., Simplify the background, enhance character features..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
              style={{ textAlignVertical: 'top', minHeight: 100 }}
              editable={!isProcessing}
            />
            <Text className="text-xs text-gray-500 mt-1">
              {editPrompt.length}/500 characters
            </Text>
          </View>

          {/* Suggestions */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-3">
              Quick Suggestions
            </Text>
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {EDIT_SUGGESTIONS.map((suggestion, index) => (
                <Pressable
                  key={index}
                  onPress={() => handleSuggestionPress(suggestion)}
                  disabled={isProcessing}
                  className="px-3 py-2 bg-gray-100 rounded-full border border-gray-300 active:bg-gray-200"
                >
                  <Text className="text-sm text-gray-700">{suggestion}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Processing Indicator */}
          {isProcessing && (
            <View className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <View className="flex-row items-center">
                <ActivityIndicator size="small" color="#9333ea" />
                <Text className="ml-3 text-sm text-purple-900 font-medium">
                  Editing image with AI...
                </Text>
              </View>
              <Text className="text-xs text-purple-700 mt-2">
                This may take 10-20 seconds. The original image is saved for undo.
              </Text>
            </View>
          )}

          {/* Tips Section */}
          <View className="mt-6 p-4 bg-gray-50 rounded-lg">
            <Text className="text-sm font-medium text-gray-800 mb-2">
              💡 Tips for best results:
            </Text>
            <Text className="text-xs text-gray-600 leading-5">
              • Be specific about what you want to change{'\n'}
              • Focus on one or two changes at a time{'\n'}
              • Use action words: "simplify", "enhance", "adjust"{'\n'}
              • Keep the sketch style in mind (avoid asking for realism)
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
