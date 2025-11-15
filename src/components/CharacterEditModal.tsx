import React, { useState, useEffect } from "react";
import { View, Text, Modal, ScrollView, Pressable, TextInput, Image, Switch, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Clipboard from "expo-clipboard";
import Slider from "@react-native-community/slider";
import { Character, StoryboardStyle } from "../types/storyboard";
import { getCharacterDescription, parseDescriptionIntoFields } from "../services/characterDescriber";
import { generateCharacterPortrait } from "../api/stable-diffusion";

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
  const [aiGeneratedDescription, setAiGeneratedDescription] = useState<string>("");
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState<string>("");
  const [portraitImage, setPortraitImage] = useState<string | undefined>();
  const [portraitDescription, setPortraitDescription] = useState<string>("");
  const [isGeneratingPortrait, setIsGeneratingPortrait] = useState(false);

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
      setAiGeneratedDescription(character.aiGeneratedDescription || "");
      setPortraitImage(character.portraitImage);
      setPortraitDescription(character.portraitDescription || "");
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
      setAiGeneratedDescription("");
      setPortraitImage(undefined);
      setPortraitDescription("");
    }
  }, [character, mode, visible]);

  // Helper function to process and analyze image
  const processImage = async (imageUri: string) => {
    setReferenceImage(imageUri);

    // Automatically generate AI description from the reference image
    setIsAnalyzingImage(true);
    try {
      console.log('[CharacterEditModal] Generating AI description from reference image...');
      const description = await getCharacterDescription(imageUri);
      console.log('[CharacterEditModal] AI description generated:', description);
      setAiGeneratedDescription(description);
      setUseReferenceInPrompt(true); // Auto-enable since they uploaded a reference

      // Auto-populate appearance fields from AI description
      const parsedFields = parseDescriptionIntoFields(description);
      if (parsedFields.age) setAge(parsedFields.age);
      if (parsedFields.gender) setGender(parsedFields.gender);
      if (parsedFields.height) setHeight(parsedFields.height);
      if (parsedFields.build) setBuild(parsedFields.build);
      if (parsedFields.hair) setHair(parsedFields.hair);
      if (parsedFields.clothing) setClothing(parsedFields.clothing);
      if (parsedFields.distinctiveFeatures?.length) {
        setDistinctiveFeatures(parsedFields.distinctiveFeatures.join(', '));
      }
      console.log('[CharacterEditModal] Appearance fields auto-populated from AI description');
    } catch (error) {
      console.error('[CharacterEditModal] Failed to generate AI description:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isContentPolicyError = errorMessage.includes('content policy') ||
                                    errorMessage.includes('safety');

      Alert.alert(
        'AI Description Failed',
        isContentPolicyError
          ? errorMessage
          : 'Could not analyze the reference image. Please enter appearance details manually in the fields below, or try a different reference image.',
        [{ text: 'OK' }]
      );
      setAiGeneratedDescription('');
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permission Required", "We need camera roll permissions to select an image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
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

      await processImage(base64Image);
    }
  };

  const pasteImage = async () => {
    try {
      // Check if clipboard has an image
      const hasImage = await Clipboard.hasImageAsync();

      if (!hasImage) {
        Alert.alert(
          'No Image Found',
          'No image found in clipboard. Please copy an image first.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Get the image from clipboard
      const image = await Clipboard.getImageAsync({ format: 'jpeg' });

      if (image && image.data) {
        const base64Image = `data:image/jpeg;base64,${image.data}`;
        await processImage(base64Image);
      } else {
        Alert.alert(
          'Paste Failed',
          'Could not paste image from clipboard.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('[CharacterEditModal] Error pasting image:', error);
      Alert.alert(
        'Paste Failed',
        'Could not paste image from clipboard. Please try selecting an image instead.',
        [{ text: 'OK' }]
      );
    }
  };

  const removeImage = () => {
    setReferenceImage(undefined);
    setUseReferenceInPrompt(false);
    setAiGeneratedDescription('');
    setPortraitImage(undefined);
    setPortraitDescription('');
  };

  // Generate character portrait from appearance fields
  const generatePortrait = async () => {
    // Build a structured, short description from the appearance fields
    const descriptionParts = [
      age,
      gender,
      build && `${build} build`,
      hair,
      clothing && `wearing ${clothing}`,
      distinctiveFeatures
    ].filter(Boolean);

    if (descriptionParts.length === 0) {
      Alert.alert(
        'No Character Details',
        'Please upload a reference image first or manually fill in appearance details.',
        [{ text: 'OK' }]
      );
      return;
    }

    const structuredDescription = descriptionParts.join(', ');
    console.log('[CharacterEditModal] Structured description for portrait:', structuredDescription);

    // Check if description is too long (Stable Diffusion has ~2000 char limit for prompts)
    if (structuredDescription.length > 500) {
      Alert.alert(
        'Description Too Long',
        'Character description is too detailed. Please simplify the appearance fields and try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsGeneratingPortrait(true);
    try {
      console.log('[CharacterEditModal] Generating character portrait...');

      // Generate portrait using the structured description
      const portrait = await generateCharacterPortrait(structuredDescription, 'rough_sketch');

      setPortraitImage(portrait);
      console.log('[CharacterEditModal] Portrait generated successfully');

      Alert.alert(
        'Portrait Generated!',
        'Character portrait created successfully. You can now re-analyze this portrait to refine the character details.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[CharacterEditModal] Failed to generate portrait:', error);
      Alert.alert(
        'Generation Failed',
        error instanceof Error ? error.message : 'Could not generate character portrait. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsGeneratingPortrait(false);
    }
  };

  // Re-analyze the generated portrait to get canonical description
  const analyzePortrait = async () => {
    if (!portraitImage) {
      Alert.alert(
        'No Portrait',
        'Please generate a character portrait first.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsAnalyzingImage(true);
    try {
      console.log('[CharacterEditModal] Re-analyzing portrait for canonical description...');
      const description = await getCharacterDescription(portraitImage);
      console.log('[CharacterEditModal] Portrait canonical description:', description);

      setPortraitDescription(description);

      // Update appearance fields from portrait analysis (overwrite existing)
      const parsedFields = parseDescriptionIntoFields(description);
      if (parsedFields.age) setAge(parsedFields.age);
      if (parsedFields.gender) setGender(parsedFields.gender);
      if (parsedFields.height) setHeight(parsedFields.height);
      if (parsedFields.build) setBuild(parsedFields.build);
      if (parsedFields.hair) setHair(parsedFields.hair);
      if (parsedFields.clothing) setClothing(parsedFields.clothing);
      if (parsedFields.distinctiveFeatures?.length) {
        setDistinctiveFeatures(parsedFields.distinctiveFeatures.join(', '));
      }
      console.log('[CharacterEditModal] Appearance fields updated from portrait analysis');

      Alert.alert(
        'Portrait Analyzed!',
        'Character details have been updated based on the portrait. This description will be used for consistent character generation across all panels.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[CharacterEditModal] Failed to analyze portrait:', error);
      Alert.alert(
        'Analysis Failed',
        error instanceof Error ? error.message : 'Could not analyze portrait. You can still use the portrait without re-analysis.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsAnalyzingImage(false);
    }
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
      imageStrength: referenceImage && useReferenceInPrompt && referenceMode === "visual" ? imageStrength : undefined,
      aiGeneratedDescription: aiGeneratedDescription || undefined,
      portraitImage: portraitImage || undefined,
      portraitDescription: portraitDescription || undefined,
      isGeneratingPortrait: false
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

                {/* Info about how reference works */}
                {useReferenceInPrompt && (
                  <View className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <View className="flex-row items-start">
                      <Ionicons name="information-circle" size={18} color="#3b82f6" />
                      <Text className="text-xs text-blue-900 ml-2 flex-1 leading-5">
                        AI will analyze this image and create a detailed visual description. This description is used in Panel 1's prompt to draw the character in storyboard style.
                      </Text>
                    </View>
                  </View>
                )}

                {/* AI-Generated Description Display */}
                {isAnalyzingImage && (
                  <View className="bg-white border border-blue-300 rounded-lg p-4 mb-3">
                    <View className="flex-row items-center">
                      <ActivityIndicator size="small" color="#3b82f6" />
                      <Text className="text-sm text-blue-900 ml-3 font-medium">
                        Analyzing reference image...
                      </Text>
                    </View>
                  </View>
                )}

                {aiGeneratedDescription && !isAnalyzingImage && (
                  <View className="bg-green-50 border border-green-300 rounded-lg p-4 mb-3">
                    <View className="flex-row items-start mb-2">
                      <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                      <Text className="text-sm font-semibold text-green-900 ml-2">
                        AI Visual Description:
                      </Text>
                    </View>
                    <TextInput
                      value={aiGeneratedDescription}
                      onChangeText={setAiGeneratedDescription}
                      multiline
                      numberOfLines={3}
                      className="bg-white border border-green-200 rounded-lg px-3 py-2 text-sm text-gray-700"
                      textAlignVertical="top"
                      placeholder="AI-generated description will appear here..."
                    />
                    <Text className="text-xs text-green-700 mt-2">
                      You can edit this description to fine-tune the character's appearance.
                    </Text>
                  </View>
                )}

                {/* Character Portrait Generation */}
                {aiGeneratedDescription && !isAnalyzingImage && (
                  <View className="bg-purple-50 border border-purple-300 rounded-lg p-4 mb-3">
                    <View className="flex-row items-start mb-2">
                      <Ionicons name="person-circle" size={18} color="#9333ea" />
                      <Text className="text-sm font-semibold text-purple-900 ml-2">
                        Character Portrait Preview
                      </Text>
                    </View>

                    {portraitImage ? (
                      <View>
                        <Image
                          source={{ uri: portraitImage }}
                          className="w-full h-64 rounded-lg mb-3"
                          resizeMode="contain"
                        />

                        {portraitDescription ? (
                          <View className="bg-white border border-purple-200 rounded-lg p-3 mb-3">
                            <Text className="text-xs font-semibold text-purple-900 mb-1">
                              Canonical Description (for consistency):
                            </Text>
                            <TextInput
                              value={portraitDescription}
                              onChangeText={setPortraitDescription}
                              multiline
                              numberOfLines={3}
                              className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 text-sm text-purple-700"
                              textAlignVertical="top"
                            />
                          </View>
                        ) : (
                          <Pressable
                            onPress={analyzePortrait}
                            disabled={isAnalyzingImage}
                            className="bg-purple-600 py-2 px-4 rounded-lg items-center mb-3"
                          >
                            {isAnalyzingImage ? (
                              <View className="flex-row items-center">
                                <ActivityIndicator size="small" color="#fff" />
                                <Text className="text-white font-medium ml-2">Analyzing...</Text>
                              </View>
                            ) : (
                              <Text className="text-white font-medium">Re-analyze Portrait for Consistency</Text>
                            )}
                          </Pressable>
                        )}

                        <Text className="text-xs text-purple-700">
                          This portrait will be used as the visual reference for all storyboard panels.
                        </Text>
                      </View>
                    ) : (
                      <View>
                        <Text className="text-xs text-purple-700 mb-3">
                          Generate a character portrait in storyboard style to preview how the character will look.
                        </Text>
                        <Pressable
                          onPress={generatePortrait}
                          disabled={isGeneratingPortrait}
                          className="bg-purple-600 py-3 px-4 rounded-lg items-center"
                        >
                          {isGeneratingPortrait ? (
                            <View className="flex-row items-center">
                              <ActivityIndicator size="small" color="#fff" />
                              <Text className="text-white font-medium ml-2">Generating Portrait...</Text>
                            </View>
                          ) : (
                            <Text className="text-white font-medium">Generate Character Portrait</Text>
                          )}
                        </Pressable>
                      </View>
                    )}
                  </View>
                )}
              </View>
            ) : (
              <View>
                {/* Upload Button */}
                <Pressable
                  onPress={pickImage}
                  className="border-2 border-dashed border-blue-300 rounded-lg py-8 items-center bg-white mb-3"
                >
                  <Ionicons name="image-outline" size={40} color="#60a5fa" />
                  <Text className="text-blue-600 font-medium mt-2">Tap to upload image</Text>
                  <Text className="text-xs text-gray-500 mt-1">JPG, PNG (recommended 1:1 aspect)</Text>
                </Pressable>

                {/* Paste Button */}
                <Pressable
                  onPress={pasteImage}
                  className="border border-gray-300 rounded-lg py-3 items-center bg-gray-50 flex-row justify-center"
                >
                  <Ionicons name="clipboard-outline" size={20} color="#6B7280" />
                  <Text className="text-gray-700 font-medium ml-2">Paste from clipboard</Text>
                </Pressable>
              </View>
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
