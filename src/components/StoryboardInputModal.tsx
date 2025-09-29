import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, Modal, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCurrentProject, useStoryboardStore } from "../state/storyboardStore";
import { ProjectType } from "../types/storyboard";
import { cn } from "../utils/cn";

interface StoryboardInputModalProps {
  visible: boolean;
  onClose: () => void;
  mode?: "storyboard" | "architectural";
  hasCurrentProject?: boolean;
}

export default function StoryboardInputModal({ visible, onClose, mode = "storyboard", hasCurrentProject }: StoryboardInputModalProps) {
  const isArchitectural = mode === "architectural";
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const createProjectFromInput = useStoryboardStore(state => state.createProjectFromInput);
  const createArchitecturalProjectFromInput = useStoryboardStore(state => state.createArchitecturalProjectFromInput);
  const appendPanelsFromInput = useStoryboardStore(state => state.appendPanelsFromInput);
  const appendArchitecturalPanelsFromInput = useStoryboardStore(state => state.appendArchitecturalPanelsFromInput);
  const error = useStoryboardStore(state => state.error);
  const currentProject = useCurrentProject();

  const [workflow, setWorkflow] = useState<"create" | "append">("create");
  const [panelCount, setPanelCount] = useState<string>(isArchitectural ? "2" : "4");
  const [appendCount, setAppendCount] = useState<string>("1");

  const canAppend = useMemo(() => {
    const projectMatches = isArchitectural
      ? currentProject?.projectType === ProjectType.ARCHITECTURAL
      : !!currentProject && currentProject.projectType !== ProjectType.ARCHITECTURAL;
    if (typeof hasCurrentProject === "boolean") {
      return hasCurrentProject && projectMatches;
    }
    return projectMatches;
  }, [currentProject, hasCurrentProject, isArchitectural]);

  useEffect(() => {
    if (workflow === "append" && !canAppend) {
      setWorkflow("create");
    }
  }, [workflow, canAppend]);

  const effectiveCount = useMemo(() => {
    const countStr = workflow === "create" ? panelCount : appendCount;
    const n = parseInt(countStr, 10);
    const fallback = workflow === "create" ? (isArchitectural ? 2 : 4) : 1;
    return Number.isFinite(n) && n > 0 ? Math.min(n, 12) : fallback;
  }, [workflow, panelCount, appendCount, isArchitectural]);

  const handleGenerate = async () => {
    if (!input.trim()) {
      Alert.alert("Input Required", isArchitectural ? "Please describe the architectural detail" : "Please describe your storyboard idea");
      return;
    }

    setIsGenerating(true);
    try {
      if (workflow === "append" && canAppend) {
        if (isArchitectural) {
          await appendArchitecturalPanelsFromInput(input.trim(), { count: effectiveCount });
        } else {
          await appendPanelsFromInput(input.trim(), { count: effectiveCount });
        }
      } else {
        const inputWithCount = `${input.trim()} (panels: ${effectiveCount})`;
        if (isArchitectural) {
          await createArchitecturalProjectFromInput(inputWithCount);
        } else {
          await createProjectFromInput(inputWithCount);
        }
      }
      setInput("");
      onClose();
    } catch (err) {
      console.error("Generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      setInput("");
      onClose();
    }
  };

  const examplePrompts = useMemo(() => (
    isArchitectural
      ? [
          "Cross-sectional detail of a reinforced concrete beam 25×40 cm with steel rebars Ø16 @150 and stirrups Ø8 @100, include dimension annotations (panels: 2)",
          "Plan detail of a slab with drop panel and reinforcement layout, scale 1:25, metric units (panels: 3)",
          "Steel column base plate connection with anchor bolts, grout, and weld symbols, include edge distances (panels: 3)",
          "Exploded axonometric of a timber truss joint showing bolts, plates, and labels (panels: 4)"
        ]
      : [
          "A guy with a dog walking in the park",
          "Product launch presentation for a new smartphone",
          "Character meeting their best friend after years",
          "Architect showing building design to client",
          "Animation sequence of a cat chasing a mouse"
        ]
  ), [isArchitectural]);

  const generationInfo = useMemo(() => (
    isArchitectural
      ? [
          `• Panel count: ${effectiveCount}`,
          "• Orthographic technical drawing views with scale and units",
          "• Components, materials, reinforcement, and dimension annotations",
          "• CAD-ready prompts aligned with architectural standards"
        ]
      : [
          `• Panel count: ${effectiveCount}`,
          "• Character descriptions and consistency",
          "• Scene settings and compositions",
          "• AI-ready prompts for image generation"
        ]
  ), [isArchitectural, effectiveCount]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
          <Text className="text-xl font-bold text-gray-900">{isArchitectural ? "Create Detail Set" : "Create Storyboard"}</Text>
          <Pressable 
            onPress={handleClose}
            disabled={isGenerating}
            className={cn(
              "p-2 rounded-full",
              isGenerating ? "opacity-50" : "opacity-100"
            )}
          >
            <Ionicons name="close" size={24} color="#6B7280" />
          </Pressable>
        </View>

        <ScrollView className="flex-1 p-4">
          {/* Mode Toggle */}
          <View className="mb-4">
            <View className="flex-row bg-gray-100 rounded-lg overflow-hidden">
              <Pressable
                onPress={() => setWorkflow("create")}
                disabled={isGenerating}
                className={cn("flex-1 p-2 items-center", workflow === "create" ? "bg-blue-500" : "")}
              >
                <Text className={cn("text-sm font-medium", workflow === "create" ? "text-white" : "text-gray-700")}>
                  {isArchitectural ? "New Detail Set" : "New Storyboard"}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setWorkflow("append")}
                disabled={isGenerating || !canAppend}
                className={cn("flex-1 p-2 items-center", workflow === "append" ? "bg-blue-500" : "", !canAppend && "opacity-50")}
              >
                <Text className={cn("text-sm font-medium", workflow === "append" ? "text-white" : "text-gray-700")}>
                  {isArchitectural ? "Add Detail Panels" : "Add Panels"}
                </Text>
              </Pressable>
            </View>
            {!canAppend && workflow === "append" && (
              <Text className="text-xs text-red-600 mt-1">No compatible project loaded. Switch to New {isArchitectural ? "Detail Set" : "Storyboard"}.</Text>
            )}
          </View>

          {/* Instructions */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              {isArchitectural ? "Describe Your Detail" : "Describe Your Story"}
            </Text>
            <Text className="text-gray-600 text-sm leading-5">
              {isArchitectural
                ? "Explain the architectural or structural detail you need. We’ll generate technical drawing views with components, dimensions, and annotations. Choose whether to create a new detail set or add panels to the current one."
                : "Tell us about your storyboard idea in simple terms. We’ll generate a 4-panel sequence with characters, scenes, and detailed prompts ready for image generation."}
            </Text>
          </View>

          {/* Input Area */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Your Idea
            </Text>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={
                isArchitectural
                  ? "Example: Cross-sectional detail of reinforced concrete beam with stirrups and annotations..."
                  : "Example: A guy with a dog walking in the park..."
              }
              multiline
              numberOfLines={4}
              className="border border-gray-300 rounded-lg p-3 text-gray-900 text-base"
              style={{ 
                minHeight: 100,
                textAlignVertical: "top"
              }}
              editable={!isGenerating}
            />
          </View>

          {/* Example Prompts */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-3">
              Example Ideas
            </Text>
            <View className="space-y-2">
              {examplePrompts.map((example, index) => (
                <Pressable
                  key={index}
                  onPress={() => setInput(example)}
                  disabled={isGenerating}
                  className={cn(
                    "p-3 bg-gray-50 rounded-lg border border-gray-200",
                    isGenerating && "opacity-50"
                  )}
                >
                  <Text className="text-gray-700 text-sm">{example}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Error Display */}
          {error && (
            <View className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <View className="flex-row items-center">
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text className="ml-2 text-red-700 text-sm font-medium">Error</Text>
              </View>
              <Text className="text-red-600 text-sm mt-1">{error}</Text>
            </View>
          )}

          {/* Generation Info */}
          <View className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <View className="flex-row items-center mb-2">
              <Ionicons name="information-circle" size={16} color="#2563EB" />
              <Text className="ml-2 text-blue-700 text-sm font-medium">What We'll Create</Text>
            </View>
            <View className="space-y-1">
              {generationInfo.map(item => (
                <Text key={item} className="text-blue-600 text-xs">{item}</Text>
              ))}
            </View>
          </View>

          {/* Panel Count */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              {workflow === "create" ? (isArchitectural ? "Number of Detail Panels" : "Number of Panels") : (isArchitectural ? "Detail Panels to Add" : "Panels to Add")}
            </Text>
            <View className="flex-row items-center">
              <TextInput
                value={workflow === "create" ? panelCount : appendCount}
                onChangeText={v => workflow === "create" ? setPanelCount(v.replace(/[^0-9]/g, "")) : setAppendCount(v.replace(/[^0-9]/g, ""))}
                placeholder={workflow === "create" ? (isArchitectural ? "2" : "4") : "1"}
                keyboardType="number-pad"
                className="border border-gray-300 rounded-lg p-3 text-gray-900 text-base"
                style={{ width: 80 }}
                editable={!isGenerating}
              />
              <Text className="ml-3 text-gray-500 text-xs">Max 12</Text>
            </View>
          </View>
        </ScrollView>

        {/* Generate Button */}
        <View className="p-4 border-t border-gray-200">
          <Pressable
            onPress={handleGenerate}
            disabled={isGenerating || !input.trim()}
            className={cn(
              "flex-row justify-center items-center py-4 px-6 rounded-lg",
              isGenerating || !input.trim()
                ? "bg-gray-300"
                : "bg-blue-500"
            )}
          >
            {isGenerating ? (
              <>
                <Ionicons name="hourglass" size={20} color="white" />
                <Text className="ml-2 text-white font-semibold">Generating...</Text>
              </>
            ) : (
              <>
                <Ionicons
                  name={workflow === "append" ? "add" : isArchitectural ? "construct" : "create"}
                  size={20}
                  color="white"
                />
                <Text className="ml-2 text-white font-semibold">
                  {workflow === "append"
                    ? isArchitectural ? "Add Detail Panels" : "Add Panels"
                    : isArchitectural ? "Generate Detail Set" : "Generate Storyboard"}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
