import React, { useEffect, useMemo, useState } from "react";
import StoryboardScreen from "./StoryboardScreen";
import { useProjects, useStoryboardStore } from "../state/storyboardStore";
import { ArchitecturalProjectKind, ProjectType } from "../types/storyboard";
import { useIsFocused } from "@react-navigation/native";

export default function ArchitecturalScreen() {
  const projects = useProjects();
  const currentProject = useStoryboardStore(state => state.currentProject);
  const setCurrentProject = useStoryboardStore(state => state.setCurrentProject);
  const [selectedKind, setSelectedKind] = useState<ArchitecturalProjectKind>("detalles");
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) return;
    if (currentProject?.projectType === ProjectType.ARCHITECTURAL) return;
    const lastArchitectural = [...projects]
      .filter(project => project.projectType === ProjectType.ARCHITECTURAL)
      .pop();
    if (lastArchitectural) {
      setCurrentProject(lastArchitectural);
    }
  }, [isFocused, projects, currentProject, setCurrentProject]);

  useEffect(() => {
    if (currentProject?.projectType === ProjectType.ARCHITECTURAL && currentProject.architecturalProjectKind) {
      setSelectedKind(currentProject.architecturalProjectKind);
    }
  }, [currentProject]);

  const kind = useMemo<ArchitecturalProjectKind>(() => selectedKind, [selectedKind]);

  return (
    <StoryboardScreen
      title="Arquitectural"
      mode="architectural"
      architecturalKind={kind}
      onArchitecturalKindChange={setSelectedKind}
    />
  );
}
