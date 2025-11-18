import React from "react";
import { View, Text, Pressable } from "react-native";
import { Location } from "../types/storyboard";

interface LocationTagProps {
  location: Location;
  size?: "small" | "medium";
  onPress?: () => void; // Optional press handler to view details
  onRemove?: () => void; // Optional remove handler
}

export default function LocationTag({ location, size = "small", onPress, onRemove }: LocationTagProps) {
  const getTypeColor = (locationType?: string) => {
    switch (locationType) {
      case "natural":
        return "bg-green-100 text-green-700";
      case "urban":
        return "bg-blue-100 text-blue-700";
      case "indoor":
        return "bg-purple-100 text-purple-700";
      case "fantasy":
        return "bg-pink-100 text-pink-700";
      case "sci-fi":
        return "bg-cyan-100 text-cyan-700";
      case "historical":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTypeIcon = (locationType?: string) => {
    switch (locationType) {
      case "natural":
        return "🌲";
      case "urban":
        return "🏙️";
      case "indoor":
        return "🏛️";
      case "fantasy":
        return "✨";
      case "sci-fi":
        return "🚀";
      case "historical":
        return "🏰";
      default:
        return "📍";
    }
  };

  const getBorderColor = (locationType?: string) => {
    switch (locationType) {
      case "natural":
        return "border-green-300";
      case "urban":
        return "border-blue-300";
      case "indoor":
        return "border-purple-300";
      case "fantasy":
        return "border-pink-300";
      case "sci-fi":
        return "border-cyan-300";
      case "historical":
        return "border-amber-300";
      default:
        return "border-gray-300";
    }
  };

  const sizeClasses = size === "small"
    ? "px-3 py-1.5 text-xs"
    : "px-4 py-2 text-sm";

  const borderClasses = size === "small"
    ? "border"
    : "border-2";

  const content = (
    <View
      className={`${getTypeColor(location.details.locationType)} ${sizeClasses} ${borderClasses} ${getBorderColor(location.details.locationType)} rounded-full flex-row items-center gap-1.5`}
    >
      <Text className="text-base">
        {getTypeIcon(location.details.locationType)}
      </Text>
      <Text className={`font-semibold ${getTypeColor(location.details.locationType).split(" ")[1]}`}>
        {location.name}
      </Text>
      {location.details.isRealPlace && (
        <View className="bg-white/50 px-1.5 py-0.5 rounded">
          <Text className="text-[10px] font-bold">REAL</Text>
        </View>
      )}
      {onRemove && (
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 active:opacity-50"
        >
          <Text className="text-xs font-bold opacity-60">✕</Text>
        </Pressable>
      )}
    </View>
  );

  // If onPress handler provided, wrap in Pressable
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className="active:opacity-70"
        style={{ minHeight: size === "small" ? 28 : 36 }}
      >
        {content}
      </Pressable>
    );
  }

  // Otherwise, just return the static view
  return content;
}
