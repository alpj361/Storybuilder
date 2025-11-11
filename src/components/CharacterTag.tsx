import React from "react";
import { View, Text, Pressable } from "react-native";
import { Character } from "../types/storyboard";

interface CharacterTagProps {
  character: Character;
  size?: "small" | "medium";
  onPress?: () => void; // Optional press handler to view details
}

export default function CharacterTag({ character, size = "small", onPress }: CharacterTagProps) {
  const getRoleColor = (role: Character["role"]) => {
    switch (role) {
      case "protagonist":
        return "bg-blue-100 text-blue-700";
      case "antagonist":
        return "bg-red-100 text-red-700";
      case "supporting":
        return "bg-green-100 text-green-700";
      case "background":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const sizeClasses = size === "small"
    ? "px-2 py-1 text-xs"
    : "px-3 py-1 text-sm";

  const content = (
    <View className={`${getRoleColor(character.role)} ${sizeClasses} rounded-full`}>
      <Text className={`font-medium ${getRoleColor(character.role).split(" ")[1]}`}>
        {character.name}
      </Text>
    </View>
  );

  // If onPress handler provided, wrap in Pressable
  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:opacity-70">
        {content}
      </Pressable>
    );
  }

  // Otherwise, just return the static view
  return content;
}