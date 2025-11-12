import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, Modal, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCurrentProject, useStoryboardStore } from "../state/storyboardStore";
import { ProjectType, ArchitecturalProjectKind, Character } from "../types/storyboard";
import { cn } from "../utils/cn";
import { CharacterEditModal } from "./CharacterEditModal";
import CharacterTag from "./CharacterTag";

interface StoryboardInputModalProps {
  visible: boolean;
  onClose: () => void;
  mode?: "storyboard" | "architectural";
  hasCurrentProject?: boolean;
  architecturalKind?: ArchitecturalProjectKind;
  onArchitecturalKindChange?: (kind: ArchitecturalProjectKind) => void;
}

export default function StoryboardInputModal({
  visible,
  onClose,
  mode = "storyboard",
  hasCurrentProject,
  architecturalKind = "detalles",
  onArchitecturalKindChange
}: StoryboardInputModalProps) {
  const isArchitectural = mode === "architectural";
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [showCharacterEditModal, setShowCharacterEditModal] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const createProjectFromInput = useStoryboardStore(state => state.createProjectFromInput);
  const createArchitecturalProjectFromInput = useStoryboardStore(state => state.createArchitecturalProjectFromInput);
  const appendPanelsFromInput = useStoryboardStore(state => state.appendPanelsFromInput);
  const appendArchitecturalPanelsFromInput = useStoryboardStore(state => state.appendArchitecturalPanelsFromInput);
  const error = useStoryboardStore(state => state.error);
  const currentProject = useCurrentProject();

  const [workflow, setWorkflow] = useState<"create" | "append">("create");
  const defaultCreateCount = useMemo(() => {
    if (!isArchitectural) return 4;
    switch (architecturalKind) {
      case "planos":
        return 3;
      case "prototipos":
        return 3;
      case "detalles":
      default:
        return 2;
    }
  }, [isArchitectural, architecturalKind]);

  const [panelCount, setPanelCount] = useState<string>(`${defaultCreateCount}`);
  const [appendCount, setAppendCount] = useState<string>("1");

  const canAppend = useMemo(() => {
    const projectMatches = isArchitectural
      ? currentProject?.projectType === ProjectType.ARCHITECTURAL && currentProject.architecturalProjectKind === architecturalKind
      : !!currentProject && currentProject.projectType !== ProjectType.ARCHITECTURAL;
    if (typeof hasCurrentProject === "boolean") {
      return hasCurrentProject && projectMatches;
    }
    return projectMatches;
  }, [currentProject, hasCurrentProject, isArchitectural, architecturalKind]);

  useEffect(() => {
    if (workflow === "append" && !canAppend) {
      setWorkflow("create");
    }
  }, [workflow, canAppend]);

  useEffect(() => {
    if (workflow === "create") {
      setPanelCount(`${defaultCreateCount}`);
    }
  }, [workflow, defaultCreateCount]);

  useEffect(() => {
    if (!visible) {
      setWorkflow("create");
      setPanelCount(`${defaultCreateCount}`);
      setAppendCount("1");
      setInput("");
      setCharacters([]);
    }
  }, [visible, defaultCreateCount]);

  const effectiveCount = useMemo(() => {
    const countStr = workflow === "create" ? panelCount : appendCount;
    const n = parseInt(countStr, 10);
    const fallback = workflow === "create" ? defaultCreateCount : 1;
    // Support up to 30 panels for storyboard mode
    const maxPanels = isArchitectural ? 12 : 30;
    return Number.isFinite(n) && n > 0 ? Math.min(n, maxPanels) : fallback;
  }, [workflow, panelCount, appendCount, defaultCreateCount, isArchitectural]);

  // Character management handlers
  const handleAddCharacter = () => {
    setEditingCharacter(null);
    setShowCharacterEditModal(true);
  };

  const handleEditCharacter = (character: Character) => {
    setEditingCharacter(character);
    setShowCharacterEditModal(true);
  };

  const handleSaveCharacter = (character: Character) => {
    if (editingCharacter) {
      // Update existing character
      setCharacters(prev => prev.map(c => c.id === character.id ? character : c));
    } else {
      // Add new character
      setCharacters(prev => [...prev, character]);
    }
  };

  const handleDeleteCharacter = (characterId: string) => {
    Alert.alert(
      "Delete Character",
      "Are you sure you want to delete this character?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => setCharacters(prev => prev.filter(c => c.id !== characterId))
        }
      ]
    );
  };

  const handleGenerate = async () => {
    if (!input.trim()) {
      Alert.alert("Input Required", isArchitectural ? "Please describe the architectural detail" : "Please describe your storyboard idea");
      return;
    }

    setIsGenerating(true);
    try {
      if (workflow === "append" && canAppend) {
        if (isArchitectural) {
          await appendArchitecturalPanelsFromInput(input.trim(), { count: effectiveCount, kind: architecturalKind });
        } else {
          await appendPanelsFromInput(input.trim(), { count: effectiveCount });
        }
      } else {
        const inputWithCount = `${input.trim()} (panels: ${effectiveCount})`;
        if (isArchitectural) {
          await createArchitecturalProjectFromInput(inputWithCount, { kind: architecturalKind });
        } else {
          // Pass custom characters if provided
          await createProjectFromInput(inputWithCount, characters.length > 0 ? characters : undefined);
        }
      }
      setInput("");
      setCharacters([]);
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

  const examplePrompts = useMemo(() => {
    if (!isArchitectural) {
      return [
        "A guy with a dog walking in the park",
        "Product launch presentation for a new smartphone",
        "Character meeting their best friend after years",
        "Architect showing building design to client",
        "Animation sequence of a cat chasing a mouse"
      ];
    }

    if (architecturalKind === "planos") {
      return [
        "Ground floor and section plan set for a community center with grids and room tags (panels: 3)",
        "Site plan, first floor plan, and elevation for a small office building, metric units (panels: 4)",
        "Residential tower plan set including typical floor plan and north elevation (panels: 3)"
      ];
    }

    if (architecturalKind === "prototipos") {
      return [
        "Concept massing prototype for a mixed-use tower with program diagram and facade concept (panels: 3)",
        "Campus prototype showing axonometric massing, program plan, and circulation diagram (panels: 4)",
        "Museum prototype concept with massing, program zoning, and structural diagram (panels: 3)"
      ];
    }

    return [
      "Cross-sectional detail of a reinforced concrete beam 25×40 cm with steel rebars Ø16 @150 and stirrups Ø8 @100, include dimension annotations (panels: 2)",
      "Plan detail of a slab with drop panel and reinforcement layout, scale 1:25, metric units (panels: 3)",
      "Steel column base plate connection with anchor bolts, grout, and weld symbols, include edge distances (panels: 3)",
      "Exploded axonometric of a timber truss joint showing bolts, plates, and labels (panels: 4)"
    ];
  }, [isArchitectural, architecturalKind]);

  const generationInfo = useMemo(() => {
    if (!isArchitectural) {
      return [
        `• Panel count: ${effectiveCount}`,
        "• Character descriptions and consistency",
        "• Scene settings and compositions",
        "• AI-ready prompts for image generation"
      ];
    }

    if (architecturalKind === "planos") {
      return [
        `• Panel count: ${effectiveCount}`,
        "• Floor plans, sections, elevations, and legends",
        "• Grid references, levels, and dimension annotations",
        "• CAD-ready prompts aligned with drafting standards"
      ];
    }

    if (architecturalKind === "prototipos") {
      return [
        `• Panel count: ${effectiveCount}`,
        "• Massing, program, facade, and circulation diagrams",
        "• Conceptual line-art with labeled overlays",
        "• Prompts suited for prototype visualization"
      ];
    }

    return [
      `• Panel count: ${effectiveCount}`,
      "• Orthographic detail views with scale and units",
      "• Components, materials, reinforcement, and dimension callouts",
      "• CAD-ready prompts aligned with structural standards"
    ];
  }, [isArchitectural, architecturalKind, effectiveCount]);

  const architecturalKindLabels: Record<ArchitecturalProjectKind, string> = {
    detalles: "Detail Set",
    planos: "Plan Set",
    prototipos: "Prototype"
  };

  const architecturalDescription = useMemo(() => {
    switch (architecturalKind) {
      case "planos":
        return "Describe the plan set you need. We’ll create plans, sections, elevations, and legends with grids, levels, and sheet-ready annotations.";
      case "prototipos":
        return "Describe the building prototype concept. We’ll generate massing, program, facade, and circulation diagrams for conceptual design.";
      case "detalles":
      default:
        return "Explain the architectural or structural detail you need. We’ll generate technical drawing views with components, dimensions, and annotations.";
    }
  }, [architecturalKind]);

  const architecturalPlaceholder = useMemo(() => {
    switch (architecturalKind) {
      case "planos":
        return "Example: Plan and section set for a community center with grids and legends...";
      case "prototipos":
        return "Example: Prototype massing for mixed-use tower with program and facade diagrams...";
      case "detalles":
      default:
        return "Example: Cross-sectional detail of reinforced concrete beam with stirrups and annotations...";
    }
  }, [architecturalKind]);

  const modalTitle = isArchitectural
    ? `Create ${architecturalKindLabels[architecturalKind]}`
    : "Create Storyboard";

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
          <Text className="text-xl font-bold text-gray-900">{modalTitle}</Text>
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
          {isArchitectural && (
            <View className="mb-4">
              <Text className="text-xs font-semibold text-gray-600 mb-2">Architectural Mode</Text>
              <View className="flex-row bg-gray-100 rounded-lg overflow-hidden">
                {([
                  { key: "detalles", label: "Detalles" },
                  { key: "planos", label: "Planos" },
                  { key: "prototipos", label: "Prototipos" }
                ] as { key: ArchitecturalProjectKind; label: string }[]).map(option => {
                  const selected = architecturalKind === option.key;
                  return (
                    <Pressable
                      key={option.key}
                      className={`flex-1 py-2 items-center ${selected ? "bg-blue-500" : ""}`}
                      onPress={() => onArchitecturalKindChange?.(option.key)}
                    >
                      <Text className={`text-sm font-medium ${selected ? "text-white" : "text-gray-700"}`}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Mode Toggle */}
          <View className="mb-4">
            <View className="flex-row bg-gray-100 rounded-lg overflow-hidden">
              <Pressable
                onPress={() => setWorkflow("create")}
                disabled={isGenerating}
                className={cn("flex-1 p-2 items-center", workflow === "create" ? "bg-blue-500" : "")}
              >
                <Text className={cn("text-sm font-medium", workflow === "create" ? "text-white" : "text-gray-700")}>
                  {isArchitectural ? `New ${architecturalKindLabels[architecturalKind]}` : "New Storyboard"}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setWorkflow("append")}
                disabled={isGenerating || !canAppend}
                className={cn("flex-1 p-2 items-center", workflow === "append" ? "bg-blue-500" : "", !canAppend && "opacity-50")}
              >
                <Text className={cn("text-sm font-medium", workflow === "append" ? "text-white" : "text-gray-700")}>
                  {isArchitectural ? `Add ${architecturalKindLabels[architecturalKind]}` : "Add Panels"}
                </Text>
              </Pressable>
            </View>
            {!canAppend && workflow === "append" && (
              <Text className="text-xs text-red-600 mt-1">No compatible project loaded. Switch to New {isArchitectural ? architecturalKindLabels[architecturalKind] : "Storyboard"}.</Text>
            )}
          </View>

          {/* Instructions */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              {isArchitectural ? `Describe Your ${architecturalKindLabels[architecturalKind]}` : "Describe Your Story"}
            </Text>
            <Text className="text-gray-600 text-sm leading-5">
              {isArchitectural
                ? architecturalDescription
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
                  ? architecturalPlaceholder
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

          {/* Character Management - Only for Storyboard mode */}
          {!isArchitectural && (
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <Ionicons name="people" size={18} color="#374151" />
                  <Text className="text-sm font-medium text-gray-700 ml-2">
                    Characters ({characters.length})
                  </Text>
                </View>
                <Pressable
                  onPress={handleAddCharacter}
                  disabled={isGenerating}
                  className={cn(
                    "flex-row items-center px-3 py-1.5 rounded-lg bg-blue-100",
                    isGenerating && "opacity-50"
                  )}
                >
                  <Ionicons name="add" size={16} color="#3b82f6" />
                  <Text className="text-blue-600 font-medium text-xs ml-1">Add Character</Text>
                </Pressable>
              </View>

              {characters.length > 0 ? (
                <View className="space-y-2">
                  {characters.map((character) => (
                    <View
                      key={character.id}
                      className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <View className="flex-1 flex-row items-center">
                        <CharacterTag character={character} size="small" />
                        <View className="ml-3 flex-1">
                          {character.description && (
                            <Text className="text-xs text-gray-600 line-clamp-1">
                              {character.description}
                            </Text>
                          )}
                          {character.referenceImage && (
                            <View className="flex-row items-center mt-1">
                              <Ionicons name="image" size={12} color="#16a34a" />
                              <Text className="text-xs text-green-600 ml-1">Has reference</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Pressable
                          onPress={() => handleEditCharacter(character)}
                          disabled={isGenerating}
                          className={cn(
                            "p-2 rounded-full bg-blue-100",
                            isGenerating && "opacity-50"
                          )}
                        >
                          <Ionicons name="pencil" size={14} color="#3b82f6" />
                        </Pressable>
                        <Pressable
                          onPress={() => handleDeleteCharacter(character.id)}
                          disabled={isGenerating}
                          className={cn(
                            "p-2 rounded-full bg-red-100",
                            isGenerating && "opacity-50"
                          )}
                        >
                          <Ionicons name="trash" size={14} color="#ef4444" />
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <Text className="text-gray-500 text-xs text-center">
                    No characters added yet. Characters will be automatically detected from your idea, or you can add them manually.
                  </Text>
                </View>
              )}
            </View>
          )}

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
              {workflow === "create"
                ? isArchitectural
                  ? `Number of ${architecturalKindLabels[architecturalKind]}`
                  : "Number of Panels"
                : isArchitectural
                  ? `${architecturalKindLabels[architecturalKind]} to Add`
                  : "Panels to Add"}
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
              <Text className="ml-3 text-gray-500 text-xs">
                Max {isArchitectural ? "12" : "30"}
              </Text>
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

      {/* Character Edit Modal */}
      <CharacterEditModal
        visible={showCharacterEditModal}
        onClose={() => {
          setShowCharacterEditModal(false);
          setEditingCharacter(null);
        }}
        character={editingCharacter}
        onSave={handleSaveCharacter}
        mode={editingCharacter ? "edit" : "create"}
      />
    </Modal>
  );
}
