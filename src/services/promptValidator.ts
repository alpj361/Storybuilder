import { 
  StoryboardProject, 
  StoryboardPrompt,
  ValidationResult
} from "../types/storyboard";

/**
 * Validate a complete storyboard project
 */
export function validateStoryboardProject(project: StoryboardProject): ValidationResult {
  const issues: ValidationResult["issues"] = [];
  const suggestions: string[] = [];
  let score = 100;

  // Check basic project completeness
  if (!project.title || project.title.trim().length === 0) {
    issues.push({
      type: "error",
      message: "Project must have a title"
    });
    score -= 20;
  }

  if (!project.description || project.description.trim().length === 0) {
    issues.push({
      type: "error", 
      message: "Project must have a description"
    });
    score -= 15;
  }

  // Validate characters
  if (project.characters.length === 0) {
    issues.push({
      type: "warning",
      message: "Project has no characters defined"
    });
    score -= 10;
    suggestions.push("Consider adding character descriptions for better consistency");
  }

  // Validate scenes
  if (project.scenes.length === 0) {
    issues.push({
      type: "error",
      message: "Project must have at least one scene"
    });
    score -= 20;
  }

  // Validate panels
  if (project.panels.length === 0) {
    issues.push({
      type: "error",
      message: "Project must have at least one panel"
    });
    score -= 30;
  } else {
    // Check each panel
    project.panels.forEach((panel, index) => {
      const panelValidation = validateStoryboardPrompt(panel.prompt);
      if (!panelValidation.isValid) {
        panelValidation.issues.forEach(issue => {
          issues.push({
            ...issue,
            panelNumber: index + 1
          });
        });
        score -= 5;
      }
    });
  }

  // Check for proper 4-panel structure
  if (project.panels.length !== 4) {
    issues.push({
      type: "suggestion",
      message: `Project has ${project.panels.length} panels, consider using 4 panels for standard storyboard format`
    });
    suggestions.push("Standard storyboards work best with 4 panels for clear narrative flow");
  }

  // Check character consistency across panels
  const characterConsistencyScore = checkCharacterConsistency(project);
  score = Math.min(score, score + characterConsistencyScore);

  return {
    isValid: issues.filter(i => i.type === "error").length === 0,
    score: Math.max(0, score),
    issues,
    suggestions
  };
}

/**
 * Validate an individual storyboard prompt
 */
export function validateStoryboardPrompt(prompt: StoryboardPrompt): ValidationResult {
  const issues: ValidationResult["issues"] = [];
  const suggestions: string[] = [];
  let score = 100;

  // Check required fields
  if (!prompt.sceneDescription || prompt.sceneDescription.trim().length === 0) {
    issues.push({
      type: "error",
      message: "Prompt must have a scene description"
    });
    score -= 25;
  }

  if (!prompt.action || prompt.action.trim().length === 0) {
    issues.push({
      type: "warning",
      message: "Prompt should have an action description"
    });
    score -= 10;
  }

  if (!prompt.generatedPrompt || prompt.generatedPrompt.trim().length === 0) {
    issues.push({
      type: "error",
      message: "Prompt must have generated AI prompt text"
    });
    score -= 30;
  }

  // Check prompt quality
  if (prompt.generatedPrompt && prompt.generatedPrompt.length < 50) {
    issues.push({
      type: "warning",
      message: "Generated prompt seems too short for good results"
    });
    score -= 5;
    suggestions.push("Consider adding more descriptive details to the prompt");
  }

  if (prompt.generatedPrompt && prompt.generatedPrompt.length > 500) {
    issues.push({
      type: "suggestion",
      message: "Generated prompt is very long, consider simplifying"
    });
    suggestions.push("Very long prompts may not generate better results");
  }

  // Check for storyboard-specific elements
  if (prompt.generatedPrompt && !prompt.generatedPrompt.toLowerCase().includes("storyboard")) {
    issues.push({
      type: "suggestion",
      message: "Prompt should include storyboard-specific styling"
    });
    suggestions.push("Adding 'storyboard' keywords helps generate appropriate style");
  }

  return {
    isValid: issues.filter(i => i.type === "error").length === 0,
    score: Math.max(0, score),
    issues,
    suggestions
  };
}

/**
 * Check character consistency across panels
 */
function checkCharacterConsistency(project: StoryboardProject): number {
  let consistencyScore = 0;
  
  // Check if characters appear consistently across panels
  project.characters.forEach(character => {
    const panelsWithCharacter = project.panels.filter(panel => 
      panel.prompt.characters.includes(character.id)
    );
    
    if (panelsWithCharacter.length > 1) {
      // Character appears in multiple panels - good for consistency
      consistencyScore += 5;
      
      // Check if character descriptions are consistent
      const descriptions = panelsWithCharacter.map(panel => 
        panel.prompt.generatedPrompt
      );
      
      // Simple consistency check - if character name appears in all descriptions
      const hasConsistentNaming = descriptions.every(desc => 
        desc.toLowerCase().includes(character.name.toLowerCase()) ||
        desc.toLowerCase().includes(character.description.toLowerCase())
      );
      
      if (hasConsistentNaming) {
        consistencyScore += 5;
      }
    }
  });
  
  return Math.min(consistencyScore, 20); // Cap at 20 points
}

/**
 * Get prompt quality suggestions
 */
export function getPromptQualitySuggestions(prompt: StoryboardPrompt): string[] {
  const suggestions: string[] = [];
  
  if (!prompt.cameraAngle) {
    suggestions.push("Add camera angle specification for better composition");
  }
  
  if (!prompt.lighting) {
    suggestions.push("Specify lighting conditions for more atmospheric results");
  }
  
  if (!prompt.mood) {
    suggestions.push("Define the mood to enhance emotional impact");
  }
  
  if (prompt.characters.length === 0) {
    suggestions.push("Include character references for better scene composition");
  }
  
  if (!prompt.visualNotes) {
    suggestions.push("Add visual notes for specific artistic direction");
  }
  
  return suggestions;
}

/**
 * Score prompt completeness (0-100)
 */
export function scorePromptCompleteness(prompt: StoryboardPrompt): number {
  let score = 0;
  
  // Required elements (60 points total)
  if (prompt.sceneDescription) score += 20;
  if (prompt.action) score += 15;
  if (prompt.generatedPrompt) score += 25;
  
  // Optional but valuable elements (40 points total)
  if (prompt.cameraAngle) score += 8;
  if (prompt.lighting) score += 8;
  if (prompt.mood) score += 8;
  if (prompt.characters.length > 0) score += 8;
  if (prompt.visualNotes) score += 8;
  
  return score;
}