import React, { useState, useEffect } from "react";
import { View, Text, Modal, ScrollView, Pressable, TextInput, Image, Switch, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Clipboard from "expo-clipboard";
import { Location } from "../types/storyboard";
import { getLocationDescription, parseDescriptionIntoFields } from "../services/locationDescriber";
import { saveLocationToLibrary, isLocationInLibrary } from "../services/locationLibrary";

interface LocationEditModalProps {
  visible: boolean;
  onClose: () => void;
  location: Location | null;
  onSave: (location: Location) => void;
  mode?: "create" | "edit";
}

export function LocationEditModal({
  visible,
  onClose,
  location,
  onSave,
  mode = "edit"
}: LocationEditModalProps) {
  // Basic info state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"interior" | "exterior" | "mixed">("exterior");
  const [locationType, setLocationType] = useState<'natural' | 'urban' | 'indoor' | 'fantasy' | 'sci-fi' | 'historical' | 'other'>('natural');

  // Real place state
  const [isRealPlace, setIsRealPlace] = useState(false);
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [specificLocation, setSpecificLocation] = useState("");
  const [landmark, setLandmark] = useState("");
  const [knownFor, setKnownFor] = useState("");

  // Visual details state
  const [setting, setSetting] = useState("");
  const [timeOfDay, setTimeOfDay] = useState<'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'night' | undefined>(undefined);
  const [weather, setWeather] = useState("");
  const [lighting, setLighting] = useState("");
  const [atmosphere, setAtmosphere] = useState("");
  const [architecture, setArchitecture] = useState("");
  const [terrain, setTerrain] = useState("");
  const [vegetation, setVegetation] = useState("");
  const [prominentFeatures, setProminentFeatures] = useState("");
  const [colorPalette, setColorPalette] = useState("");
  const [scale, setScale] = useState<'intimate' | 'medium' | 'vast' | 'epic' | undefined>(undefined);
  const [condition, setCondition] = useState("");
  const [crowdLevel, setCrowdLevel] = useState<'empty' | 'sparse' | 'moderate' | 'crowded' | undefined>(undefined);
  const [soundscape, setSoundscape] = useState("");
  const [culturalContext, setCulturalContext] = useState("");

  // Reference image state
  const [referenceImage, setReferenceImage] = useState<string | undefined>();
  const [useReferenceInPrompt, setUseReferenceInPrompt] = useState(false);
  const [referenceMode, setReferenceMode] = useState<"description" | "visual">("description");
  const [imageStrength, setImageStrength] = useState(0.35);
  const [aiGeneratedDescription, setAiGeneratedDescription] = useState<string>("");
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);

  // Concept art state
  const [conceptImage, setConceptImage] = useState<string | undefined>();
  const [conceptDescription, setConceptDescription] = useState<string>("");
  const [isGeneratingConcept, setIsGeneratingConcept] = useState(false);

  // UI state
  const [showBasicInfo, setShowBasicInfo] = useState(true);
  const [showRealPlaceInfo, setShowRealPlaceInfo] = useState(false);
  const [showVisualDetails, setShowVisualDetails] = useState(true);
  const [showArchitectureTerrain, setShowArchitectureTerrain] = useState(false);
  const [showVisualCharacteristics, setShowVisualCharacteristics] = useState(false);
  const [showAdditionalFeatures, setShowAdditionalFeatures] = useState(false);

  // Library state
  const [isLocationSaved, setIsLocationSaved] = useState(false);

  // Initialize form with location data
  useEffect(() => {
    if (location) {
      setName(location.name || "");
      setDescription(location.description || "");
      setType(location.type || "exterior");
      setLocationType(location.details.locationType || 'natural');
      setIsRealPlace(location.details.isRealPlace || false);

      // Real place info
      setCity(location.details.realPlaceInfo?.city || "");
      setCountry(location.details.realPlaceInfo?.country || "");
      setRegion(location.details.realPlaceInfo?.region || "");
      setSpecificLocation(location.details.realPlaceInfo?.specificLocation || "");
      setLandmark(location.details.realPlaceInfo?.landmark || "");
      setKnownFor(location.details.realPlaceInfo?.knownFor || "");

      // Visual details
      setSetting(location.details.setting || "");
      setTimeOfDay(location.details.timeOfDay);
      setWeather(location.details.weather || "");
      setLighting(location.details.lighting || "");
      setAtmosphere(location.details.atmosphere || "");
      setArchitecture(location.details.architecture || "");
      setTerrain(location.details.terrain || "");
      setVegetation(location.details.vegetation || "");
      setProminentFeatures(location.details.prominentFeatures?.join(", ") || "");
      setColorPalette(location.details.colorPalette || "");
      setScale(location.details.scale);
      setCondition(location.details.condition || "");
      setCrowdLevel(location.details.crowdLevel);
      setSoundscape(location.details.soundscape || "");
      setCulturalContext(location.details.culturalContext || "");

      // Reference image
      setReferenceImage(location.referenceImage);
      setUseReferenceInPrompt(location.useReferenceInPrompt || false);
      setReferenceMode(location.referenceMode || "description");
      setImageStrength(location.imageStrength || 0.35);
      setAiGeneratedDescription(location.aiGeneratedDescription || "");

      // Concept art
      setConceptImage(location.conceptImage);
      setConceptDescription(location.conceptDescription || "");
    } else if (mode === "create") {
      // Reset form for new location
      resetForm();
    }
  }, [location, mode, visible]);

  // Check if location is saved in library
  useEffect(() => {
    const checkLibraryStatus = async () => {
      if (location?.id) {
        const saved = await isLocationInLibrary(location.id);
        setIsLocationSaved(saved);
      } else {
        setIsLocationSaved(false);
      }
    };

    if (visible) {
      checkLibraryStatus();
    }
  }, [location, visible]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setType("exterior");
    setLocationType('natural');
    setIsRealPlace(false);
    setCity("");
    setCountry("");
    setRegion("");
    setSpecificLocation("");
    setLandmark("");
    setKnownFor("");
    setSetting("");
    setTimeOfDay(undefined);
    setWeather("");
    setLighting("");
    setAtmosphere("");
    setArchitecture("");
    setTerrain("");
    setVegetation("");
    setProminentFeatures("");
    setColorPalette("");
    setScale(undefined);
    setCondition("");
    setCrowdLevel(undefined);
    setSoundscape("");
    setCulturalContext("");
    setReferenceImage(undefined);
    setUseReferenceInPrompt(false);
    setReferenceMode("description");
    setImageStrength(0.35);
    setAiGeneratedDescription("");
    setConceptImage(undefined);
    setConceptDescription("");
  };

  // Process and analyze reference image
  const processImage = async (imageUri: string) => {
    setReferenceImage(imageUri);

    // Automatically generate AI description from the reference image
    setIsAnalyzingImage(true);
    try {
      console.log('[LocationEditModal] Generating AI description from reference image...');
      const descriptionText = await getLocationDescription(imageUri);
      console.log('[LocationEditModal] AI description generated:', descriptionText);
      setAiGeneratedDescription(descriptionText);
      setUseReferenceInPrompt(true);

      // Auto-populate ALL location fields from AI description
      const parsedFields = parseDescriptionIntoFields(descriptionText);

      // Location type
      if (parsedFields.locationType) setLocationType(parsedFields.locationType);
      if (parsedFields.isRealPlace !== undefined) setIsRealPlace(parsedFields.isRealPlace);

      // Real place info
      if (parsedFields.realPlaceInfo) {
        if (parsedFields.realPlaceInfo.city) setCity(parsedFields.realPlaceInfo.city);
        if (parsedFields.realPlaceInfo.country) setCountry(parsedFields.realPlaceInfo.country);
        if (parsedFields.realPlaceInfo.region) setRegion(parsedFields.realPlaceInfo.region);
        if (parsedFields.realPlaceInfo.specificLocation) setSpecificLocation(parsedFields.realPlaceInfo.specificLocation);
        if (parsedFields.realPlaceInfo.landmark) setLandmark(parsedFields.realPlaceInfo.landmark);
      }

      // Visual details
      if (parsedFields.setting) setSetting(parsedFields.setting);
      if (parsedFields.timeOfDay) setTimeOfDay(parsedFields.timeOfDay);
      if (parsedFields.weather) setWeather(parsedFields.weather);
      if (parsedFields.lighting) setLighting(parsedFields.lighting);
      if (parsedFields.atmosphere) setAtmosphere(parsedFields.atmosphere);
      if (parsedFields.architecture) setArchitecture(parsedFields.architecture);
      if (parsedFields.terrain) setTerrain(parsedFields.terrain);
      if (parsedFields.vegetation) setVegetation(parsedFields.vegetation);
      if (parsedFields.prominentFeatures?.length) setProminentFeatures(parsedFields.prominentFeatures.join(', '));
      if (parsedFields.colorPalette) setColorPalette(parsedFields.colorPalette);
      if (parsedFields.scale) setScale(parsedFields.scale);
      if (parsedFields.condition) setCondition(parsedFields.condition);
      if (parsedFields.crowdLevel) setCrowdLevel(parsedFields.crowdLevel);

      console.log('[LocationEditModal] ALL location fields auto-populated from AI description');
    } catch (error) {
      console.error('[LocationEditModal] Failed to generate AI description:', error);
      Alert.alert(
        'AI Description Failed',
        'Could not analyze the reference image. Please enter location details manually in the fields below.',
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
      aspect: [16, 9],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const base64Image = asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : asset.uri;

      await processImage(base64Image);
    }
  };

  const pasteImage = async () => {
    const hasImage = await Clipboard.hasImageAsync();

    if (!hasImage) {
      Alert.alert("No Image", "No image found in clipboard.");
      return;
    }

    const imageData = await Clipboard.getImageAsync({ format: "jpeg" });

    if (imageData) {
      await processImage(imageData.data);
    }
  };

  const removeImage = () => {
    setReferenceImage(undefined);
    setAiGeneratedDescription("");
    setUseReferenceInPrompt(false);
  };

  const hasEnoughDetailsForGeneration = (): boolean => {
    return !!(
      name &&
      locationType &&
      (
        setting ||
        atmosphere ||
        lighting ||
        referenceImage ||
        (isRealPlace && specificLocation)
      )
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Missing Information", "Please enter a location name.");
      return;
    }

    const savedLocation: Location = {
      id: location?.id || `loc_${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      type,
      details: {
        locationType,
        isRealPlace,
        realPlaceInfo: isRealPlace ? {
          city: city.trim() || undefined,
          country: country.trim() || undefined,
          region: region.trim() || undefined,
          specificLocation: specificLocation.trim() || undefined,
          landmark: landmark.trim() || undefined,
          knownFor: knownFor.trim() || undefined,
        } : undefined,
        setting: setting.trim() || undefined,
        timeOfDay,
        weather: weather.trim() || undefined,
        lighting: lighting.trim() || undefined,
        atmosphere: atmosphere.trim() || undefined,
        architecture: architecture.trim() || undefined,
        terrain: terrain.trim() || undefined,
        vegetation: vegetation.trim() || undefined,
        prominentFeatures: prominentFeatures.trim()
          ? prominentFeatures.split(',').map(f => f.trim()).filter(Boolean)
          : undefined,
        colorPalette: colorPalette.trim() || undefined,
        scale,
        condition: condition.trim() || undefined,
        crowdLevel,
        soundscape: soundscape.trim() || undefined,
        culturalContext: culturalContext.trim() || undefined,
      },
      referenceImage,
      useReferenceInPrompt,
      referenceMode,
      imageStrength,
      aiGeneratedDescription: aiGeneratedDescription || undefined,
      conceptImage,
      conceptDescription: conceptDescription || undefined,
      isGeneratingConcept: false,
    };

    onSave(savedLocation);
    onClose();
  };

  const handleSaveToLibrary = async () => {
    if (!name.trim()) {
      Alert.alert("Missing Information", "Please enter a location name before saving.");
      return;
    }

    const locationToSave: Location = {
      id: location?.id || `loc_${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      type,
      details: {
        locationType,
        isRealPlace,
        realPlaceInfo: isRealPlace ? {
          city: city.trim() || undefined,
          country: country.trim() || undefined,
          region: region.trim() || undefined,
          specificLocation: specificLocation.trim() || undefined,
          landmark: landmark.trim() || undefined,
          knownFor: knownFor.trim() || undefined,
        } : undefined,
        setting: setting.trim() || undefined,
        timeOfDay,
        weather: weather.trim() || undefined,
        lighting: lighting.trim() || undefined,
        atmosphere: atmosphere.trim() || undefined,
        architecture: architecture.trim() || undefined,
        terrain: terrain.trim() || undefined,
        vegetation: vegetation.trim() || undefined,
        prominentFeatures: prominentFeatures.trim()
          ? prominentFeatures.split(',').map(f => f.trim()).filter(Boolean)
          : undefined,
        colorPalette: colorPalette.trim() || undefined,
        scale,
        condition: condition.trim() || undefined,
        crowdLevel,
        soundscape: soundscape.trim() || undefined,
        culturalContext: culturalContext.trim() || undefined,
      },
      referenceImage,
      useReferenceInPrompt,
      referenceMode,
      imageStrength,
      aiGeneratedDescription: aiGeneratedDescription || undefined,
      conceptImage,
      conceptDescription: conceptDescription || undefined,
      isGeneratingConcept: false,
    };

    try {
      await saveLocationToLibrary(locationToSave);
      setIsLocationSaved(true);
      Alert.alert("Success", `"${name}" has been saved to your location library!`);
    } catch (error) {
      Alert.alert("Error", "Failed to save location to library.");
      console.error(error);
    }
  };

  // Collapsible section component
  const CollapsibleSection = ({ title, isExpanded, onToggle, children }: {
    title: string;
    isExpanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
  }) => (
    <View className="mb-4">
      <Pressable
        onPress={onToggle}
        className="flex-row items-center justify-between bg-gray-100 p-4 rounded-lg mb-2"
      >
        <Text className="text-base font-semibold text-gray-800">{title}</Text>
        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
          color="#6b7280"
        />
      </Pressable>
      {isExpanded && <View className="px-2">{children}</View>}
    </View>
  );

  const InputField = ({ label, value, onChangeText, placeholder, multiline = false }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    multiline?: boolean;
  }) => (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        className="border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900"
        style={{ textAlignVertical: multiline ? 'top' : 'center' }}
      />
    </View>
  );

  const PickerField = ({ label, options, value, onValueChange }: {
    label: string;
    options: Array<{ label: string; value: string }>;
    value: string;
    onValueChange: (value: any) => void;
  }) => (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>
      <View className="border border-gray-300 rounded-lg overflow-hidden">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row p-1">
          {options.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => onValueChange(option.value)}
              className={`px-4 py-2 rounded-md mr-2 ${
                value === option.value ? 'bg-blue-500' : 'bg-gray-200'
              }`}
            >
              <Text className={`text-sm ${value === option.value ? 'text-white font-semibold' : 'text-gray-700'}`}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
          <Pressable onPress={onClose}>
            <Text className="text-blue-500 text-base">Cancel</Text>
          </Pressable>
          <Text className="text-lg font-semibold">
            {mode === "create" ? "New Location" : "Edit Location"}
          </Text>
          <Pressable onPress={handleSave}>
            <Text className="text-blue-500 text-base font-semibold">Save</Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 p-4">
          {/* Basic Information */}
          <CollapsibleSection
            title="Basic Information"
            isExpanded={showBasicInfo}
            onToggle={() => setShowBasicInfo(!showBasicInfo)}
          >
            <InputField
              label="Location Name"
              value={name}
              onChangeText={setName}
              placeholder="e.g., Dark Forest, Parisian Café, Starship Bridge"
            />

            <InputField
              label="Description (optional)"
              value={description}
              onChangeText={setDescription}
              placeholder="Brief description of this location..."
              multiline
            />

            <PickerField
              label="Location Type"
              options={[
                { label: "Natural", value: "natural" },
                { label: "Urban", value: "urban" },
                { label: "Indoor", value: "indoor" },
                { label: "Fantasy", value: "fantasy" },
                { label: "Sci-Fi", value: "sci-fi" },
                { label: "Historical", value: "historical" },
                { label: "Other", value: "other" },
              ]}
              value={locationType}
              onValueChange={setLocationType}
            />

            <PickerField
              label="Interior/Exterior"
              options={[
                { label: "Interior", value: "interior" },
                { label: "Exterior", value: "exterior" },
                { label: "Mixed", value: "mixed" },
              ]}
              value={type}
              onValueChange={setType}
            />
          </CollapsibleSection>

          {/* Real or Fictional Place */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between bg-gray-50 p-4 rounded-lg">
              <Text className="text-base font-medium text-gray-800">Is this a real place?</Text>
              <Switch
                value={isRealPlace}
                onValueChange={setIsRealPlace}
                trackColor={{ false: "#d1d5db", true: "#3b82f6" }}
                thumbColor={isRealPlace ? "#ffffff" : "#f3f4f6"}
              />
            </View>
          </View>

          {isRealPlace && (
            <CollapsibleSection
              title="Real Place Information"
              isExpanded={showRealPlaceInfo}
              onToggle={() => setShowRealPlaceInfo(!showRealPlaceInfo)}
            >
              <InputField label="City" value={city} onChangeText={setCity} placeholder="e.g., Paris, New York" />
              <InputField label="Country" value={country} onChangeText={setCountry} placeholder="e.g., France, USA" />
              <InputField label="Region/State" value={region} onChangeText={setRegion} placeholder="e.g., Île-de-France, California" />
              <InputField label="Specific Location" value={specificLocation} onChangeText={setSpecificLocation} placeholder="e.g., Eiffel Tower, Central Park" />
              <InputField label="Landmark" value={landmark} onChangeText={setLandmark} placeholder="e.g., Iron tower monument" />
              <InputField
                label="Known For (helps GPT)"
                value={knownFor}
                onChangeText={setKnownFor}
                placeholder="e.g., Symbol of Paris, built in 1889 for World's Fair"
                multiline
              />
            </CollapsibleSection>
          )}

          {/* Visual Details */}
          <CollapsibleSection
            title="Visual Details"
            isExpanded={showVisualDetails}
            onToggle={() => setShowVisualDetails(!showVisualDetails)}
          >
            <InputField
              label="Setting"
              value={setting}
              onChangeText={setSetting}
              placeholder="e.g., Dense forest, Modern city street, Medieval castle"
            />

            <PickerField
              label="Time of Day"
              options={[
                { label: "None", value: "" },
                { label: "Dawn", value: "dawn" },
                { label: "Morning", value: "morning" },
                { label: "Noon", value: "noon" },
                { label: "Afternoon", value: "afternoon" },
                { label: "Dusk", value: "dusk" },
                { label: "Night", value: "night" },
              ]}
              value={timeOfDay || ""}
              onValueChange={(val) => setTimeOfDay(val || undefined)}
            />

            <InputField label="Weather" value={weather} onChangeText={setWeather} placeholder="e.g., Sunny, Rainy, Foggy, Stormy" />
            <InputField label="Lighting" value={lighting} onChangeText={setLighting} placeholder="e.g., Natural sunlight, Dim artificial, Dramatic shadows" />
            <InputField label="Atmosphere" value={atmosphere} onChangeText={setAtmosphere} placeholder="e.g., Peaceful, Tense, Mysterious, Romantic" />
          </CollapsibleSection>

          {/* Architecture & Terrain */}
          <CollapsibleSection
            title="Architecture & Terrain"
            isExpanded={showArchitectureTerrain}
            onToggle={() => setShowArchitectureTerrain(!showArchitectureTerrain)}
          >
            <InputField label="Architecture Style" value={architecture} onChangeText={setArchitecture} placeholder="e.g., Gothic, Modern, Rustic, Futuristic" />
            <InputField label="Terrain" value={terrain} onChangeText={setTerrain} placeholder="e.g., Flat, Hilly, Mountainous, Rocky" />
            <InputField label="Vegetation" value={vegetation} onChangeText={setVegetation} placeholder="e.g., Dense forest, Sparse trees, Desert" />
          </CollapsibleSection>

          {/* Visual Characteristics */}
          <CollapsibleSection
            title="Visual Characteristics"
            isExpanded={showVisualCharacteristics}
            onToggle={() => setShowVisualCharacteristics(!showVisualCharacteristics)}
          >
            <InputField label="Color Palette" value={colorPalette} onChangeText={setColorPalette} placeholder="e.g., Warm tones, Cool blues, Monochrome" />

            <PickerField
              label="Scale"
              options={[
                { label: "None", value: "" },
                { label: "Intimate", value: "intimate" },
                { label: "Medium", value: "medium" },
                { label: "Vast", value: "vast" },
                { label: "Epic", value: "epic" },
              ]}
              value={scale || ""}
              onValueChange={(val) => setScale(val || undefined)}
            />

            <InputField label="Condition" value={condition} onChangeText={setCondition} placeholder="e.g., Well-maintained, Abandoned, Ruins" />

            <PickerField
              label="Crowd Level"
              options={[
                { label: "None", value: "" },
                { label: "Empty", value: "empty" },
                { label: "Sparse", value: "sparse" },
                { label: "Moderate", value: "moderate" },
                { label: "Crowded", value: "crowded" },
              ]}
              value={crowdLevel || ""}
              onValueChange={(val) => setCrowdLevel(val || undefined)}
            />
          </CollapsibleSection>

          {/* Additional Features */}
          <CollapsibleSection
            title="Additional Features"
            isExpanded={showAdditionalFeatures}
            onToggle={() => setShowAdditionalFeatures(!showAdditionalFeatures)}
          >
            <InputField
              label="Prominent Features (comma-separated)"
              value={prominentFeatures}
              onChangeText={setProminentFeatures}
              placeholder="e.g., fountain, statue, neon signs"
              multiline
            />

            <InputField
              label="Soundscape (optional)"
              value={soundscape}
              onChangeText={setSoundscape}
              placeholder="e.g., Silent, Bustling, Nature sounds, Echoing"
            />

            <InputField
              label="Cultural Context (optional)"
              value={culturalContext}
              onChangeText={setCulturalContext}
              placeholder="e.g., Western, Eastern, Futuristic, Medieval"
            />
          </CollapsibleSection>

          {/* Reference Image Section */}
          <View className="mb-4 p-4 bg-blue-50 rounded-lg">
            <Text className="text-base font-semibold text-gray-800 mb-2">Reference Image (Optional)</Text>
            <Text className="text-sm text-gray-600 mb-4">
              💡 Upload an image to auto-fill the fields above, or leave empty to describe manually
            </Text>

            {!referenceImage ? (
              <View className="flex-row gap-2">
                <Pressable onPress={pickImage} className="flex-1 bg-blue-500 py-3 rounded-lg items-center">
                  <Text className="text-white font-semibold">📁 Upload Image</Text>
                </Pressable>
                <Pressable onPress={pasteImage} className="flex-1 bg-gray-500 py-3 rounded-lg items-center">
                  <Text className="text-white font-semibold">📋 Paste</Text>
                </Pressable>
              </View>
            ) : (
              <View>
                <Image source={{ uri: referenceImage }} className="w-full h-48 rounded-lg mb-3" resizeMode="cover" />

                {isAnalyzingImage && (
                  <View className="bg-white p-4 rounded-lg mb-3">
                    <ActivityIndicator size="small" color="#3b82f6" />
                    <Text className="text-center text-gray-600 mt-2">Analyzing image...</Text>
                  </View>
                )}

                {aiGeneratedDescription && (
                  <View className="bg-white p-4 rounded-lg mb-3">
                    <Text className="text-sm font-medium text-gray-700 mb-1">AI Analysis:</Text>
                    <Text className="text-sm text-gray-600">{aiGeneratedDescription.substring(0, 200)}...</Text>
                  </View>
                )}

                <Pressable onPress={removeImage} className="bg-red-500 py-2 rounded-lg items-center">
                  <Text className="text-white font-semibold">🗑️ Remove Image</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Save to Library */}
          <View className="mb-6">
            <Pressable
              onPress={handleSaveToLibrary}
              className={`${isLocationSaved ? 'bg-green-500' : 'bg-purple-500'} py-4 rounded-lg items-center`}
            >
              <Text className="text-white font-semibold text-base">
                {isLocationSaved ? '✓ Saved to Library' : '💾 Save to Location Library'}
              </Text>
            </Pressable>
          </View>

          {!hasEnoughDetailsForGeneration() && (
            <View className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
              <Text className="text-yellow-800 text-sm">
                ⚠️ Please provide either: visual details, a reference image, or real place information to generate accurate panels.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
