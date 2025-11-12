import React, { useState, useEffect } from "react";
import { View, Text, Modal, ScrollView, Pressable, TextInput, Image, Switch, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import Slider from "@react-native-community/slider";
import { Character } from "../types/storyboard";

interface CharacterEditModalProps {
  visible: boolean;
  onClose: () => void;
  character: Character | null;
  onSave: (character: Character) => void;
  mode?: "create" | "edit";
}

export function CharacterEditModal({
  visible,
  onClose,
  character,
  onSave,
  mode = "edit"
}: CharacterEditModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [height, setHeight] = useState("");
  const [build, setBuild] = useState("");
  const [hair, setHair] = useState("");
  const [clothing, setClothing] = useState("");
  const [distinctiveFeatures, setDistinctiveFeatures] = useState("");
  const [role, setRole] = useState<Character["role"]>("supporting");
  const [referenceImage, setReferenceImage] = useState<string | undefined>();
  const [useReferenceInPrompt, setUseReferenceInPrompt] = useState(false);
  const [referenceMode, setReferenceMode] = useState<"description" | "visual">("description");
  const [imageStrength, setImageStrength] = useState(0.35);

  // Initialize form with character data
  useEffect(() => {
    if (character) {
      setName(character.name || "");
      setDescription(character.description || "");
      setAge(character.appearance.age || "");
      setGender(character.appearance.gender || "");
      setHeight(character.appearance.height || "");
      setBuild(character.appearance.build || "");
      setHair(character.appearance.hair || "");
      setClothing(character.appearance.clothing || "");
      setDistinctiveFeatures(character.appearance.distinctiveFeatures?.join(", ") || "");
      setRole(character.role);
      setReferenceImage(character.referenceImage);
      setUseReferenceInPrompt(character.useReferenceInPrompt || false);
      setReferenceMode(character.referenceMode || "description");
      setImageStrength(character.imageStrength || 0.35);
    } else if (mode === "create") {
      // Reset form for new character
      setName("");
      setDescription("");
      setAge("");
      setGender("");
      setHeight("");
      setBuild("");
      setHair("");
      setClothing("");
      setDistinctiveFeatures("");
      setRole("supporting");
      setReferenceImage(undefined);
      setUseReferenceInPrompt(false);
      setReferenceMode("description");
      setImageStrength(0.35);
    }
  }, [character, mode, visible]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permission Required", "We need camera roll permissions to select an image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      // Store as base64 data URI
      const base64Image = asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : asset.uri;
      setReferenceImage(base64Image);
    }
  };

  const removeImage = () => {
    setReferenceImage(undefined);
    setUseReferenceInPrompt(false);
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Character name is required.");
      return;
    }

    const updatedCharacter: Character = {
      id: character?.id || `char-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      appearance: {
        age: age.trim() || undefined,
        gender: gender.trim() || undefined,
        height: height.trim() || undefined,
        build: build.trim() || undefined,
        hair: hair.trim() || undefined,
        clothing: clothing.trim() || undefined,
        distinctiveFeatures: distinctiveFeatures
          .split(",")
          .map(f => f.trim())
          .filter(f => f.length > 0)
      },
      role,
      referenceImage,
      useReferenceInPrompt: referenceImage ? useReferenceInPrompt : false,
      referenceMode: referenceImage && useReferenceInPrompt ? referenceMode : undefined,
      imageStrength: referenceImage && useReferenceInPrompt && referenceMode === "visual" ? imageStrength : undefined
    };

    onSave(updatedCharacter);
    onClose();
  };

  const roleOptions: Array<{ value: Character["role"]; label: string; color: string }> = [
    { value: "protagonist", label: "Protagonist", color: "bg-blue-100 border-blue-300 text-blue-700" },
    { value: "antagonist", label: "Antagonist", color: "bg-red-100 border-red-300 text-red-700" },
    { value: "supporting", label: "Supporting", color: "bg-green-100 border-green-300 text-green-700" },
    { value: "background", label: "Background", color: "bg-gray-100 border-gray-300 text-gray-700" }
  ];

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
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-gray-900">
              {mode === "create" ? "Create Character" : "Edit Character"}
            </Text>
            <Pressable
              onPress={onClose}
              className="w-10 h-10 items-center justify-center rounded-full bg-gray-200"
            >
              <Ionicons name="close" size={24} color="#374151" />
            </Pressable>
          </View>
        </View>

        {/* Content */}
        <ScrollView className="flex-1 px-6 py-4">
          {/* Name */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Name <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g., Sarah, The Detective, Robot"
              className="border border-gray-300 rounded-lg px-4 py-3 text-base"
            />
          </View>

          {/* Description */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Brief description of the character"
              multiline
              numberOfLines={3}
              className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              textAlignVertical="top"
            />
          </View>

          {/* Role Selection */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Role</Text>
            <View className="flex-row flex-wrap gap-2">
              {roleOptions.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setRole(option.value)}
                  className={`px-4 py-2 rounded-full border-2 ${
                    role === option.value ? option.color : "bg-white border-gray-300 text-gray-600"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      role === option.value ? option.color.split(" ")[2] : "text-gray-600"
                    }`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Appearance Section */}
          <View className="mb-4 bg-gray-50 rounded-lg p-4">
            <Text className="text-base font-bold text-gray-900 mb-3">Appearance</Text>

            <View className="space-y-3">
              <View>
                <Text className="text-xs font-semibold text-gray-600 mb-1">Age</Text>
                <TextInput
                  value={age}
                  onChangeText={setAge}
                  placeholder="e.g., 30s, young adult, elderly"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-gray-600 mb-1">Gender</Text>
                <TextInput
                  value={gender}
                  onChangeText={setGender}
                  placeholder="e.g., male, female, non-binary"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-gray-600 mb-1">Height</Text>
                <TextInput
                  value={height}
                  onChangeText={setHeight}
                  placeholder="e.g., tall, average, short"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-gray-600 mb-1">Build</Text>
                <TextInput
                  value={build}
                  onChangeText={setBuild}
                  placeholder="e.g., athletic, slim, muscular"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-gray-600 mb-1">Hair</Text>
                <TextInput
                  value={hair}
                  onChangeText={setHair}
                  placeholder="e.g., short brown hair, long blonde"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-gray-600 mb-1">Clothing</Text>
                <TextInput
                  value={clothing}
                  onChangeText={setClothing}
                  placeholder="e.g., business suit, casual jeans"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-gray-600 mb-1">
                  Distinctive Features (comma-separated)
                </Text>
                <TextInput
                  value={distinctiveFeatures}
                  onChangeText={setDistinctiveFeatures}
                  placeholder="e.g., scar on left cheek, glasses, tattoo"
                  multiline
                  numberOfLines={2}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>

          {/* Reference Image Section */}
          <View className="mb-4 bg-blue-50 rounded-lg p-4 border border-blue-200">
            <Text className="text-base font-bold text-gray-900 mb-2">Reference Image</Text>
            <Text className="text-xs text-gray-600 mb-3">
              Upload a reference image for visual consistency (optional)
            </Text>

            {referenceImage ? (
              <View>
                <Image
                  source={{ uri: referenceImage }}
                  className="w-full h-48 rounded-lg mb-3"
                  resizeMode="cover"
                />
                {/* Use in prompt toggle */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center flex-1 mr-3">
                    <Switch
                      value={useReferenceInPrompt}
                      onValueChange={setUseReferenceInPrompt}
                      trackColor={{ false: "#cbd5e0", true: "#60a5fa" }}
                      thumbColor={useReferenceInPrompt ? "#3b82f6" : "#f4f4f5"}
                    />
                    <Text className="text-sm text-gray-700 ml-2 flex-1">
                      Use in prompt generation
                    </Text>
                  </View>
                  <Pressable
                    onPress={removeImage}
                    className="bg-red-100 px-3 py-2 rounded-lg"
                  >
                    <Text className="text-red-700 text-sm font-medium">Remove</Text>
                  </Pressable>
                </View>

                {/* Reference Mode Selection - Only show if enabled */}
                {useReferenceInPrompt && (
                  <View className="mb-3">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                      Reference Mode
                    </Text>

                    {/* Mode 1: Description Only */}
                    <Pressable
                      onPress={() => setReferenceMode("description")}
                      className={`p-3 rounded-lg border-2 mb-2 ${
                        referenceMode === "description"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <Text className="font-medium text-gray-900">Reference Only</Text>
                          <Text className="text-xs text-gray-600 mt-1">
                            AI describes the image, uses text description only
                          </Text>
                        </View>
                        <Ionicons
                          name={referenceMode === "description" ? "radio-button-on" : "radio-button-off"}
                          size={24}
                          color={referenceMode === "description" ? "#3b82f6" : "#9ca3af"}
                        />
                      </View>
                    </Pressable>

                    {/* Mode 2: Visual Match */}
                    <Pressable
                      onPress={() => setReferenceMode("visual")}
                      className={`p-3 rounded-lg border-2 ${
                        referenceMode === "visual"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <Text className="font-medium text-gray-900">Visual Match</Text>
                          <Text className="text-xs text-gray-600 mt-1">
                            Uses actual image for stronger visual consistency
                          </Text>
                        </View>
                        <Ionicons
                          name={referenceMode === "visual" ? "radio-button-on" : "radio-button-off"}
                          size={24}
                          color={referenceMode === "visual" ? "#3b82f6" : "#9ca3af"}
                        />
                      </View>
                    </Pressable>

                    {/* Image Strength Slider - Only show for Visual Match mode */}
                    {referenceMode === "visual" && (
                      <View className="mt-3 p-3 bg-white rounded-lg border border-gray-300">
                        <View className="flex-row justify-between items-center mb-2">
                          <Text className="text-xs font-semibold text-gray-700">
                            Match Strength
                          </Text>
                          <Text className="text-xs font-bold text-blue-600">
                            {Math.round(imageStrength * 100)}%
                          </Text>
                        </View>
                        <Slider
                          value={imageStrength}
                          onValueChange={setImageStrength}
                          minimumValue={0.2}
                          maximumValue={0.6}
                          step={0.05}
                          minimumTrackTintColor="#3b82f6"
                          maximumTrackTintColor="#cbd5e0"
                          thumbTintColor="#3b82f6"
                        />
                        <View className="flex-row justify-between mt-1">
                          <Text className="text-xs text-gray-500">More creative</Text>
                          <Text className="text-xs text-gray-500">Closer match</Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            ) : (
              <Pressable
                onPress={pickImage}
                className="border-2 border-dashed border-blue-300 rounded-lg py-8 items-center bg-white"
              >
                <Ionicons name="image-outline" size={40} color="#60a5fa" />
                <Text className="text-blue-600 font-medium mt-2">Tap to upload image</Text>
                <Text className="text-xs text-gray-500 mt-1">JPG, PNG (recommended 1:1 aspect)</Text>
              </Pressable>
            )}
          </View>

          {/* Info Note */}
          <View className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#f59e0b" />
              <View className="flex-1 ml-2">
                <Text className="text-sm text-amber-900 leading-5">
                  <Text className="font-semibold">Tip:</Text> Appearance fields are optional. If left empty, the AI will
                  generate natural-looking characters in Panel 1. Reference images help maintain visual consistency.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View className="border-t border-gray-200 p-4 bg-white flex-row gap-3">
          <Pressable
            onPress={onClose}
            className="flex-1 bg-gray-200 py-3 px-6 rounded-lg items-center active:opacity-80"
          >
            <Text className="text-gray-700 font-semibold text-base">Cancel</Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            className="flex-1 bg-blue-600 py-3 px-6 rounded-lg items-center active:opacity-80"
          >
            <Text className="text-white font-semibold text-base">
              {mode === "create" ? "Create" : "Save Changes"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
