import React from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

interface StoryboardPanelProps {
  panelNumber: number;
}

const StoryboardPanel: React.FC<StoryboardPanelProps> = ({ panelNumber }) => {
  return (
    <View className="flex-1 bg-white border border-gray-300 rounded-lg m-1 p-4 min-h-[200px]">
      {/* Panel Header */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-sm font-semibold text-gray-600">Panel {panelNumber}</Text>
        <Ionicons name="ellipsis-horizontal" size={16} color="#6B7280" />
      </View>
      
      {/* Drawing Area */}
      <View className="flex-1 bg-gray-50 rounded border-2 border-dashed border-gray-300 justify-center items-center">
        <Ionicons name="camera-outline" size={32} color="#9CA3AF" />
        <Text className="text-gray-400 text-xs mt-2">Tap to add content</Text>
      </View>
      
      {/* Notes Section */}
      <View className="mt-3 p-2 bg-gray-50 rounded">
        <Text className="text-xs text-gray-500 mb-1">Notes:</Text>
        <Text className="text-xs text-gray-400">Add scene description...</Text>
      </View>
    </View>
  );
};

export default function StoryboardScreen() {
  const insets = useSafeAreaInsets();
  
  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-xl font-bold text-gray-900">Storyboard</Text>
            <Text className="text-sm text-gray-500">Untitled Project</Text>
          </View>
          <View className="flex-row space-x-3">
            <Ionicons name="add-circle-outline" size={24} color="#3B82F6" />
            <Ionicons name="share-outline" size={24} color="#6B7280" />
            <Ionicons name="settings-outline" size={24} color="#6B7280" />
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Four Panel Grid */}
        <View className="flex-1">
          {/* Top Row */}
          <View className="flex-row mb-2">
            <StoryboardPanel panelNumber={1} />
            <StoryboardPanel panelNumber={2} />
          </View>
          
          {/* Bottom Row */}
          <View className="flex-row">
            <StoryboardPanel panelNumber={3} />
            <StoryboardPanel panelNumber={4} />
          </View>
        </View>
        
        {/* Add More Panels Button */}
        <View className="mt-6 p-4 bg-white rounded-lg border border-dashed border-gray-300">
          <View className="flex-row justify-center items-center">
            <Ionicons name="add" size={20} color="#3B82F6" />
            <Text className="ml-2 text-blue-500 font-medium">Add More Panels</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}