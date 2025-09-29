import React, { useEffect } from "react";
import StoryboardScreen from "./StoryboardScreen";
import { useProjects, useStoryboardStore } from "../state/storyboardStore";
import { ProjectType } from "../types/storyboard";

export default function ArchitecturalScreen() {
  const projects = useProjects();
  const currentProject = useStoryboardStore(state => state.currentProject);
  const setCurrentProject = useStoryboardStore(state => state.setCurrentProject);

  useEffect(() => {
    if (currentProject?.projectType === ProjectType.ARCHITECTURAL) return;
    const lastArchitectural = [...projects]
      .filter(project => project.projectType === ProjectType.ARCHITECTURAL)
      .pop();
    if (lastArchitectural) {
      setCurrentProject(lastArchitectural);
    }
  }, [projects, currentProject, setCurrentProject]);

  return <StoryboardScreen title="Arquitectural" mode="architectural" />;
}
