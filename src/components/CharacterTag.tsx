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
    ? "px-3 py-1.5 text-xs"
    : "px-4 py-2 text-sm";

  const borderClasses = size === "small"
    ? "border"
    : "border-2";

  const getBorderColor = (role: Character["role"]) => {
    switch (role) {
      case "protagonist":
        return "border-blue-300";
      case "antagonist":
        return "border-red-300";
      case "supporting":
        return "border-green-300";
      case "background":
        return "border-gray-300";
      default:
        return "border-gray-300";
    }
  };

  const content = (
    <View className={`${getRoleColor(character.role)} ${sizeClasses} ${borderClasses} ${getBorderColor(character.role)} rounded-full`}>
      <Text className={`font-semibold ${getRoleColor(character.role).split(" ")[1]}`}>
        {character.name}
      </Text>
    </View>
  );

  // If onPress handler provided, wrap in Pressable
  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:opacity-70" style={{ minHeight: size === "small" ? 28 : 36 }}>
        {content}
      </Pressable>
    );
  }

  // Otherwise, just return the static view
  return content;
}